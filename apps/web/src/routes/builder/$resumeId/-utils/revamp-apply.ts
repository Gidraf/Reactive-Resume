import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { WritableDraft } from "immer";

export function applyRevampResult(section: string, result: unknown, draft: WritableDraft<ResumeData>) {
	if (!result || typeof result !== "object") return;
	const r = result as Record<string, unknown>;

	try {
		switch (section) {
			case "basics":
				Object.assign(draft.basics, r);
				break;
			case "work_experience":
				if (Array.isArray(r.items)) draft.sections.experience.items = r.items as typeof draft.sections.experience.items;
				break;
			case "education":
				if (Array.isArray(r.items)) draft.sections.education.items = r.items as typeof draft.sections.education.items;
				break;
			case "projects":
				if (Array.isArray(r.items)) draft.sections.projects.items = r.items as typeof draft.sections.projects.items;
				break;
			case "skills":
				if (Array.isArray(r.items)) draft.sections.skills.items = r.items as typeof draft.sections.skills.items;
				break;
			case "languages":
				if (Array.isArray(r.items)) draft.sections.languages.items = r.items as typeof draft.sections.languages.items;
				break;
			case "certifications":
				if (Array.isArray(r.items))
					draft.sections.certifications.items = r.items as typeof draft.sections.certifications.items;
				break;
			case "awards":
				if (Array.isArray(r.items)) draft.sections.awards.items = r.items as typeof draft.sections.awards.items;
				break;
			case "interests":
				if (Array.isArray(r.items)) draft.sections.interests.items = r.items as typeof draft.sections.interests.items;
				break;
			case "publications":
				if (Array.isArray(r.items))
					draft.sections.publications.items = r.items as typeof draft.sections.publications.items;
				break;
			case "volunteer":
				if (Array.isArray(r.items)) draft.sections.volunteer.items = r.items as typeof draft.sections.volunteer.items;
				break;
			case "references":
				if (Array.isArray(r.items)) draft.sections.references.items = r.items as typeof draft.sections.references.items;
				break;
			default:
				break;
		}
	} catch {
		// schema mismatch — ignore
	}
}
