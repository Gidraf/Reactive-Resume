import type { SampleLength } from "./sample-lengths";
import { describe, expect, it } from "vitest";
import { sampleResumeData } from "./sample";
import {
	createAllSampleLengths,
	createSampleResumeOfLength,
	SAMPLE_LENGTH_LABELS,
	SAMPLE_LENGTHS,
} from "./sample-lengths";

/** Rough proxy for how much printed space a resume takes. */
function contentWeight(data: ReturnType<typeof createSampleResumeOfLength>): number {
	return Object.values(data.sections)
		.filter((section) => !section.hidden)
		.reduce((total, section) => {
			const itemText = section.items.reduce((sum, item) => {
				const text = Object.values(item as Record<string, unknown>)
					.filter((v): v is string => typeof v === "string")
					.join(" ");
				return sum + text.length;
			}, 0);
			return total + itemText;
		}, 0);
}

describe("sample resumes by length", () => {
	it("offers every advertised length with a label", () => {
		expect(SAMPLE_LENGTHS).toEqual(["1", "1.5", "2", "2.5", "3"]);
		for (const length of SAMPLE_LENGTHS) {
			expect(SAMPLE_LENGTH_LABELS[length]).toBeTruthy();
		}
	});

	it("grows monotonically with the requested length", () => {
		const weights = SAMPLE_LENGTHS.map((l) => contentWeight(createSampleResumeOfLength(l)));
		for (let i = 1; i < weights.length; i++) {
			expect(weights[i] ?? 0).toBeGreaterThan(weights[i - 1] ?? 0);
		}
	});

	it("adds distinct entries rather than repeating one", () => {
		const three = createSampleResumeOfLength("3");
		const companies = three.sections.experience.items.map((i) => (i as { company: string }).company);
		const projects = three.sections.projects.items.map((i) => (i as { name: string }).name);

		expect(companies.length).toBeGreaterThan(1);
		expect(new Set(companies).size).toBe(companies.length);
		expect(new Set(projects).size).toBe(projects.length);
	});

	it("keeps a one-page CV to the sections that earn the space", () => {
		const one = createSampleResumeOfLength("1");

		expect(one.sections.experience.hidden).toBe(false);
		expect(one.sections.education.hidden).toBe(false);
		expect(one.sections.skills.hidden).toBe(false);
		// the long tail belongs on a longer CV
		expect(one.sections.publications.hidden).toBe(true);
		expect(one.sections.references.hidden).toBe(true);
		expect(one.sections.volunteer.hidden).toBe(true);
	});

	it("shows the long tail only at three pages", () => {
		expect(createSampleResumeOfLength("3").sections.references.hidden).toBe(false);
		expect(createSampleResumeOfLength("2.5").sections.references.hidden).toBe(true);
		expect(createSampleResumeOfLength("2.5").sections.volunteer.hidden).toBe(false);
		expect(createSampleResumeOfLength("2").sections.volunteer.hidden).toBe(true);
	});

	it("carries the photo, since the preview is about how it looks printed", () => {
		for (const length of SAMPLE_LENGTHS) {
			const data = createSampleResumeOfLength(length);
			expect(data.picture.url).toBe(sampleResumeData.picture.url);
			expect(data.picture.hidden).toBe(false);
		}
	});

	it("uses the given name and leaves the persona otherwise intact", () => {
		const named = createSampleResumeOfLength("2", "  Amina Wanjiru  ");
		expect(named.basics.name).toBe("Amina Wanjiru");
		expect(named.basics.email).toBe(sampleResumeData.basics.email);

		expect(createSampleResumeOfLength("2", "   ").basics.name).toBe(sampleResumeData.basics.name);
		expect(createSampleResumeOfLength("2").basics.name).toBe(sampleResumeData.basics.name);
	});

	it("never mutates the shared sample", () => {
		const before = JSON.stringify(sampleResumeData);
		createAllSampleLengths("Someone Else");
		expect(JSON.stringify(sampleResumeData)).toBe(before);
	});

	it("gives every item a unique id, so nothing collides when seeded", () => {
		for (const length of SAMPLE_LENGTHS) {
			const data = createSampleResumeOfLength(length);
			const ids = Object.values(data.sections).flatMap((s) => s.items.map((i) => (i as { id: string }).id));
			expect(new Set(ids).size).toBe(ids.length);
		}
	});

	it("returns one entry per length from the picker helper", () => {
		const all = createAllSampleLengths();
		expect(all.map((a) => a.length)).toEqual([...SAMPLE_LENGTHS]);
		expect(all.every((a) => a.data.sections.experience.items.length > 0)).toBe(true);
	});

	// Page count comes from metadata.layout.pages: the renderer lays out the pages
	// the layout declares. How far content fills the last page depends on the
	// template and its fonts, so that is not asserted here — the declared
	// structure is what this module actually controls.
	it("declares the right number of layout pages", () => {
		const expected: Record<SampleLength, number> = { "1": 1, "1.5": 2, "2": 2, "2.5": 3, "3": 3 };
		for (const length of SAMPLE_LENGTHS) {
			expect(createSampleResumeOfLength(length).metadata.layout.pages).toHaveLength(expected[length]);
		}
	});

	it("replaces the stock layout rather than inheriting it", () => {
		// The shared sample declares four pages, which would otherwise force every
		// variant to the same length no matter how much content it has.
		expect(sampleResumeData.metadata.layout.pages).toHaveLength(4);
		expect(createSampleResumeOfLength("1").metadata.layout.pages).toHaveLength(1);
	});

	it("keeps visibility and layout placement in agreement", () => {
		for (const length of SAMPLE_LENGTHS) {
			const data = createSampleResumeOfLength(length);
			const placed = new Set(data.metadata.layout.pages.flatMap((p) => [...p.main, ...p.sidebar]));
			for (const [key, section] of Object.entries(data.sections)) {
				// a section that renders must be placed, and a placed one must render
				expect(section.hidden).toBe(!placed.has(key));
			}
			// summary is placed by the layout but lives outside `sections`
			expect(placed.has("summary")).toBe(true);
		}
	});

	it("shortens the summary on the one-page variant", () => {
		const one = createSampleResumeOfLength("1");
		const three = createSampleResumeOfLength("3");
		expect(one.summary.content.length).toBeLessThan(three.summary.content.length);
	});

	it("defaults to the cheapest template to print", () => {
		// The stock sample uses azurill, whose coloured sidebar is a full-height
		// solid block; bronzor paints no large area at all.
		expect(sampleResumeData.metadata.template).toBe("azurill");
		for (const length of SAMPLE_LENGTHS) {
			expect(createSampleResumeOfLength(length).metadata.template).toBe("bronzor");
		}
	});

	it("uses ink-light colours on white paper", () => {
		for (const length of SAMPLE_LENGTHS) {
			const { colors } = createSampleResumeOfLength(length).metadata.design;
			expect(colors.background).toBe("rgba(255, 255, 255, 1)");
			expect(colors.text).toBe("rgba(26, 26, 26, 1)");
			// a restrained slate rather than the stock saturated blue
			expect(colors.primary).not.toBe(sampleResumeData.metadata.design.colors.primary);
		}
	});

	it("leaves the rest of the design metadata alone", () => {
		const sized = createSampleResumeOfLength("2");
		expect(sized.metadata.design.level).toEqual(sampleResumeData.metadata.design.level);
		expect(sized.metadata.typography).toEqual(sampleResumeData.metadata.typography);
		expect(sized.metadata.page.format).toBe(sampleResumeData.metadata.page.format);
	});
});
