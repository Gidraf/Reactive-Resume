/**
 * Single sign-on from CVPAP — CVPAP is the only login channel.
 *
 * Both apps share one domain (Cards & Print under /cards, this app at the
 * root), so the `cvpap_token` cookie the cards app sets is readable here. No
 * token is ever put in a URL.
 *
 *   GET /api/sso/cvpap?next=/dashboard
 *     1. read the cvpap_token cookie
 *     2. ask CVPAP who it belongs to (CVPAP stays the authority — we never
 *        verify its JWT ourselves, so there is no shared secret to leak)
 *     3. find/create the Reactive Resume account for that CVPAP *partner*
 *     4. start a session and redirect
 *
 * Multi-tenancy: the account is keyed to the **partner**, not the individual
 * staff member, so everyone working for a partner shares one library of
 * resumes — the same tenant boundary the cards side already enforces via
 * partner_id. A partner can never see another partner's resumes because they
 * resolve to different Reactive Resume accounts.
 */
import { sql } from "drizzle-orm";
import { auth, takeBotMagicLinkToken } from "@reactive-resume/auth/config";
import { db } from "@reactive-resume/db/client";
import { user } from "@reactive-resume/db/schema";
import { env } from "@reactive-resume/env/server";
import { generateId, slugify } from "@reactive-resume/utils/string";

const CVPAP_API_URL = process.env.WORKER_URL ?? process.env.CVPAP_API_URL ?? "https://api.ajiriwa.gidraf.dev";
const CVPAP_TOKEN_COOKIE = "cvpap_token";

/** Where the cards app lives, so we can bounce unauthenticated users to its login. */
const CARDS_BASE_PATH = process.env.CARDS_BASE_PATH ?? "/cards";

type CvpapMe = {
	user?: { id?: string; name?: string; email?: string | null };
	account_type?: string;
	partner_id?: string | null;
	partner?: { id: string; name: string; email: string | null } | null;
};

function readCookie(request: Request, name: string): string | null {
	const header = request.headers.get("cookie");
	if (!header) return null;
	for (const part of header.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key === name) return decodeURIComponent(rest.join("="));
	}
	return null;
}

function loginRedirect(next: string): Response {
	const target = `${env.APP_URL}${CARDS_BASE_PATH}/login?next=${encodeURIComponent(next)}`;
	return new Response(null, { status: 302, headers: { Location: target } });
}

/** Only same-site, absolute-path destinations. */
function safeNext(raw: string | null): string {
	if (!raw?.startsWith("/") || raw.startsWith("//")) return "/dashboard";
	return raw;
}

/** Stable, unique username for a tenant account. */
async function uniqueUsername(seed: string): Promise<string> {
	const base = (slugify(seed) || "partner").slice(0, 24);
	for (let attempt = 0; attempt < 5; attempt++) {
		const candidate = attempt === 0 ? base : `${base}-${generateId().slice(0, 6)}`;
		const [taken] = await db
			.select({ id: user.id })
			.from(user)
			.where(sql`lower(${user.username}) = lower(${candidate})`)
			.limit(1);
		if (!taken) return candidate;
	}
	return `${base}-${generateId().slice(0, 12)}`;
}

export async function handleCvpapSso(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const next = safeNext(url.searchParams.get("next"));

	const token = readCookie(request, CVPAP_TOKEN_COOKIE);
	if (!token) return loginRedirect(next);

	// CVPAP is the authority: it validates its own token and tells us the tenant.
	let me: CvpapMe;
	try {
		const res = await fetch(`${CVPAP_API_URL}/api/v1/cards/me`, {
			headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
		});
		if (!res.ok) return loginRedirect(next);
		me = (await res.json()) as CvpapMe;
	} catch {
		return new Response("Could not reach CVPAP to verify your session.", { status: 502 });
	}

	const partnerId = me.partner_id;
	if (!partnerId) {
		return new Response("This account is not linked to a partner.", { status: 403 });
	}

	// One Reactive Resume account per CVPAP partner = the tenant boundary.
	const partnerName = me.partner?.name ?? me.user?.name ?? "Partner";

	// Look the tenant up by partner id, never by email. A partner's contact
	// email is not unique per partner and is not ours to trust: keying on it
	// would let a partner land in whatever account already holds that address,
	// inheriting its resumes and its role.
	const [existing] = await db
		.select({ id: user.id, email: user.email })
		.from(user)
		.where(sql`${user.cvpapPartnerId} = ${partnerId}`)
		.limit(1);

	let email: string;

	if (existing) {
		// Established tenant: sign in as whatever address it already carries, so
		// a changed contact email in CVPAP does not fork the account.
		email = existing.email.toLowerCase();
	} else {
		const preferred = (me.partner?.email ?? "").trim().toLowerCase();
		const fallback = `partner-${partnerId}@cvpap.internal`;

		// The preferred address is only usable if no other account holds it.
		// Otherwise fall back to an address derived from the partner id, which
		// is unique by construction — we must never adopt someone else's row.
		let claimed = false;
		if (preferred) {
			const [taken] = await db
				.select({ id: user.id })
				.from(user)
				.where(sql`lower(${user.email}) = ${preferred}`)
				.limit(1);
			claimed = Boolean(taken);
		}

		email = preferred && !claimed ? preferred : fallback;

		const username = await uniqueUsername(partnerName);
		await db.insert(user).values({
			name: partnerName,
			email,
			// CVPAP already verified the human; there is no separate email loop here.
			emailVerified: true,
			username,
			displayUsername: username,
			cvpapPartnerId: partnerId,
		});
	}

	// Better Auth 1.7 has no server-side "create a session for this user" API, so
	// mint a magic link and redeem it immediately (same trick as bot-link.ts).
	const callbackURL = `${env.APP_URL}${next}`;
	await auth.api.signInMagicLink({ body: { email, callbackURL }, headers: request.headers });

	const magicToken = takeBotMagicLinkToken(email);
	if (!magicToken) return new Response("Could not start your session.", { status: 500 });

	return auth.api.magicLinkVerify({
		query: { token: magicToken, callbackURL },
		headers: request.headers,
		asResponse: true,
	});
}

/** Sign out of Reactive Resume too, then hand back to the cards app's logout. */
export async function handleCvpapSsoLogout(request: Request): Promise<Response> {
	try {
		await auth.api.signOut({ headers: request.headers });
	} catch {
		// already signed out — fall through to the redirect
	}
	return new Response(null, {
		status: 302,
		headers: { Location: `${env.APP_URL}${CARDS_BASE_PATH}/login` },
	});
}
