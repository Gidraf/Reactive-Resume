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

const STATUS_BADGE: Record<string, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
	idle: { label: "Waiting", variant: "secondary" },
	working: { label: "Working…", variant: "default" },
	thinking: { label: "Thinking…", variant: "default" },
	done: { label: "Done", variant: "default" },
	error: { label: "Error", variant: "destructive" },
};

export function SectionCard({ sectionKey, label, state, onCommentSubmitted }: SectionCardProps) {
	const [comment, setComment] = useState("");
	const [submitting, setSubmit] = useState(false);
	const [showThinking, setShowTh] = useState(false);

	const isLocked = state.status === "working" || state.status === "thinking";
	const isDone = state.status === "done";
	const isError = state.status === "error";

	const badge = STATUS_BADGE[state.status] ?? STATUS_BADGE.idle;

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
				"rounded-lg border bg-card p-4 transition-all",
				isLocked && "border-primary/40 bg-primary/5",
				isDone && "border-green-500/40",
				isError && "border-destructive/40",
			)}
		>
			{/* Header */}
			<div className="mb-3 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					{isLocked && <CircleNotchIcon className="animate-spin text-primary" size={16} />}
					{isDone && <CheckCircleIcon className="text-green-500" size={16} />}
					{isError && <XCircleIcon className="text-destructive" size={16} />}
					{state.status === "idle" && <WarningCircleIcon className="text-muted-foreground" size={16} />}

					<span className="font-semibold text-sm">{label}</span>
				</div>
				<Badge variant={badge.variant}>{badge.label}</Badge>
			</div>

			{/* Live thinking stream */}
			{state.thinkingText && (
				<div className="mb-3">
					<button
						type="button"
						className="mb-1 text-muted-foreground text-xs hover:text-foreground"
						onClick={() => setShowTh((v) => !v)}
					>
						{showThinking ? "Hide thinking" : "Show thinking"}
					</button>
					{showThinking && (
						<pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border bg-muted/30 p-2 font-mono text-[0.7rem] text-muted-foreground leading-relaxed">
							{state.thinkingText}
						</pre>
					)}
				</div>
			)}

			{/* Result */}
			{isDone && state.result && (
				<div className="mb-3">
					<p className="mb-1 text-muted-foreground text-xs">Generated output</p>
					<pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded border bg-muted/10 p-2 font-mono text-[0.7rem] leading-relaxed">
						{state.result}
					</pre>
				</div>
			)}

			{/* Error */}
			{isError && state.error && <p className="mb-3 text-destructive text-xs">{state.error}</p>}

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
