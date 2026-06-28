import type { LeftSidebarSection } from "@/libs/resume/section";
import { t } from "@lingui/core/macro";
import { FloppyDiskIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Suspense, useCallback, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { ResumePreview } from "@/features/resume/preview/preview";
import { useRevampStore } from "../-store/revamp";
import { BuilderDock } from "./dock";
import { InlineEditor, sectionFromYFraction } from "./inline-editor";
import { DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT, getNextBuilderPreviewPageLayout } from "./page-layout";
import { RevampHUD } from "./revamp-hud";

const WATERMARK_SVG = encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><text x="50%" y="50%" fill="rgba(220,38,38,0.14)" font-size="20" font-weight="700" font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle" transform="rotate(-40,130,130)" letter-spacing="4">UNPAID DRAFT</text></svg>',
);

export function PreviewPage() {
	const [pageLayout, setPageLayout] = useState(DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT);
	const [editorOpen, setEditorOpen] = useState(false);
	const [activeSection, setActiveSection] = useState<LeftSidebarSection>("basics");

	const paymentStatus = useRevampStore((s) => s.paymentStatus);
	const revampToken = useRevampStore((s) => s.token);
	const showWatermark = revampToken !== null && paymentStatus === "unpaid";

	// Track pan distance — if the pointer moved significantly, it's a pan, not a tap
	const panMovedRef = useRef(false);

	useHotkey("Mod+S", () => {
		toast.info(t`Your changes are saved automatically.`, { id: "auto-save", icon: <FloppyDiskIcon /> });
	});

	const openEditor = useCallback((section: LeftSidebarSection = "basics") => {
		setActiveSection(section);
		setEditorOpen(true);
	}, []);

	const closeEditor = useCallback(() => {
		setEditorOpen(false);
	}, []);

	// Click on the artboard opens the section editor, guessing which section
	// was clicked using the Y position fraction as a heuristic.
	const handleArtboardClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (panMovedRef.current) return;
			if (editorOpen) return;
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const yFraction = (e.clientY - rect.top) / rect.height;
			openEditor(sectionFromYFraction(yFraction));
		},
		[editorOpen, openEditor],
	);

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
					onPanningStart={() => {
						panMovedRef.current = false;
					}}
					onPanning={() => {
						panMovedRef.current = true;
					}}
				>
					<TransformComponent
						wrapperClass="h-full! w-full!"
						wrapperStyle={{ cursor: editorOpen ? "default" : "pointer" }}
						contentStyle={{ position: "relative" }}
					>
						{/* Transparent click layer — sit on top of the PDF canvas, intercept taps */}
						<button
							type="button"
							aria-label="Click to edit CV sections"
							className="absolute inset-0 z-10 cursor-pointer border-0 bg-transparent p-0"
							onClick={handleArtboardClick}
						/>
						<ResumePreview showPageNumbers pageLayout={pageLayout} />
					</TransformComponent>

					<BuilderDock
						pageLayout={pageLayout}
						onTogglePageLayout={() => {
							setPageLayout((current) => getNextBuilderPreviewPageLayout(current));
						}}
					/>
				</TransformWrapper>

				{/* Watermark overlay */}
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

				{/* Floating "Edit CV" shortcut — always visible, stays outside the pan/zoom layer */}
				{!editorOpen && (
					<button
						type="button"
						onClick={() => openEditor("basics")}
						className="absolute bottom-20 left-4 z-30 flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 font-medium text-primary-foreground text-xs shadow-lg transition-opacity hover:opacity-90"
					>
						<PencilSimpleIcon size={13} />
						Edit CV
					</button>
				)}

				{/* Live revamp progress HUD */}
				<RevampHUD />

				{/* Inline section editor panel */}
				<InlineEditor
					isOpen={editorOpen}
					activeSection={activeSection}
					onSectionChange={setActiveSection}
					onClose={closeEditor}
				/>
			</div>
		</Suspense>
	);
}
