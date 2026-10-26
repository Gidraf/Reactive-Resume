// @vitest-environment happy-dom

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
	composeCoverLetter,
	copyCoverLetterStyle,
	createCoverLetterResumeData,
} from "@reactive-resume/resume/cover-letter";
import { createSampleResumeOfLength } from "@reactive-resume/schema/resume/sample-lengths";
import { htmlToParagraphs } from "./html-to-docx";
import { buildDocx } from "./index";

// CVpap ships Word files in its paid tier: a CV and a cover letter per job description.
// Set to a directory to keep the generated .docx files for opening in Word.
const SNAPSHOT_DIR = process.env.DOCX_SNAPSHOT_DIR;

const keep = async (blob: Blob, name: string) => {
	if (!SNAPSHOT_DIR) return;
	mkdirSync(SNAPSHOT_DIR, { recursive: true });
	writeFileSync(join(SNAPSHOT_DIR, name), new Uint8Array(await blob.arrayBuffer()));
};

const isZip = async (blob: Blob) => {
	const bytes = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
	return bytes[0] === 0x50 && bytes[1] === 0x4b;
};

describe("CVpap Word exports", () => {
	it.each(["1", "2", "3"] as const)("builds a %s-page sample CV as a .docx", async (length) => {
		const data = createSampleResumeOfLength(length, "Amina Wanjiru");
		const blob = await buildDocx(data);
		expect(blob.size).toBeGreaterThan(5_000);
		expect(await isZip(blob)).toBe(true);
		await keep(blob, `cv-${length}-page.docx`);
	});

	it("builds a structured cover letter as a .docx, as the letter export route composes it", async () => {
		const style = copyCoverLetterStyle(createSampleResumeOfLength("1", "Amina Wanjiru"));
		const letter = {
			name: "Application — Head of Sales",
			layout: "structured" as const,
			recipient: "",
			recipientName: "Ms. Njeri Kamau",
			recipientCompany: "Acme Kenya",
			letterDate: "2026-10-24",
			content: "<p>I am applying for the Head of Sales role.</p><p>Last year I grew revenue by 38%.</p>",
			style,
		};
		const composed = composeCoverLetter(letter, {
			greeting: (name) => `Dear ${name},`,
			teamGreeting: "Dear hiring team,",
			hiringTeam: "Hiring team",
			signOff: "Kind regards,",
			formatDate: (date) => date,
		});
		const blob = await buildDocx(createCoverLetterResumeData({ ...letter, ...composed }));
		expect(blob.size).toBeGreaterThan(3_000);
		expect(await isZip(blob)).toBe(true);
		await keep(blob, "cover-letter.docx");
	});

	it("keeps the words of rich content and drops its drawings", () => {
		const html = `<div style="display: flex; flex-direction: row; gap: 6pt">
<div style="background-color: #ccfbf1; padding: 3pt 8pt">+38% sales</div>
<div style="background-color: #dbeafe; padding: 3pt 8pt">12 hires</div>
</div>
<div style="display: flex; flex-direction: row"><div style="width: 90pt">Python</div><svg width="140" height="6" viewBox="0 0 140 6"><rect width="126" height="6" fill="#0d9488"/></svg></div>
<div><img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"/>Nairobi, Kenya</div>`;
		const json = JSON.stringify(htmlToParagraphs(html));
		for (const words of ["+38% sales", "12 hires", "Python", "Nairobi, Kenya"]) expect(json).toContain(words);
		expect(json).not.toMatch(/<svg|<rect|iVBORw0KGgo/);
	});
});
