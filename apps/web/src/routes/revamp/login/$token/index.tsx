import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/revamp/login/$token/")({
	component: lazyRouteComponent(() => import("./-components/login-page"), "RevampLoginPage"),
	head: () => ({
		meta: [{ title: "Signing you in… | CVpap" }],
	}),
});
