import type { APIRoute } from "astro";
export const prerender = false;

const API_BASE = "http://frp-dad.cn3.top:37878";
const TIMEOUT_MS = 5000;

async function getToken(): Promise<string | undefined> {
	try {
		const { env } = await import("cloudflare:workers");
		return (env.TSHOCK_TOKEN as string) || undefined;
	} catch {
		return undefined;
	}
}

export const GET: APIRoute = async () => {
	try {
		const token = await getToken();
		if (!token) {
			return Response.json({
				status: "offline",
				playercount: 0,
				maxplayers: 0,
				players: [],
			});
		}

		const [statusRes, playersRes] = await Promise.all([
			fetch(`${API_BASE}/v2/server/status?token=${token}`, {
				signal: AbortSignal.timeout(TIMEOUT_MS),
			}),
			fetch(`${API_BASE}/lists/players?token=${token}`, {
				signal: AbortSignal.timeout(TIMEOUT_MS),
			}),
		]);

		if (!statusRes.ok)
			throw new Error(`Status API returned ${statusRes.status}`);
		const data = await statusRes.json();

		let players: string[] = [];
		if (playersRes.ok) {
			const raw = await playersRes.json();
			if (typeof raw.players === "string") {
				players = raw.players
					.split(",")
					.map((s: string) => s.trim())
					.filter(Boolean);
			} else if (Array.isArray(raw.players)) {
				players = raw.players;
			}
		}

		return Response.json({
			status: "online",
			playercount: data.playercount ?? 0,
			maxplayers: data.maxplayers ?? 0,
			players,
		});
	} catch (e) {
		return Response.json({
			status: "offline",
			playercount: 0,
			maxplayers: 0,
			players: [],
			debug: { error: e instanceof Error ? e.message : String(e) },
		});
	}
};
