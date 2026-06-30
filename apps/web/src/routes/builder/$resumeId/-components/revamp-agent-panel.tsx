import {
	ArrowCounterClockwiseIcon,
	CaretDownIcon,
	CaretRightIcon,
	CheckCircleIcon,
	CircleNotchIcon,
	LockSimpleOpenIcon,
	PaperPlaneTiltIcon,
	ProhibitIcon,
	SparkleIcon,
	StopCircleIcon,
	WarningCircleIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { ScrollArea } from "@reactive-resume/ui/components/scroll-area";
import { cn } from "@reactive-resume/utils/style";
import { useUpdateResumeData } from "@/features/resume/builder/draft";
import { useRevampStore } from "../-store/revamp";
import { applyRevampResult } from "../-utils/revamp-apply";

const CVPAP_API = (import.meta.env.VITE_CVPAP_API_URL as string | undefined) ?? "";

const SECTION_LABELS: Record<string, string> = {
	basics: "Personal info",
	work_experience: "Work experience",
	education: "Education",
	skills: "Skills",
	projects: "Projects",
	certifications: "Certifications",
	languages: "Languages",
	awards: "Awards",
	publications: "Publications",
	interests: "Interests",
	volunteer: "Volunteer",
	references: "References",
};

const SECTION_ORDER = Object.keys(SECTION_LABELS);

async function postRevampAction(path: string, body: Record<string, string>) {
	await fetch(`${CVPAP_API}/api/v1/revamp/${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

// ── Section row ───────────────────────────────────────────────────────────────

type SectionRowProps = {
	sectionKey: string;
	token: string;
	expanded: boolean;
	onToggle: () => void;
};

function SectionRow({ sectionKey, token, expanded, onToggle }: SectionRowProps) {
	const state = useRevampStore((s) => s.sections[sectionKey]);
	const pendingResult = useRevampStore((s) => s.pendingChanges[sectionKey]);
	const clearPending = useRevampStore((s) => s.clearPending);
	const updateResumeData = useUpdateResumeData();

	const [comment, setComment] = useState("");
	const [sending, setSending] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const status = state?.status ?? "idle";
	const label = SECTION_LABELS[sectionKey] ?? sectionKey;

	const handleAccept = useCallback(() => {
		if (!pendingResult) return;
		updateResumeData((draft) => {
			applyRevampResult(sectionKey, pendingResult, draft);
		});
		clearPending(sectionKey, true);
	}, [pendingResult, sectionKey, updateResumeData, clearPending]);

	const handleReject = useCallback(() => {
		clearPending(sectionKey, false);
	}, [sectionKey, clearPending]);

	const handleComment = useCallback(async () => {
		if (!comment.trim()) return;
		setSending(true);
		try {
			await postRevampAction("comment", { token, section: sectionKey, comment: comment.trim() });
			setComment("");
		} finally {
			setSending(false);
		}
	}, [comment, sectionKey, token]);

	const handleRetry = useCallback(async () => {
		await postRevampAction("retry", { token, section: sectionKey });
	}, [sectionKey, token]);

	const statusIcon = () => {
		switch (status) {
			case "working":
				return <CircleNotchIcon className="size-3.5 shrink-0 animate-spin text-primary" />;
			case "thinking":
				return <CircleNotchIcon className="size-3.5 shrink-0 animate-spin text-amber-500" />;
			case "pending":
				return <SparkleIcon className="size-3.5 shrink-0 text-blue-500" />;
			case "done":
				return <CheckCircleIcon className="size-3.5 shrink-0 text-green-500" />;
			case "rejected":
				return <ProhibitIcon className="size-3.5 shrink-0 text-muted-foreground" />;
			case "error":
				return <XCircleIcon className="size-3.5 shrink-0 text-destructive" />;
			default:
				return <div className="size-3.5 shrink-0 rounded-full border-2 border-muted-foreground/30" />;
		}
	};

	const statusLabel = () => {
		switch (status) {
			case "working":
				return "writing…";
			case "thinking":
				return "thinking…";
			case "pending":
				return "review";
			case "done":
				return "applied";
			case "rejected":
				return "skipped";
			case "error":
				return "error";
			default:
				return "waiting";
		}
	};

	const isActive = status === "working" || status === "thinking";
	const isPending = status === "pending";
	const isDone = status === "done";
	const isError = status === "error";
	const isRejected = status === "rejected";

	return (
		<div
			className={cn(
				"rounded-lg border transition-colors",
				isActive && "border-primary/30 bg-primary/5",
				isPending && "border-blue-400/40 bg-blue-50/30 dark:bg-blue-900/10",
				isDone && "border-green-400/30 bg-green-50/10 dark:bg-green-900/5",
				isError && "border-destructive/30 bg-destructive/5",
				isRejected && "border-muted bg-muted/20 opacity-60",
				!isActive && !isPending && !isDone && !isError && !isRejected && "border-border",
			)}
		>
			{/* Header row */}
			<button type="button" className="flex w-full items-center gap-2 p-2.5 text-left text-sm" onClick={onToggle}>
				{statusIcon()}
				<span className={cn("flex-1 font-medium leading-none", isRejected && "text-muted-foreground line-through")}>
					{label}
				</span>
				<span
					className={cn(
						"shrink-0 rounded-full px-1.5 py-0.5 font-medium text-[10px]",
						isActive && "bg-primary/15 text-primary",
						isPending && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
						isDone && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
						isError && "bg-destructive/15 text-destructive",
						isRejected && "bg-muted text-muted-foreground",
						!isActive && !isPending && !isDone && !isError && !isRejected && "bg-muted text-muted-foreground",
					)}
				>
					{statusLabel()}
				</span>
				{isDone || isRejected || status === "idle" ? (
					expanded ? (
						<CaretDownIcon className="size-3 shrink-0 text-muted-foreground" />
					) : (
						<CaretRightIcon className="size-3 shrink-0 text-muted-foreground" />
					)
				) : null}
			</button>

			{/* Live thinking — always visible when active */}
			{isActive && state?.thinkingText && (
				<div className="border-primary/20 border-t bg-background/50 px-3 py-2">
					<p className="line-clamp-3 font-mono text-[10px] text-muted-foreground leading-relaxed">
						{state.thinkingText.split("\n").filter(Boolean).at(-1)}
					</p>
				</div>
			)}

			{/* Pending change — diff card with Accept/Reject */}
			{isPending && (
				<div className="space-y-2.5 border-blue-200 border-t px-3 py-2.5 dark:border-blue-800">
					<p className="font-medium text-[11px] text-blue-700 dark:text-blue-300">AI proposed a change — review it</p>
					<PendingDiff sectionKey={sectionKey} result={pendingResult} />
					<div className="flex gap-1.5 pt-0.5">
						<Button
							size="sm"
							className="h-7 flex-1 gap-1 bg-green-600 text-white text-xs hover:bg-green-700"
							onClick={handleAccept}
						>
							<CheckCircleIcon className="size-3" />
							Accept
						</Button>
						<Button size="sm" variant="outline" className="h-7 flex-1 gap-1 text-xs" onClick={handleReject}>
							<ProhibitIcon className="size-3" />
							Skip
						</Button>
					</div>
				</div>
			)}

			{/* Expanded section: chat input + thinking history + retry */}
			{expanded && !isActive && (
				<div className="space-y-2 border-border/60 border-t px-3 py-2.5">
					{/* Full thinking history */}
					{state?.thinkingText && (
						<ScrollArea className="max-h-28 rounded border bg-muted/40 p-2">
							<pre className="whitespace-pre-wrap font-mono text-[10px] text-muted-foreground leading-relaxed">
								{state.thinkingText}
							</pre>
						</ScrollArea>
					)}

					{isError && state?.error && <p className="text-[11px] text-destructive">{state.error}</p>}

					{/* Inline chat / comment */}
					<div className="flex gap-1.5">
						<input
							ref={inputRef}
							type="text"
							placeholder={isDone || isRejected ? "Tell AI to change this section…" : "Ask AI something…"}
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && void handleComment()}
							className="h-7 min-w-0 flex-1 rounded border bg-background px-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
						<Button
							size="icon"
							variant="outline"
							className="size-7 shrink-0"
							disabled={!comment.trim() || sending}
							onClick={() => void handleComment()}
						>
							{sending ? (
								<CircleNotchIcon className="size-3 animate-spin" />
							) : (
								<PaperPlaneTiltIcon className="size-3" />
							)}
						</Button>
					</div>

					{(isError || isDone || isRejected) && (
						<button
							type="button"
							className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
							onClick={() => void handleRetry()}
						>
							<ArrowCounterClockwiseIcon className="size-3" />
							Retry this section
						</button>
					)}
				</div>
			)}
		</div>
	);
}

// ── Pending diff preview ──────────────────────────────────────────────────────

function PendingDiff({ sectionKey, result }: { sectionKey: string; result: unknown }) {
	if (!result || typeof result !== "object") return null;
	const r = result as Record<string, unknown>;

	const lines: string[] = [];

	try {
		if (sectionKey === "basics") {
			const name = (r.name as string | undefined) ?? "";
			const headline = (r.headline as string | undefined) ?? "";
			if (name) lines.push(`Name: ${name}`);
			if (headline) lines.push(`Headline: ${headline}`);
			const summary = r.summary as string | undefined;
			if (summary) lines.push(`Summary: ${summary.slice(0, 80)}…`);
		} else if (Array.isArray(r.items)) {
			const items = r.items as Record<string, unknown>[];
			items.slice(0, 3).forEach((item) => {
				const title =
					(item.name as string | undefined) ??
					(item.company as string | undefined) ??
					(item.institution as string | undefined) ??
					"";
				if (title) lines.push(`• ${title}`);
			});
			if (items.length > 3) lines.push(`  …and ${items.length - 3} more`);
		}
	} catch {
		// ignore
	}

	if (!lines.length) {
		lines.push("Updated content ready");
	}

	return (
		<div className="space-y-0.5 rounded border border-blue-200 bg-blue-50/50 p-2 dark:border-blue-800 dark:bg-blue-950/30">
			{lines.map((line, i) => (
				<p key={i} className="font-mono text-[11px] text-blue-800 leading-snug dark:text-blue-200">
					{line}
				</p>
			))}
		</div>
	);
}

// ── Main panel ────────────────────────────────────────────────────────────────

type RevampAgentPanelProps = {
	className?: string;
};

export function RevampAgentPanel({ className }: RevampAgentPanelProps) {
	const token = useRevampStore((s) => s.token);
	const overallStatus = useRevampStore((s) => s.overallStatus);
	const paymentStatus = useRevampStore((s) => s.paymentStatus);
	const sections = useRevampStore((s) => s.sections);
	const autoApply = useRevampStore((s) => s.autoApply);
	const toggleAutoApply = useRevampStore((s) => s.toggleAutoApply);
	const reconnect = useRevampStore((s) => s.reconnect);

	const [expandedSection, setExpandedSection] = useState<string | null>(null);
	const [redoing, setRedoing] = useState(false);

	const doneCount = Object.values(sections).filter((s) => s.status === "done").length;
	const pendingCount = Object.values(sections).filter((s) => s.status === "pending").length;
	const totalSections = SECTION_ORDER.length;
	const progressPct = Math.round((doneCount / totalSections) * 100);

	const activeSection = Object.entries(sections).find(
		([, s]) => s.status === "working" || s.status === "thinking",
	)?.[0];

	const handleStop = async () => {
		if (!token) return;
		await postRevampAction("stop", { token });
	};

	const handleRedo = async () => {
		if (!token || redoing) return;
		setRedoing(true);
		try {
			await fetch(`${CVPAP_API}/api/v1/revamp/redo/${token}`, { method: "POST" });
			reconnect();
		} finally {
			setRedoing(false);
		}
	};

	const toggleSection = (key: string) => {
		setExpandedSection((prev) => (prev === key ? null : key));
	};

	if (!token) {
		return (
			<div className={cn("flex flex-col items-center justify-center gap-3 py-8 text-center", className)}>
				<SparkleIcon className="size-10 text-muted-foreground/30" />
				<p className="text-muted-foreground text-sm">No active revamp</p>
				<p className="max-w-[200px] text-muted-foreground text-xs">
					Send your CV via the Ajiriwa WhatsApp bot to start a live AI revamp session.
				</p>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{/* Header */}
			<div className="shrink-0 space-y-2.5">
				{/* Status row */}
				<div className="flex items-center gap-2">
					<div className="flex min-w-0 flex-1 items-center gap-1.5">
						{overallStatus === "connecting" && (
							<CircleNotchIcon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
						)}
						{overallStatus === "running" && <CircleNotchIcon className="size-3.5 shrink-0 animate-spin text-primary" />}
						{overallStatus === "complete" && <CheckCircleIcon className="size-3.5 shrink-0 text-green-500" />}
						{overallStatus === "error" && <WarningCircleIcon className="size-3.5 shrink-0 text-destructive" />}
						{overallStatus === "idle" && <SparkleIcon className="size-3.5 shrink-0 text-muted-foreground" />}
						<span className="truncate font-medium text-sm">
							{overallStatus === "connecting"
								? "Connecting…"
								: overallStatus === "running"
									? activeSection
										? `Writing ${SECTION_LABELS[activeSection] ?? activeSection}…`
										: "Revamping…"
									: overallStatus === "complete"
										? "Revamp complete"
										: overallStatus === "error"
											? "Error occurred"
											: "CV Agent"}
						</span>
					</div>

					{paymentStatus === "paid" && (
						<span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 font-medium text-[10px] text-green-700 dark:bg-green-900/30 dark:text-green-300">
							Paid ✓
						</span>
					)}
				</div>

				{/* Progress bar */}
				{overallStatus !== "idle" && (
					<div className="space-y-1">
						<div className="h-1 w-full overflow-hidden rounded-full bg-muted">
							<div
								className={cn(
									"h-full transition-all duration-500",
									overallStatus === "complete" ? "bg-green-500" : "bg-primary",
								)}
								style={{ width: overallStatus === "complete" ? "100%" : `${progressPct}%` }}
							/>
						</div>
						<div className="flex items-center justify-between text-[10px] text-muted-foreground">
							<span>
								{doneCount}/{totalSections} applied
							</span>
							{pendingCount > 0 && (
								<span className="font-medium text-blue-600 dark:text-blue-400">{pendingCount} awaiting review</span>
							)}
						</div>
					</div>
				)}

				{/* Controls row */}
				<div className="flex items-center gap-1.5">
					{/* Auto-apply toggle */}
					<button
						type="button"
						onClick={toggleAutoApply}
						className={cn(
							"flex items-center gap-1.5 rounded-md border px-2 py-1 font-medium text-[11px] transition-colors",
							autoApply
								? "border-primary/40 bg-primary/10 text-primary"
								: "border-border bg-muted/40 text-muted-foreground",
						)}
						title={autoApply ? "Auto-apply is ON — changes apply instantly" : "Review mode — you approve each change"}
					>
						<div className={cn("size-1.5 rounded-full", autoApply ? "bg-primary" : "bg-muted-foreground")} />
						{autoApply ? "Auto-apply on" : "Review each"}
					</button>

					<div className="flex-1" />

					{(overallStatus === "running" || overallStatus === "connecting") && (
						<Button
							size="sm"
							variant="ghost"
							className="h-6 gap-1 px-2 text-[11px] text-muted-foreground"
							onClick={() => void handleStop()}
						>
							<StopCircleIcon className="size-3" />
							Stop
						</Button>
					)}
					{(overallStatus === "complete" || overallStatus === "error" || overallStatus === "idle") && (
						<Button
							size="sm"
							variant="ghost"
							className="h-6 gap-1 px-2 text-[11px] text-muted-foreground"
							disabled={redoing}
							onClick={() => void handleRedo()}
						>
							{redoing ? (
								<CircleNotchIcon className="size-3 animate-spin" />
							) : (
								<ArrowCounterClockwiseIcon className="size-3" />
							)}
							Redo
						</Button>
					)}
				</div>

				{/* Payment CTA */}
				{paymentStatus === "unpaid" && token && overallStatus === "complete" && (
					<a
						href={`/revamp/${token}/`}
						className="flex items-center justify-center gap-1.5 rounded-md bg-yellow-500 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-yellow-600"
					>
						<LockSimpleOpenIcon className="size-3.5" />
						Pay to remove watermark
					</a>
				)}
			</div>

			{/* Section list */}
			<ScrollArea className="max-h-[60vh]">
				<div className="space-y-1.5">
					{SECTION_ORDER.map((key) => (
						<SectionRow
							key={key}
							sectionKey={key}
							token={token}
							expanded={expandedSection === key}
							onToggle={() => toggleSection(key)}
						/>
					))}
				</div>

				{overallStatus === "complete" && (
					<p className="pt-2 pb-1 text-center text-[11px] text-muted-foreground">
						All sections complete. Click any section to chat with the AI or retry it.
					</p>
				)}
			</ScrollArea>
		</div>
	);
}
