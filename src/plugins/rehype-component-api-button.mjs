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

	const apiUrl = properties.url || "";
	const label = properties.label || "发送请求";

	if (!apiUrl)
		return h("div", { class: "hidden" }, 'Missing URL. ("url" attribute is required)');

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
		{ class: "overflow-auto p-5 text-sm font-mono leading-relaxed whitespace-pre-wrap break-all m-0 hidden" },
		"",
	);

	const dlCard = h(
		`div#${id}-dl`,
		{ class: "p-6 flex flex-col items-center gap-5 hidden" },
		[
			h("div", { class: "flex items-center gap-3 w-full" }, [
				h("div", { class: "w-10 h-10 rounded-xl bg-(--primary)/10 flex items-center justify-center shrink-0" }, [
					h("span", { class: "text-lg" }, "\u{1F4E6}"),
				]),
				h("div", { class: "flex flex-col min-w-0" }, [
					h("span", { class: "text-xs text-neutral-500" }, "文件名"),
					h(`span#${id}-filename`, { class: "font-semibold text-sm truncate" }, ""),
				]),
			]),
			h(
				`a#${id}-dllink`,
				{
					class:
						"inline-flex w-full items-center justify-center gap-2 px-6 py-3 rounded-xl bg-(--primary) text-white dark:text-black/70 font-semibold text-sm hover:bg-(--primary)/90 hover:shadow-lg transition-all cursor-pointer no-underline",
					href: "#",
					target: "_blank",
					rel: "noopener",
				},
				"⬇ 下载",
			),
		],
	);

	const loadingEl = h(
		`div#${id}-loading`,
		{ class: "hidden" },
		h("div", { class: "flex flex-col items-center gap-3 py-10" }, [
			h("div", { class: "w-5 h-5 border-2 border-(--primary) border-t-transparent rounded-full animate-spin" }),
			h("span", { class: "text-sm text-neutral-500" }, "正在请求..."),
		]),
	);

	const modalBody = h("div", { class: "overflow-auto" }, [loadingEl, rawPre, dlCard]);

	const modal = h(
		`div#${id}-modal`,
		{ class: "relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-xl sm:rounded-2xl bg-(--card-bg) border border-(--line-divider) shadow-2xl" },
		[
			h("div", { class: "flex items-center justify-between px-5 py-3.5 border-b border-(--line-divider)" }, [
				h("span", { class: "text-sm font-semibold text-75" }, "响应结果"),
				h(
					`button#${id}-close`,
					{
						class:
							"flex h-7 w-7 items-center justify-center rounded-lg bg-(--btn-regular-bg) text-(--btn-content) hover:bg-(--btn-regular-bg-hover) active:bg-(--btn-regular-bg-active) transition-colors cursor-pointer border-none text-sm leading-none",
					},
					"✕",
				),
			]),
			modalBody,
		],
	);

	const overlay = h(
		`div#${id}-overlay`,
		{
			class: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 hidden",
		},
		[h("div", { class: "w-full max-w-md animate-api-in" }, [modal])],
	);

	const script = h(`script#${id}-script`, { type: "text/javascript" }, `(function(){
const a=document.getElementById("${id}-btn");
const b=document.getElementById("${id}-overlay");
const c=document.getElementById("${id}-loading");
const d=document.getElementById("${id}-raw");
const e=document.getElementById("${id}-dl");
const f=document.getElementById("${id}-filename");
const g=document.getElementById("${id}-dllink");
const h=document.getElementById("${id}-close");
const i=${JSON.stringify(apiUrl)};
const j=i.replace(/[?&]format=json/g,"");
a.addEventListener("click",function(){
	a.disabled=true;a.textContent="请求中...";
	b.classList.remove("hidden");
	c.classList.remove("hidden");d.classList.add("hidden");e.classList.add("hidden");
	fetch(i,{headers:{"Accept":"application/json"}})
	.then(async k=>{
		const l=await k.text();
		let m;try{m=JSON.parse(l)}catch{}
		const n=m&&(m.url||m.data?.url);
		if(n){
			c.classList.add("hidden");d.classList.add("hidden");e.classList.remove("hidden");
			f.textContent=m.filename||"download";
			g.href=n;
		}else{
			c.classList.add("hidden");d.classList.remove("hidden");e.classList.add("hidden");
			try{d.textContent=JSON.stringify(JSON.parse(l),null,2)}catch{d.textContent=l}
		}
	})
	.catch(k=>{c.classList.add("hidden");d.classList.remove("hidden");e.classList.add("hidden");d.textContent="请求失败:\\n"+k.message})
	.finally(()=>{a.disabled=false;a.textContent="${label}"});
});
h.addEventListener("click",function(){b.classList.add("hidden")});
b.addEventListener("click",function(k){if(k.target===this)b.classList.add("hidden")});
})();`);

	const style = h(`style#${id}-style`, {}, `@keyframes api-in{from{opacity:0;transform:translateY(8px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}.animate-api-in{animation:api-in .2s ease-out}`);

	return h("div", { class: "my-4" }, [btn, overlay, style]);
}
