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

export const GET: APIRoute = async ({ url }) => {
	try {
		const db = await getDb();
		if (!db)
			return Response.json({ error: "DB not available" }, { status: 500 });

		const type = url.searchParams.get("type") || "daily";
		const days = parseInt(url.searchParams.get("days") || "30");
		const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
		const dateFilter =
			days > 0 ? " AND created_at >= DATE('now', ? || ' days')" : "";
		const dateBind = days > 0 ? [`-${days}`] : [];

		// KV 缓存（不含 page，仅用于首页/默认页）
		const kv = await getKv();
		const cacheKey = `stats:${type}:${days}`;

		if (page === 1 && kv) {
			try {
				const cached = await kv.get(cacheKey);
				if (cached) return Response.json(JSON.parse(cached));
			} catch { /* 缓存 miss */ }
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
				if (r.path === "/posts/{canonicalSlug}/" || r.path.includes("{canonicalSlug}"))
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

			// 分页
			const pageSize = 10;
			const total = posts.length + (otherCount > 0 ? 1 : 0);
			const paged = posts.slice((page - 1) * pageSize, page * pageSize);
			if (otherCount > 0) paged.push({ path: "/其他页面/", count: otherCount });
			result = { data: paged, total, page, pageSize };
		} else if (type === "referrer") {
			const rows = await db
				.prepare(
					"SELECT referrer, COUNT(*) as count FROM pageviews WHERE is_crawler = 0 AND referrer != ''" +
						dateFilter +
						" GROUP BY referrer ORDER BY count DESC LIMIT 200",
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
						.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
					if (raw) domainMap.set(raw, (domainMap.get(raw) || 0) + r.count);
				}
			}
			const sorted = [...domainMap.entries()]
				.map(([domain, count]) => ({ domain, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 20);
			result = sorted;
		} else {
			return Response.json({ error: "unknown type" }, { status: 400 });
		}

		// 缓存 5 分钟（首页/默认页）
		if (page === 1 && kv) {
			kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 }).catch(() => {});
		}

		return Response.json(result);
	} catch (e) {
		return Response.json({ error: String(e) }, { status: 500 });
	}
};
