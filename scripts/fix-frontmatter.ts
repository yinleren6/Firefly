// 统一 frontmatter 格式：空字段 → ""，布尔值确保 true/false，uid 加引号
import fs from "fs";
import { glob } from "glob";

const FIELDS_TO_QUOTE = [
	"image",
	"description",
	"lang",
	"author",
	"sourceLink",
	"licenseName",
	"licenseUrl",
	"password",
	"passwordHint",
	"category",
	"alias",
];

async function main() {
	const files = await glob("src/content/posts/**/*.{md,mdx}");
	let fixed = 0;

	for (const file of files) {
		let content = fs.readFileSync(file, "utf8");
		const fm = content.match(/^---\n([\s\S]*?)\n---/);
		if (!fm) continue;

		let raw = fm[1];
		let changed = false;

		for (const field of FIELDS_TO_QUOTE) {
			// field: (空或null) → field: ""
			const regex = new RegExp(`^${field}:\\s*(null|~)?\\s*$`, "m");
			if (regex.test(raw)) {
				raw = raw.replace(regex, `${field}: ""`);
				changed = true;
			}
		}

		// uid 没加引号 → 加引号（YAML 会把 unquoted 值解析为其他类型）
		const uidLine = raw.match(/^uid:\s*(\S+)\s*$/m);
		if (uidLine) {
			const val = uidLine[1];
			const isQuoted = val.startsWith('"') || val.startsWith("'");
			if (!isQuoted && val !== "") {
				raw = raw.replace(/^uid:\s*\S+\s*$/m, `uid: "${val}"`);
				changed = true;
			}
		}

		if (changed) {
			content = content.replace(fm[1], raw);
			fs.writeFileSync(file, content, "utf8");
			fixed++;
		}
	}

	console.log(`Fixed ${fixed} file(s)`);
}

main().catch(console.error);
