import { CheckCircleIcon, CircleNotchIcon, SparkleIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cn } from "@reactive-resume/utils/style";
import { useRevampStore } from "../-store/revamp";

const SECTION_LABELS: Record<string, string> = {
	basics: "Personal Info",
	work_experience: "Work Experience",
	education: "Education",
	skills: "Skills",
	projects: "Projects",
	awards: "Awards",
	certifications: "Certifications",
	languages: "Languages",
	interests: "Interests",
	publications: "Publications",
	volunteer: "Volunteer",
	references: "References",
};

const TOTAL_SECTIONS = 12;

export function RevampHUD() {
	const overallStatus = useRevampStore((s) => s.overallStatus);
	const sections = useRevampStore((s) => s.sections);
	const [dismissed, setDismissed] = useState(false);
	const [visible, setVisible] = useState(false);

	// Become visible as soon as revamp starts
	useEffect(() => {
		if (overallStatus === "running" || overallStatus === "connecting") {
			setVisible(true);
			setDismissed(false);
		}
	}, [overallStatus]);

	// Auto-dismiss 4s after complete
	useEffect(() => {
		if (overallStatus !== "complete") return;
		const t = setTimeout(() => setDismissed(true), 4000);
		return () => clearTimeout(t);
	}, [overallStatus]);

	if (!visible || dismissed) return null;

	// Find the currently active section (working or thinking)
	const activeEntry = Object.entries(sections).find(([, s]) => s.status === "working" || s.status === "thinking");
	const activeKey = activeEntry?.[0];
	const activeState = activeEntry?.[1];
	const doneCount = Object.values(sections).filter((s) => s.status === "done").length;
	const progressPct = Math.round((doneCount / TOTAL_SECTIONS) * 100);

	return (
		<div className="pointer-events-none absolute top-3 right-3 z-30 flex w-72 flex-col gap-1.5">
			{/* Status card */}
			<div className="pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur-sm">
				<div className="mt-0.5 shrink-0">
					{overallStatus === "running" || overallStatus === "connecting" ? (
						<SparkleIcon size={16} className="animate-pulse text-primary" />
					) : overallStatus === "complete" ? (
						<CheckCircleIcon size={16} className="text-green-500" />
					) : (
						<WarningCircleIcon size={16} className="text-destructive" />
					)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<p className="truncate font-semibold text-xs">
							{overallStatus === "complete"
								? "Revamp complete!"
								: overallStatus === "error"
									? "Revamp error"
									: activeKey
										? `Writing ${SECTION_LABELS[activeKey] ?? activeKey}…`
										: "Starting revamp…"}
						</p>
						<button
							type="button"
							className="shrink-0 text-muted-foreground hover:text-foreground"
							onClick={() => setDismissed(true)}
						>
							<XIcon size={12} />
						</button>
					</div>

					{/* Progress bar */}
					<div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
						<div
							className={cn(
								"h-full rounded-full transition-all duration-700",
								overallStatus === "complete" ? "bg-green-500" : "bg-primary",
							)}
							style={{ width: overallStatus === "complete" ? "100%" : `${progressPct}%` }}
						/>
					</div>

					<p className="mt-1 text-[10px] text-muted-foreground">
						{overallStatus === "complete"
							? "Your CV is ready — review the design below."
							: `${doneCount} / ${TOTAL_SECTIONS} sections complete`}
					</p>
				</div>
			</div>

			{/* Thinking text bubble */}
			{activeState?.thinkingText && (
				<div className="pointer-events-none max-h-20 overflow-hidden rounded-lg border bg-muted/80 px-3 py-2 backdrop-blur-sm">
					<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
						<CircleNotchIcon size={9} className="shrink-0 animate-spin" />
						<span className="line-clamp-3 font-mono leading-snug">
							{activeState.thinkingText.split("\n").at(-1) ?? activeState.thinkingText}
						</span>
					</div>
				</div>
			)}

			{/* Section progress pills */}
			<div className="pointer-events-none flex flex-wrap gap-1">
				{Object.entries(SECTION_LABELS).map(([key, label]) => {
					const state = sections[key];
					return (
						<span
							key={key}
							className={cn(
								"rounded-full px-1.5 py-0.5 font-medium text-[9px]",
								state?.status === "done"
									? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
									: state?.status === "working" || state?.status === "thinking"
										? "bg-primary/10 text-primary"
										: "bg-muted text-muted-foreground",
							)}
						>
							{label}
						</span>
					);
				})}
			</div>
		</div>
	);
}
