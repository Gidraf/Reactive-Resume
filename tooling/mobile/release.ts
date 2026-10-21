import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Reserve 99 attempts per workflow run; changing the offset later must never decrease store versions.
export function buildNumber(env: NodeJS.ProcessEnv) {
	const integer = (name: string) => {
		const value = env[name];
		if (!/^[0-9]+$/.test(value ?? "")) throw new Error(`${name} must be a non-negative integer`);
		const number = Number(value);
		if (!Number.isSafeInteger(number)) throw new Error(`${name} is too large`);
		return number;
	};
	const base = integer("MOBILE_BUILD_NUMBER_BASE");
	if (base < 1) throw new Error("MOBILE_BUILD_NUMBER_BASE must be positive");
	const run = integer("GITHUB_RUN_NUMBER");
	const attempt = integer("GITHUB_RUN_ATTEMPT");
	if (run < 1 || attempt < 1 || attempt > 99) throw new Error("Run must be positive; attempt must be 1–99");
	const number = base + (run - 1) * 100 + (attempt - 1);
	if (!Number.isSafeInteger(number) || number > 2_100_000_000) throw new Error("Android versionCode limit exceeded");
	return number;
}

export function validateRelease(env: NodeJS.ProcessEnv) {
	if (!["all", "android", "ios"].includes(env.PLATFORM ?? "")) throw new Error("Invalid release platform");
	if (!["true", "false"].includes(env.UPLOAD ?? "")) throw new Error("UPLOAD must be true or false");
	const required = ["EXPO_TOKEN"];
	if (env.PLATFORM !== "ios") {
		required.push("ANDROID_KEYSTORE_BASE64", "ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEY_ALIAS", "ANDROID_KEY_PASSWORD");
		if (env.UPLOAD === "true") required.push("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
	}
	if (env.PLATFORM !== "android") {
		required.push("IOS_DISTRIBUTION_P12_BASE64", "IOS_DISTRIBUTION_P12_PASSWORD", "IOS_PROVISION_PROFILE_BASE64");
		if (env.UPLOAD === "true") required.push("ASC_KEY_ID", "ASC_ISSUER_ID", "ASC_PRIVATE_KEY");
	}
	const missing = required.filter((name) => !env[name]?.trim());
	if (missing.length) throw new Error(`Missing Actions secrets: ${missing.join(", ")}`);
	return buildNumber(env);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	try {
		const number = validateRelease(process.env);
		if (!process.env.GITHUB_OUTPUT) throw new Error("GITHUB_OUTPUT is required");
		appendFileSync(process.env.GITHUB_OUTPUT, `build_number=${number}\n`);
	} catch (error) {
		console.error(error instanceof Error ? error.message : "Mobile release preparation failed");
		process.exitCode = 1;
	}
}
