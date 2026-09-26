import { defineConfig } from "drizzle-kit";
import { loadEnvFiles } from "@reactive-resume/env/load";

// drizzle-kit runs outside the app, so it has to load the same layered .env
// files itself — otherwise migrations silently fall back to whatever
// DATABASE_URL happens to be exported, or none at all.
loadEnvFiles();

export default defineConfig({
	schema: "./src/schema/index.ts",
	out: "../../migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
});
