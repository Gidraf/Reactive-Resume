import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { WritableDraft } from "immer";
import { useEffect, useRef } from "react";
import { useUpdateResumeData } from "@/features/resume/builder/draft";
import { useRevampStore } from "../-store/revamp";

const CVPAP_API = (import.meta.env.VITE_CVPAP_API_URL as string | undefined) ?? "";

type RevampEvent = {
	section: string;
	status: string;
	thinking?: string;
	result?: string;
	error?: string;
	payment_status?: string;
};

// Maps CVPAP section keys → Reactive Resume draft mutations
function applyRevampResult(section: string, result: unknown, draft: WritableDraft<ResumeData>) {
	if (!result || typeof result !== "object") return;
	const r = result as Record<string, unknown>;

	try {
		switch (section) {
			case "basics": {
				Object.assign(draft.basics, r);
				break;
			}
			case "work_experience": {
				if (Array.isArray(r.items)) {
					draft.sections.experience.items = r.items as typeof draft.sections.experience.items;
				}
				break;
			}
			case "education": {
				if (Array.isArray(r.items)) {
					draft.sections.education.items = r.items as typeof draft.sections.education.items;
				}
				break;
			}
			case "projects": {
				if (Array.isArray(r.items)) {
					draft.sections.projects.items = r.items as typeof draft.sections.projects.items;
				}
				break;
			}
			case "skills": {
				if (Array.isArray(r.items)) {
					draft.sections.skills.items = r.items as typeof draft.sections.skills.items;
				}
				break;
			}
			case "languages": {
				if (Array.isArray(r.items)) {
					draft.sections.languages.items = r.items as typeof draft.sections.languages.items;
				}
				break;
			}
			case "certifications": {
				if (Array.isArray(r.items)) {
					draft.sections.certifications.items = r.items as typeof draft.sections.certifications.items;
				}
				break;
			}
			case "awards": {
				if (Array.isArray(r.items)) {
					draft.sections.awards.items = r.items as typeof draft.sections.awards.items;
				}
				break;
			}
			case "interests": {
				if (Array.isArray(r.items)) {
					draft.sections.interests.items = r.items as typeof draft.sections.interests.items;
				}
				break;
			}
			case "publications": {
				if (Array.isArray(r.items)) {
					draft.sections.publications.items = r.items as typeof draft.sections.publications.items;
				}
				break;
			}
			case "volunteer": {
				if (Array.isArray(r.items)) {
					draft.sections.volunteer.items = r.items as typeof draft.sections.volunteer.items;
				}
				break;
			}
			case "references": {
				if (Array.isArray(r.items)) {
					draft.sections.references.items = r.items as typeof draft.sections.references.items;
				}
				break;
			}
			default:
				break;
		}
	} catch {
		// Schema mismatch — ignore rather than crash
	}
}

export function useRevampStream(token: string | null) {
	const updateResumeData = useUpdateResumeData();
	const store = useRevampStore();
	const esRef = useRef<EventSource | null>(null);

	// Seed payment status once on mount
	useEffect(() => {
		if (!token) return;
		store.setToken(token);

		fetch(`${CVPAP_API}/api/v1/revamp/verify/${token}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((data: { payment_status?: string } | null) => {
				if (data?.payment_status === "paid") store.setPaymentStatus("paid");
			})
			.catch(() => undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, store.setPaymentStatus, store.setToken]);

	// Open SSE stream
	useEffect(() => {
		if (!token) return;

		const es = new EventSource(`${CVPAP_API}/api/v1/revamp/stream/${token}`);
		esRef.current = es;

		es.onmessage = (evt) => {
			try {
				const payload = JSON.parse(evt.data as string) as RevampEvent;
				const { section, status } = payload;

				if (section === "__all__") {
					if (status === "start") {
						store.setOverallStatus("running");
						if (payload.payment_status === "paid") store.setPaymentStatus("paid");
					} else if (status === "complete") {
						store.setOverallStatus("complete");
						es.close();
					} else if (status === "error") {
						store.setOverallStatus("error");
						es.close();
					}
					return;
				}

				if (section === "__payment__") {
					if (status === "paid") store.setPaymentStatus("paid");
					return;
				}

				if (status === "working") {
					store.setSectionStatus(section, { status: "working", thinkingText: "", result: null, error: null });
				} else if (status === "thinking" && payload.thinking) {
					store.appendThinking(section, payload.thinking);
				} else if (status === "done") {
					let parsed: unknown = null;
					try {
						parsed = payload.result ? JSON.parse(payload.result) : null;
					} catch {
						parsed = payload.result ?? null;
					}
					store.setSectionStatus(section, { status: "done", result: parsed });
					// Apply to live resume data so preview updates instantly
					if (parsed) {
						updateResumeData((draft) => {
							applyRevampResult(section, parsed, draft);
						});
					}
				} else if (status === "error") {
					store.setSectionStatus(section, { status: "error", error: payload.error ?? "Unknown error" });
				}
			} catch {
				// malformed event
			}
		};

		es.onerror = () => {
			const current = useRevampStore.getState().overallStatus;
			store.setOverallStatus(current === "connecting" ? "running" : current);
		};

		return () => {
			es.close();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		token,
		updateResumeData,
		store.setOverallStatus,
		store.setSectionStatus,
		store.setPaymentStatus,
		store.appendThinking,
	]);

	return esRef;
}
