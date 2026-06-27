import { useEffect, useRef, useState } from "react";

export type SectionStatus = "idle" | "working" | "thinking" | "done" | "error";

export type SectionState = {
	status: SectionStatus;
	thinkingText: string;
	result: string | null;
	error: string | null;
};

export type RevampEvent = {
	section: string;
	status: string;
	thinking?: string;
	result?: string;
	error?: string;
	progress?: number;
	total_sections?: number;
	payment_status?: string;
};

const CVPAP_API = (import.meta.env.VITE_CVPAP_API_URL as string | undefined) ?? "";

export function useRevampStream(token: string) {
	const [sections, setSections] = useState<Record<string, SectionState>>({});
	const [overallStatus, setOverallStatus] = useState<"pending" | "running" | "complete" | "error">("pending");
	const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid">("unpaid");
	const esRef = useRef<EventSource | null>(null);

	// Seed payment status from verify endpoint on mount — only once per token.
	useEffect(() => {
		if (!token) return;
		fetch(`${CVPAP_API}/api/v1/revamp/verify/${token}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data?.payment_status === "paid") setPaymentStatus("paid");
			})
			.catch(() => undefined);
	}, [token]);

	// Open SSE stream — stable reference, no status dependency to avoid reconnect loop.
	useEffect(() => {
		if (!token) return;

		const es = new EventSource(`${CVPAP_API}/api/v1/revamp/stream/${token}`);
		esRef.current = es;

		es.onmessage = (evt) => {
			try {
				const payload = JSON.parse(evt.data) as RevampEvent;
				const { section, status } = payload;

				if (section === "__all__") {
					if (status === "start") {
						setOverallStatus("running");
						if (payload.payment_status === "paid") setPaymentStatus("paid");
					} else if (status === "complete") {
						setOverallStatus("complete");
						es.close();
					} else if (status === "error") {
						setOverallStatus("error");
						es.close();
					}
					return;
				}

				if (section === "__payment__") {
					if (status === "paid") setPaymentStatus("paid");
					return;
				}

				setSections((prev) => {
					const current = prev[section] ?? { status: "idle", thinkingText: "", result: null, error: null };
					const next: SectionState = { ...current };

					if (status === "working") {
						next.status = "working";
						next.thinkingText = "";
					} else if (status === "thinking" && payload.thinking) {
						next.status = "thinking";
						next.thinkingText = (current.thinkingText ?? "") + payload.thinking;
					} else if (status === "done") {
						next.status = "done";
						next.result = payload.result ?? null;
					} else if (status === "error") {
						next.status = "error";
						next.error = payload.error ?? "Unknown error";
					}

					return { ...prev, [section]: next };
				});
			} catch {
				// malformed event — ignore
			}
		};

		// EventSource auto-reconnects on network drops — don't set error state here
		// as it fires spuriously during normal reconnections.
		es.onerror = () => {
			// Only flip to "running" if still in pending (first connect) to avoid
			// overwriting a terminal status set by the stream itself.
			setOverallStatus((prev) => (prev === "pending" ? "running" : prev));
		};

		return () => {
			es.close();
		};
	}, [token]); // token is stable — no reconnect loop

	return { sections, overallStatus, paymentStatus };
}
