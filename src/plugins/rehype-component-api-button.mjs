/// <reference types="mdast" />
import { h } from "hastscript";

const uid = () => Math.random().toString(36).slice(-6);

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

	const id = `API${uid()}`;
	const wid = `${id}-w`;
	const yid = `${id}-y`;
	const pid = `${id}-p`;
	const bid = `${id}-b`;

	const container = h(
		`div#${id}`,
		{ class: "flex items-center gap-3 flex-wrap" },
		[
			h(
				`button#${id}-btn`,
				{
					class:
						"inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-(--primary) text-white dark:text-black/70 font-medium hover:bg-(--primary)/80 hover:scale-105 active:scale-95 transition-all cursor-pointer border-none text-sm shrink-0",
				},
				label,
			),
		],
	);

	const s =
		`(function(){var b=document.getElementById('${id}-btn'),c=document.getElementById('${id}'),u=${JSON.stringify(apiUrl)};` +
		`b.addEventListener('click',function(){if(b._f)return;b._f=true;b.disabled=true;b.textContent='获取中...';` +
		`fetch(u,{headers:{'Accept':'application/json'}}).then(async function(k){` +
		`var l=await k.text(),m;try{m=JSON.parse(l)}catch(e){}` +
		`var n=m&&(m.url||m.data&&m.data.url);` +
		`if(n){var fn=m.filename||'download';` +
		`c.innerHTML='<span id="${wid}" class="inline-flex items-center gap-3 min-w-0 flex-1"><span class="text-sm font-semibold truncate min-w-0 max-w-48">'+fn+'</span><button id="${yid}" class="shrink-0 no-styling inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--primary) text-white dark:text-black/70 font-semibold text-sm hover:bg-(--primary)/90 transition-all cursor-pointer border-none">⬇ 下载</button></span><div id="${pid}" class="hidden w-full h-1.5 rounded-full bg-(--primary)/10 overflow-hidden"><div id="${bid}" class="h-full rounded-full bg-(--primary) transition-all duration-200" style="width:0%"></div></div>';` +
		`document.getElementById('${yid}').addEventListener('click',function(){` +
		`var Y=document.getElementById('${yid}'),P=document.getElementById('${pid}'),B=document.getElementById('${bid}');` +
		`if(Y._d)return;Y._d=true;Y.disabled=true;Y.textContent='下载中...';` +
		`fetch(n).then(async function(r){` +
		`var cl=parseInt(r.headers.get('Content-Length'))||0,re=r.body.getReader(),chunks=[],received=0;` +
		`while(true){var d=await re.read();if(d.done)break;chunks.push(d.value);received+=d.value.length;if(cl){B.style.width=Math.round(received/cl*100)+'%';P.classList.remove('hidden')}}` +
		`var blob=new Blob(chunks);` +
		`if(window.showSaveFilePicker){try{var h=await window.showSaveFilePicker({suggestedName:fn});var ws=await h.createWritable();await ws.write(blob);await ws.close();B.style.width='100%';setTimeout(function(){P.classList.add('hidden')},1000)}catch(e1){if(e1.name!='AbortError'){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;a.click();URL.revokeObjectURL(a.href)}}` +
		`}else{var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;a.click();URL.revokeObjectURL(a.href)}` +
		`Y.textContent='⬇ 下载';Y.disabled=false;Y._d=false` +
		`}).catch(function(){Y.textContent='下载失败';setTimeout(function(){Y.textContent='⬇ 下载';Y.disabled=false;Y._d=false},2000)})})` +
		`}else{try{c.innerHTML='<pre class="overflow-auto p-3 text-sm font-mono whitespace-pre-wrap break-all m-0 rounded-xl bg-(--card-bg) border border-(--line-divider) max-h-60">'+JSON.stringify(JSON.parse(l),null,2)+'</pre>'}catch(e){c.textContent=l}}` +
		`}).catch(function(){c.innerHTML='<span class="text-sm text-red-500">请求失败</span>'})` +
		`.finally(function(){b.disabled=false;b.textContent='${label}'})})})();`;

	const script = h(`script#${id}-script`, { type: "text/javascript" }, s);

	return h("div", { class: "my-4" }, [container, script]);
}
