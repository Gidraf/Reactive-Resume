const CVPAP_API_URL = process.env.WORKER_URL ?? process.env.CVPAP_API_URL ?? "https://api.ajiriwa.gidraf.dev";

export async function handleCvpapProxy(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const target = `${CVPAP_API_URL}${url.pathname}${url.search}`;

	const proxyReq = new Request(target, {
		method: req.method,
		headers: req.headers,
		body: req.body,
		// @ts-expect-error — Node fetch needs this to allow streaming bodies
		duplex: "half",
	});

	try {
		return await fetch(proxyReq);
	} catch (e) {
		return new Response(JSON.stringify({ error: "CVPAP proxy error", detail: String(e) }), {
			status: 502,
			headers: { "Content-Type": "application/json" },
		});
	}
}
