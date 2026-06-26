/**
 * Fetches AI system prompts from Langfuse at runtime and tracks every
 * LLM generation as a Langfuse trace so usage statistics appear in the
 * Langfuse dashboard (tokens, latency, cost per prompt).
 *
 * Prompt names in Langfuse:
 *   rr_chat_system         — resume chat / editing assistant
 *   rr_analyze_resume      — resume analysis / scorecard
 *   rr_pdf_parser_system   — PDF → resume JSON extractor
 *   rr_pdf_parser_user     — PDF parser user message
 *   rr_docx_parser_system  — DOCX → resume JSON extractor
 *   rr_docx_parser_user    — DOCX parser user message
 *
 * Env vars required for Langfuse:
 *   LANGFUSE_PUBLIC_KEY   — pk-lf-…
 *   LANGFUSE_SECRET_KEY   — sk-lf-…
 *   LANGFUSE_BASEURL      — https://langfuse.gidraf.dev
 */

import {
	analyzeResumeSystemPrompt as analyzeResumeFallback,
	chatSystemPromptTemplate as chatSystemFallback,
	docxParserSystemPrompt as docxParserSystemFallback,
	docxParserUserPrompt as docxParserUserFallback,
	pdfParserSystemPrompt as pdfParserSystemFallback,
	pdfParserUserPrompt as pdfParserUserFallback,
} from "./prompts";

// ── Langfuse client type (minimal surface we use) ────────────────────────────

type LangfusePromptClient = {
	getPrompt(name: string): Promise<{ compile(vars: Record<string, string>): string } | null>;
	trace(opts: { name: string; sessionId?: string }): LangfuseTrace;
	flush(): Promise<void>;
};

type LangfuseTrace = {
	generation(opts: LangfuseGenerationOpts): LangfuseGeneration;
};

type LangfuseGeneration = {
	end(opts: { output?: string; usage?: LangfuseUsage; level?: string }): void;
};

type LangfuseUsage = {
	input: number | undefined;
	output: number | undefined;
	total: number | undefined;
	unit: string;
};

type LangfuseGenerationOpts = {
	name: string;
	model?: string;
	modelParameters?: Record<string, unknown>;
	input?: unknown;
	startTime?: Date;
	promptName?: string;
};

// ── Singleton client ──────────────────────────────────────────────────────────

let _langfuse: LangfusePromptClient | null | undefined;

function getLangfuse(): LangfusePromptClient | null {
	if (_langfuse !== undefined) return _langfuse;

	const secretKey = process.env.LANGFUSE_SECRET_KEY;
	const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
	const baseUrl = process.env.LANGFUSE_BASEURL ?? "https://cloud.langfuse.com";

	if (!secretKey || !publicKey) {
		_langfuse = null;
		return null;
	}

	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { Langfuse } = require("langfuse");
		_langfuse = new Langfuse({ secretKey, publicKey, baseUrl }) as LangfusePromptClient;
		console.info("[Langfuse] Connected —", baseUrl);
		return _langfuse;
	} catch {
		_langfuse = null;
		return null;
	}
}

// ── Prompt fetching ───────────────────────────────────────────────────────────

async function fetchPrompt(name: string, fallback: string): Promise<string> {
	const client = getLangfuse();
	if (!client) return fallback;

	try {
		const prompt = await client.getPrompt(name);
		if (prompt) return prompt.compile({});
	} catch (err) {
		console.warn(`[Langfuse] Could not fetch prompt '${name}':`, err);
	}

	return fallback;
}

// ── Generation tracking ───────────────────────────────────────────────────────

export type TrackGenerationOpts = {
	/** Trace name shown in Langfuse (e.g. "parse-pdf", "chat", "analyze-resume") */
	traceName: string;
	/** The Langfuse prompt name that was used */
	promptName: string;
	/** e.g. "openai/gpt-4o-mini" */
	model: string;
	/** Input passed to the model (will be stringified if not already a string) */
	input: unknown;
	/** Model output text */
	output?: string;
	/** Token counts from the Vercel AI SDK result.usage object */
	usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
	/** Optional ISO session/user identifier for grouping traces */
	sessionId?: string;
};

/**
 * Fire-and-forget: records one LLM call to Langfuse.
 * Never throws — silently skips if Langfuse is unconfigured.
 */
export function trackGeneration(opts: TrackGenerationOpts): void {
	const client = getLangfuse();
	if (!client) return;

	try {
		const startTime = new Date();
		const trace = client.trace({ name: opts.traceName, ...(opts.sessionId ? { sessionId: opts.sessionId } : {}) });

		const generation = trace.generation({
			name: opts.promptName,
			model: opts.model,
			input: typeof opts.input === "string" ? opts.input : JSON.stringify(opts.input),
			startTime,
			promptName: opts.promptName,
		});

		const endOpts: Parameters<LangfuseGeneration["end"]>[0] = {};
		if (opts.output) endOpts.output = opts.output;
		if (opts.usage) {
			endOpts.usage = {
				input: opts.usage.promptTokens,
				output: opts.usage.completionTokens,
				total: opts.usage.totalTokens,
				unit: "TOKENS",
			};
		}
		generation.end(endOpts);

		// Non-blocking flush — send to Langfuse in background
		void client.flush().catch(() => {});
	} catch {
		// Never let Langfuse tracking errors surface to the user
	}
}

// ── Exported prompt getters ───────────────────────────────────────────────────

export async function getChatSystemPrompt(): Promise<string> {
	return fetchPrompt("rr_chat_system", chatSystemFallback);
}

export async function getAnalyzeResumeSystemPrompt(): Promise<string> {
	return fetchPrompt("rr_analyze_resume", analyzeResumeFallback);
}

export async function getPdfParserSystemPrompt(): Promise<string> {
	return fetchPrompt("rr_pdf_parser_system", pdfParserSystemFallback);
}

export async function getPdfParserUserPrompt(): Promise<string> {
	return fetchPrompt("rr_pdf_parser_user", pdfParserUserFallback);
}

export async function getDocxParserSystemPrompt(): Promise<string> {
	return fetchPrompt("rr_docx_parser_system", docxParserSystemFallback);
}

export async function getDocxParserUserPrompt(): Promise<string> {
	return fetchPrompt("rr_docx_parser_user", docxParserUserFallback);
}
