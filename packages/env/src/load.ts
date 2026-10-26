import { join } from "node:path";
import { findWorkspaceRoot } from "@reactive-resume/utils/monorepo.node";

/**
 * Load the workspace `.env` files, layered like Next.js.
 *
 * `process.loadEnvFile` never overwrites a variable that is already set, so the
 * first file to define one wins. Loading most-specific first gives:
 *
 *   real process.env  >  .env.local  >  .env.<NODE_ENV>  >  .env
 *
 * `.env.local` and `.env.test` are git-ignored and point at a throwaway
 * database, so nothing run locally can reach the production one. Deployments
 * ship only `.env` (or inject the variables directly), so they are unaffected.
 *
 * Returns the files that were actually loaded, for diagnostics.
 */
export function loadEnvFiles(): string[] {
	const workspaceRoot = findWorkspaceRoot();
	if (!workspaceRoot) return [];

	const nodeEnv = process.env.NODE_ENV;
	const candidates = [".env.local", ...(nodeEnv ? [`.env.${nodeEnv}`] : []), ".env"];
	const loaded: string[] = [];

	for (const file of candidates) {
		try {
			process.loadEnvFile(join(workspaceRoot, file));
			loaded.push(file);
		} catch (error) {
			// Missing files are expected (production injects env directly); anything else is real.
			if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
		}
	}

	return loaded;
}
