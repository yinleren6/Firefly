import fs from "fs";
import { glob } from "glob";
import path from "path";

interface PostMap {
	slug: string;
	uid: string;
}

async function main() {
	const files = await glob("src/content/posts/**/*.{md,mdx}");
	const posts: PostMap[] = [];

	for (const file of files) {
		const content = fs.readFileSync(file, "utf8");
		const uidMatch = content.match(/^uid:\s*(\S+)/m);
		if (!uidMatch) continue;

		const relPath = path.relative("src/content/posts", file);
		const slug = relPath.replace(/\.(md|mdx)$/, "").replace(/\\/g, "/");
		posts.push({ slug, uid: uidMatch[1] });
	}

	const lines: string[] = [];
	lines.push("ALTER TABLE pageviews ADD COLUMN post_uid TEXT;\n");

	for (const p of posts) {
		const encodedSlug = encodeURI(p.slug);
		// 精确匹配（用原始路径）
		lines.push(
			`UPDATE pageviews SET post_uid = '${p.uid}' WHERE path = '/posts/${p.slug}/' AND (post_uid IS NULL OR post_uid = '');`,
		);
		// 大小写不敏感匹配
		lines.push(
			`UPDATE pageviews SET post_uid = '${p.uid}' WHERE LOWER(path) = LOWER('/posts/${p.slug}/') AND (post_uid IS NULL OR post_uid = '');`,
		);
		// 没有 /posts/ 前缀的路径
		lines.push(
			`UPDATE pageviews SET post_uid = '${p.uid}' WHERE LOWER(path) = LOWER('/${p.slug}/') AND (post_uid IS NULL OR post_uid = '');`,
		);
	}

	const outPath = "scripts/_migrate-stats.sql";
	fs.writeFileSync(outPath, lines.join("\n"), "utf8");
	console.log(`Written to ${outPath}`);
}

main().catch(console.error);
