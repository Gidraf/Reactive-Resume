import { immer } from "zustand/middleware/immer";
import { create } from "zustand/react";

export type RevampSectionStatus = "idle" | "working" | "thinking" | "done" | "error";

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
};

type RevampStoreActions = {
	setToken: (token: string | null) => void;
	setOverallStatus: (status: RevampStoreState["overallStatus"]) => void;
	setPaymentStatus: (status: "unpaid" | "paid") => void;
	setSectionStatus: (section: string, state: Partial<RevampSectionState>) => void;
	appendThinking: (section: string, text: string) => void;
	reset: () => void;
};

export type RevampStore = RevampStoreState & RevampStoreActions;

const initialState: RevampStoreState = {
	token: null,
	overallStatus: "idle",
	paymentStatus: "unpaid",
	sections: {},
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

		reset: () => {
			set(() => ({ ...initialState }));
		},
	})),
);

export const isProcessing = (state: RevampStoreState, section: string): boolean => {
	const s = state.sections[section]?.status;
	return s === "working" || s === "thinking";
};
