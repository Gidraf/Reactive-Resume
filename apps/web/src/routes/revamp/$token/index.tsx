import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/revamp/$token/")({
	component: lazyRouteComponent(() => import("./-components/revamp-page"), "RevampPage"),
	head: () => ({
		meta: [{ title: "CV Revamp — Live Progress | CVpap" }],
	}),
});
