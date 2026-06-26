import { desc, eq } from "drizzle-orm";
import { auth } from "@reactive-resume/auth/config";
import { db } from "@reactive-resume/db/client";
import { accountBalance, tokenTopUp, usageRecord } from "@reactive-resume/db/schema";
import { env } from "@reactive-resume/env/server";
import { generateId } from "@reactive-resume/utils/string";

function unauthorizedResponse() {
	return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequestResponse(message: string) {
	return Response.json({ error: message }, { status: 400 });
}

async function getAuthenticatedUser(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	return session?.user ?? null;
}

export async function handleBillingRoutes(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const pathname = url.pathname;

	// GET /api/billing/balance — get user's account balance
	if (request.method === "GET" && pathname === "/api/billing/balance") {
		const user = await getAuthenticatedUser(request);
		if (!user) return unauthorizedResponse();

		const [balance] = await db.select().from(accountBalance).where(eq(accountBalance.userId, user.id)).limit(1);

		if (!balance) {
			// Return a zero balance record if none exists yet
			return Response.json({ balance: "0.0000", userId: user.id });
		}

		return Response.json(balance);
	}

	// GET /api/billing/topups — list token topups for user
	if (request.method === "GET" && pathname === "/api/billing/topups") {
		const user = await getAuthenticatedUser(request);
		if (!user) return unauthorizedResponse();

		const topUps = await db
			.select()
			.from(tokenTopUp)
			.where(eq(tokenTopUp.userId, user.id))
			.orderBy(desc(tokenTopUp.createdAt))
			.limit(50);

		return Response.json(topUps);
	}

	// POST /api/billing/topup — initiate M-Pesa topup
	if (request.method === "POST" && pathname === "/api/billing/topup") {
		const user = await getAuthenticatedUser(request);
		if (!user) return unauthorizedResponse();

		let body: { amount?: unknown; phoneNumber?: unknown };
		try {
			body = await request.json();
		} catch {
			return badRequestResponse("Invalid JSON body");
		}

		const amount = Number(body.amount);
		const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";

		if (!amount || amount <= 0) {
			return badRequestResponse("amount must be a positive number");
		}
		if (!phoneNumber) {
			return badRequestResponse("phoneNumber is required");
		}

		// Calculate KES cost (1 token = 1 KES as a base rate; worker may override)
		const costKes = amount;

		// Create a pending topup record
		const topUpId = generateId();
		const [_newTopUp] = await db
			.insert(tokenTopUp)
			.values({
				id: topUpId,
				userId: user.id,
				amount: String(amount),
				costKes: String(costKes),
				currency: "KES",
				status: "unpaid",
				phoneNumber,
			})
			.returning();

		// Forward STK push to the CVPAP worker
		const workerUrl = env.WORKER_URL;
		if (!workerUrl) {
			return Response.json({ error: "Payment integration not configured" }, { status: 503 });
		}

		try {
			const workerResponse = await fetch(`${workerUrl}/mpesa/stk-push`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-verification-id": env.VERIFICATION_ID ?? "",
				},
				body: JSON.stringify({
					amount: costKes,
					phoneNumber,
					accountReference: topUpId,
					transactionDesc: `Token top-up for ${user.email}`,
				}),
			});

			const workerData = (await workerResponse.json()) as Record<string, unknown>;

			if (!workerResponse.ok) {
				// Mark topup as failed
				await db.update(tokenTopUp).set({ status: "failed" }).where(eq(tokenTopUp.id, topUpId));

				return Response.json({ error: "Failed to initiate payment", details: workerData }, { status: 502 });
			}

			// Store the checkout request ID from M-Pesa
			const checkoutRequestId = typeof workerData.CheckoutRequestID === "string" ? workerData.CheckoutRequestID : null;

			if (checkoutRequestId) {
				await db.update(tokenTopUp).set({ checkoutRequestId }).where(eq(tokenTopUp.id, topUpId));
			}

			return Response.json({
				topUpId,
				status: "unpaid",
				checkoutRequestId,
				message: "STK push sent. Complete payment on your phone.",
			});
		} catch (error) {
			console.error("[Billing] STK push error:", error);
			await db.update(tokenTopUp).set({ status: "failed" }).where(eq(tokenTopUp.id, topUpId));

			return Response.json({ error: "Payment gateway error" }, { status: 502 });
		}
	}

	// POST /api/billing/mpesa-callback — M-Pesa payment callback
	if (request.method === "POST" && pathname === "/api/billing/mpesa-callback") {
		// Verify callback secret if configured
		const callbackSecret = env.MPESA_CALLBACK_SECRET;
		if (callbackSecret) {
			const authHeader = request.headers.get("x-callback-secret");
			if (authHeader !== callbackSecret) {
				return Response.json({ error: "Forbidden" }, { status: 403 });
			}
		}

		let body: Record<string, unknown>;
		try {
			body = await request.json();
		} catch {
			return badRequestResponse("Invalid JSON body");
		}

		// M-Pesa STK push callback structure
		const stkCallback =
			typeof body.Body === "object" && body.Body !== null ? (body.Body as Record<string, unknown>).stkCallback : null;

		if (!stkCallback || typeof stkCallback !== "object") {
			return badRequestResponse("Invalid M-Pesa callback payload");
		}

		const cb = stkCallback as Record<string, unknown>;
		const resultCode = cb.ResultCode;
		const checkoutRequestId = typeof cb.CheckoutRequestID === "string" ? cb.CheckoutRequestID : null;

		if (!checkoutRequestId) {
			return badRequestResponse("Missing CheckoutRequestID");
		}

		// Find the top-up by checkout request ID
		const [topUp] = await db
			.select()
			.from(tokenTopUp)
			.where(eq(tokenTopUp.checkoutRequestId, checkoutRequestId))
			.limit(1);

		if (!topUp) {
			// Return 200 so M-Pesa doesn't retry; we just can't find it
			return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
		}

		if (resultCode === 0) {
			// Payment successful — extract receipt number
			const callbackMetadata =
				typeof cb.CallbackMetadata === "object" && cb.CallbackMetadata !== null
					? (cb.CallbackMetadata as Record<string, unknown>).Item
					: null;

			let mpesaReceiptNumber: string | null = null;
			if (Array.isArray(callbackMetadata)) {
				for (const item of callbackMetadata as Array<Record<string, unknown>>) {
					if (item.Name === "MpesaReceiptNumber") {
						mpesaReceiptNumber = typeof item.Value === "string" ? item.Value : null;
					}
				}
			}

			const tokenAmount = Number(topUp.amount);

			// Update top-up to completed
			await db
				.update(tokenTopUp)
				.set({
					status: "completed",
					mpesaReceiptNumber,
					transactionReference: mpesaReceiptNumber,
				})
				.where(eq(tokenTopUp.id, topUp.id));

			// Credit the user's balance
			const [existingBalance] = await db
				.select()
				.from(accountBalance)
				.where(eq(accountBalance.userId, topUp.userId))
				.limit(1);

			const previousBalance = existingBalance ? Number(existingBalance.balance) : 0;
			const newBalance = previousBalance + tokenAmount;

			if (existingBalance) {
				await db
					.update(accountBalance)
					.set({ balance: String(newBalance) })
					.where(eq(accountBalance.userId, topUp.userId));
			} else {
				await db.insert(accountBalance).values({
					id: generateId(),
					userId: topUp.userId,
					balance: String(newBalance),
				});
			}

			// Record usage entry for the credit
			await db.insert(usageRecord).values({
				id: generateId(),
				userId: topUp.userId,
				topUpId: topUp.id,
				itemType: "token_top_up",
				previousBalance: String(previousBalance),
				tokenQuantity: String(tokenAmount),
				newBalance: String(newBalance),
				usageType: "credit",
			});
		} else {
			// Payment failed or cancelled
			await db.update(tokenTopUp).set({ status: "failed" }).where(eq(tokenTopUp.id, topUp.id));
		}

		return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
	}

	return Response.json({ error: "Not Found" }, { status: 404 });
}
