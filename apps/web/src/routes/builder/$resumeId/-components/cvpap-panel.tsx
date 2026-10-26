import { CircleNotchIcon } from "@phosphor-icons/react";
import { InterviewSectionBuilder } from "../-sidebar/right/sections/interview";
import { RevampSectionBuilder } from "../-sidebar/right/sections/revamp";
import { useRevampStore } from "../-store/revamp";
import { getSectionTitle } from "@/libs/resume/section";

/** CVpap: the AI revamp agent and interview questions, shown under Check (they review and prepare, not write). */
export function CvpapPanel() {
	return (
		<div className="grid gap-6 border-t border-line p-4">
			<section className="grid gap-3">
				<h2 className="text-sm font-semibold">{getSectionTitle("revamp")}</h2>
				<RevampSectionBuilder />
			</section>
			<section className="grid gap-3">
				<h2 className="text-sm font-semibold">{getSectionTitle("interview")}</h2>
				<InterviewSectionBuilder />
			</section>
		</div>
	);
}

const REVAMP_SECTION_LABELS: Record<string, string> = {
	basics: "Personal info",
	work_experience: "Experience",
	education: "Education",
	projects: "Projects",
	skills: "Skills",
	languages: "Languages",
	certifications: "Certifications",
	awards: "Awards",
	interests: "Interests",
	publications: "Publications",
	volunteer: "Volunteer",
	references: "References",
};

/**
 * CVpap: while a revamp is writing sections, says which ones, so nobody edits text the AI is about to replace.
 * (The v5 builder locked each section card; v6's Write panel has no per-section card to overlay.)
 */
export function RevampProcessingBanner() {
	const sections = useRevampStore((s) => s.sections);
	const busy = Object.entries(sections)
		.filter(([, state]) => state.status === "working" || state.status === "thinking")
		.map(([key]) => REVAMP_SECTION_LABELS[key] ?? key);

	if (busy.length === 0) return null;

	return (
		<div className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-line bg-raised px-3 py-2 text-sm text-ink-2">
			<CircleNotchIcon className="size-3.5 shrink-0 animate-spin" />
			<span>AI is writing: {busy.join(", ")}. Edits there will be overwritten.</span>
		</div>
	);
}
