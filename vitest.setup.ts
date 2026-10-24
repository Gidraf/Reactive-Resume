import { join } from "node:path";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vite-plus/test";

// Several units under test transitively import the validated server env, which throws at import
// time when a required variable is missing.
//
// Load the workspace env files first (.env.local / .env.test win over .env) so a developer's
// throwaway database is used, then fill in anything still missing. Tests must never reach the
// production database, so the fallback stays a local one. Real process.env still wins.
process.env.NODE_ENV ??= "test";

// Inlined rather than imported from @reactive-resume/env: this setup file runs for every
// workspace project, including ones that do not depend on that package, and Vite resolves
// imports at build time so a try/catch around the import would not help.
// This file sits at the workspace root, so its own directory is where the env files live.
for (const file of [".env.local", `.env.${process.env.NODE_ENV}`, ".env"]) {
	try {
		process.loadEnvFile(join(import.meta.dirname, file));
	} catch {
		// missing env files are expected
	}
}

process.env.APP_URL ??= "http://localhost:3000";
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
process.env.AUTH_SECRET ??= "test-auth-secret";

// React Testing Library auto-cleanup hooks into afterEach as a global, but Vitest
// only exposes `afterEach` globally when `test.globals: true` is set. We register
// the cleanup explicitly so component tests do not leak DOM between runs.
afterEach(() => {
	cleanup();
});

// Same reason as the cleanup above: RTL flips `IS_REACT_ACT_ENVIRONMENT` from its own global
// `beforeAll`/`afterAll` hooks, which it skips without `test.globals`. Without the flag React
// logs "The current testing environment is not configured to support act(...)" on every
// `act()` call, so set it here instead.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
