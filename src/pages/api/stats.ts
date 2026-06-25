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

		if (type === "daily") {
			const rows = await db
				.prepare(
					"SELECT DATE(created_at) as date, COUNT(*) as count, COUNT(DISTINCT ip_hash) as uv FROM pageviews WHERE is_crawler = 0" +
						dateFilter +
						" GROUP BY DATE(created_at) ORDER BY date ASC",
				)
				.bind(...dateBind)
				.all<{ date: string; count: number; uv: number }>();
			return Response.json(rows.results ?? []);
		}

		if (type === "top") {
			const rows = await db
				.prepare(
					"SELECT path, COUNT(*) as count FROM pageviews WHERE is_crawler = 0" +
						dateFilter +
						" GROUP BY path ORDER BY count DESC LIMIT 50",
				)
				.bind(...dateBind)
				.all<{ path: string; count: number }>();
			// Group non-post paths, filter garbage
			const posts: { path: string; count: number }[] = [];
			let otherCount = 0;
			for (const r of rows.results ?? []) {
				if (
					r.path === "/posts/{canonicalSlug}/" ||
					r.path.includes("{canonicalSlug}")
				)
					continue;
				if (r.path.startsWith("/posts/")) {
					posts.push(r);
				} else {
					otherCount += r.count;
				}
			}
			posts.sort((a, b) => b.count - a.count);
			const result = posts.slice(0, 10);
			if (otherCount > 0)
				result.push({ path: "/其他页面/", count: otherCount });
			return Response.json(result);
		}

		if (type === "referrer") {
			const rows = await db
				.prepare(
					"SELECT referrer, COUNT(*) as count FROM pageviews WHERE is_crawler = 0 AND referrer != ''" +
						dateFilter +
						" GROUP BY referrer ORDER BY count DESC LIMIT 50",
				)
				.bind(...dateBind)
				.all<{ referrer: string; count: number }>();
			// Group by domain
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
			const sorted = [...domainMap.entries()]
				.map(([domain, count]) => ({ domain, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);
			return Response.json(sorted);
		}

		return Response.json({ error: "unknown type" }, { status: 400 });
	} catch (e) {
		return Response.json({ error: String(e) }, { status: 500 });
	}
};
