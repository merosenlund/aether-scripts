import { c as escape_html, b as attr, e as ensure_array_like, a as attr_class, s as stringify, i as spread_props } from './dev-db1ab9cf.js';
import './client-ffaaeca1.js';
import { I as Icon } from './Icon-f47d171f.js';
import { A as Arrow_left } from './arrow-left-693621d1.js';
import { B as Book_open } from './book-open-8545439b.js';
import { L as Layers } from './layers-397d5d71.js';
import { P as Plus } from './plus-54415a1e.js';
import { S as Save } from './save-c09f9a5a.js';
import { S as Settings } from './settings-9137a3a7.js';
import { T as Trash_2 } from './trash-2-84c1de2c.js';
import './dist-99a5dbca.js';
import './internal-8a8e9ef7.js';
import './index-21b402be.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/check.svelte
function Check($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "check" },
		props,
		{ iconNode: [["path", { "d": "M20 6 9 17l-5-5" }]] }
	]));
}
//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/grip-vertical.svelte
function Grip_vertical($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "grip-vertical" },
		props,
		{ iconNode: [
			["circle", {
				"cx": "9",
				"cy": "12",
				"r": "1"
			}],
			["circle", {
				"cx": "9",
				"cy": "5",
				"r": "1"
			}],
			["circle", {
				"cx": "9",
				"cy": "19",
				"r": "1"
			}],
			["circle", {
				"cx": "15",
				"cy": "12",
				"r": "1"
			}],
			["circle", {
				"cx": "15",
				"cy": "5",
				"r": "1"
			}],
			["circle", {
				"cx": "15",
				"cy": "19",
				"r": "1"
			}]
		] }
	]));
}
//#endregion
//#region src/routes/(reader)/lists/[id]/edit/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		data.list.title;
		data.list.is_public;
		let isSaving = false;
		let itemsState = [];
		function updateLocalArc(itemId, arcId) {
			itemsState = itemsState.map((item) => {
				if (item.id === itemId) return {
					...item,
					list_arc_id: arcId
				};
				return item;
			});
		}
		function isSceneCurated(sceneId) {
			return itemsState.some((item) => item.scene_id === sceneId);
		}
		$$renderer.push(`<div class="relative flex h-screen flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-100"><header class="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-900/10 px-8 backdrop-blur-xl"><div class="flex items-center gap-4"><a href="/lists" class="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition-all hover:bg-white/10 hover:text-white">`);
		Arrow_left($$renderer, { class: "h-4 w-4" });
		$$renderer.push(`<!----></a> <div class="space-y-0.5"><span class="block font-mono text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Curation Hub / ${escape_html(data.list.serial?.title)}</span> <h2 class="block font-serif text-sm font-bold text-white">${escape_html(data.list.title)}</h2></div></div> <div class="flex items-center gap-3">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button class="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold transition-all hover:bg-white/10">`);
		Settings($$renderer, { class: "h-3.5 w-3.5" });
		$$renderer.push(`<!----> List Settings</button> <button class="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold transition-all hover:bg-white/10">`);
		Plus($$renderer, { class: "h-3.5 w-3.5" });
		$$renderer.push(`<!----> Add Arc Section</button> <button${attr("disabled", isSaving, true)} class="bg-primary text-primary-foreground shadow-primary/20 flex items-center gap-1.5 rounded-xl border border-white/10 px-5 py-2 text-xs font-bold shadow-lg transition-all hover:opacity-90 disabled:opacity-50">`);
		$$renderer.push("<!--[-1-->");
		Save($$renderer, { class: "h-3.5 w-3.5" });
		$$renderer.push(`<!--]--> Save Curation Layout</button></div></header> <div class="relative flex flex-1 overflow-hidden"><aside class="flex w-96 shrink-0 flex-col space-y-6 overflow-y-auto border-r border-white/5 bg-zinc-900/10 p-6 backdrop-blur-2xl">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="space-y-4"><div><h3 class="flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 uppercase">`);
		Book_open($$renderer, { class: "text-primary h-4 w-4" });
		$$renderer.push(`<!----> Published Scenes (${escape_html(data.scenes.length)})</h3> <p class="mt-1 text-[10px] text-zinc-500">Select chapters from the original serial to include in your curation.</p></div> <div class="space-y-2"><!--[-->`);
		const each_array = ensure_array_like(data.scenes);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let scene = each_array[$$index];
			const curated = isSceneCurated(scene.id);
			$$renderer.push(`<div class="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-900/40 p-3 transition-all hover:border-white/10"><div class="space-y-0.5 truncate pr-2"><span class="block truncate font-serif text-xs font-bold text-zinc-200">${escape_html(scene.display_title || scene.author_title || `Scene ${scene.order_index}`)}</span> <span class="block font-mono text-[8px] text-zinc-500 uppercase">Chapter ${escape_html(scene.order_index)}</span></div> `);
			if (curated) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold tracking-wider text-emerald-400 uppercase select-none">`);
				Check($$renderer, { class: "h-3 w-3" });
				$$renderer.push(`<!----> Included</span>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<form method="POST" action="?/addItem"><input type="hidden" name="sceneId"${attr("value", scene.id)}/> <input type="hidden" name="orderIndex"${attr("value", itemsState.length + 1)}/> <button type="submit" class="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold tracking-wider text-zinc-400 uppercase transition-all hover:bg-white/10 hover:text-white">`);
				Plus($$renderer, { class: "group-hover:text-primary h-3 w-3 text-zinc-400 transition-colors" });
				$$renderer.push(`<!----> Add</button></form>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div></div> `);
		if (data.arcs.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="space-y-4 border-t border-white/5 pt-4"><h3 class="flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 uppercase">`);
			Layers($$renderer, { class: "text-primary h-4 w-4" });
			$$renderer.push(`<!----> Custom Sections (${escape_html(data.arcs.length)})</h3> <div class="space-y-2"><!--[-->`);
			const each_array_1 = ensure_array_like(data.arcs);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let arc = each_array_1[$$index_1];
				$$renderer.push(`<div class="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-900/40 p-3"><span class="truncate font-serif text-xs font-bold text-zinc-300">${escape_html(arc.title)}</span> <form method="POST" action="?/deleteArc"><input type="hidden" name="arcId"${attr("value", arc.id)}/> <button type="submit" class="shrink-0 rounded-lg p-1 text-zinc-500 transition-all hover:bg-white/5 hover:text-red-400">`);
				Trash_2($$renderer, { class: "h-3.5 w-3.5" });
				$$renderer.push(`<!----></button></form></div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></aside> <main class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950 p-8"><div class="mx-auto flex h-full w-full max-w-4xl flex-col space-y-6 pb-24"><div class="flex items-end justify-between border-b border-white/5 pb-4"><div><h3 class="flex items-center gap-2 font-serif text-base font-bold text-white">Playlist Curations</h3> <p class="mt-1 text-xs text-zinc-500">Reorder chapters, group them into your custom sections, and adjust their individual
							reading modes.</p></div> <div class="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-zinc-400">${escape_html(itemsState.length)} chapters curated</div></div> `);
		if (itemsState.length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex flex-1 flex-col items-center justify-center space-y-4 rounded-[2.5rem] border border-dashed border-white/5 bg-zinc-900/10 p-12 text-center">`);
			Layers($$renderer, { class: "h-12 w-12 text-zinc-800" });
			$$renderer.push(`<!----> <h4 class="text-sm font-bold text-zinc-400">Your Playlist is Empty</h4> <p class="max-w-xs text-xs text-zinc-600">Use the side column to add published chapters, then customize their orders and
							settings here.</p></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="flex-1 space-y-4 overflow-y-auto pr-2"><div class="min-h-64 space-y-3"><!--[-->`);
			const each_array_2 = ensure_array_like(itemsState);
			for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
				let item = each_array_2[index];
				$$renderer.push(`<div class="group relative flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all duration-300 hover:border-white/10 hover:bg-zinc-900/60 md:flex-row md:items-center"><div class="flex w-full items-center gap-3 md:w-auto"><div class="shrink-0 cursor-grab p-1 text-zinc-600 transition-colors hover:text-zinc-400 active:cursor-grabbing">`);
				Grip_vertical($$renderer, { class: "h-4 w-4" });
				$$renderer.push(`<!----></div> <div class="space-y-0.5 truncate"><span class="block truncate font-serif text-xs font-bold text-zinc-200">${escape_html(item.scene_title)}</span> <span class="block font-mono text-[8px] font-bold text-zinc-500 uppercase">Sequence ${escape_html(index + 1)}</span></div></div> <div class="flex w-full flex-wrap items-center justify-end gap-3 md:w-auto">`);
				if (data.arcs.length > 0) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="flex items-center gap-1"><span class="mr-1 text-[8px] font-bold tracking-wider text-zinc-500 uppercase">Section:</span> `);
					$$renderer.select({
						value: item.list_arc_id || "",
						onchange: (e) => updateLocalArc(item.id, e.target.value || null),
						class: "focus:border-primary/50 cursor-pointer rounded-xl border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-medium text-zinc-300 focus:outline-none"
					}, ($$renderer) => {
						$$renderer.option({ value: "" }, ($$renderer) => {
							$$renderer.push(`Unassigned`);
						});
						$$renderer.push(`<!--[-->`);
						const each_array_3 = ensure_array_like(data.arcs);
						for (let $$index_2 = 0, $$length = each_array_3.length; $$index_2 < $$length; $$index_2++) {
							let arc = each_array_3[$$index_2];
							$$renderer.option({ value: arc.id }, ($$renderer) => {
								$$renderer.push(`${escape_html(arc.title)}`);
							});
						}
						$$renderer.push(`<!--]-->`);
					});
					$$renderer.push(`</div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="flex shrink-0 items-center gap-1 rounded-xl border border-white/5 bg-black/40 p-1"><button${attr_class(`rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-all ${stringify(item.reading_mode === "prose" ? "bg-primary/20 text-primary font-bold" : "text-zinc-500 hover:text-zinc-300")}`)}>Prose</button> <button${attr_class(`rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-all ${stringify(item.reading_mode === "summary" ? "bg-indigo-500/20 font-bold text-indigo-400" : "text-zinc-500 hover:text-zinc-300")}`)}>Summary</button> <button${attr_class(`rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-all ${stringify(item.reading_mode === "description" ? "bg-amber-500/20 font-bold text-amber-400" : "text-zinc-500 hover:text-zinc-300")}`)}>Desc</button> <button${attr_class(`rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-all ${stringify(item.reading_mode === "skip" ? "bg-rose-500/20 font-bold text-rose-400" : "text-zinc-500 hover:text-zinc-300")}`)}>Skip</button></div> <form method="POST" action="?/removeItem"><input type="hidden" name="itemId"${attr("value", item.id)}/> <button type="submit" class="rounded-xl border border-white/10 bg-white/5 p-1.5 text-zinc-500 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400">`);
				Trash_2($$renderer, { class: "h-3.5 w-3.5" });
				$$renderer.push(`<!----></button></form></div></div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--></div></main></div></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-65eb095b.js.map
