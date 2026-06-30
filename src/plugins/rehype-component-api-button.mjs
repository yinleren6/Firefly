/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * API 请求按钮
 * ::api{url="https://..." label="查询"}
 *
 * 响应含 url/filename 时自动显示下载界面，否则显示原始 JSON。
 */
export function ApiButtonComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("api" directive must be leaf type ::api{url="..."})',
		]);

	const url = properties.url || "";
	const label = properties.label || "发送请求";

	if (!url)
		return h(
			"div",
			{ class: "hidden" },
			'Missing URL. ("url" attribute is required)',
		);

	const id = `API${Math.random().toString(36).slice(-6)}`;

	const btn = h(
		`button#${id}-btn`,
		{
			class:
				"inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-(--primary) text-white dark:text-black/70 font-medium hover:bg-(--primary)/80 hover:scale-105 active:scale-95 transition-all cursor-pointer border-none text-sm",
		},
		label,
	);

	const rawPre = h(
		`pre#${id}-raw`,
		{
			class:
				"overflow-auto p-6 text-sm font-mono leading-relaxed whitespace-pre-wrap break-all m-0",
		},
		"点击按钮发送请求...",
	);

	const dlCard = h(
		`div#${id}-dl`,
		{ class: "p-6 flex flex-col items-center gap-4 hidden" },
		[
			h("div", { class: "flex items-center gap-3 w-full pb-4 border-b border-(--border)" }, [
				h("div", { class: "w-10 h-10 rounded-lg bg-(--primary)/10 flex items-center justify-center shrink-0" }, [
					h("span", { class: "text-xl" }, "📦"),
				]),
				h("div", { class: "flex flex-col min-w-0" }, [
					h("span", { class: "text-sm text-neutral-500" }, "文件名"),
					h(`span#${id}-filename`, { class: "font-bold text-base truncate" }, ""),
				]),
			]),
			h(
				`a#${id}-dllink`,
				{
					class:
						"inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-(--primary) text-white dark:text-black/70 font-medium hover:bg-(--primary)/80 hover:scale-105 active:scale-95 transition-all cursor-pointer text-base no-underline",
					href: "#",
					target: "_blank",
					rel: "noopener",
				},
				"⬇ 下载",
			),
		],
	);

	const modalBody = h("div", { class: "overflow-auto" }, [rawPre, dlCard]);

	const modal = h(
		`div#${id}-modal`,
		{
			class:
				"bg-(--card-bg) rounded-xl shadow-2xl max-w-lg w-[90vw] flex flex-col overflow-hidden",
		},
		[
			h("div", { class: "flex items-center justify-between px-6 py-4 border-b border-(--border)" }, [
				h("span", { class: "font-bold text-base" }, "响应结果"),
				h(
					`button#${id}-close`,
					{
						class:
							"w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--btn-plain-bg-hover) cursor-pointer border-none text-lg",
					},
					"×",
				),
			]),
			modalBody,
		],
	);

	const overlay = h(
		`div#${id}-overlay`,
		{
			class:
				"fixed inset-0 bg-black/50 z-50 flex items-center justify-center hidden",
			style: "backdrop-filter: blur(2px)",
		},
		[modal],
	);

	const script = h(`script#${id}-script`, { type: "text/javascript" }, `
(function() {
	const btn = document.getElementById("${id}-btn");
	const overlay = document.getElementById("${id}-overlay");
	const rawPre = document.getElementById("${id}-raw");
	const dlCard = document.getElementById("${id}-dl");
	const filenameEl = document.getElementById("${id}-filename");
	const dlLink = document.getElementById("${id}-dllink");
	const closeBtn = document.getElementById("${id}-close");

	btn.addEventListener("click", function() {
		btn.disabled = true;
		btn.textContent = "请求中...";
		overlay.classList.remove("hidden");
		rawPre.classList.remove("hidden");
		dlCard.classList.add("hidden");
		rawPre.textContent = "正在请求...";
		fetch(${JSON.stringify(url)}, {
			headers: { "Accept": "application/json" },
		})
			.then(async (res) => {
				const text = await res.text();
				let data;
				try { data = JSON.parse(text); } catch { data = null; }
				if (data && data.url) {
					rawPre.classList.add("hidden");
					dlCard.classList.remove("hidden");
					filenameEl.textContent = data.filename || data.url.split("/").pop() || "download";
					dlLink.href = data.url;
				} else {
					rawPre.classList.remove("hidden");
					dlCard.classList.add("hidden");
					try {
						rawPre.textContent = JSON.stringify(JSON.parse(text), null, 2);
					} catch {
						rawPre.textContent = text;
					}
				}
			})
			.catch((err) => {
				rawPre.classList.remove("hidden");
				dlCard.classList.add("hidden");
				rawPre.textContent = "请求失败:\\n" + err.message;
			})
			.finally(() => {
				btn.disabled = false;
				btn.textContent = ${JSON.stringify(label)};
			});
	});

	closeBtn.addEventListener("click", function() {
		overlay.classList.add("hidden");
	});

	overlay.addEventListener("click", function(e) {
		if (e.target === this) overlay.classList.add("hidden");
	});
})();
	`);

	return h("div", { class: "my-4" }, [btn, overlay, script]);
}
