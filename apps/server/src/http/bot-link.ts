/**
 * Bot-generated magic links for WhatsApp users.
 *
 * Flow:
 *   Bot → POST /api/bot/generate-link { userId, resumeId } → { url }
 *   User taps URL → GET /api/bot/login?token=XXX&to=/builder/ID
 *   Server validates token → creates session → redirects to builder
 *
 * Tokens live for 2 minutes and are single-use (deleted on redemption).
 * Endpoint is protected by INTERNAL_SERVICE_SECRET.
 */
import { and, eq, gt } from "drizzle-orm";
import { auth } from "@reactive-resume/auth/config";
import { db } from "@reactive-resume/db/client";
import { user, verification } from "@reactive-resume/db/schema";
import { env } from "@reactive-resume/env/server";
import { generateId } from "@reactive-resume/utils/string";

const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutes

function serviceSecretOk(request: Request): boolean {
	const secret = env.INTERNAL_SERVICE_SECRET;
	if (!secret) return false;
	return request.headers.get("x-service-secret") === secret;
}

export async function handleBotLinkRoutes(request: Request): Promise<Response> {
	const url = new URL(request.url);

	// ── POST /api/bot/generate-link ──────────────────────────────────────────
	if (request.method === "POST" && url.pathname === "/api/bot/generate-link") {
		if (!serviceSecretOk(request)) {
			return new Response("Unauthorized", { status: 401 });
		}

		let body: { userId?: string; resumeId?: string };
		try {
			body = await request.json();
		} catch {
			return new Response("Invalid JSON", { status: 400 });
		}

		const { userId, resumeId } = body;
		if (!userId) return new Response("userId required", { status: 400 });

		// Confirm user exists
		const [existingUser] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
		if (!existingUser) return new Response("User not found", { status: 404 });

		const token = generateId(48);
		const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
		const redirectTo = resumeId ? `/builder/${resumeId}` : "/dashboard";

		// Remove any previous bot-link token for this user
		await db.delete(verification).where(eq(verification.identifier, `bot-link:${userId}`));

		await db.insert(verification).values({
			id: generateId(),
			identifier: `bot-link:${userId}`,
			value: JSON.stringify({ token, redirectTo }),
			expiresAt,
		});

		const loginUrl = `${env.APP_URL}/api/bot/login?token=${token}&userId=${userId}`;

		return Response.json({ url: loginUrl, expiresAt: expiresAt.toISOString() });
	}

	// ── GET /api/bot/login ───────────────────────────────────────────────────
	if (request.method === "GET" && url.pathname === "/api/bot/login") {
		const token = url.searchParams.get("token");
		const userId = url.searchParams.get("userId");

		if (!token || !userId) {
			return new Response("Invalid link — missing parameters.", { status: 400 });
		}

		const now = new Date();

		const [record] = await db
			.select()
			.from(verification)
			.where(and(eq(verification.identifier, `bot-link:${userId}`), gt(verification.expiresAt, now)))
			.limit(1);

		if (!record) {
			return new Response("This link has expired or already been used. Ask the bot for a new one.", {
				status: 410,
				headers: { "Content-Type": "text/plain" },
			});
		}

		let stored: { token: string; redirectTo: string };
		try {
			stored = JSON.parse(record.value);
		} catch {
			return new Response("Malformed link data.", { status: 500 });
		}

		if (stored.token !== token) {
			return new Response("Invalid link token.", { status: 401 });
		}

		// Single-use — delete immediately
		await db.delete(verification).where(eq(verification.identifier, `bot-link:${userId}`));

		// Create a session via better-auth admin plugin
		const sessionResponse = await auth.api.createSession({
			body: { userId },
			headers: new Headers({ "x-forwarded-for": "bot-link" }),
		});

		if (!sessionResponse) {
			return new Response("Could not create session.", { status: 500 });
		}

		// Forward the Set-Cookie header so the browser is authenticated
		const redirectUrl = `${env.APP_URL}${stored.redirectTo}`;
		const responseHeaders = new Headers({ Location: redirectUrl });

		// Copy all Set-Cookie headers from the session response
		const setCookieHeader = sessionResponse.headers?.get("set-cookie");
		if (setCookieHeader) {
			responseHeaders.set("set-cookie", setCookieHeader);
		}

		return new Response(null, { status: 302, headers: responseHeaders });
	}

	return new Response("Not found", { status: 404 });
}
