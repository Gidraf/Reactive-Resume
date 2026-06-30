import { CheckCircleIcon, CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/libs/auth/client";

const CVPAP_API = (import.meta.env.VITE_CVPAP_API_URL as string | undefined) ?? "";

type Stage = "loading" | "signing-in" | "redirecting" | "error";

type RRCreds = {
	email: string;
	password: string;
	reactive_resume_id: string;
	revamp_token: string;
	payment_status?: string;
};

export function RevampLoginPage() {
	const { token } = useParams({ from: "/revamp/login/$token/" });
	const navigate = useNavigate();
	const [stage, setStage] = useState<Stage>("loading");
	const [errorMsg, setErrorMsg] = useState("");
	const ranRef = useRef(false);

	useEffect(() => {
		if (ranRef.current) return;
		ranRef.current = true;

		void (async () => {
			try {
				// 1. Fetch RR credentials from CVPAP
				setStage("loading");
				const credsRes = await fetch(`${CVPAP_API}/api/v1/revamp/rr-creds/${token}`);
				if (!credsRes.ok) {
					const body = (await credsRes.json().catch(() => ({}))) as { error?: string };
					throw new Error(body.error ?? `Failed to load credentials (${credsRes.status})`);
				}
				const creds = (await credsRes.json()) as RRCreds;

				if (!creds.email || !creds.password) {
					throw new Error("Invalid credentials returned from server");
				}

				// 2. Sign in to Reactive Resume via Better-Auth
				setStage("signing-in");
				const { error } = await authClient.signIn.email({
					email: creds.email,
					password: creds.password,
				});

				if (error) {
					// Try sign-up first (account might not exist yet), then retry sign-in
					const { error: signUpError } = await authClient.signUp.email({
						email: creds.email,
						password: creds.password,
						name: "CV User",
					});

					if (signUpError) {
						// Sign-up failed too — throw original sign-in error
						throw new Error(error.message ?? "Authentication failed");
					}

					// Registered — now sign in
					const retry = await authClient.signIn.email({
						email: creds.email,
						password: creds.password,
					});
					if (retry.error) throw new Error(retry.error.message ?? "Sign-in failed after registration");
				}

				// 3. Redirect: unpaid CVs go to the revamp page (has watermark + payment UI).
				//    Paid CVs with a builder ID go directly to the builder.
				setStage("redirecting");
				const isPaid = creds.payment_status === "paid";
				const destination =
					isPaid && creds.reactive_resume_id
						? `/builder/${creds.reactive_resume_id}?revamp=${creds.revamp_token}`
						: `/revamp/${creds.revamp_token}/`;

				// Small delay so the browser can complete the cookie write
				await new Promise((r) => setTimeout(r, 300));
				void navigate({ to: destination as never, replace: true });
			} catch (e) {
				setErrorMsg(e instanceof Error ? e.message : "An unexpected error occurred");
				setStage("error");
			}
		})();
	}, [token, navigate]);

	return (
		<div className="flex h-svh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
			{stage === "loading" && (
				<>
					<CircleNotchIcon size={40} className="animate-spin text-primary" />
					<p className="font-medium text-lg">Loading your CV…</p>
					<p className="text-muted-foreground text-sm">Please wait a moment.</p>
				</>
			)}

			{stage === "signing-in" && (
				<>
					<CircleNotchIcon size={40} className="animate-spin text-primary" />
					<p className="font-medium text-lg">Signing you in…</p>
					<p className="text-muted-foreground text-sm">Setting up your builder access.</p>
				</>
			)}

			{stage === "redirecting" && (
				<>
					<CheckCircleIcon size={40} className="text-green-500" />
					<p className="font-medium text-lg">Signed in!</p>
					<p className="text-muted-foreground text-sm">Opening your CV builder…</p>
				</>
			)}

			{stage === "error" && (
				<>
					<WarningCircleIcon size={40} className="text-destructive" />
					<p className="font-medium text-lg">Something went wrong</p>
					<p className="max-w-xs text-muted-foreground text-sm">{errorMsg}</p>
					<button
						type="button"
						className="mt-2 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
						onClick={() => {
							ranRef.current = false;
							setStage("loading");
							setErrorMsg("");
						}}
					>
						Try again
					</button>
				</>
			)}
		</div>
	);
}
