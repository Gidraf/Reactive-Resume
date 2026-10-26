// @vitest-environment happy-dom

import { expect, it } from "vite-plus/test";
import { Editor } from "@tiptap/react";
import { richTextExtensions } from "./rich-text-extensions";
import { hasUnsupportedRichMarkup } from "./rich-text-markup";

it("keeps supported table formatting and drops other CSS from imported tables", () => {
	const editor = new Editor({
		extensions: richTextExtensions,
		content:
			'<table style="width: 100%; position: fixed; inset: 0"><tbody><tr><td style="padding: 4px; background-image: url(https://example.test/x.png)"><p>Cell</p></td></tr></tbody></table>',
	});
	const html = editor.getHTML();
	editor.destroy();

	expect(html).toContain("width: 100%");
	expect(html).toContain("padding: 4px");
	expect(html).not.toMatch(/position|inset|background-image/);
});

const skillBar =
	'<div style="display: flex; flex-direction: row"><div style="width: 90pt">Python</div><svg width="140" height="6" viewBox="0 0 140 6"><rect width="126" height="6" rx="3" fill="#0d9488"/></svg></div>';
const icon = '<p>Nairobi</p><img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10">';

it("drops rich-content markup when it round-trips, which is why the editor must not re-serialize it", () => {
	const editor = new Editor({ extensions: richTextExtensions, content: skillBar + icon });
	const html = editor.getHTML();
	editor.destroy();

	expect(html).not.toMatch(/<svg|<img|<div/);
});

it.each([
	["a styled div", '<div style="background-color: #ccfbf1">+38% sales</div>'],
	["inline svg", skillBar],
	["an image", icon],
	["a span styled beyond colour", '<p><span style="font-weight: bold; color: #0d9488">KES 42M</span></p>'],
])("flags %s as markup the editor can't keep", (_, html) => {
	expect(hasUnsupportedRichMarkup(html)).toBe(true);
});

it.each([
	["plain text", "Led a team of 12"],
	["editor formatting", '<p><strong>Led</strong> a <em>team</em> of <span style="color: #0d9488">12</span></p>'],
	["lists and links", '<ul><li><p>One <a href="https://example.com">link</a></p></li></ul><hr>'],
	["highlights", '<p><mark data-color="#fde68a" style="background-color: #fde68a">key</mark></p>'],
	["tables", "<table><tbody><tr><td><p>Cell</p></td></tr></tbody></table>"],
])("accepts %s as editable", (_, html) => {
	expect(hasUnsupportedRichMarkup(html)).toBe(false);
});
