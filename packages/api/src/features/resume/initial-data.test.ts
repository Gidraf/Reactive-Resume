import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { createResumeData } from "./initial-data";

describe("createResumeData", () => {
	it("seeds one canonical empty stylesheet source", () => {
		expect(createResumeData({}).metadata.stylesheet).toEqual({
			mode: "semantic",
			source: { languageVersion: 1, text: "@version 1;\n" },
		});
	});

	it("clones normal and sample defaults instead of mutating shared data", () => {
		const normal = createResumeData({ locale: "de-DE" });
		const sample = createResumeData({ withSampleData: true, name: "Sample Person", locale: "de-DE" });

		normal.basics.name = "Mutated";
		sample.metadata.page.locale = "en-US";

		expect(defaultResumeData.basics.name).toBe("");
		expect(defaultResumeData.metadata.page.locale).not.toBe("de-DE");
		expect(sample.basics.name).toBe("Sample Person");
	});

	it("sizes the sample to the requested printed length", () => {
		const one = createResumeData({ sampleLength: "1", name: "Amina" });
		const three = createResumeData({ sampleLength: "3", name: "Amina" });

		// Length is carried by the layout, not by text volume.
		expect(one.metadata.layout.pages).toHaveLength(1);
		expect(three.metadata.layout.pages).toHaveLength(3);
		expect(three.sections.experience.items.length).toBeGreaterThan(one.sections.experience.items.length);
		expect(one.basics.name).toBe("Amina");
	});

	it("treats a requested length as asking for sample data", () => {
		// withSampleData is not set here — the length alone should seed the sample.
		const sized = createResumeData({ sampleLength: "2" });
		expect(sized.sections.experience.items.length).toBeGreaterThan(0);
		expect(sized.basics.name).not.toBe("");
	});

	it("falls back to the unsized sample when no length is given", () => {
		const plain = createResumeData({ withSampleData: true });
		expect(plain.metadata.layout.pages).toHaveLength(4);
	});

	it("still seeds the empty stylesheet for a sized sample", () => {
		expect(createResumeData({ sampleLength: "1.5" }).metadata.stylesheet).toEqual({
			mode: "semantic",
			source: { languageVersion: 1, text: "@version 1;\n" },
		});
	});
});
