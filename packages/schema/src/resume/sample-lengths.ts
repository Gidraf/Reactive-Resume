/**
 * Sample resumes at fixed printed lengths.
 *
 * Clients ask what their CV will look like before they have filled anything in,
 * and the honest answer depends almost entirely on how much they end up writing.
 * These build the same persona at 1, 1.5, 2, 2.5 and 3 pages so the difference
 * can be shown rather than described — which matters most for print, where a CV
 * spilling four lines onto a fourth page wastes a whole sheet.
 *
 * Longer variants add *distinct* roles and projects rather than repeating one
 * entry, because a preview full of duplicates does not read as a real CV.
 */
import type { ResumeData } from "./data";
import { sampleResumeData } from "./sample";

/**
 * The template that costs least to print. Of the fifteen, bronzor is the only
 * one that paints no large area in the primary or text colour — the others range
 * from one filled block to four, and azurill (the stock sample's) floods a
 * full-height sidebar.
 */
export const PRINT_FRIENDLY_TEMPLATE = "bronzor" as const;

/**
 * Ink-light by default: white paper, near-black text, and a restrained slate
 * blue used for headings and rules rather than fills. Strong saturated colour is
 * fine on screen and expensive on an inkjet.
 */
export const PRINT_FRIENDLY_COLORS = {
	primary: "rgba(31, 58, 95, 1)",
	text: "rgba(26, 26, 26, 1)",
	background: "rgba(255, 255, 255, 1)",
} as const;

export const SAMPLE_LENGTHS = ["1", "1.5", "2", "2.5", "3"] as const;
export type SampleLength = (typeof SAMPLE_LENGTHS)[number];

export const SAMPLE_LENGTH_LABELS: Record<SampleLength, string> = {
	"1": "1 page",
	"1.5": "1½ pages",
	"2": "2 pages",
	"2.5": "2½ pages",
	"3": "3 pages",
};

type Sections = ResumeData["sections"];
type ExperienceItem = Sections["experience"]["items"][number];
type ProjectItem = Sections["projects"]["items"][number];
type EducationItem = Sections["education"]["items"][number];

/** Ids only have to be unique within a resume; these never reach the database. */
const id = (n: number) => `019bef5a-0000-7000-a000-${String(n).padStart(12, "0")}`;

const bullets = (...lines: string[]) => `<ul>${lines.map((l) => `<li><p>${l}</p></li>`).join("")}</ul><p></p>`;

/**
 * The stock sample's own entries are long — a 727-character experience
 * description and a dense summary — which alone overflow a page. These variants
 * are about showing length, so every entry here is deliberately sized: roughly
 * three short bullets, which is what a real CV that has to fit one page looks
 * like.
 */
const LEAD_EXPERIENCE: ExperienceItem = {
	id: id(100),
	hidden: false,
	company: "Cascade Studios",
	position: "Senior Game Developer",
	location: "Seattle, WA",
	period: "March 2022 - Present",
	website: { url: "", label: "", inlineLink: false },
	roles: [],
	description: bullets(
		"Lead gameplay programmer on an unannounced AAA action-adventure title in Unreal Engine 5",
		"Architected the core combat system: hit detection, combos and AI behaviour trees for 15+ enemy types",
		"Built editor tools in C++ that cut level-designer iteration time by 40%",
	),
} as ExperienceItem;

/** Short enough for a one-page CV; the full summary runs to a third of a page. */
const SHORT_SUMMARY =
	"<p><strong>Game developer with 5+ years of experience</strong> building gameplay systems in Unity and Unreal Engine, shipping on PC and console.</p>";

const EXTRA_EXPERIENCE: ExperienceItem[] = [
	{
		id: id(101),
		hidden: false,
		company: "Northwind Interactive",
		position: "Gameplay Programmer",
		location: "Portland, OR",
		period: "June 2019 - February 2022",
		website: { url: "", label: "", inlineLink: false },
		roles: [],
		description: bullets(
			"Built the player traversal and climbing systems for a third-person adventure title shipped on PC and console",
			"Owned the save/load subsystem, cutting load times by 35% through asynchronous streaming of level chunks",
			"Mentored two junior programmers through their first shipped title, running weekly code reviews",
			"Collaborated daily with designers and animators to tune movement feel across four iterations of playtesting",
		),
	} as ExperienceItem,
	{
		id: id(102),
		hidden: false,
		company: "Bright Anvil Games",
		position: "Junior Engine Programmer",
		location: "Remote",
		period: "August 2018 - May 2019",
		website: { url: "", label: "", inlineLink: false },
		roles: [],
		description: bullets(
			"Maintained the in-house asset pipeline used by a 30-person studio, reducing failed imports by 60%",
			"Implemented profiling instrumentation that surfaced a frame-time regression before it reached QA",
			"Ported core gameplay libraries from C++14 to C++17, removing three classes of undefined behaviour",
		),
	} as ExperienceItem,
	{
		id: id(103),
		hidden: false,
		company: "Freelance",
		position: "Contract Unity Developer",
		location: "Remote",
		period: "January 2018 - July 2018",
		website: { url: "", label: "", inlineLink: false },
		roles: [],
		description: bullets(
			"Delivered four client prototypes in Unity, each from brief to playable build inside six weeks",
			"Wrote a reusable input-abstraction package later adopted across subsequent client projects",
		),
	} as ExperienceItem,
	{
		id: id(104),
		hidden: false,
		company: "University of Washington",
		position: "Undergraduate Research Assistant",
		location: "Seattle, WA",
		period: "September 2016 - December 2017",
		website: { url: "", label: "", inlineLink: false },
		roles: [],
		description: bullets(
			"Built real-time visualisation tooling for a graphics research group studying crowd simulation",
			"Co-authored a workshop paper on GPU-accelerated pathfinding for dense agent populations",
		),
	} as ExperienceItem,
];

const EXTRA_PROJECTS: ProjectItem[] = [
	{
		id: id(201),
		hidden: false,
		name: "Lumen",
		period: "2023",
		website: {
			url: "https://github.com/dkowalski-dev/lumen",
			label: "github.com/dkowalski-dev/lumen",
			inlineLink: false,
		},
		description: bullets(
			"Open-source 2D lighting renderer for Unity with soft shadows and normal-mapped sprites",
			"Used in a dozen published indie titles; 1.4k stars and 40 contributors",
		),
	} as ProjectItem,
	{
		id: id(202),
		hidden: false,
		name: "Tilewright",
		period: "2022",
		website: { url: "", label: "", inlineLink: false },
		description: bullets(
			"Level-authoring tool that round-trips between Tiled and a custom binary format",
			"Cut level import time from minutes to under two seconds on large maps",
		),
	} as ProjectItem,
	{
		id: id(203),
		hidden: false,
		name: "Frame Budget",
		period: "2021",
		website: { url: "", label: "", inlineLink: false },
		description: bullets(
			"Lightweight profiler overlay showing per-system frame cost in shipped builds",
			"Adopted internally to catch performance regressions before certification",
		),
	} as ProjectItem,
];

const EXTRA_EDUCATION: EducationItem[] = [
	{
		id: id(301),
		hidden: false,
		school: "Seattle Central College",
		degree: "Associate of Science",
		area: "Mathematics",
		grade: "3.8 GPA",
		location: "Seattle, WA",
		period: "2012 - 2014",
		website: { url: "", label: "", inlineLink: false },
		description: "<p>Transferred into the University of Washington computer science programme.</p>",
	} as EducationItem,
];

type PageLayout = { fullWidth: boolean; main: string[]; sidebar: string[] };

/**
 * Page count is set by `metadata.layout.pages`, not by how much text there is —
 * the renderer lays out exactly the pages the layout declares (overflowing onto
 * more only if a page cannot hold its own sections). So each length declares its
 * own layout, and the item counts are tuned to fill those pages rather than to
 * create them.
 *
 * Half sizes are a full layout page whose content stops around the middle: "1.5"
 * is two pages with a short second one, "2.5" three with a short third.
 */
const RECIPES: Record<
	SampleLength,
	{
		experience: number;
		projects: number;
		education: number;
		skills: number;
		shortSummary: boolean;
		pages: PageLayout[];
	}
> = {
	"1": {
		experience: 1,
		projects: 2,
		education: 1,
		skills: 4,
		shortSummary: true,
		pages: [{ fullWidth: false, main: ["summary", "experience", "education"], sidebar: ["profiles", "skills"] }],
	},
	"1.5": {
		experience: 2,
		projects: 2,
		education: 1,
		skills: 5,
		shortSummary: true,
		pages: [
			{ fullWidth: false, main: ["summary", "experience", "education"], sidebar: ["profiles", "skills"] },
			{ fullWidth: false, main: ["projects"], sidebar: ["languages"] },
		],
	},
	"2": {
		experience: 3,
		projects: 4,
		education: 2,
		skills: 6,
		shortSummary: false,
		pages: [
			{ fullWidth: false, main: ["summary", "experience", "education"], sidebar: ["profiles", "skills"] },
			{ fullWidth: false, main: ["projects", "awards"], sidebar: ["languages", "certifications"] },
		],
	},
	"2.5": {
		experience: 4,
		projects: 5,
		education: 2,
		skills: 6,
		shortSummary: false,
		pages: [
			{ fullWidth: false, main: ["summary", "experience", "education"], sidebar: ["profiles", "skills"] },
			{ fullWidth: false, main: ["projects", "awards"], sidebar: ["languages", "certifications"] },
			{ fullWidth: false, main: ["volunteer"], sidebar: ["interests"] },
		],
	},
	"3": {
		experience: 5,
		projects: 6,
		education: 2,
		skills: 6,
		shortSummary: false,
		pages: [
			{ fullWidth: false, main: ["summary", "experience", "education"], sidebar: ["profiles", "skills"] },
			{ fullWidth: false, main: ["projects", "awards"], sidebar: ["languages", "certifications"] },
			{ fullWidth: false, main: ["volunteer", "publications"], sidebar: ["interests", "references"] },
		],
	},
};

/** Take `count` items, topping up from a pool of distinct extras when short. */
function fill<T>(base: readonly T[], extras: readonly T[], count: number): T[] {
	const out = [...base.slice(0, count)];
	for (const extra of extras) {
		if (out.length >= count) break;
		out.push(extra);
	}
	return out;
}

/**
 * Build the sample persona at a given printed length.
 *
 * `name` overrides the persona's name so a preview can carry the client's own,
 * matching createSampleResumeData.
 */
export function createSampleResumeOfLength(length: SampleLength, name?: string): ResumeData {
	const recipe = RECIPES[length];
	const base = sampleResumeData;
	// Only what the layout actually places is visible; anything else would be
	// carried in the data but never rendered.
	const visible = new Set<string>(recipe.pages.flatMap((page) => [...page.main, ...page.sidebar]));

	const sections = Object.fromEntries(
		Object.entries(base.sections).map(([key, section]) => {
			const hidden = !visible.has(key);
			let items = section.items;

			if (key === "experience") {
				// Own entries rather than the stock one, whose length alone overflows a page.
				items = fill([LEAD_EXPERIENCE], EXTRA_EXPERIENCE, recipe.experience);
			} else if (key === "projects") {
				items = fill(section.items as ProjectItem[], EXTRA_PROJECTS, recipe.projects);
			} else if (key === "education") {
				items = fill(section.items as EducationItem[], EXTRA_EDUCATION, recipe.education);
			} else if (key === "skills") {
				items = section.items.slice(0, recipe.skills);
			}

			return [key, { ...section, hidden, items }];
		}),
	) as Sections;

	const trimmed = name?.trim();

	return {
		...base,
		basics: trimmed ? { ...base.basics, name: trimmed } : base.basics,
		// `summary` sits alongside `sections`, not inside it, even though the
		// layout places it like any other block.
		summary: recipe.shortSummary ? { ...base.summary, content: SHORT_SUMMARY } : base.summary,
		sections,
		metadata: {
			...base.metadata,
			// These samples exist to be printed, so they default to the cheapest
			// template to print. The stock sample uses azurill, whose coloured
			// sidebar is a full-height solid block — roughly a third of every page
			// laid down as ink. bronzor is the only template of the fifteen that
			// paints no large area in the primary or text colour, so a page of it
			// is text on paper.
			template: PRINT_FRIENDLY_TEMPLATE,
			design: {
				...base.metadata.design,
				colors: PRINT_FRIENDLY_COLORS,
			},
			layout: {
				...base.metadata.layout,
				// Replaces the stock four-page layout, which would otherwise force
				// every variant to the same length regardless of content.
				pages: recipe.pages.map((page) => ({ ...page, main: [...page.main], sidebar: [...page.sidebar] })),
			},
		},
	};
}

/** Every length, for rendering a picker. */
export function createAllSampleLengths(name?: string): { length: SampleLength; label: string; data: ResumeData }[] {
	return SAMPLE_LENGTHS.map((length) => ({
		length,
		label: SAMPLE_LENGTH_LABELS[length],
		data: createSampleResumeOfLength(length, name),
	}));
}
