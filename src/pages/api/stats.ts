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
		const kv = await getKv();

		const type = url.searchParams.get("type") || "daily";
		const days = parseInt(url.searchParams.get("days") || "30");
		const date = url.searchParams.get("date") || "";
		const useExactDate = type !== "daily" && date;
		const now = new Date(Date.now() + 8 * 3600000);
		const todayStr = now.toISOString().slice(0, 10);
		const startDate = new Date(now.getTime() - days * 86400000)
			.toISOString()
			.slice(0, 10);
		const dateFilter = useExactDate
			? " AND DATE(created_at) = ?"
			: days > 0
				? " AND created_at >= ?"
				: "";
		const dateBind = useExactDate ? [date] : days > 0 ? [startDate] : [];

		let result: unknown;

		if (type === "daily") {
			if (kv && days > 0) {
				// 生成范围内的所有日期
				const dateList: string[] = [];
				const d = new Date(startDate);
				while (d <= now) {
					dateList.push(d.toISOString().slice(0, 10));
					d.setDate(d.getDate() + 1);
				}

				// 逐日读取 KV 缓存（并行）
				const kvEntries = await Promise.all(
					dateList.map((dateStr) =>
						kv
							.get(`stats:d:${dateStr}`)
							.then((cached) =>
								cached ? (JSON.parse(cached) as { date: string; count: number; uv: number }) : null,
							)
							.catch(() => null),
					),
				);

				// 全部命中 → 直接返回
				if (kvEntries.every((e) => e !== null)) {
					result = kvEntries as { date: string; count: number; uv: number }[];
				} else {
					// 有缺失 → 回退 D1 全量查询
					const rows = await db
						.prepare(
							"SELECT DATE(created_at) as date, COUNT(*) as count, COUNT(DISTINCT ip) as uv FROM pageviews WHERE is_crawler = 0" +
								dateFilter +
								" GROUP BY DATE(created_at) ORDER BY date ASC",
						)
						.bind(...dateBind)
						.all<{ date: string; count: number; uv: number }>();
					result = rows.results ?? [];
					// 逐日回写 KV（不含今天）
					for (const row of rows.results ?? []) {
						if (row.date !== todayStr) {
							await kv
								.put(`stats:d:${row.date}`, JSON.stringify(row), {
									expirationTtl: 86400,
								})
								.catch(() => {});
						}
					}
				}
			} else {
				const rows = await db
					.prepare(
						"SELECT DATE(created_at) as date, COUNT(*) as count, COUNT(DISTINCT ip) as uv FROM pageviews WHERE is_crawler = 0" +
							dateFilter +
							" GROUP BY DATE(created_at) ORDER BY date ASC",
					)
					.bind(...dateBind)
					.all<{ date: string; count: number; uv: number }>();
				result = rows.results ?? [];
			}
		} else if (type === "top") {
			if (kv) {
				const cached =
					date && date !== todayStr
						? await kv.get(`stats:top:${days}:${date}`).catch(() => null)
						: null;
				if (cached) {
					result = JSON.parse(cached);
				}
			}
			if (!result) {
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
					if (uidMap.has(key)) uidMap.get(key)!.count += r.count;
					else uidMap.set(key, { path: r.path, count: r.count });
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
					if (r.path.startsWith("/posts/")) posts.push(r);
					else otherCount += r.count;
				}
				posts.sort((a, b) => b.count - a.count);
				const sliced = posts.slice(0, 10);
				if (otherCount > 0)
					sliced.push({ path: "/其他页面/", count: otherCount });
				result = sliced;
				if (kv && result)
					await kv
						.put(
							date && date !== todayStr
								? `stats:top:${days}:${date}`
								: `stats:top:${days}`,
							JSON.stringify(result),
							{ expirationTtl: 3600 },
						)
						.catch(() => {});
			}
		} else if (type === "daily-top") {
			const rows = await db
				.prepare(
					"SELECT path, post_uid, COUNT(*) as count FROM pageviews WHERE is_crawler = 0 AND created_at >= ? GROUP BY path, post_uid ORDER BY count DESC LIMIT 20",
				)
				.bind(todayStr)
				.all<{ path: string; post_uid: string; count: number }>();
			const uidMap = new Map<string, { path: string; count: number }>();
			for (const r of rows.results ?? []) {
				const key = r.post_uid || r.path;
				if (uidMap.has(key)) uidMap.get(key)!.count += r.count;
				else uidMap.set(key, { path: r.path, count: r.count });
			}
			result = [...uidMap.values()]
				.filter(
					(r) =>
						r.path.startsWith("/posts/") &&
						!r.path.includes("{canonicalSlug}") &&
						r.path !== "/posts/",
				)
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);
		} else if (type === "referrer") {
			if (kv) {
				const cached =
					date && date !== todayStr
						? await kv.get(`stats:ref:${days}:${date}`).catch(() => null)
						: null;
				if (cached) {
					result = JSON.parse(cached);
				}
			}
			if (!result) {
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
				if (kv && result)
					await kv
						.put(
							date && date !== todayStr
								? `stats:ref:${days}:${date}`
								: `stats:ref:${days}`,
							JSON.stringify(result),
							{ expirationTtl: 3600 },
						)
						.catch(() => {});
			}
		} else {
			return Response.json({ error: "unknown type" }, { status: 400 });
		}

		return Response.json(result);
	} catch (e) {
		return Response.json({ error: String(e) }, { status: 500 });
	}
};
