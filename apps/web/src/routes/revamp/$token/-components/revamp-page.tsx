import {
	CheckCircleIcon,
	CircleNotchIcon,
	LockSimpleIcon,
	SparkleIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { useParams } from "@tanstack/react-router";
import { ScrollArea } from "@reactive-resume/ui/components/scroll-area";
import { cn } from "@reactive-resume/utils/style";
import { useRevampStream } from "../-hooks/use-revamp-stream";
import { SectionCard } from "./section-card";

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

const SECTION_ORDER = Object.keys(SECTION_LABELS);

async function submitComment(token: string, section: string, comment: string) {
	const res = await fetch(`${CVPAP_API}/api/v1/revamp/comment`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ token, section, comment }),
	});
	if (!res.ok) throw new Error(`Server error ${res.status}`);
}

export function RevampPage() {
	const { token } = useParams({ from: "/revamp/$token/" });
	const { sections, overallStatus, paymentStatus } = useRevampStream(token);

	const doneSections = Object.values(sections).filter((s) => s.status === "done").length;
	const totalSections = SECTION_ORDER.length;
	const progressPct = Math.round((doneSections / totalSections) * 100);
	const isPaid = paymentStatus === "paid";

	return (
		<div className="relative flex h-svh flex-col bg-background">
			{/* Watermark overlay — shown when unpaid */}
			{!isPaid && (
				<div
					className="pointer-events-none absolute inset-0 z-20 flex select-none items-center justify-center overflow-hidden"
					aria-hidden
				>
					<div className="rotate-[-35deg] whitespace-nowrap font-black text-[clamp(3rem,10vw,8rem)] text-muted-foreground/10 tracking-widest">
						DRAFT · UNPAID · DRAFT · UNPAID · DRAFT · UNPAID
					</div>
				</div>
			)}

			{/* Payment banner — shown when unpaid */}
			{!isPaid && (
				<div className="z-10 flex items-center justify-between border-yellow-400/40 border-b bg-yellow-50 px-6 py-2 text-sm dark:bg-yellow-900/20">
					<div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
						<LockSimpleIcon size={16} weight="bold" />
						<span>
							This is a <strong>draft preview</strong>. Pay via WhatsApp to remove the watermark and download your clean
							CV.
						</span>
					</div>
					<span className="ml-4 shrink-0 text-yellow-600 dark:text-yellow-400">
						Reply <strong>pay</strong> on WhatsApp
					</span>
				</div>
			)}

			{/* Header */}
			<header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
				<div className="flex items-center gap-2 font-semibold">
					<SparkleIcon className="text-primary" size={18} />
					CV Revamp — Live Progress
				</div>
				<div className="flex items-center gap-3">
					{isPaid && (
						<span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-300">
							Paid ✓
						</span>
					)}
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						{overallStatus === "running" && (
							<>
								<CircleNotchIcon className="animate-spin" size={14} />
								Revamping…
							</>
						)}
						{overallStatus === "complete" && (
							<>
								<CheckCircleIcon className="text-green-500" size={14} />
								All sections done
							</>
						)}
						{overallStatus === "error" && (
							<>
								<WarningCircleIcon className="text-destructive" size={14} />
								Error occurred
							</>
						)}
						{overallStatus === "pending" && "Waiting for revamp to start…"}
					</div>
				</div>
			</header>

			{/* Progress bar */}
			<div className="h-1 w-full bg-muted">
				<div
					className={cn(
						"h-full bg-primary transition-all duration-500",
						overallStatus === "complete" && "bg-green-500",
					)}
					style={{ width: `${progressPct}%` }}
				/>
			</div>

			{/* Body */}
			<ScrollArea className="flex-1">
				<div className={cn("mx-auto grid max-w-4xl gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3", !isPaid && "blur-[1px]")}>
					{SECTION_ORDER.map((key) => {
						const state = sections[key] ?? {
							status: "idle",
							thinkingText: "",
							result: null,
							error: null,
						};

						return (
							<SectionCard
								key={key}
								sectionKey={key}
								label={SECTION_LABELS[key] ?? key}
								state={state}
								onCommentSubmitted={async (section, comment) => {
									await submitComment(token, section, comment);
								}}
							/>
						);
					})}
				</div>

				{overallStatus === "complete" && (
					<div className="mx-auto max-w-4xl px-6 pb-8 text-center text-muted-foreground text-sm">
						{isPaid
							? "Your revamped CV sections are ready. Check your WhatsApp for the PDF and interview questions!"
							: "Revamp complete! Pay via WhatsApp (reply pay) to receive your clean PDF without a watermark."}
					</div>
				)}
			</ScrollArea>
		</div>
	);
}
