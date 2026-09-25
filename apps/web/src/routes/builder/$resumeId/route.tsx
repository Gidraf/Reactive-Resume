import type { BuilderLayout } from "./-store/sidebar";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useBuilderResumeUpdateSubscription, useResumeCleanup, useResumeStore } from "@/features/resume/builder/draft";
import { orpc } from "@/libs/orpc/client";
import { createNoindexFollowMeta } from "@/libs/seo";
import { DesktopBuilderShell } from "./-components/desktop-builder-shell";
import { MobileBuilderShell } from "./-components/mobile-builder-shell";
import { useRevampStream } from "./-hooks/use-revamp-stream";
import { getBuilderLayout } from "./-store/sidebar";

const CVPAP_API = (import.meta.env.VITE_CVPAP_API_URL as string | undefined) ?? "";

export const Route = createFileRoute("/builder/$resumeId")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => ({
		revamp: typeof search.revamp === "string" ? search.revamp : undefined,
	}),
	beforeLoad: async ({ context, search }) => {
		// WhatsApp users land here via the builder URL but have no RR session.
		// If the revamp token is valid, redirect them to the dedicated revamp page
		// so they see live progress without needing an account.
		if (search.revamp && !context.session) {
			try {
				const res = await fetch(`${CVPAP_API}/api/v1/revamp/verify/${search.revamp}`);
				if (res.ok) {
					throw redirect({ to: "/revamp/$token/", params: { token: search.revamp }, replace: true });
				}
			} catch (e) {
				// Re-throw TanStack redirect errors; absorb network errors.
				if (e && typeof e === "object" && "to" in e) throw e;
			}
		}
		if (!context.session) throw redirect({ to: "/auth/login", replace: true });
		return { session: context.session };
	},
	loader: async ({ params, context }) => {
		const [layout, resume] = await Promise.all([
			getBuilderLayout(),
			context.queryClient.ensureQueryData(orpc.resume.getById.queryOptions({ input: { id: params.resumeId } })),
		]);

		return { layout, name: resume.name };
	},
	head: ({ loaderData }) => ({
		meta: loaderData
			? [{ title: `${loaderData.name} - CVpap` }, createNoindexFollowMeta()]
			: [createNoindexFollowMeta()],
	}),
});

function RouteComponent() {
	const { layout: initialLayout } = Route.useLoaderData();
	const { revamp: revampToken } = Route.useSearch();

	const { resumeId } = Route.useParams();

	// Mount the revamp SSE stream — no-op when revampToken is undefined
	useRevampStream(revampToken ?? null);
	const { data: resume } = useSuspenseQuery(orpc.resume.getById.queryOptions({ input: { id: resumeId } }));
	const initializeResumeStore = useResumeStore((state) => state.initialize);
	const mergeResumeMetadata = useResumeStore((state) => state.mergeResumeMetadata);
	const isReady = useResumeStore((state) => state.isReady);
	const initializedResumeId = useResumeStore((state) => state.resumeId);
	const isInitialized = isReady && initializedResumeId === resumeId;

	useResumeCleanup();
	useBuilderResumeUpdateSubscription();

	useEffect(() => {
		if (isInitialized) return;
		initializeResumeStore(resume);
	}, [initializeResumeStore, isInitialized, resume]);

	useEffect(() => {
		mergeResumeMetadata(resume);
	}, [
		mergeResumeMetadata,
		resume.id,
		resume.name,
		resume.slug,
		resume.tags,
		resume.isLocked,
		resume.isPublic,
		resume.showDownloadButtons,
		resume.hasPassword,
		resume.updatedAt,
		resume,
	]);

	if (!isInitialized) return null;

	return <BuilderLayoutShell initialLayout={initialLayout} />;
}

function BuilderLayoutShell({ initialLayout }: { initialLayout: BuilderLayout }) {
	// Single breakpoint (below `md`) switches between the desktop resizable panels and the mobile tabbed shell.
	const isMobile = useMediaQuery("(max-width: 767px)", { initializeWithValue: false });

	if (isMobile) return <MobileBuilderShell />;
	return <DesktopBuilderShell initialLayout={initialLayout} />;
}
