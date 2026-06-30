import { useEffect, useRef } from "react";
import { useUpdateResumeData } from "@/features/resume/builder/draft";
import { useRevampStore } from "../-store/revamp";
import { applyRevampResult } from "../-utils/revamp-apply";

const CVPAP_API = (import.meta.env.VITE_CVPAP_API_URL as string | undefined) ?? "";

type RevampEvent = {
	section: string;
	status: string;
	thinking?: string;
	result?: string;
	error?: string;
	payment_status?: string;
};

export function useRevampStream(token: string | null) {
	const updateResumeData = useUpdateResumeData();
	const store = useRevampStore();
	const _streamKey = useRevampStore((s) => s.streamKey);
	const autoApply = useRevampStore((s) => s.autoApply);
	const esRef = useRef<EventSource | null>(null);

	// Seed token + payment status once on mount
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

	// Open SSE stream — re-runs when streamKey increments (redo button)
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

					if (autoApply) {
						// Auto-apply: update live preview immediately
						store.setSectionStatus(section, { status: "done", result: parsed });
						if (parsed) {
							updateResumeData((draft) => {
								applyRevampResult(section, parsed, draft);
							});
						}
					} else {
						// Review mode: queue as pending — user approves each section
						store.setPending(section, parsed);
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
		autoApply,
		updateResumeData,
		store.setOverallStatus,
		store.setSectionStatus,
		store.setPaymentStatus,
		store.appendThinking,
		store.setPending,
	]);

	return { esRef, updateResumeData };
}
