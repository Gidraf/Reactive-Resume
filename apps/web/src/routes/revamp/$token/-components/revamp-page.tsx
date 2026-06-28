import {
	ArrowSquareOutIcon,
	CheckCircleIcon,
	CircleNotchIcon,
	FilePdfIcon,
	LockSimpleIcon,
	LockSimpleOpenIcon,
	SparkleIcon,
	WarningCircleIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
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

type PayState = "idle" | "sending" | "waiting" | "paid" | "error";

type VerifyMeta = {
	whatsapp_number?: string;
	price?: number;
};

export function RevampPage() {
	const { token } = useParams({ from: "/revamp/$token/" });
	const { sections, overallStatus, paymentStatus, setPaymentStatus } = useRevampStream(token);

	const [verifyMeta, setVerifyMeta] = useState<VerifyMeta>({});
	const [showPayModal, setShowPayModal] = useState(false);
	const [payPhone, setPayPhone] = useState("");
	const [payState, setPayState] = useState<PayState>("idle");
	const [payError, setPayError] = useState("");
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Seed phone + price from verify on mount
	useEffect(() => {
		if (!token) return;
		fetch(`${CVPAP_API}/api/v1/revamp/verify/${token}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (!data) return;
				setVerifyMeta({ whatsapp_number: data.whatsapp_number, price: data.price });
				setPayPhone(data.whatsapp_number ?? "");
			})
			.catch(() => undefined);
	}, [token]);

	// Stop polling when paid
	useEffect(() => {
		if (paymentStatus === "paid" && pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
			setPayState("paid");
		}
	}, [paymentStatus]);

	// Cleanup on unmount
	useEffect(
		() => () => {
			if (pollRef.current) clearInterval(pollRef.current);
		},
		[],
	);

	const startPolling = () => {
		if (pollRef.current) return;
		pollRef.current = setInterval(async () => {
			try {
				const res = await fetch(`${CVPAP_API}/api/v1/revamp/pay/status/${token}`);
				if (!res.ok) return;
				const data = (await res.json()) as { payment_status: string };
				if (data.payment_status === "paid") {
					setPaymentStatus("paid");
				}
			} catch {
				// network blip — keep polling
			}
		}, 3000);
	};

	const handlePay = async () => {
		setPayState("sending");
		setPayError("");
		try {
			const res = await fetch(`${CVPAP_API}/api/v1/revamp/pay`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, phone: payPhone }),
			});
			const data = (await res.json()) as {
				success?: boolean;
				already_paid?: boolean;
				error?: string;
				stk_exhausted?: boolean;
			};
			if (data.already_paid) {
				setPaymentStatus("paid");
				setPayState("paid");
				setShowPayModal(false);
				return;
			}
			if (!res.ok || !data.success) {
				setPayError(data.error ?? "Payment initiation failed");
				setPayState("error");
				return;
			}
			setPayState("waiting");
			startPolling();
		} catch (e) {
			setPayError(e instanceof Error ? e.message : "Network error");
			setPayState("error");
		}
	};

	const closeModal = () => {
		setShowPayModal(false);
		setPayState("idle");
		setPayError("");
	};

	const doneSections = Object.values(sections).filter((s) => s.status === "done").length;
	const totalSections = SECTION_ORDER.length;
	const progressPct = Math.round((doneSections / totalSections) * 100);
	const isPaid = paymentStatus === "paid";
	const price = verifyMeta.price ?? 200;

	return (
		<div className="relative flex h-svh flex-col bg-background">
			{/* Watermark overlay */}
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

			{/* Payment banner */}
			{!isPaid && (
				<div className="z-10 flex items-center justify-between border-yellow-400/40 border-b bg-yellow-50 px-6 py-2 text-sm dark:bg-yellow-900/20">
					<div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
						<LockSimpleIcon size={16} weight="bold" />
						<span>
							<strong>Draft preview</strong> — pay to remove the watermark and download your clean CV.
						</span>
					</div>
					<Button
						size="sm"
						className="ml-4 shrink-0 bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
						onClick={() => setShowPayModal(true)}
					>
						<LockSimpleOpenIcon size={14} weight="bold" className="mr-1" />
						Pay KES {price.toFixed(0)} — Unlock
					</Button>
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
						<>
							<span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-300">
								Paid ✓
							</span>
							<a href={`${CVPAP_API}/api/v1/revamp/pdf/${token}`} target="_blank" rel="noopener noreferrer">
								<Button
									size="sm"
									variant="outline"
									className="gap-1.5 border-green-400 text-green-700 dark:border-green-600 dark:text-green-400"
								>
									<FilePdfIcon size={14} />
									Download PDF
								</Button>
							</a>
						</>
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
						{isPaid ? (
							<span>
								Your revamped CV is ready!{" "}
								<a
									href={`${CVPAP_API}/api/v1/revamp/pdf/${token}`}
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium text-primary underline-offset-4 hover:underline"
								>
									Download your clean PDF
								</a>{" "}
								or check WhatsApp for interview questions.
							</span>
						) : (
							<span>
								Revamp complete!{" "}
								<button
									type="button"
									className="font-medium text-primary underline-offset-4 hover:underline"
									onClick={() => setShowPayModal(true)}
								>
									Pay KES {price.toFixed(0)}
								</button>{" "}
								to download the watermark-free PDF.
							</span>
						)}
					</div>
				)}
			</ScrollArea>

			{/* Payment modal */}
			{showPayModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-2xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="font-semibold text-lg">Pay KES {price.toFixed(0)}</h2>
							<button
								type="button"
								onClick={closeModal}
								className="rounded-md p-1 text-muted-foreground hover:bg-muted"
							>
								<XIcon size={18} />
							</button>
						</div>

						{payState === "idle" || payState === "error" ? (
							<>
								<p className="mb-4 text-muted-foreground text-sm">
									We'll send an M-Pesa prompt to your phone. Confirm payment to instantly unlock your watermark-free CV
									and PDF download.
								</p>
								<label htmlFor="mpesa-phone" className="mb-1 block font-medium text-sm">
									M-Pesa phone number
								</label>
								<input
									id="mpesa-phone"
									type="tel"
									value={payPhone}
									onChange={(e) => setPayPhone(e.target.value)}
									placeholder="e.g. 0712345678"
									className="mb-4 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								/>
								{payError && (
									<p className="mb-3 flex items-center gap-1.5 text-destructive text-sm">
										<WarningCircleIcon size={14} />
										{payError}
									</p>
								)}
								<div className="flex gap-2">
									<Button variant="outline" className="flex-1" onClick={closeModal}>
										Cancel
									</Button>
									<Button className="flex-1" onClick={handlePay} disabled={!payPhone.trim()}>
										Send M-Pesa Prompt
									</Button>
								</div>
							</>
						) : payState === "sending" ? (
							<div className="flex flex-col items-center gap-3 py-4 text-center">
								<CircleNotchIcon size={32} className="animate-spin text-primary" />
								<p className="text-sm">Sending M-Pesa prompt…</p>
							</div>
						) : payState === "waiting" ? (
							<div className="flex flex-col items-center gap-3 py-4 text-center">
								<CircleNotchIcon size={32} className="animate-spin text-yellow-500" />
								<p className="font-medium text-sm">Check your phone!</p>
								<p className="text-muted-foreground text-xs">
									Enter your M-Pesa PIN to pay KES {price.toFixed(0)}.<br />
									This page updates automatically once payment is confirmed.
								</p>
								<Button variant="outline" size="sm" onClick={closeModal}>
									Close
								</Button>
							</div>
						) : (
							/* paid */
							<div className="flex flex-col items-center gap-3 py-4 text-center">
								<CheckCircleIcon size={40} className="text-green-500" />
								<p className="font-semibold text-green-600 dark:text-green-400">Payment confirmed!</p>
								<p className="text-muted-foreground text-xs">Your watermark has been removed.</p>
								<a
									href={`${CVPAP_API}/api/v1/revamp/pdf/${token}`}
									target="_blank"
									rel="noopener noreferrer"
									onClick={closeModal}
								>
									<Button className="gap-2">
										<FilePdfIcon size={16} />
										Download Clean PDF
										<ArrowSquareOutIcon size={14} />
									</Button>
								</a>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
