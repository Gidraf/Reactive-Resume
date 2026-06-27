import {
	ArrowCounterClockwiseIcon,
	CheckCircleIcon,
	CircleNotchIcon,
	PaperPlaneTiltIcon,
	SparkleIcon,
	StopCircleIcon,
	WarningCircleIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { ScrollArea } from "@reactive-resume/ui/components/scroll-area";
import { cn } from "@reactive-resume/utils/style";
import { useRevampStore } from "../../../-store/revamp";
import { SectionBase as RightSectionBase } from "../shared/section-base";

const CVPAP_API = (import.meta.env.VITE_CVPAP_API_URL as string | undefined) ?? "";

const SECTION_LABELS: Record<string, string> = {
	basics: "Personal Info & Summary",
	work_experience: "Work Experience",
	education: "Education",
	projects: "Projects",
	awards: "Awards",
	publications: "Publications",
	interests: "Interests",
	references: "References",
	volunteer: "Volunteer",
	languages: "Languages",
	certifications: "Certifications",
	skills: "Skills",
};

async function postRevampAction(path: string, body: Record<string, string>) {
	await fetch(`${CVPAP_API}/api/v1/revamp/${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

// ── Section Card ──────────────────────────────────────────────────────────────

type SectionCardProps = {
	token: string;
	sectionKey: string;
};

function RevampSectionCard({ token, sectionKey }: SectionCardProps) {
	const state = useRevampStore((s) => s.sections[sectionKey]);
	const [comment, setComment] = useState("");
	const [showThinking, setShowThinking] = useState(false);
	const [sending, setSending] = useState(false);

	const status = state?.status ?? "idle";
	const label = SECTION_LABELS[sectionKey] ?? sectionKey;

	const handleComment = async () => {
		if (!comment.trim()) return;
		setSending(true);
		try {
			await postRevampAction("comment", { token, section: sectionKey, comment: comment.trim() });
			setComment("");
		} finally {
			setSending(false);
		}
	};

	const handleRetry = async () => {
		await postRevampAction("retry", { token, section: sectionKey });
	};

	return (
		<div
			className={cn(
				"space-y-2 rounded-lg border bg-card p-3 text-sm transition-colors",
				status === "working" && "border-primary/40 bg-primary/5",
				status === "thinking" && "border-amber-400/40 bg-amber-50/30 dark:bg-amber-900/10",
				status === "done" && "border-green-400/40 bg-green-50/20 dark:bg-green-900/10",
				status === "error" && "border-destructive/40 bg-destructive/5",
			)}
		>
			{/* Header row */}
			<div className="flex items-center gap-2">
				{status === "idle" && <div className="size-3.5 shrink-0 rounded-full border-2 border-muted-foreground/30" />}
				{status === "working" && <CircleNotchIcon className="size-3.5 shrink-0 animate-spin text-primary" />}
				{status === "thinking" && <CircleNotchIcon className="size-3.5 shrink-0 animate-spin text-amber-500" />}
				{status === "done" && <CheckCircleIcon className="size-3.5 shrink-0 text-green-500" />}
				{status === "error" && <XCircleIcon className="size-3.5 shrink-0 text-destructive" />}

				<span className="flex-1 font-medium leading-none">{label}</span>

				{(status === "error" || status === "done") && (
					<Button size="icon" variant="ghost" className="size-6" title="Retry section" onClick={handleRetry}>
						<ArrowCounterClockwiseIcon className="size-3" />
					</Button>
				)}
			</div>

			{/* Thinking accordion */}
			{(status === "thinking" || (status === "done" && state?.thinkingText)) && (
				<div>
					<button
						type="button"
						className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
						onClick={() => setShowThinking((v) => !v)}
					>
						{showThinking ? "▾" : "▸"} {status === "thinking" ? "Thinking…" : "View thinking"}
					</button>
					{showThinking && (
						<ScrollArea className="mt-1 max-h-32 rounded border bg-muted/40 p-2">
							<pre className="whitespace-pre-wrap font-mono text-muted-foreground text-xs leading-relaxed">
								{state?.thinkingText}
							</pre>
						</ScrollArea>
					)}
				</div>
			)}

			{/* Error message */}
			{status === "error" && state?.error && <p className="text-destructive text-xs">{state.error}</p>}

			{/* Comment + reprocess */}
			{(status === "done" || status === "error") && (
				<div className="flex gap-1.5 pt-1">
					<input
						type="text"
						placeholder="Comment to refine this section…"
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && void handleComment()}
						className="flex-1 rounded border bg-background px-2 py-1 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
					/>
					<Button
						size="icon"
						variant="outline"
						className="size-6 shrink-0"
						disabled={!comment.trim() || sending}
						onClick={handleComment}
					>
						{sending ? <CircleNotchIcon className="size-3 animate-spin" /> : <PaperPlaneTiltIcon className="size-3" />}
					</Button>
				</div>
			)}
		</div>
	);
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function RevampSectionBuilder() {
	const token = useRevampStore((s) => s.token);
	const overallStatus = useRevampStore((s) => s.overallStatus);
	const paymentStatus = useRevampStore((s) => s.paymentStatus);
	const sections = useRevampStore((s) => s.sections);

	const doneSections = Object.values(sections).filter((s) => s.status === "done").length;
	const totalSections = Object.keys(SECTION_LABELS).length;
	const progressPct = totalSections > 0 ? Math.round((doneSections / totalSections) * 100) : 0;

	const handleStop = async () => {
		if (!token) return;
		await postRevampAction("stop", { token });
	};

	if (!token) {
		return (
			<RightSectionBase type="revamp">
				<div className="space-y-2 py-2 text-center text-muted-foreground text-sm">
					<SparkleIcon className="mx-auto size-8 opacity-30" />
					<p>No active revamp.</p>
					<p className="text-xs">Send your CV to the Ajiriwa WhatsApp bot to start an AI revamp session.</p>
				</div>
			</RightSectionBase>
		);
	}

	return (
		<RightSectionBase type="revamp">
			<div className="space-y-3">
				{/* Status + stop */}
				<div className="flex items-center gap-2 text-sm">
					<div className="flex flex-1 items-center gap-1.5">
						{overallStatus === "connecting" && (
							<CircleNotchIcon className="size-3.5 animate-spin text-muted-foreground" />
						)}
						{overallStatus === "running" && <CircleNotchIcon className="size-3.5 animate-spin text-primary" />}
						{overallStatus === "complete" && <CheckCircleIcon className="size-3.5 text-green-500" />}
						{overallStatus === "error" && <WarningCircleIcon className="size-3.5 text-destructive" />}
						{overallStatus === "idle" && <SparkleIcon className="size-3.5 text-muted-foreground" />}
						<span className="text-muted-foreground capitalize">
							{overallStatus === "connecting"
								? "Connecting…"
								: overallStatus === "running"
									? "Revamping…"
									: overallStatus}
						</span>
						{paymentStatus === "paid" && (
							<span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-300">
								Paid ✓
							</span>
						)}
					</div>
					{(overallStatus === "running" || overallStatus === "connecting") && (
						<Button
							size="sm"
							variant="ghost"
							className="h-6 gap-1 px-2 text-muted-foreground text-xs"
							onClick={handleStop}
						>
							<StopCircleIcon className="size-3" />
							Stop
						</Button>
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
								style={{ width: `${progressPct}%` }}
							/>
						</div>
						<p className="text-right text-muted-foreground text-xs">
							{doneSections}/{totalSections} sections
						</p>
					</div>
				)}

				{/* Section cards */}
				<div className="space-y-2">
					{Object.keys(SECTION_LABELS).map((key) => (
						<RevampSectionCard key={key} token={token} sectionKey={key} />
					))}
				</div>

				{overallStatus === "complete" && (
					<p className="pt-1 text-center text-muted-foreground text-xs">
						{paymentStatus === "paid"
							? "Revamp complete! Your CV is updated and the PDF is on WhatsApp."
							: "Revamp complete! Reply pay on WhatsApp to get a clean PDF without watermark."}
					</p>
				)}
			</div>
		</RightSectionBase>
	);
}
