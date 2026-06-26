import { desc, eq } from "drizzle-orm";
import { auth } from "@reactive-resume/auth/config";
import { db } from "@reactive-resume/db/client";
import { cvResumeOrder, resume } from "@reactive-resume/db/schema";
import { env } from "@reactive-resume/env/server";
import { generateId } from "@reactive-resume/utils/string";

function unauthorizedResponse() {
	return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequestResponse(message: string) {
	return Response.json({ error: message }, { status: 400 });
}

function notFoundResponse(message = "Not found") {
	return Response.json({ error: message }, { status: 404 });
}

async function getAuthenticatedUser(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	return session?.user ?? null;
}

function getExpiryDate(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d;
}

export async function handleCvOrderRoutes(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const pathname = url.pathname;

	// GET /api/cv-orders — list user's CV orders
	if (request.method === "GET" && pathname === "/api/cv-orders") {
		const user = await getAuthenticatedUser(request);
		if (!user) return unauthorizedResponse();

		const orders = await db
			.select()
			.from(cvResumeOrder)
			.where(eq(cvResumeOrder.userId, user.id))
			.orderBy(desc(cvResumeOrder.createdAt))
			.limit(50);

		return Response.json(orders);
	}

	// POST /api/cv-orders — create new CV order for a resume
	if (request.method === "POST" && pathname === "/api/cv-orders") {
		const user = await getAuthenticatedUser(request);
		if (!user) return unauthorizedResponse();

		let body: {
			resumeId?: unknown;
			hasImage?: unknown;
			processingType?: unknown;
			whatsappUserId?: unknown;
		};
		try {
			body = await request.json();
		} catch {
			return badRequestResponse("Invalid JSON body");
		}

		const resumeId = typeof body.resumeId === "string" ? body.resumeId.trim() : "";
		if (!resumeId) return badRequestResponse("resumeId is required");

		const hasImage = body.hasImage === true;
		const processingType = typeof body.processingType === "string" ? body.processingType : "bot";
		const whatsappUserId = typeof body.whatsappUserId === "string" ? body.whatsappUserId : null;

		// Verify the resume belongs to this user
		const [resumeRecord] = await db
			.select({ id: resume.id, userId: resume.userId })
			.from(resume)
			.where(eq(resume.id, resumeId))
			.limit(1);

		if (!resumeRecord) return notFoundResponse("Resume not found");
		if (resumeRecord.userId !== user.id) {
			return Response.json({ error: "Forbidden" }, { status: 403 });
		}

		// Check for existing order on this resume
		const [existingOrder] = await db.select().from(cvResumeOrder).where(eq(cvResumeOrder.resumeId, resumeId)).limit(1);

		if (existingOrder) {
			return Response.json({ error: "An order already exists for this resume", order: existingOrder }, { status: 409 });
		}

		// Determine price
		const priceWithoutImage = env.CV_PRICE_WITHOUT_IMAGE;
		const priceWithImage = env.CV_PRICE_WITH_IMAGE;
		const priceKes = hasImage ? priceWithImage : priceWithoutImage;

		// Expiry = now + CV_EXPIRY_DAYS
		const expiryDays = env.CV_EXPIRY_DAYS;
		const expiresAt = getExpiryDate(expiryDays);

		const maxRevisions = env.CV_MAX_FREE_REVISIONS;

		const [newOrder] = await db
			.insert(cvResumeOrder)
			.values({
				id: generateId(),
				resumeId,
				userId: user.id,
				whatsappUserId,
				paymentStatus: "unpaid",
				hasImage,
				priceKes: String(priceKes),
				revisionCount: 0,
				maxRevisions,
				expiresAt,
				processingType,
			})
			.returning();

		return Response.json(newOrder, { status: 201 });
	}

	// Match /api/cv-orders/:resumeId or /api/cv-orders/:resumeId/revision
	const cvOrderMatch = pathname.match(/^\/api\/cv-orders\/([^/]+)(\/revision)?$/);
	if (cvOrderMatch) {
		const resumeId = cvOrderMatch[1];
		const isRevision = cvOrderMatch[2] === "/revision";

		// GET /api/cv-orders/:resumeId — get order for a specific resume
		if (request.method === "GET" && !isRevision) {
			const user = await getAuthenticatedUser(request);
			if (!user) return unauthorizedResponse();

			const [order] = await db.select().from(cvResumeOrder).where(eq(cvResumeOrder.resumeId, resumeId)).limit(1);

			if (!order) return notFoundResponse("Order not found for this resume");
			if (order.userId !== user.id) {
				return Response.json({ error: "Forbidden" }, { status: 403 });
			}

			return Response.json(order);
		}

		// PUT /api/cv-orders/:resumeId/revision — increment revision count
		if (request.method === "PUT" && isRevision) {
			const user = await getAuthenticatedUser(request);
			if (!user) return unauthorizedResponse();

			const [order] = await db.select().from(cvResumeOrder).where(eq(cvResumeOrder.resumeId, resumeId)).limit(1);

			if (!order) return notFoundResponse("Order not found for this resume");
			if (order.userId !== user.id) {
				return Response.json({ error: "Forbidden" }, { status: 403 });
			}

			// Check payment status
			if (order.paymentStatus !== "paid") {
				return Response.json({ error: "Order has not been paid. Revisions require a paid order." }, { status: 402 });
			}

			// Check revision limit
			const currentCount = order.revisionCount ?? 0;
			const maxAllowed = order.maxRevisions ?? env.CV_MAX_FREE_REVISIONS;

			if (currentCount >= maxAllowed) {
				return Response.json(
					{
						error: `Revision limit reached (${currentCount}/${maxAllowed}). Additional revisions require a new purchase.`,
						revisionCount: currentCount,
						maxRevisions: maxAllowed,
					},
					{ status: 422 },
				);
			}

			const [updatedOrder] = await db
				.update(cvResumeOrder)
				.set({ revisionCount: currentCount + 1 })
				.where(eq(cvResumeOrder.resumeId, resumeId))
				.returning();

			return Response.json(updatedOrder);
		}
	}

	return Response.json({ error: "Not Found" }, { status: 404 });
}
