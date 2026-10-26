import type { HTMLElement, Node } from "node-html-parser";
import { NodeType, parse } from "node-html-parser";
import { toColor } from "./forme/style";

/**
 * Pictures and drawings inside rich text (`<img>`, inline `<svg>`), reduced to what the PDF can draw without
 * reaching outside the document: images only as data URIs, SVG only as an allowlisted set of shapes and
 * presentation attributes. Nothing here fetches, runs script or references another resource.
 */

/** Longest data URI accepted in rich text; a resume's JSON carries it, so keep pictures small. */
export const MAX_RICH_IMAGE_DATA_URI_LENGTH = 1_500_000;
/** Largest drawn size of a rich-text picture or drawing, in points: an A4 page's printable width. */
export const MAX_RICH_MEDIA_SIZE = 540;
/** Size of an `<svg>` that says nothing about its size: no width, height or viewBox. */
const FALLBACK_SVG_SIZE = 100;

const RASTER_DATA_URI = /^data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/i;
const SVG_DATA_URI = /^data:image\/svg\+xml(;base64)?(?:;charset=[\w-]+)?,/i;

// Shapes Forme draws, and groups. Everything else (script, style, foreignObject, image, use, a, defs, gradients,
// filters, animation, and `text`, which Forme doesn't draw) is dropped with its children.
const SVG_ELEMENTS = new Set(["g", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path"]);

// Geometry and the presentation Forme draws. No `href`/`xlink:href`, no `style` (its allowed properties become
// attributes), no event handlers, no `class` or `id` (nothing can select them). `transform` and dash patterns are
// left out because Forme ignores them: dropping them keeps what's drawn the same in every renderer.
const SVG_ATTRIBUTES = new Set([
	"x",
	"y",
	"x1",
	"y1",
	"x2",
	"y2",
	"cx",
	"cy",
	"r",
	"rx",
	"ry",
	"width",
	"height",
	"d",
	"points",
	"fill",
	"fill-opacity",
	"fill-rule",
	"stroke",
	"stroke-width",
	"stroke-opacity",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-miterlimit",
	"opacity",
]);

// A value that could pull in another resource or smuggle markup is refused outright.
const UNSAFE_VALUE = /url\s*\(|javascript:|data:|expression\s*\(|[<>]|&#|\\/i;

const escapeAttribute = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const tagOf = (element: HTMLElement) => (element.rawTagName ?? "").toLowerCase();

/** Attributes by lower-cased name, from the source (node-html-parser keeps `viewBox`'s case only in `rawAttributes`). */
function attributesOf(element: HTMLElement): Map<string, string> {
	const attributes = new Map<string, string>();
	for (const [name, value] of Object.entries(element.rawAttributes)) attributes.set(name.toLowerCase(), value);
	return attributes;
}

/** `style="fill: red; stroke-width: 2"` as attributes, for the properties SVG also takes as attributes. */
function styleAttributes(style: string | undefined): Map<string, string> {
	const attributes = new Map<string, string>();
	if (!style) return attributes;
	for (const declaration of style.split(";")) {
		const colon = declaration.indexOf(":");
		if (colon === -1) continue;
		const property = declaration.slice(0, colon).trim().toLowerCase();
		const value = declaration.slice(colon + 1).trim();
		if (property && value && SVG_ATTRIBUTES.has(property)) attributes.set(property, value);
	}
	return attributes;
}

const COLOR_ATTRIBUTES = new Set(["fill", "stroke"]);

/** A colour Forme reads, `none`, or undefined; named colours become hex, as Forme would draw them black. */
const svgColor = (value: string) => (value.trim().toLowerCase() === "none" ? "none" : toColor(value));

const number = (value: string | undefined) => {
	const parsed = Number.parseFloat(value ?? "");
	return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Forme draws `<rect rx>` square, so a rounded rectangle (a skill bar's ends, a chip) becomes the equivalent path
 * of four lines and four arcs.
 */
function roundedRect(attributes: Map<string, string>): ["rect" | "path", Map<string, string>] {
	const width = number(attributes.get("width"));
	const height = number(attributes.get("height"));
	let rx = number(attributes.get("rx") ?? attributes.get("ry"));
	let ry = number(attributes.get("ry") ?? attributes.get("rx"));
	attributes.delete("rx");
	attributes.delete("ry");
	if (rx <= 0 || ry <= 0 || width <= 0 || height <= 0) return ["rect", attributes];
	rx = Math.min(rx, width / 2);
	ry = Math.min(ry, height / 2);
	const x = number(attributes.get("x"));
	const y = number(attributes.get("y"));
	const arc = (toX: number, toY: number) => `A ${rx} ${ry} 0 0 1 ${toX} ${toY}`;
	const d = [
		`M ${x + rx} ${y}`,
		`H ${x + width - rx}`,
		arc(x + width, y + ry),
		`V ${y + height - ry}`,
		arc(x + width - rx, y + height),
		`H ${x + rx}`,
		arc(x, y + height - ry),
		`V ${y + ry}`,
		arc(x + rx, y),
		"Z",
	].join(" ");
	for (const name of ["x", "y", "width", "height"]) attributes.delete(name);
	attributes.set("d", d);
	return ["path", attributes];
}

function serializeSvgNode(node: Node): string {
	if (node.nodeType !== NodeType.ELEMENT_NODE) return "";
	const element = node as HTMLElement;
	const tag = tagOf(element);
	if (!SVG_ELEMENTS.has(tag)) return "";

	const source = attributesOf(element);
	const attributes = styleAttributes(source.get("style"));
	// An attribute written out wins over the same property in `style`, as a presentation attribute would lose to
	// CSS in a browser; either way only one is kept.
	for (const [name, value] of source) if (SVG_ATTRIBUTES.has(name)) attributes.set(name, value);
	for (const [name, value] of attributes) {
		const safe = value.trim() !== "" && !UNSAFE_VALUE.test(value);
		const color = safe && COLOR_ATTRIBUTES.has(name) ? svgColor(value) : value.trim();
		if (!safe || color === undefined) attributes.delete(name);
		else attributes.set(name, color);
	}

	const [drawnTag, drawnAttributes] = tag === "rect" ? roundedRect(attributes) : [tag, attributes];
	const rendered = [...drawnAttributes].map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`).join("");
	const children = element.childNodes.map(serializeSvgNode).join("");
	return `<${drawnTag}${rendered}>${children}</${drawnTag}>`;
}

/** A length attribute in points: unitless and `px` count as points, as everywhere else in the PDF. */
function lengthOf(value: string | undefined): number | undefined {
	if (!value) return undefined;
	const match = /^\s*(\d*\.?\d+)\s*(px|pt)?\s*$/i.exec(value);
	if (!match) return undefined;
	const number = Number(match[1]);
	return Number.isFinite(number) && number > 0 ? number : undefined;
}

function viewBoxOf(value: string | undefined): [number, number, number, number] | undefined {
	if (!value) return undefined;
	const parts = value
		.trim()
		.split(/[\s,]+/)
		.map(Number);
	if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return undefined;
	const [minX = 0, minY = 0, width = 0, height = 0] = parts;
	return width > 0 && height > 0 ? [minX, minY, width, height] : undefined;
}

export type SanitizedSvg = {
	/** The drawing's inner markup, allowlisted and re-serialized. */
	content: string;
	viewBox: string | undefined;
	/** Drawn size in points. */
	width: number;
	height: number;
};

type SvgSize = { width?: number | undefined; height?: number | undefined };

/**
 * An `<svg>` element reduced to shapes Forme can draw. `size` comes from the element's inline style, which wins over
 * its `width`/`height` attributes as in a browser. Null when nothing drawable is left.
 */
export function sanitizeSvgElement(svg: HTMLElement, size: SvgSize = {}): SanitizedSvg | null {
	const attributes = attributesOf(svg);
	const content = svg.childNodes.map(serializeSvgNode).join("");
	if (!content) return null;

	const viewBox = viewBoxOf(attributes.get("viewbox"));
	let width = size.width ?? lengthOf(attributes.get("width"));
	let height = size.height ?? lengthOf(attributes.get("height"));
	const ratio = viewBox ? viewBox[3] / viewBox[2] : 1;
	if (width === undefined && height === undefined) {
		width = viewBox?.[2] ?? FALLBACK_SVG_SIZE;
		height = viewBox?.[3] ?? FALLBACK_SVG_SIZE;
	} else if (width === undefined) width = (height ?? FALLBACK_SVG_SIZE) / ratio;
	else if (height === undefined) height = width * ratio;

	// Never wider than the page, keeping the shape.
	const scale = Math.min(1, MAX_RICH_MEDIA_SIZE / (width ?? 1), MAX_RICH_MEDIA_SIZE / (height ?? 1));
	return {
		content,
		viewBox: viewBox ? viewBox.join(" ") : `0 0 ${width} ${height}`,
		width: (width ?? FALLBACK_SVG_SIZE) * scale,
		height: (height ?? FALLBACK_SVG_SIZE) * scale,
	};
}

/** SVG markup (a whole `<svg>…</svg>` document) reduced as `sanitizeSvgElement` does. */
export function sanitizeSvgMarkup(markup: string, size: SvgSize = {}): SanitizedSvg | null {
	const root = parse(markup, { comment: false });
	const svg = root.querySelector("svg");
	return svg ? sanitizeSvgElement(svg, size) : null;
}

const decodeBase64 = (value: string) => {
	try {
		const binary = atob(value.replace(/\s+/g, ""));
		return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
	} catch {
		return undefined;
	}
};

export type RichImage =
	| { kind: "raster"; src: string; width: number | undefined; height: number | undefined }
	| ({ kind: "svg" } & SanitizedSvg);

/**
 * What an `<img src>` in rich text draws: a PNG/JPEG/WebP data URI as a picture, an SVG data URI as a drawing.
 * Null for anything else — a URL is never fetched from rich text, so a remote picture is left out.
 */
export function resolveRichImage(src: string | undefined, size: SvgSize = {}): RichImage | null {
	const source = src?.trim();
	if (!source || source.length > MAX_RICH_IMAGE_DATA_URI_LENGTH) return null;
	if (RASTER_DATA_URI.test(source)) {
		// Forme reads `image/jpeg`; `image/jpg` is a common misspelling of it.
		const normalized = source.replace(/^data:image\/jpg;/i, "data:image/jpeg;").replace(/\s+/g, "");
		const clamp = (value: number | undefined) =>
			value === undefined ? undefined : Math.min(value, MAX_RICH_MEDIA_SIZE);
		return { kind: "raster", src: normalized, width: clamp(size.width), height: clamp(size.height) };
	}
	const svgMatch = SVG_DATA_URI.exec(source);
	if (!svgMatch) return null;
	const payload = source.slice(svgMatch[0].length);
	let markup: string | undefined;
	if (svgMatch[1]) markup = decodeBase64(payload);
	else {
		try {
			markup = decodeURIComponent(payload);
		} catch {
			markup = undefined;
		}
	}
	if (!markup) return null;
	const svg = sanitizeSvgMarkup(markup, size);
	return svg ? { kind: "svg", ...svg } : null;
}

export { lengthOf as richMediaLength };
