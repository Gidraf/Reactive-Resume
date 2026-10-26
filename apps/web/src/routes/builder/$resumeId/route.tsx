import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import z from "zod";
import { EditorShell } from "./-components/editor-shell";
import { useRevampStream } from "./-hooks/use-revamp-stream";
import { useBuilderResumeUpdateSubscription, useResumeCleanup, useResumeStore } from "@/features/resume/builder/draft";
import { EDITOR_MODES } from "@/features/resume/editor/store";
import { orpc } from "@/libs/orpc/client";
import { createNoindexFollowMeta } from "@/libs/seo";

const searchSchema = z.object({
	// Write is the default and stays out of the URL.
	mode: z.enum(EDITOR_MODES).optional().catch(undefined),
	// Opens History on this version, read-only; Applications' "Open" on what was sent links here.
	version: z.string().optional().catch(undefined),
	// Opens the assistant on a conversation ("new" for a fresh one).
	assistant: z.string().optional().catch(undefined),
	// Fills the assistant's composer. Never sent without the user pressing Send: anyone can make a link.
	ask: z.string().max(2_000).optional().catch(undefined),
	// Prepare for next step keeps the application clicked, even when a base resume serves several jobs.
	applicationId: z.string().optional().catch(undefined),
	// The file a resume was just imported from; Write says what came in until it's dismissed.
	imported: z.string().max(255).optional().catch(undefined),
	// CVpap: a WhatsApp revamp token; the builder streams that revamp's progress onto the page.
	revamp: z.string().optional().catch(undefined),
});

const CVPAP_API = (import.meta.env.VITE_CVPAP_API_URL as string | undefined) ?? "";

export const Route = createFileRoute("/builder/$resumeId")({
	component: RouteComponent,
	validateSearch: searchSchema,
	beforeLoad: async ({ context, location, search }) => {
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
		if (!context.session) throw redirect({ to: "/auth/login", search: { callbackURL: location.href }, replace: true });
		return { session: context.session };
	},
	loader: async ({ params, context }) => {
		// The page canvas and the preview are chunks of their own, otherwise fetched one after another only once the editor
		// has rendered: start them with the resume, so the first page can draw as soon as its PDF is ready.
		void import("./-components/page-canvas");
		void import("@/features/resume/preview/preview.browser");

		const resume = await context.queryClient.ensureQueryData(
			orpc.resume.getById.queryOptions({ input: { id: params.resumeId } }),
		);

		return { name: resume.name };
	},
	head: ({ loaderData }) => ({
		meta: loaderData
			? [{ title: `${loaderData.name} - CVpap` }, createNoindexFollowMeta()]
			: [createNoindexFollowMeta()],
	}),
});

function RouteComponent() {
	const { resumeId } = Route.useParams();
	const { revamp: revampToken } = Route.useSearch();

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

	return <EditorShell />;
}
