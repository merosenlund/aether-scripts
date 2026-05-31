import { b as attr, s as stringify, c as escape_html, e as ensure_array_like, a as attr_class, l as derived, i as spread_props } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';
import { C as Chevron_left } from './chevron-left-077ef2d0.js';
import { D as Dices } from './dices-8db7386d.js';
import { H as History } from './history-591ca8e4.js';
import { P as Pen_tool } from './pen-tool-139d6058.js';
import { p as page } from './state-0ced0af7.js';
import './client-ffaaeca1.js';
import './internal-8a8e9ef7.js';
import './index-21b402be.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/share-2.svelte
function Share_2($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "share-2" },
		props,
		{ iconNode: [
			["circle", {
				"cx": "18",
				"cy": "5",
				"r": "3"
			}],
			["circle", {
				"cx": "6",
				"cy": "12",
				"r": "3"
			}],
			["circle", {
				"cx": "18",
				"cy": "19",
				"r": "3"
			}],
			["line", {
				"x1": "8.59",
				"x2": "15.42",
				"y1": "13.51",
				"y2": "17.49"
			}],
			["line", {
				"x1": "15.41",
				"x2": "8.59",
				"y1": "6.51",
				"y2": "10.49"
			}]
		] }
	]));
}
//#endregion
//#region src/routes/(author)/serials/[id]/scenes/[sceneId]/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children, data } = $$props;
		let activeTab = derived(() => page.url.pathname.split("/").pop() || "play");
		let serialId = derived(() => page.params.id);
		let sceneId = derived(() => page.params.sceneId);
		const tabs = [
			{
				id: "play",
				name: "Play",
				icon: Dices,
				path: "play"
			},
			{
				id: "edit",
				name: "Edit",
				icon: Pen_tool,
				path: "edit"
			},
			{
				id: "history",
				name: "History",
				icon: History,
				path: "history"
			},
			{
				id: "share",
				name: "Share & Publish",
				icon: Share_2,
				path: "share"
			}
		];
		$$renderer.push(`<div class="relative flex h-screen flex-col overflow-hidden bg-stone-950 font-sans text-stone-100"><header class="z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-stone-900/40 px-6 shadow-md backdrop-blur-xl"><div class="flex items-center gap-4"><a data-component="back-link"${attr("href", `/serials/${stringify(serialId())}`)} class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-stone-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white" title="Back to Serial">`);
		Chevron_left($$renderer, { class: "h-4 w-4" });
		$$renderer.push(`<!----></a> <div class="h-4 w-px bg-white/10"></div> <div><h2 class="mb-1 text-xs leading-none font-bold tracking-widest text-stone-500 uppercase">${escape_html(data.scene.serials?.title || "Serial")}</h2> <h1 class="max-w-xs truncate text-sm leading-none font-bold text-white/95 sm:max-w-md">${escape_html(data.scene.author_title || `Scene ${data.scene.order_index}`)}</h1></div></div> <nav class="flex rounded-xl border border-white/5 bg-black/40 p-1 backdrop-blur-md"><!--[-->`);
		const each_array = ensure_array_like(tabs);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let tab = each_array[$$index];
			const Icon = tab.icon;
			$$renderer.push(`<a data-component="nav-tab"${attr("href", `/serials/${stringify(serialId())}/scenes/${stringify(sceneId())}/${stringify(tab.path)}`)}${attr_class(`relative flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${stringify(activeTab() === tab.id ? "text-white" : "text-stone-400 hover:text-white")}`)}>`);
			if (activeTab() === tab.id) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="bg-primary/20 border-primary/30 absolute inset-0 -z-10 rounded-lg border shadow-[0_0_12px_rgba(var(--primary),0.15)]"></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (Icon) {
				$$renderer.push("<!--[-->");
				Icon($$renderer, { class: "h-3.5 w-3.5" });
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
			$$renderer.push(` <span>${escape_html(tab.name)}</span></a>`);
		}
		$$renderer.push(`<!--]--></nav> <div class="flex items-center gap-3"><span class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-emerald-400 uppercase shadow-[0_0_8px_rgba(16,185,129,0.05)]">${escape_html(data.scene.status || "Playing")}</span> `);
		if (data.scene.semantic_version) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-stone-500">v${escape_html(data.scene.semantic_version)}</span>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></header> <main class="relative z-10 min-h-0 flex-1">`);
		children($$renderer);
		$$renderer.push(`<!----></main> <div class="bg-primary/5 absolute top-0 left-1/4 -z-10 h-[600px] w-[600px] -translate-y-1/2 rounded-full blur-[140px]"></div></div>`);
	});
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-2e5e7bae.js.map
