import type { SectionState } from "../-hooks/use-revamp-stream";
import { CheckCircleIcon, CircleNotchIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { Textarea } from "@reactive-resume/ui/components/textarea";
import { cn } from "@reactive-resume/utils/style";

type SectionCardProps = {
	sectionKey: string;
	label: string;
	state: SectionState;
	onCommentSubmitted: (section: string, comment: string) => Promise<void>;
};

type StatusBadge = { label: string; variant: "neutral" | "accent" | "danger" };

const IDLE_BADGE: StatusBadge = { label: "Waiting", variant: "neutral" };
const STATUS_BADGE: Record<string, StatusBadge> = {
	idle: IDLE_BADGE,
	working: { label: "Working…", variant: "accent" },
	thinking: { label: "Thinking…", variant: "accent" },
	done: { label: "Done", variant: "accent" },
	error: { label: "Error", variant: "danger" },
};

export function SectionCard({ sectionKey, label, state, onCommentSubmitted }: SectionCardProps) {
	const [comment, setComment] = useState("");
	const [submitting, setSubmit] = useState(false);
	const [showThinking, setShowTh] = useState(false);

	const isLocked = state.status === "working" || state.status === "thinking";
	const isDone = state.status === "done";
	const isError = state.status === "error";

	const badge = STATUS_BADGE[state.status] ?? IDLE_BADGE;

	const handleSubmit = async () => {
		if (!comment.trim() || submitting) return;
		setSubmit(true);
		try {
			await onCommentSubmitted(sectionKey, comment.trim());
			setComment("");
		} finally {
			setSubmit(false);
		}
	};

	return (
		<div
			className={cn(
				"bg-card rounded-lg border p-4 transition-all",
				isLocked && "border-primary/40 bg-primary/5",
				isDone && "border-green-500/40",
				isError && "border-destructive/40",
			)}
		>
			{/* Header */}
			<div className="mb-3 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					{isLocked && <CircleNotchIcon className="text-primary animate-spin" size={16} />}
					{isDone && <CheckCircleIcon className="text-green-500" size={16} />}
					{isError && <XCircleIcon className="text-destructive" size={16} />}
					{state.status === "idle" && <WarningCircleIcon className="text-muted-foreground" size={16} />}

					<span className="text-sm font-semibold">{label}</span>
				</div>
				<Badge variant={badge.variant}>{badge.label}</Badge>
			</div>

			{/* Live thinking stream */}
			{state.thinkingText && (
				<div className="mb-3">
					<button
						type="button"
						className="text-muted-foreground hover:text-foreground mb-1 text-xs"
						onClick={() => setShowTh((v) => !v)}
					>
						{showThinking ? "Hide thinking" : "Show thinking"}
					</button>
					{showThinking && (
						<pre className="bg-muted/30 text-muted-foreground max-h-48 overflow-y-auto rounded border p-2 font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap">
							{state.thinkingText}
						</pre>
					)}
				</div>
			)}

			{/* Result */}
			{isDone && state.result && (
				<div className="mb-3">
					<p className="text-muted-foreground mb-1 text-xs">Generated output</p>
					<pre className="bg-muted/10 max-h-40 overflow-y-auto rounded border p-2 font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap">
						{state.result}
					</pre>
				</div>
			)}

			{/* Error */}
			{isError && state.error && <p className="text-destructive mb-3 text-xs">{state.error}</p>}

			{/* Comment / re-revamp */}
			{(isDone || isError) && (
				<div className="mt-3 space-y-2">
					<Textarea
						rows={2}
						placeholder="Add a comment to refine this section…"
						disabled={submitting}
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						className="resize-none text-xs"
					/>
					<Button size="sm" disabled={!comment.trim() || submitting} onClick={() => void handleSubmit()}>
						{submitting ? <CircleNotchIcon className="animate-spin" size={14} /> : null}
						Re-revamp section
					</Button>
				</div>
			)}
		</div>
	);
}
