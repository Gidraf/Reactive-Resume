import { immer } from "zustand/middleware/immer";
import { create } from "zustand/react";

export type RevampSectionStatus = "idle" | "working" | "thinking" | "pending" | "done" | "rejected" | "error";

export type RevampSectionState = {
	status: RevampSectionStatus;
	thinkingText: string;
	result: unknown | null;
	error: string | null;
};

type RevampStoreState = {
	token: string | null;
	overallStatus: "idle" | "connecting" | "running" | "complete" | "error";
	paymentStatus: "unpaid" | "paid";
	sections: Record<string, RevampSectionState>;
	streamKey: number;
	autoApply: boolean;
	pendingChanges: Record<string, unknown>;
};

type RevampStoreActions = {
	setToken: (token: string | null) => void;
	setOverallStatus: (status: RevampStoreState["overallStatus"]) => void;
	setPaymentStatus: (status: "unpaid" | "paid") => void;
	setSectionStatus: (section: string, state: Partial<RevampSectionState>) => void;
	appendThinking: (section: string, text: string) => void;
	reset: () => void;
	reconnect: () => void;
	toggleAutoApply: () => void;
	setPending: (section: string, result: unknown) => void;
	clearPending: (section: string, accepted: boolean) => void;
};

export type RevampStore = RevampStoreState & RevampStoreActions;

const initialState: RevampStoreState = {
	token: null,
	overallStatus: "idle",
	paymentStatus: "unpaid",
	sections: {},
	streamKey: 0,
	autoApply: true,
	pendingChanges: {},
};

export const useRevampStore = create<RevampStore>()(
	immer((set) => ({
		...initialState,

		setToken: (token) => {
			set((state) => {
				state.token = token;
				if (token) state.overallStatus = "connecting";
			});
		},

		setOverallStatus: (status) => {
			set((state) => {
				state.overallStatus = status;
			});
		},

		setPaymentStatus: (status) => {
			set((state) => {
				state.paymentStatus = status;
			});
		},

		setSectionStatus: (section, partial) => {
			set((state) => {
				const current = state.sections[section] ?? {
					status: "idle",
					thinkingText: "",
					result: null,
					error: null,
				};
				state.sections[section] = { ...current, ...partial };
			});
		},

		appendThinking: (section, text) => {
			set((state) => {
				const current = state.sections[section] ?? {
					status: "thinking",
					thinkingText: "",
					result: null,
					error: null,
				};
				state.sections[section] = {
					...current,
					status: "thinking",
					thinkingText: (current.thinkingText ?? "") + text,
				};
			});
		},

		toggleAutoApply: () => {
			set((state) => {
				state.autoApply = !state.autoApply;
			});
		},

		setPending: (section, result) => {
			set((state) => {
				state.pendingChanges[section] = result;
				const current = state.sections[section] ?? { status: "idle", thinkingText: "", result: null, error: null };
				state.sections[section] = { ...current, status: "pending" };
			});
		},

		clearPending: (section, accepted) => {
			set((state) => {
				const result = state.pendingChanges[section];
				delete state.pendingChanges[section];
				const current = state.sections[section];
				if (current) {
					state.sections[section] = {
						...current,
						status: accepted ? "done" : "rejected",
						result: accepted ? (result ?? null) : null,
					};
				}
			});
		},

		reset: () => {
			set(() => ({ ...initialState }));
		},

		reconnect: () => {
			set((state) => {
				state.sections = {};
				state.pendingChanges = {};
				state.overallStatus = "connecting";
				state.streamKey += 1;
			});
		},
	})),
);

export const isProcessing = (state: RevampStoreState, section: string): boolean => {
	const s = state.sections[section]?.status;
	return s === "working" || s === "thinking";
};
