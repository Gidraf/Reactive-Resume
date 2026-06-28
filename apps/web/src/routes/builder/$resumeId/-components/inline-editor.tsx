import type { LeftSidebarSection } from "@/libs/resume/section";
import { PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, m } from "motion/react";
import { Fragment, useCallback, useEffect, useRef } from "react";
import { match } from "ts-pattern";
import { ScrollArea } from "@reactive-resume/ui/components/scroll-area";
import { Separator } from "@reactive-resume/ui/components/separator";
import { cn } from "@reactive-resume/utils/style";
import { getSectionIcon, getSectionTitle, leftSidebarSections } from "@/libs/resume/section";
import { AwardsSectionBuilder } from "../-sidebar/left/sections/awards";
import { BasicsSectionBuilder } from "../-sidebar/left/sections/basics";
import { CertificationsSectionBuilder } from "../-sidebar/left/sections/certifications";
import { CustomSectionBuilder } from "../-sidebar/left/sections/custom";
import { EducationSectionBuilder } from "../-sidebar/left/sections/education";
import { ExperienceSectionBuilder } from "../-sidebar/left/sections/experience";
import { InterestsSectionBuilder } from "../-sidebar/left/sections/interests";
import { LanguagesSectionBuilder } from "../-sidebar/left/sections/languages";
import { PictureSectionBuilder } from "../-sidebar/left/sections/picture";
import { ProfilesSectionBuilder } from "../-sidebar/left/sections/profiles";
import { ProjectsSectionBuilder } from "../-sidebar/left/sections/projects";
import { PublicationsSectionBuilder } from "../-sidebar/left/sections/publications";
import { ReferencesSectionBuilder } from "../-sidebar/left/sections/references";
import { SkillsSectionBuilder } from "../-sidebar/left/sections/skills";
import { SummarySectionBuilder } from "../-sidebar/left/sections/summary";
import { VolunteerSectionBuilder } from "../-sidebar/left/sections/volunteer";
import { useRevampStore } from "../-store/revamp";

function getSectionComponent(type: LeftSidebarSection) {
	return match(type)
		.with("picture", () => <PictureSectionBuilder />)
		.with("basics", () => <BasicsSectionBuilder />)
		.with("summary", () => <SummarySectionBuilder />)
		.with("profiles", () => <ProfilesSectionBuilder />)
		.with("experience", () => <ExperienceSectionBuilder />)
		.with("education", () => <EducationSectionBuilder />)
		.with("projects", () => <ProjectsSectionBuilder />)
		.with("skills", () => <SkillsSectionBuilder />)
		.with("languages", () => <LanguagesSectionBuilder />)
		.with("interests", () => <InterestsSectionBuilder />)
		.with("awards", () => <AwardsSectionBuilder />)
		.with("certifications", () => <CertificationsSectionBuilder />)
		.with("publications", () => <PublicationsSectionBuilder />)
		.with("volunteer", () => <VolunteerSectionBuilder />)
		.with("references", () => <ReferencesSectionBuilder />)
		.with("custom", () => <CustomSectionBuilder />)
		.exhaustive();
}

type InlineEditorProps = {
	isOpen: boolean;
	activeSection: LeftSidebarSection;
	onSectionChange: (section: LeftSidebarSection) => void;
	onClose: () => void;
};

export function InlineEditor({ isOpen, activeSection, onSectionChange, onClose }: InlineEditorProps) {
	const scrollAreaRef = useRef<HTMLDivElement | null>(null);
	const revampSections = useRevampStore((s) => s.sections);

	// Scroll to the active section whenever it changes and the panel is open
	useEffect(() => {
		if (!isOpen) return;
		// Small delay so the slide-in animation has time to render the elements
		const t = setTimeout(() => {
			const el = scrollAreaRef.current?.querySelector<HTMLElement>(`[data-section="${activeSection}"]`);
			el?.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 180);
		return () => clearTimeout(t);
	}, [isOpen, activeSection]);

	const handleTabClick = useCallback(
		(section: LeftSidebarSection) => {
			onSectionChange(section);
		},
		[onSectionChange],
	);

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop — clicking it closes the panel */}
					<m.div
						key="backdrop"
						className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
						onClick={onClose}
					/>

					{/* Slide-in panel */}
					<m.div
						key="panel"
						className="absolute inset-y-0 left-0 z-50 flex w-[min(440px,90vw)] flex-col bg-background shadow-2xl"
						initial={{ x: "-100%" }}
						animate={{ x: 0 }}
						exit={{ x: "-100%" }}
						transition={{ type: "spring", stiffness: 380, damping: 38 }}
					>
						{/* Header */}
						<div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
							<div className="flex items-center gap-2">
								<PencilSimpleIcon size={16} className="text-primary" />
								<span className="font-semibold text-sm">Edit CV</span>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
							>
								<XIcon size={16} />
							</button>
						</div>

						{/* Section tab strip */}
						<div className="shrink-0 overflow-x-auto border-b">
							<div className="flex gap-0.5 p-2">
								{leftSidebarSections.map((section) => {
									const sectionStatus = revampSections[section]?.status;
									const processing = sectionStatus === "working" || sectionStatus === "thinking";
									return (
										<button
											key={section}
											type="button"
											title={getSectionTitle(section)}
											onClick={() => handleTabClick(section)}
											className={cn(
												"relative flex shrink-0 flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 font-medium text-[10px] transition-colors",
												section === activeSection
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground hover:bg-muted hover:text-foreground",
											)}
										>
											{getSectionIcon(section, { size: 14 })}
											{processing && (
												<span className="absolute top-0.5 right-0.5 size-1.5 animate-pulse rounded-full bg-primary" />
											)}
										</button>
									);
								})}
							</div>
						</div>

						{/* All section editors — scrollable */}
						<ScrollArea ref={scrollAreaRef} className="@container flex-1">
							<div className="space-y-4 p-4 pb-20">
								{leftSidebarSections.map((section) => (
									<Fragment key={section}>
										<div data-section={section}>{getSectionComponent(section)}</div>
										<Separator />
									</Fragment>
								))}
							</div>
						</ScrollArea>
					</m.div>
				</>
			)}
		</AnimatePresence>
	);
}

/**
 * Rough heuristic: maps a click's Y fraction (0–1) on the PDF artboard
 * to the most likely section. Used to auto-jump to a section when user
 * clicks on the canvas preview.
 */
export function sectionFromYFraction(y: number): LeftSidebarSection {
	if (y < 0.12) return "picture";
	if (y < 0.18) return "basics";
	if (y < 0.24) return "summary";
	if (y < 0.48) return "experience";
	if (y < 0.62) return "education";
	if (y < 0.72) return "skills";
	if (y < 0.8) return "projects";
	if (y < 0.87) return "languages";
	return "certifications";
}
