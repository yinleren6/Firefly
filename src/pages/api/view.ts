import type { APIRoute } from "astro";
export const prerender = false;

const BOT_PATTERN =
	/bot|crawl|spider|scraper|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot/i;

// 内存限流：每 IP 每路径 30 秒内最多 10 次 POST
const rateMap = new Map<string, { count: number; reset: number }>();
const RL_MAX = 10;
const RL_WIN = 30_000;

function checkRateLimit(ip: string, path: string): boolean {
	const key = ip + ":" + path;
	const now = Date.now();
	const entry = rateMap.get(key);
	if (!entry || now > entry.reset) {
		rateMap.set(key, { count: 1, reset: now + RL_WIN });
		return true;
	}
	entry.count++;
	return entry.count <= RL_MAX;
}

async function getDb(): Promise<D1Database | null> {
	try {
		const { env } = await import("cloudflare:workers");
		return (env.DB as D1Database) ?? null;
	} catch {
		return null;
	}
}

export const POST: APIRoute = async ({ request }) => {
	try {
		const ip = request.headers.get("CF-Connecting-IP") || "";
		const { path, uid } = await request.json();
		if (!path || typeof path !== "string") {
			return Response.json({ error: "path is required" }, { status: 400 });
		}
		if (!checkRateLimit(ip, path)) {
			return Response.json({ error: "Too Many Requests" }, { status: 429 });
		}

		const db = await getDb();
		if (!db)
			return Response.json({ error: "DB not available" }, { status: 500 });

		const ua = request.headers.get("User-Agent") || "";
		const referrer = request.headers.get("Referer") || "";
		const isCrawler = BOT_PATTERN.test(ua) ? 1 : 0;

		await db
			.prepare(
				"INSERT INTO pageviews(path, post_uid, ip, referrer, is_crawler) VALUES(?, ?, ?, ?, ?)",
			)
			.bind(path, uid || "", ip, referrer, isCrawler)
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
						"SELECT COUNT(DISTINCT ip) as count FROM pageviews WHERE is_crawler = 0 AND ip != ''",
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
					"SELECT COUNT(DISTINCT ip) as count FROM pageviews WHERE path = ? AND is_crawler = 0 AND ip != ''",
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
