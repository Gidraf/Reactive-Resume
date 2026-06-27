import { t } from "@lingui/core/macro";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Suspense, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { ResumePreview } from "@/features/resume/preview/preview";
import { useRevampStore } from "../-store/revamp";
import { BuilderDock } from "./dock";
import { DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT, getNextBuilderPreviewPageLayout } from "./page-layout";

const WATERMARK_SVG = encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><text x="50%" y="50%" fill="rgba(220,38,38,0.14)" font-size="20" font-weight="700" font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle" transform="rotate(-40,130,130)" letter-spacing="4">UNPAID DRAFT</text></svg>',
);

export function PreviewPage() {
	const [pageLayout, setPageLayout] = useState(DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT);

	const paymentStatus = useRevampStore((s) => s.paymentStatus);
	const revampToken = useRevampStore((s) => s.token);
	const showWatermark = revampToken !== null && paymentStatus === "unpaid";

	useHotkey("Mod+S", () => {
		toast.info(t`Your changes are saved automatically.`, { id: "auto-save", icon: <FloppyDiskIcon /> });
	});

	return (
		<Suspense fallback={<LoadingScreen />}>
			<div className="fixed inset-0">
				<TransformWrapper
					centerOnInit
					maxScale={5}
					minScale={0.5}
					initialScale={0.75}
					limitToBounds={false}
					wheel={{ step: 0.001 }}
				>
					<TransformComponent wrapperClass="h-full! w-full!">
						<ResumePreview showPageNumbers pageLayout={pageLayout} />
					</TransformComponent>

					<BuilderDock
						pageLayout={pageLayout}
						onTogglePageLayout={() => {
							setPageLayout((current) => getNextBuilderPreviewPageLayout(current));
						}}
					/>
				</TransformWrapper>

				{/* Watermark overlay — shown for unpaid CV orders while revamp is in progress */}
				{showWatermark && (
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
						style={{
							backgroundImage: `url("data:image/svg+xml,${WATERMARK_SVG}")`,
							backgroundRepeat: "repeat",
							backgroundSize: "260px 260px",
						}}
					/>
				)}
			</div>
		</Suspense>
	);
}
