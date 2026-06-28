import { glob } from "glob";
import fs from "fs/promises";
import path from "path";

const POSTS_DIR = "src/content/posts";
const IMAGE_DIRS = [
	"src/content/posts/image",
	"src/content/posts/images",
	"public/images",
];

// 从 markdown 中提取所有图片引用路径
function extractImageRefs(content: string, filePath: string): Set<string> {
	const refs = new Set<string>();
	const mdDir = path.dirname(filePath);

	// 匹配 ![](path) 和 ![](path "title")
	const mdImgRegex = /!\[.*?\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g;
	let match: RegExpExecArray | null;
	while ((match = mdImgRegex.exec(content)) !== null) {
		let imgPath = match[1];

		if (imgPath.startsWith("/")) {
			// 绝对路径 /images/xxx → public/images/xxx
			refs.add(path.resolve("public", imgPath.slice(1)));
		} else if (imgPath.startsWith("./") || imgPath.startsWith("../")) {
			// 相对路径 → 相对于 .md 文件目录
			refs.add(path.resolve(mdDir, imgPath));
		}
		// data:uri 等忽略
	}

	return refs;
}

async function main() {
	// 1. 收集所有 markdown 文件中的图片引用
	const mdFiles = await glob(`${POSTS_DIR}/**/*.md`);
	const referencedPaths = new Set<string>();

	for (const mdFile of mdFiles) {
		const content = await fs.readFile(mdFile, "utf-8");
		const refs = extractImageRefs(content, mdFile);
		for (const ref of refs) {
			referencedPaths.add(ref);
		}
	}

	console.log(`Scanning ${mdFiles.length} markdown files...`);
	console.log(`Found ${referencedPaths.size} unique image references.\n`);

	// 2. 扫描图片目录中的所有文件
	const allImageFiles = await glob(
		IMAGE_DIRS.map((d) => `${d}/**/*.{png,jpg,jpeg,webp,avif,gif,svg}`),
	);

	// 3. 找出未被引用的图片
	const orphanFiles: string[] = [];
	for (const file of allImageFiles) {
		const absPath = path.resolve(file);
		if (!referencedPaths.has(absPath)) {
			orphanFiles.push(file);
		}
	}

	if (orphanFiles.length === 0) {
		console.log("No orphan images found. Clean! ✨");
		return;
	}

	console.log(`Found ${orphanFiles.length} orphan image(s):\n`);
	for (const file of orphanFiles.sort()) {
		console.log(`  ${file}`);
	}

	console.log("\n---");
	console.log(`To delete them, run: pnpm find-orphan-images --delete`);

	// 4. 可选：删除
	if (process.argv.includes("--delete")) {
		for (const file of orphanFiles) {
			await fs.unlink(file);
			console.log(`Deleted: ${file}`);
		}
		console.log(`\nDeleted ${orphanFiles.length} file(s).`);
	}
}

main().catch(console.error);
