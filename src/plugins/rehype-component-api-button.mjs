/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * API 请求按钮（内联模式）
 * ::api{url="https://..." label="查询"}
 *
 * 点击后 fetch JSON，内联显示文件名 + 下载按钮。
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

	const result = h(`div#${id}-result`, { class: "mt-3 hidden" });

	const scriptSrc =
		"(function(){var b=document.getElementById('" +
		id +
		"-btn'),r=document.getElementById('" +
		id +
		"-result'),u=" +
		JSON.stringify(apiUrl) +
		";b.addEventListener('click',function(){if(b.disabled)return;b.disabled=true;b.textContent='获取中...';r.classList.remove('hidden');r.innerHTML='<div class=\"flex items-center gap-2 py-2\"><div class=\"w-4 h-4 border-2 border-(--primary) border-t-transparent rounded-full animate-spin\"></div><span class=\"text-sm text-neutral-500\">正在请求...</span></div>';fetch(u,{headers:{'Accept':'application/json'}}).then(async function(k){var l=await k.text(),m;try{m=JSON.parse(l)}catch(e){}var n=m&&(m.url||m.data&&m.data.url);if(n){var h='';if(m.filename){h='<div class=\"flex flex-col min-w-0 flex-1\"><span class=\"text-xs text-neutral-500\">文件名</span><span class=\"font-semibold text-sm truncate\">'+m.filename+'</span></div>'}r.innerHTML='<div class=\"flex items-center gap-3 p-3 rounded-xl bg-(--card-bg) border border-(--line-divider)\">'+h+'<a href=\"'+n+'\" target=\"_blank\" rel=\"noopener\" class=\"shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--primary) text-white dark:text-black/70 font-semibold text-sm hover:bg-(--primary)/90 transition-all no-underline\">⬇ 下载</a></div>'}else{try{r.innerHTML='<pre class=\"overflow-auto p-3 text-sm font-mono whitespace-pre-wrap break-all m-0 rounded-xl bg-(--card-bg) border border-(--line-divider) max-h-60\">'+JSON.stringify(JSON.parse(l),null,2)+'</pre>'}catch(e){r.textContent=l}}}).catch(function(){r.innerHTML='<span class=\"text-sm text-red-500\">请求失败</span>'}).finally(function(){b.disabled=false;b.textContent='" +
		label +
		"'})})})();";

	const script = h(
		`script#${id}-script`,
		{ type: "text/javascript" },
		scriptSrc,
	);

	return h("div", { class: "my-4" }, [btn, result, script]);
}
