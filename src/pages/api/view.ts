import type { APIRoute } from "astro";
export const prerender = false;

const BOT_PATTERN =
	/bot|crawl|spider|scraper|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot/i;

async function getDb(): Promise<D1Database | null> {
	try {
		const { env } = await import("cloudflare:workers");
		return (env.DB as D1Database) ?? null;
	} catch {
		return null;
	}
}

async function hashIp(ip: string): Promise<string> {
	const buf = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(ip),
	);
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")
		.slice(0, 16);
}

export const POST: APIRoute = async ({ request }) => {
	try {
		const db = await getDb();
		if (!db)
			return Response.json({ error: "DB not available" }, { status: 500 });

		const { path } = await request.json();
		if (!path || typeof path !== "string") {
			return Response.json({ error: "path is required" }, { status: 400 });
		}

		const ip = request.headers.get("CF-Connecting-IP") || "";
		const ua = request.headers.get("User-Agent") || "";
		const referrer = request.headers.get("Referer") || "";
		const isCrawler = BOT_PATTERN.test(ua) ? 1 : 0;
		const ipHash = ip ? await hashIp(ip) : "";

		await db
			.prepare(
				"INSERT INTO pageviews(path, ip_hash, referrer, is_crawler) VALUES(?, ?, ?, ?)",
			)
			.bind(path, ipHash, referrer, isCrawler)
			.run();

		const result = await db
			.prepare(
				"SELECT COUNT(*) as count FROM pageviews WHERE path = ? AND is_crawler = 0",
			)
			.bind(path)
			.first<{ count: number }>();

		return Response.json({ count: result?.count ?? 0 });
	} catch (e) {
		return Response.json({ error: String(e) }, { status: 500 });
	}
};

export const GET: APIRoute = async ({ url }) => {
	try {
		const db = await getDb();
		if (!db)
			return Response.json({ error: "DB not available" }, { status: 500 });

		const path = url.searchParams.get("path");

		if (!path) {
			const [total, unique] = await Promise.all([
				db
					.prepare(
						"SELECT COUNT(*) as total FROM pageviews WHERE is_crawler = 0",
					)
					.first<{ total: number }>(),
				db
					.prepare(
						"SELECT COUNT(DISTINCT ip_hash) as count FROM pageviews WHERE is_crawler = 0 AND ip_hash != ''",
					)
					.first<{ count: number }>(),
			]);
			return Response.json({
				total: total?.total ?? 0,
				uv: unique?.count ?? 0,
			});
		}

		const [pvResult, uvResult] = await Promise.all([
			db
				.prepare(
					"SELECT COUNT(*) as count FROM pageviews WHERE path = ? AND is_crawler = 0",
				)
				.bind(path)
				.first<{ count: number }>(),
			db
				.prepare(
					"SELECT COUNT(DISTINCT ip_hash) as count FROM pageviews WHERE path = ? AND is_crawler = 0 AND ip_hash != ''",
				)
				.bind(path)
				.first<{ count: number }>(),
		]);

		return Response.json({
			count: pvResult?.count ?? 0,
			uv: uvResult?.count ?? 0,
		});
	} catch (e) {
		return Response.json({ error: String(e) }, { status: 500 });
	}
};
