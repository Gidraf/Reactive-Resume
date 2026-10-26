/**
 * Rich-content snippets for summaries and descriptions: the examples `docs/rich-content-guide.md` documents, kept
 * here so the integration test renders exactly what writers are told to paste.
 */

/** A 24×24 teal disc, as the smallest useful PNG icon. */
export const TEAL_DOT_PNG =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAVklEQVR42mP4//8/Ay0xUYp4p3T8x4YpsgCXoaRaRhXD8VlCNcNxWUJVw7FZQnXD0S0ZJhZQ23BkS0YtGCkWjGY0oiygeWFHl+KaLhUOXapMulT61MIAGvJ6DBD5EDcAAAAASUVORK5CYII=";

const STAR_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5-6.5 4.5 2-7.5L2 9h7z" fill="#f59e0b"/></svg>';

/** The same star as an SVG data URI, base64 and URL-encoded. */
export const STAR_SVG_BASE64 = `data:image/svg+xml;base64,${btoa(STAR_SVG)}`;
export const STAR_SVG_URLENCODED = `data:image/svg+xml,${encodeURIComponent(STAR_SVG)}`;

export const styledText = `<p>Delivered <span style="color: #0d9488; font-weight: bold">KES 42M</span> in new revenue and cut costs by <span style="color: #dc2626">18%</span>.</p>`;

export const metricChips = `<div style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 6pt; margin-bottom: 6pt">
<div style="background-color: #ccfbf1; color: #115e59; padding: 3pt 8pt; border-radius: 8pt; font-size: 8pt; font-weight: bold">+38% sales</div>
<div style="background-color: #dbeafe; color: #1e40af; padding: 3pt 8pt; border-radius: 8pt; font-size: 8pt; font-weight: bold">12 hires</div>
<div style="background-color: #fef3c7; color: #92400e; padding: 3pt 8pt; border-radius: 8pt; font-size: 8pt; font-weight: bold">KES 4.2M saved</div>
</div>`;

const skillBar = (label: string, percent: number) =>
	`<div style="display: flex; flex-direction: row; align-items: center; margin-bottom: 3pt">
<div style="width: 90pt; font-size: 8pt">${label}</div>
<svg width="140" height="6" viewBox="0 0 140 6"><rect x="0" y="0" width="140" height="6" rx="3" fill="#e5e7eb"/><rect x="0" y="0" width="${(140 * percent) / 100}" height="6" rx="3" fill="#0d9488"/></svg>
</div>`;

export const skillBars = [skillBar("Python", 90), skillBar("SQL", 75), skillBar("Power BI", 60)].join("");

/** A ring drawn as a track circle plus an arc path (arcs, not stroke-dasharray, so every renderer agrees). */
const progressRing = (label: string, percent: number) => {
	const radius = 16;
	const angle = (percent / 100) * 2 * Math.PI - Math.PI / 2;
	const endX = 20 + radius * Math.cos(angle);
	const endY = 20 + radius * Math.sin(angle);
	const largeArc = percent > 50 ? 1 : 0;
	return `<div style="display: flex; flex-direction: column; align-items: center; width: 60pt">
<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="4"/><path d="M 20 4 A ${radius} ${radius} 0 ${largeArc} 1 ${endX.toFixed(2)} ${endY.toFixed(2)}" fill="none" stroke="#0d9488" stroke-width="4" stroke-linecap="round"/></svg>
<div style="font-size: 7pt; margin-top: 2pt">${label} ${percent}%</div>
</div>`;
};

export const progressRings = `<div style="display: flex; flex-direction: row; gap: 8pt; margin-bottom: 6pt">${[
	progressRing("Leadership", 85),
	progressRing("Analytics", 70),
	progressRing("Sales", 40),
].join("")}</div>`;

export const miniBarChart = `<div style="display: flex; flex-direction: row; align-items: flex-end; gap: 8pt; margin-bottom: 6pt">
<svg width="120" height="50" viewBox="0 0 120 50"><line x1="0" y1="49" x2="120" y2="49" stroke="#9ca3af" stroke-width="1"/><rect x="5" y="30" width="18" height="19" fill="#99f6e4"/><rect x="33" y="22" width="18" height="27" fill="#5eead4"/><rect x="61" y="14" width="18" height="35" fill="#2dd4bf"/><rect x="89" y="4" width="18" height="45" fill="#0d9488"/></svg>
<div style="font-size: 7pt; color: #6b7280">Revenue 2021–2024 (KES M): 19 · 27 · 35 · 45</div>
</div>`;

export const timeline = `<div style="margin-bottom: 6pt">
<div style="display: flex; flex-direction: row; margin-bottom: 4pt">
<div style="width: 44pt; font-size: 8pt; font-weight: bold; color: #0d9488">2024</div>
<div style="border-left: 2pt solid #0d9488; padding-left: 6pt; font-size: 8pt">Head of Sales, Acme Kenya</div>
</div>
<div style="display: flex; flex-direction: row">
<div style="width: 44pt; font-size: 8pt; font-weight: bold; color: #0d9488">2020</div>
<div style="border-left: 2pt solid #99f6e4; padding-left: 6pt; font-size: 8pt">Sales Lead, Beta Ltd</div>
</div>
</div>`;

export const iconRow = `<div style="display: flex; flex-direction: row; align-items: center; gap: 4pt; margin-bottom: 6pt">
<img src="${TEAL_DOT_PNG}" width="10" height="10"/>
<div style="font-size: 8pt">Nairobi, Kenya</div>
<img src="${STAR_SVG_BASE64}" width="10" height="10"/>
<div style="font-size: 8pt">Top performer 2023</div>
<img src="${STAR_SVG_URLENCODED}" width="10" height="10"/>
<div style="font-size: 8pt">Certified</div>
</div>`;

export const statsTable = `<table style="width: 100%"><tbody>
<tr><th style="border-bottom: 1pt solid #0d9488; padding: 2pt">Metric</th><th style="border-bottom: 1pt solid #0d9488; padding: 2pt">2023</th><th style="border-bottom: 1pt solid #0d9488; padding: 2pt">2024</th></tr>
<tr><td style="padding: 2pt">Accounts</td><td style="padding: 2pt">120</td><td style="padding: 2pt">185</td></tr>
<tr><td style="padding: 2pt">Retention</td><td style="padding: 2pt">82%</td><td style="padding: 2pt">91%</td></tr>
</tbody></table>`;

/** Markup that must never reach the PDF: script, external fetches, event handlers, smuggled data URIs. */
export const hostileMarkup = `<script>alert(1)</script>
<img src="https://example.com/tracker.png" width="10" height="10"/>
<img src="http://127.0.0.1/private.png"/>
<svg width="20" height="20" viewBox="0 0 20 20" onload="alert(1)"><script>alert(1)</script><image href="https://example.com/x.png" width="20" height="20"/><foreignObject><div>html</div></foreignObject><use href="#a"/><rect width="20" height="20" fill="url(https://example.com/p.svg)" onclick="x()"/></svg>`;

export const richContentFixture = [
	styledText,
	metricChips,
	skillBars,
	progressRings,
	miniBarChart,
	timeline,
	iconRow,
	statsTable,
].join("\n");
