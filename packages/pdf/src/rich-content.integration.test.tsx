import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { act } from "react";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { ResumeDocument } from "./document";
import { pdf, renderToBuffer } from "./forme/testing";
import {
	hostileMarkup,
	iconRow,
	metricChips,
	miniBarChart,
	progressRings,
	richContentFixture,
	skillBars,
	statsTable,
	styledText,
	timeline,
} from "./rich-content.fixture";
import { rasterizePdf } from "./semantic/test/rasterize-pdf";

// Set to a directory to keep the rendered fixture as PDF and PNG for a human look.
const SNAPSHOT_DIR = process.env.RICH_CONTENT_SNAPSHOT_DIR;

const fixture = (html: string): ResumeData => {
	const data = structuredClone(defaultResumeData);
	data.basics.name = "Amina Wanjiru";
	data.basics.headline = "Head of Sales";
	data.picture.hidden = true;
	data.summary.content = html;
	data.metadata.layout.pages = [{ fullWidth: true, main: ["summary"], sidebar: [] }];
	data.metadata.typography.body.fontFamily = "Helvetica";
	data.metadata.typography.heading.fontFamily = "Helvetica";
	data.metadata.stylesheet = { mode: "semantic", source: { languageVersion: 1, text: "@version 1;" } };
	return data;
};

const render = async (html: string, template: Template = "onyx") =>
	new Uint8Array(await act(() => renderToBuffer(<ResumeDocument data={fixture(html)} template={template} />)));

const pageText = async (bytes: Uint8Array) => {
	const loading = getDocument({ data: bytes.slice() });
	try {
		const document = await loading.promise;
		const page = await document.getPage(1);
		const content = await page.getTextContent();
		return content.items.flatMap((item) => ("str" in item ? [item.str] : [])).join(" ");
	} finally {
		await loading.destroy();
	}
};

type RenderedNode = NonNullable<ReturnType<typeof pdf>["container"]["document"]>;
type RenderedElement = Extract<RenderedNode, { props: unknown }>;
const collect = (node: RenderedNode | null, type: string): RenderedElement[] => {
	if (!node || !("props" in node)) return [];
	const own = node.type === type ? [node] : [];
	return [...own, ...node.children.flatMap((child) => collect(child, type))];
};
const tree = (html: string, template: Template = "onyx") =>
	pdf(<ResumeDocument data={fixture(html)} template={template} />).container.document;

type Rgb = readonly [number, number, number];
/** How many pixels of the rendered first page are within a small distance of `color`. */
const countColor = async (bytes: Uint8Array, color: Rgb) => {
	const [page] = await rasterizePdf(bytes.slice());
	if (!page) throw new Error("No page rendered");
	let count = 0;
	for (let at = 0; at < page.data.length; at += 4) {
		const distance =
			Math.abs((page.data[at] ?? 0) - color[0]) +
			Math.abs((page.data[at + 1] ?? 0) - color[1]) +
			Math.abs((page.data[at + 2] ?? 0) - color[2]);
		if (distance < 24) count++;
	}
	return count;
};

const TEAL: Rgb = [13, 148, 136];
const AMBER: Rgb = [245, 158, 11];

describe("rich content in summaries", () => {
	it("draws inline-styled spans with their colour and keeps the text extractable", async () => {
		const bytes = await render(styledText);
		expect(await pageText(bytes)).toContain("KES 42M");
		expect(await countColor(bytes, TEAL)).toBeGreaterThan(20);
	});

	it("lays out flex rows of styled divs (metric chips) with backgrounds", async () => {
		const bytes = await render(metricChips);
		const text = await pageText(bytes);
		expect(text).toContain("+38% sales");
		expect(text).toContain("12 hires");
		// The chip fill #ccfbf1.
		expect(await countColor(bytes, [204, 251, 241])).toBeGreaterThan(200);
	});

	it("draws inline SVG skill bars, progress rings and a mini bar chart", async () => {
		const html = [skillBars, progressRings, miniBarChart].join("");
		const svgs = collect(tree(html), "SVG");
		expect(svgs.length).toBe(3 + 3 + 1);
		for (const svg of svgs) {
			expect(svg.props.content).toMatch(/^<(rect|circle|line|path)/);
			expect(Number(svg.props.width)).toBeGreaterThan(0);
		}
		const bytes = await render(html);
		expect(await countColor(bytes, TEAL)).toBeGreaterThan(400);
		expect(await pageText(bytes)).toContain("Python");
	});

	it("draws a timeline with left borders", async () => {
		const bytes = await render(timeline);
		expect(await pageText(bytes)).toContain("Head of Sales, Acme Kenya");
		expect(await countColor(bytes, TEAL)).toBeGreaterThan(30);
	});

	it("draws data-URI PNG and SVG images in an icon row", async () => {
		const document = tree(iconRow);
		expect(collect(document, "IMAGE")).toHaveLength(1);
		// Both SVG data URIs (base64 and URL-encoded) become drawings, not fetched images.
		expect(collect(document, "SVG")).toHaveLength(2);
		const bytes = await render(iconRow);
		expect(await countColor(bytes, TEAL)).toBeGreaterThan(30);
		expect(await countColor(bytes, AMBER)).toBeGreaterThan(30);
		expect(await pageText(bytes)).toContain("Nairobi, Kenya");
	});

	it("lays out tables as rows and columns", async () => {
		const loading = getDocument({ data: (await render(statsTable)).slice() });
		try {
			const page = await (await loading.promise).getPage(1);
			const items = (await page.getTextContent()).items.flatMap((item) =>
				"str" in item ? [{ text: item.str, x: item.transform[4], y: item.transform[5] }] : [],
			);
			const at = (text: string) => {
				const found = items.find((item) => item.text === text);
				if (!found) throw new Error(`Missing ${text}`);
				return found;
			};
			expect(at("Accounts").y).toBe(at("185").y);
			expect(at("185").x).toBeGreaterThan(at("120").x);
			expect(at("Metric").y).toBeGreaterThan(at("Accounts").y);
		} finally {
			await loading.destroy();
		}
	});

	it("never fetches or embeds anything hostile markup points at", async () => {
		const requested: string[] = [];
		const realFetch = globalThis.fetch;
		globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input instanceof Request ? input.url : input);
			if (!url.startsWith("data:")) requested.push(url);
			return realFetch(input, init);
		}) as typeof fetch;
		try {
			const document = tree(hostileMarkup);
			// Remote pictures are left out entirely.
			expect(collect(document, "IMAGE")).toHaveLength(0);
			const [svg] = collect(document, "SVG");
			const content = String(svg?.props.content ?? "");
			expect(content).toBe('<rect width="20" height="20"></rect>');
			const bytes = await render(hostileMarkup);
			expect(bytes.length).toBeGreaterThan(0);
			expect(await pageText(bytes)).not.toContain("alert");
			expect(requested.filter((url) => !url.startsWith("file:"))).toEqual([]);
		} finally {
			globalThis.fetch = realFetch;
		}
	});

	it.each(["onyx", "azurill", "bronzor"] as const)("renders the whole fixture in %s", async (template) => {
		const bytes = await render(richContentFixture, template);
		const text = await pageText(bytes);
		for (const phrase of [
			"KES 42M",
			"+38% sales",
			"Python",
			"Leadership",
			"Revenue",
			"Acme Kenya",
			"Nairobi",
			"Retention",
		])
			expect(text).toContain(phrase);
		if (SNAPSHOT_DIR) await snapshot(bytes, template);
	});
});

async function snapshot(bytes: Uint8Array, name: string) {
	mkdirSync(SNAPSHOT_DIR as string, { recursive: true });
	writeFileSync(join(SNAPSHOT_DIR as string, `rich-content-${name}.pdf`), bytes);
	const [page] = await rasterizePdf(bytes.slice());
	if (!page) return;
	const canvas = createCanvas(page.width, page.height);
	const context = canvas.getContext("2d");
	const image = context.createImageData(page.width, page.height);
	image.data.set(page.data);
	context.putImageData(image, 0, 0);
	writeFileSync(join(SNAPSHOT_DIR as string, `rich-content-${name}.png`), canvas.toBuffer("image/png"));
}
