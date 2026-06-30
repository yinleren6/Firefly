/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * API 请求按钮 ::api{url="https://..." label="查询" method="GET"}
 */
export function ApiButtonComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("api" directive must be leaf type ::api{url="..."})',
		]);

	const url = properties.url || "";
	const label = properties.label || "发送请求";
	const method = (properties.method || "GET").toUpperCase();

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

	const modalContent = h(
		`pre#${id}-content`,
		{
			class:
				"overflow-auto p-6 text-sm font-mono leading-relaxed whitespace-pre-wrap break-all m-0",
		},
		"点击按钮发送请求...",
	);

	const modal = h(
		`div#${id}-modal`,
		{
			class:
				"bg-(--card-bg) rounded-xl shadow-2xl max-w-2xl w-[90vw] max-h-[80vh] flex flex-col overflow-hidden",
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
			modalContent,
		],
	);

	const overlay = h(`div#${id}-overlay`, { class: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center hidden", style: "backdrop-filter: blur(2px)" }, [modal]);

	const script = h(`script#${id}-script`, { type: "text/javascript" }, `
(function() {
	const btn = document.getElementById("${id}-btn");
	const overlay = document.getElementById("${id}-overlay");
	const content = document.getElementById("${id}-content");
	const closeBtn = document.getElementById("${id}-close");

	btn.addEventListener("click", function() {
		btn.disabled = true;
		btn.textContent = "请求中...";
		overlay.classList.remove("hidden");
		content.textContent = "正在请求 " + ${JSON.stringify(url)} + " ...";
		fetch(${JSON.stringify(url)}, {
			method: ${JSON.stringify(method)},
			headers: { "Accept": "application/json" },
		})
			.then(async (res) => {
				const text = await res.text();
				let formatted;
				try {
					formatted = JSON.stringify(JSON.parse(text), null, 2);
				} catch {
					formatted = text;
				}
				content.textContent = formatted;
			})
			.catch((err) => {
				content.textContent = "请求失败:\\n" + err.message;
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
