import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { SampleLength } from "@reactive-resume/schema/resume/sample-lengths";
import type { Locale } from "@reactive-resume/utils/locale";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { createSampleResumeData } from "@reactive-resume/schema/resume/sample";
import { createSampleResumeOfLength } from "@reactive-resume/schema/resume/sample-lengths";
import { EMPTY_SEMANTIC_CSS_SOURCE } from "@reactive-resume/schema/resume/stylesheet";

type CreateResumeDataOptions = {
	withSampleData?: boolean;
	/** Sizes the sample to a printed length, for showing a client what they'll get. */
	// Explicitly `| undefined`: the repo runs exactOptionalPropertyTypes, so an
	// optional field passed through from a Zod `.optional()` must accept it.
	sampleLength?: SampleLength | undefined;
	name?: string;
	locale?: Locale;
};

function sampleFor(options: CreateResumeDataOptions): ResumeData {
	if (options.sampleLength) return createSampleResumeOfLength(options.sampleLength, options.name);
	return createSampleResumeData(options.name);
}

export function createResumeData(options: CreateResumeDataOptions): ResumeData {
	const useSample = options.withSampleData || Boolean(options.sampleLength);
	const data = structuredClone(useSample ? sampleFor(options) : defaultResumeData);

	if (options.locale) data.metadata.page.locale = options.locale;
	data.metadata.stylesheet = {
		mode: "semantic",
		source: { languageVersion: 1, text: EMPTY_SEMANTIC_CSS_SOURCE },
	};

	return data;
}
