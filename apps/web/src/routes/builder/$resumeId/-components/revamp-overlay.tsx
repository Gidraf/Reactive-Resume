import { LockSimpleIcon } from "@phosphor-icons/react";
import { useRevampStore } from "../-store/revamp";
import { RevampHUD } from "./revamp-hud";

const WATERMARK_SVG = encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><text x="50%" y="50%" fill="rgba(220,38,38,0.14)" font-size="20" font-weight="700" font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle" transform="rotate(-40,130,130)" letter-spacing="4">UNPAID DRAFT</text></svg>',
);

/**
 * CVpap: everything a WhatsApp revamp puts over the editor — the "unpaid draft" watermark and pay banner while the
 * revamp is unpaid, and the live progress HUD. Renders nothing without a revamp token.
 */
export function RevampOverlay() {
	const paymentStatus = useRevampStore((s) => s.paymentStatus);
	const revampToken = useRevampStore((s) => s.token);
	const showWatermark = revampToken !== null && paymentStatus === "unpaid";

	return (
		<>
			{showWatermark && (
				<div
					aria-hidden
					className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
					style={{
						backgroundImage: `url("data:image/svg+xml,${WATERMARK_SVG}")`,
						backgroundRepeat: "repeat",
						backgroundSize: "260px 260px",
					}}
				/>
			)}

			{/* Payment banner — sits above the watermark, lets the user pay without leaving the builder */}
			{showWatermark && revampToken && (
				<div className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t border-yellow-400/50 bg-yellow-50/95 px-4 py-2 backdrop-blur-sm dark:border-yellow-800 dark:bg-yellow-900/30">
					<div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
						<LockSimpleIcon size={14} weight="bold" />
						<span>Draft preview — watermark removed after payment</span>
					</div>
					<a
						href={`/revamp/${revampToken}/`}
						className="ml-4 shrink-0 rounded-md bg-yellow-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
					>
						Pay to Unlock →
					</a>
				</div>
			)}

			<RevampHUD />
		</>
	);
}
