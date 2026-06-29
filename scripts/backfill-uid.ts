import fs from "fs";
import path from "path";
import crypto from "crypto";
import { glob } from "glob";

async function main() {
	const files = await glob("src/content/posts/**/*.{md,mdx}");
	let updated = 0;

	for (const file of files) {
		let content = fs.readFileSync(file, "utf8");

		// 已有 uid 则跳过
		if (/^uid:/m.test(content)) continue;

		// 确保有 frontmatter
		const match = content.match(/^---\n([\s\S]*?)\n---/);
		if (!match) continue;

		const uid = crypto.randomUUID();
		// 在 frontmatter 末尾（第二个 --- 前）插入 uid
		content = content.replace(
			/^---\n([\s\S]*?)\n---/,
			`---\n$1\nuid: ${uid}\n---`,
		);

		fs.writeFileSync(file, content, "utf8");
		updated++;
		console.log(`  + ${path.relative("src/content/posts", file)} → ${uid}`);
	}

	console.log(`\nDone. Updated ${updated} file(s).`);
}

main().catch(console.error);
