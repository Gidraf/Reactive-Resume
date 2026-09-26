import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	signInMagicLink: vi.fn(),
	magicLinkVerify: vi.fn(),
	signOut: vi.fn(),
	takeBotMagicLinkToken: vi.fn(),
	select: vi.fn(),
	insert: vi.fn(),
	insertedValues: [] as unknown[],
}));

vi.mock("@reactive-resume/auth/config", () => ({
	auth: {
		api: {
			signInMagicLink: mocks.signInMagicLink,
			magicLinkVerify: mocks.magicLinkVerify,
			signOut: mocks.signOut,
		},
	},
	takeBotMagicLinkToken: mocks.takeBotMagicLinkToken,
}));

vi.mock("@reactive-resume/db/client", () => ({
	db: {
		select: () => ({ from: () => ({ where: () => ({ limit: () => mocks.select() }) }) }),
		insert: () => ({
			values: (values: unknown) => {
				mocks.insertedValues.push(values);
				return mocks.insert();
			},
		}),
	},
}));

vi.mock("@reactive-resume/db/schema", () => ({
	user: { id: "id", email: "email", username: "username", cvpapPartnerId: "cvpap_partner_id" },
}));

vi.mock("@reactive-resume/env/server", () => ({
	env: { APP_URL: "https://cards.gidraf.dev" },
}));

const { handleCvpapSso, handleCvpapSsoLogout } = await import("./cvpap-sso");

const withCookie = (token?: string) =>
	new Request("https://cards.gidraf.dev/api/sso/cvpap?next=/dashboard", {
		headers: token ? { cookie: `cvpap_token=${token}; other=x` } : {},
	});

function mockCvpapMe(body: unknown, ok = true) {
	vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok, json: async () => body } as unknown as Response));
}

/**
 * The handler runs up to three lookups, in order:
 *   1. find the tenant by CVPAP partner id
 *   2. (only when creating) is the partner's contact email already claimed?
 *   3. (only when creating) is the candidate username free?
 * Queue one result per lookup so a test can describe each independently.
 */
function queueLookups(...results: unknown[][]) {
	mocks.select.mockReset();
	for (const result of results) mocks.select.mockResolvedValueOnce(result);
	mocks.select.mockResolvedValue([]);
}

describe("CVPAP single sign-on", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.insertedValues.length = 0;
		mocks.takeBotMagicLinkToken.mockReturnValue("magic-token");
		mocks.magicLinkVerify.mockResolvedValue(new Response(null, { status: 302 }));
		mocks.select.mockResolvedValue([{ id: "u1", email: "acme@example.com" }]);
	});

	it("sends visitors without a CVPAP cookie to the single login page", async () => {
		const res = await handleCvpapSso(withCookie());

		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("https://cards.gidraf.dev/cards/login?next=%2Fdashboard");
		expect(mocks.signInMagicLink).not.toHaveBeenCalled();
	});

	it("sends visitors back to login when CVPAP rejects the token", async () => {
		mockCvpapMe({}, false);

		const res = await handleCvpapSso(withCookie("stale"));

		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toContain("/cards/login");
	});

	it("starts a session for the partner's existing account", async () => {
		queueLookups([{ id: "u1", email: "Acme@Example.com" }]);
		mockCvpapMe({ partner_id: "p1", partner: { id: "p1", name: "Acme", email: "acme@example.com" } });

		await handleCvpapSso(withCookie("good"));

		// existing tenant: nothing created
		expect(mocks.insertedValues).toHaveLength(0);
		// signs in as the address the account already carries, normalised
		expect(mocks.signInMagicLink).toHaveBeenCalledWith(
			expect.objectContaining({
				body: { email: "acme@example.com", callbackURL: "https://cards.gidraf.dev/dashboard" },
			}),
		);
		expect(mocks.magicLinkVerify).toHaveBeenCalledWith(
			expect.objectContaining({ query: expect.objectContaining({ token: "magic-token" }), asResponse: true }),
		);
	});

	it("provisions one account per partner, keyed to the partner not the staff member", async () => {
		queueLookups([], [], []); // no tenant, email free, username free
		mockCvpapMe({
			partner_id: "p42",
			partner: { id: "p42", name: "Mwihoko Cyber", email: null },
			user: { id: "staff1", name: "Jane", email: "jane@example.com" },
		});

		await handleCvpapSso(withCookie("good"));

		expect(mocks.insertedValues).toHaveLength(1);
		const created = mocks.insertedValues[0] as Record<string, unknown>;
		// tenant identity comes from the partner, never the signed-in staff member
		expect(created.email).toBe("partner-p42@cvpap.internal");
		expect(created.name).toBe("Mwihoko Cyber");
		expect(created.emailVerified).toBe(true);
		expect(created.cvpapPartnerId).toBe("p42");
		expect(created.username).toBe(created.displayUsername);
		expect(String(created.username)).not.toHaveLength(0);
	});

	it("uses the partner's own address when no other account holds it", async () => {
		queueLookups([], [], []); // no tenant, email free, username free
		mockCvpapMe({ partner_id: "p7", partner: { id: "p7", name: "Acme", email: "Acme@Example.com" } });

		await handleCvpapSso(withCookie("good"));

		const created = mocks.insertedValues[0] as Record<string, unknown>;
		expect(created.email).toBe("acme@example.com");
		expect(created.cvpapPartnerId).toBe("p7");
	});

	// Regression: keying the lookup on email let a partner land in whatever
	// account already held that address — including an admin's — inheriting its
	// resumes and its role.
	it("never adopts an existing account that merely shares the partner's email", async () => {
		queueLookups(
			[], // no account for this partner id
			[{ id: "admin1" }], // ...but something already owns the address
			[], // username free
		);
		mockCvpapMe({ partner_id: "p99", partner: { id: "p99", name: "Church Demo", email: "church@demo.com" } });

		await handleCvpapSso(withCookie("good"));

		// a separate account is created rather than reusing the claimed one
		expect(mocks.insertedValues).toHaveLength(1);
		const created = mocks.insertedValues[0] as Record<string, unknown>;
		expect(created.email).toBe("partner-p99@cvpap.internal");
		expect(created.cvpapPartnerId).toBe("p99");
		// and the session is started for the new account, not the claimed address
		expect(mocks.signInMagicLink).toHaveBeenCalledWith(
			expect.objectContaining({
				body: expect.objectContaining({ email: "partner-p99@cvpap.internal" }),
			}),
		);
	});

	it("keeps two partners that share a contact email in separate tenants", async () => {
		queueLookups([], [{ id: "tenantA" }], []); // partner B: own id absent, A holds the email
		mockCvpapMe({ partner_id: "pB", partner: { id: "pB", name: "Second Shop", email: "shared@example.com" } });

		await handleCvpapSso(withCookie("good"));

		const created = mocks.insertedValues[0] as Record<string, unknown>;
		expect(created.email).toBe("partner-pB@cvpap.internal");
		expect(created.cvpapPartnerId).toBe("pB");
	});

	it("refuses a CVPAP session that has no partner", async () => {
		mockCvpapMe({ partner_id: null, user: { id: "u9" } });

		const res = await handleCvpapSso(withCookie("good"));

		expect(res.status).toBe(403);
		expect(mocks.signInMagicLink).not.toHaveBeenCalled();
	});

	it("ignores an off-site next target", async () => {
		queueLookups([{ id: "u1", email: "acme@example.com" }]);
		mockCvpapMe({ partner_id: "p1", partner: { id: "p1", name: "Acme", email: "acme@example.com" } });
		const request = new Request("https://cards.gidraf.dev/api/sso/cvpap?next=https://evil.test/steal", {
			headers: { cookie: "cvpap_token=good" },
		});

		await handleCvpapSso(request);

		expect(mocks.signInMagicLink).toHaveBeenCalledWith(
			expect.objectContaining({
				body: expect.objectContaining({ callbackURL: "https://cards.gidraf.dev/dashboard" }),
			}),
		);
	});

	it("clears the resume session and returns to the single login page", async () => {
		const res = await handleCvpapSsoLogout(new Request("https://cards.gidraf.dev/api/sso/logout"));

		expect(mocks.signOut).toHaveBeenCalled();
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("https://cards.gidraf.dev/cards/login");
	});
});
