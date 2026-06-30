/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * API 请求按钮
 * ::api{url="https://..." label="查询"}
 *
 * 响应含 url/filename 时自动显示下载界面，否则显示原始 JSON。
 * 下载按钮使用去掉了 ?format=json 的原始 URL（302 直链下载）。
 */
export function ApiButtonComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("api" directive must be leaf type ::api{url="..."})',
		]);

	const apiUrl = properties.url || "";
	const label = properties.label || "发送请求";

	if (!apiUrl)
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
				"overflow-auto p-6 text-sm font-mono leading-relaxed whitespace-pre-wrap break-all m-0 hidden",
		},
		"",
	);

	const dlCard = h(
		`div#${id}-dl`,
		{ class: "p-6 flex flex-col items-center gap-4 hidden" },
		[
			h("div", { class: "flex items-center gap-3 w-full pb-4 border-b border-(--border)" }, [
				h("div", { class: "w-10 h-10 rounded-lg bg-(--primary)/10 flex items-center justify-center shrink-0" }, [
					h("span", { class: "text-xl" }, "\u{1F4E6}"),
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

	const loadingEl = h(
		`div#${id}-loading`,
		{ class: "p-6 text-center text-sm text-neutral-500" },
		"正在请求...",
	);

	const modalBody = h("div", { class: "overflow-auto" }, [loadingEl, rawPre, dlCard]);

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

	const script = h(`script#${id}-script`, { type: "text/javascript" }, `(function(){
const b=document.getElementById("${id}-btn");
const o=document.getElementById("${id}-overlay");
const l=document.getElementById("${id}-loading");
const r=document.getElementById("${id}-raw");
const d=document.getElementById("${id}-dl");
const f=document.getElementById("${id}-filename");
const a=document.getElementById("${id}-dllink");
const c=document.getElementById("${id}-close");
const u=${JSON.stringify(apiUrl)};
const du=u.replace(/[?&]format=json/g,"");
b.addEventListener("click",function(){
	b.disabled=true;b.textContent="请求中...";
	o.classList.remove("hidden");
	l.classList.remove("hidden");r.classList.add("hidden");d.classList.add("hidden");
	fetch(u,{headers:{"Accept":"application/json"}})
	.then(async res=>{
		const txt=await res.text();
		let data;try{data=JSON.parse(txt)}catch{}
		if(data&&data.url){
			l.classList.add("hidden");r.classList.add("hidden");d.classList.remove("hidden");
			f.textContent=data.filename||"download";
			a.href=du;
		}else{
			l.classList.add("hidden");r.classList.remove("hidden");d.classList.add("hidden");
			try{r.textContent=JSON.stringify(JSON.parse(txt),null,2)}catch{r.textContent=txt}
		}
	})
	.catch(err=>{l.classList.add("hidden");r.classList.remove("hidden");d.classList.add("hidden");r.textContent="请求失败:\\n"+err.message})
	.finally(()=>{b.disabled=false;b.textContent="${label}"});
});
c.addEventListener("click",function(){o.classList.add("hidden")});
o.addEventListener("click",function(e){if(e.target===this)o.classList.add("hidden")});
})();`);

	return h("div", { class: "my-4" }, [btn, overlay, script]);
}
