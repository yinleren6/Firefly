import type { APIRoute } from "astro";
export const prerender = false;

async function getDb(): Promise<D1Database | null> {
	try {
		const { env } = await import("cloudflare:workers");
		return (env.DB as D1Database) ?? null;
	} catch {
		return null;
	}
}

async function getKv(): Promise<KVNamespace | null> {
	try {
		const { env } = await import("cloudflare:workers");
		return (env.SESSION as KVNamespace) ?? null;
	} catch {
		return null;
	}
}

const CACHE_TTL = 3600; // 1 小时，每天最多 24 次写入

export const GET: APIRoute = async ({ url }) => {
	try {
		const db = await getDb();
		if (!db)
			return Response.json({ error: "DB not available" }, { status: 500 });

		const type = url.searchParams.get("type") || "daily";
		const days = parseInt(url.searchParams.get("days") || "30");
		const dateFilter =
			days > 0 ? " AND created_at >= DATE('now', ? || ' days')" : "";
		const dateBind = days > 0 ? [`-${days}`] : [];

		// KV 读缓存
		const kv = await getKv();
		const cacheKey = `stats:${type}:${days}`;
		if (kv) {
			try {
				const cached = await kv.get(cacheKey);
				if (cached) return Response.json(JSON.parse(cached));
			} catch {
				/* miss */
			}
		}

		let result: unknown;

		if (type === "daily") {
			const rows = await db
				.prepare(
					"SELECT DATE(created_at) as date, COUNT(*) as count, COUNT(DISTINCT ip_hash) as uv FROM pageviews WHERE is_crawler = 0" +
						dateFilter +
						" GROUP BY DATE(created_at) ORDER BY date ASC",
				)
				.bind(...dateBind)
				.all<{ date: string; count: number; uv: number }>();
			result = rows.results ?? [];
		} else if (type === "top") {
			const rows = await db
				.prepare(
					"SELECT path, post_uid, COUNT(*) as count FROM pageviews WHERE is_crawler = 0" +
						dateFilter +
						" GROUP BY path, post_uid ORDER BY count DESC LIMIT 100",
				)
				.bind(...dateBind)
				.all<{ path: string; post_uid: string; count: number }>();
			const uidMap = new Map<string, { path: string; count: number }>();
			for (const r of rows.results ?? []) {
				const key = r.post_uid || r.path;
				if (uidMap.has(key)) {
					uidMap.get(key)!.count += r.count;
				} else {
					uidMap.set(key, { path: r.path, count: r.count });
				}
			}
			const merged = [...uidMap.values()];
			const posts: { path: string; count: number }[] = [];
			let otherCount = 0;
			for (const r of merged) {
				if (
					r.path === "/posts/{canonicalSlug}/" ||
					r.path.includes("{canonicalSlug}")
				)
					continue;
				if (r.path === "/" || r.path === "/posts/" || r.path === "/post/")
					continue;
				if (r.path.startsWith("/posts/")) {
					posts.push(r);
				} else {
					otherCount += r.count;
				}
			}
			posts.sort((a, b) => b.count - a.count);
			const sliced = posts.slice(0, 10);
			if (otherCount > 0)
				sliced.push({ path: "/其他页面/", count: otherCount });
			result = sliced;
		} else if (type === "referrer") {
			const rows = await db
				.prepare(
					"SELECT referrer, COUNT(*) as count FROM pageviews WHERE is_crawler = 0 AND referrer != ''" +
						dateFilter +
						" GROUP BY referrer ORDER BY count DESC LIMIT 50",
				)
				.bind(...dateBind)
				.all<{ referrer: string; count: number }>();
			const domainMap = new Map<string, number>();
			for (const r of rows.results ?? []) {
				try {
					const hostname = new URL(r.referrer).hostname.replace(/^www\./, "");
					domainMap.set(hostname, (domainMap.get(hostname) || 0) + r.count);
				} catch {
					const raw = r.referrer
						.replace(/^https?:\/\//, "")
						.split("/")[0]
						.replace(/^www\./, "");
					if (raw) domainMap.set(raw, (domainMap.get(raw) || 0) + r.count);
				}
			}
			result = [...domainMap.entries()]
				.map(([domain, count]) => ({ domain, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);
		} else {
			return Response.json({ error: "unknown type" }, { status: 400 });
		}

		// 写缓存（1 小时 TTL）
		if (kv) {
			kv.put(cacheKey, JSON.stringify(result), {
				expirationTtl: CACHE_TTL,
			}).catch(() => {});
		}

		return Response.json(result);
	} catch (e) {
		return Response.json({ error: String(e) }, { status: 500 });
	}
};
