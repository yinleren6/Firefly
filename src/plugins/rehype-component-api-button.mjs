/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * API 请求按钮（内联模式）
 * ::api{url="https://..." label="查询"}
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

	const container = h(`div#${id}`, { class: "flex items-center gap-3 flex-wrap" }, [
		h(
			`button#${id}-btn`,
			{
				class:
					"inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-(--primary) text-white dark:text-black/70 font-medium hover:bg-(--primary)/80 hover:scale-105 active:scale-95 transition-all cursor-pointer border-none text-sm shrink-0",
			},
			label,
		),
	]);

	const scriptSrc =
		"(function(){var b=document.getElementById('" + id +
		"-btn'),c=document.getElementById('" + id +
		"'),u=" + JSON.stringify(apiUrl) + ";b.addEventListener('click',function(){if(b.disabled)return;b.disabled=true;b.textContent='获取中...';fetch(u,{headers:{'Accept':'application/json'}}).then(async function(k){var l=await k.text(),m;try{m=JSON.parse(l)}catch(e){}var n=m&&(m.url||m.data&&m.data.url);if(n){var fn=m.filename||'download';var w=document.createElement('span');w.className='inline-flex items-center gap-3 min-w-0 flex-1';var x=document.createElement('span');x.className='text-sm font-semibold truncate min-w-0 max-w-48';x.textContent=fn;var y=document.createElement('button');y.className='shrink-0 no-styling inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--primary) text-white dark:text-black/70 font-semibold text-sm hover:bg-(--primary)/90 transition-all cursor-pointer border-none';y.textContent='⬇ 下载';var p=document.createElement('div');p.className='hidden w-full h-1.5 rounded-full bg-(--primary)/10 overflow-hidden';var pb=document.createElement('div');pb.className='h-full rounded-full bg-(--primary) transition-all duration-200';pb.style.width='0%';p.appendChild(pb);c.appendChild(p);y.addEventListener('click',function(){y.disabled=true;y.textContent='下载中...';fetch(n).then(async function(r){var cl=parseInt(r.headers.get('Content-Length'))||0;var re=r.body.getReader();var chunks=[];var received=0;while(true){var d=await re.read();if(d.done)break;chunks.push(d.value);received+=d.value.length;if(cl){var pct=Math.round(received/cl*100);pb.style.width=pct+'%';p.classList.remove('hidden')}}var blob=new Blob(chunks);if(window.showSaveFilePicker){try{var h=await window.showSaveFilePicker({suggestedName:fn});var ws=await h.createWritable();await ws.write(blob);await ws.close();pb.style.width='100%';setTimeout(function(){p.classList.add('hidden')},1000)}catch(e1){if(e1.name!='AbortError'){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;a.click();URL.revokeObjectURL(a.href)}}}else{var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;a.click();URL.revokeObjectURL(a.href)}y.textContent='⬇ 下载';y.disabled=false}).catch(function(){y.textContent='下载失败';setTimeout(function(){y.textContent='⬇ 下载';y.disabled=false},2000)})});w.appendChild(x);w.appendChild(y);c.appendChild(w)}else{try{var p=document.createElement('pre');p.className='overflow-auto p-3 text-sm font-mono whitespace-pre-wrap break-all m-0 rounded-xl bg-(--card-bg) border border-(--line-divider) max-h-60';p.textContent=JSON.stringify(JSON.parse(l),null,2);c.appendChild(p)}catch(e){var t=document.createElement('span');t.className='text-sm';t.textContent=l;c.appendChild(t)}}}).catch(function(){var e=document.createElement('span');e.className='text-sm text-red-500';e.textContent='请求失败';c.appendChild(e)}).finally(function(){b.disabled=false;b.textContent='" + label + "'})})})();";

	const script = h(`script#${id}-script`, { type: "text/javascript" }, scriptSrc);

	return h("div", { class: "my-4" }, [container, script]);
}
