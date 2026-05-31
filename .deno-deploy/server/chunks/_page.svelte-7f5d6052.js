import { c as escape_html, e as ensure_array_like, a as attr_class, s as stringify, b as attr, i as spread_props, l as derived } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';
import { A as Arrow_left } from './arrow-left-693621d1.js';
import { B as Book_open } from './book-open-8545439b.js';
import { C as Chevron_right } from './chevron-right-c66109d9.js';
import { C as Compass } from './compass-09b8f898.js';
import { F as File_text } from './file-text-6819df47.js';
import { G as Globe, L as Lock } from './lock-1533b680.js';
import { L as Layers } from './layers-397d5d71.js';
import { R as Reader } from './Reader-d480f7c6.js';
import './index-server-db57e4a7.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/play.svelte
function Play($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "play" },
		props,
		{ iconNode: [["path", { "d": "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" }]] }
	]));
}
//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/rotate-ccw.svelte
function Rotate_ccw($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "rotate-ccw" },
		props,
		{ iconNode: [["path", { "d": "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }], ["path", { "d": "M3 3v5h5" }]] }
	]));
}
//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/square-pen.svelte
function Square_pen($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "square-pen" },
		props,
		{ iconNode: [["path", { "d": "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }], ["path", { "d": "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" }]] }
	]));
}
//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/triangle-alert.svelte
function Triangle_alert($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "triangle-alert" },
		props,
		{ iconNode: [
			["path", { "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }],
			["path", { "d": "M12 9v4" }],
			["path", { "d": "M12 17h.01" }]
		] }
	]));
}
//#endregion
//#region src/routes/(reader)/lists/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let activeItemIndex = 0;
		let forcedProseList = {};
		const itemsByArc = derived(() => {
			const unassigned = [];
			const grouped = {};
			data.arcs.forEach((arc) => {
				grouped[arc.id] = [];
			});
			data.items.forEach((item) => {
				if (item.list_arc_id && grouped[item.list_arc_id]) grouped[item.list_arc_id].push(item);
				else unassigned.push(item);
			});
			return {
				unassigned,
				grouped
			};
		});
		const flatActiveItems = derived(() => data.items.filter((item) => item.scene !== null));
		function formatDate(dateStr) {
			if (!dateStr) return "Recently";
			return new Date(dateStr).toLocaleDateString(void 0, {
				month: "short",
				day: "numeric",
				year: "numeric"
			});
		}
		$$renderer.push(`<div class="flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100"><aside class="flex w-80 shrink-0 flex-col border-r border-white/5 bg-zinc-900/20 backdrop-blur-2xl"><div class="border-b border-white/5 bg-white/[0.01] p-6"><a href="/lists" class="mb-4 flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-white">`);
		Arrow_left($$renderer, { class: "h-3.5 w-3.5" });
		$$renderer.push(`<!----> Back to Playlists</a> <h2 class="line-clamp-2 font-serif text-xl leading-tight font-bold tracking-tight text-white">${escape_html(data.list.title)}</h2> <div class="mt-3 flex flex-wrap items-center gap-2 select-none"><span class="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold tracking-wider text-zinc-400 uppercase">${escape_html(data.list.serial?.title)}</span> `);
		if (data.list.is_public) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400 uppercase">`);
			Globe($$renderer, { class: "h-2.5 w-2.5" });
			$$renderer.push(`<!----> Public</span>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span class="flex items-center gap-1 rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-indigo-400 uppercase">`);
			Lock($$renderer, { class: "h-2.5 w-2.5" });
			$$renderer.push(`<!----> Private</span>`);
		}
		$$renderer.push(`<!--]--></div></div> <div class="flex-1 space-y-6 overflow-y-auto p-4">`);
		if (itemsByArc().unassigned.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="space-y-2"><h3 class="mb-2 px-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Introductory Chapters</h3> <!--[-->`);
			const each_array = ensure_array_like(itemsByArc().unassigned);
			for (let uIdx = 0, $$length = each_array.length; uIdx < $$length; uIdx++) {
				let item = each_array[uIdx];
				const flatIndex = flatActiveItems().findIndex((f) => f.id === item.id);
				$$renderer.push(`<button${attr_class(`group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${stringify(activeItemIndex === flatIndex ? "bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.03)]" : "border-white/5 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white")}`)}><div class="space-y-1 truncate pr-1"><span class="block truncate font-serif text-xs font-bold transition-colors group-hover:text-white">${escape_html(item.scene?.display_title || item.scene?.author_title || `Sequence ${item.order_index}`)}</span> <div class="flex items-center gap-1.5"><span class="block text-[8px] font-medium text-zinc-600">Chapter ${escape_html(item.scene?.order_index)}</span> <span${attr_class(`origin-left scale-[0.9] rounded border border-white/10 bg-white/5 px-1 text-[8px] font-bold tracking-wider uppercase ${stringify(item.reading_mode === "prose" ? "text-primary" : "")} ${stringify(item.reading_mode === "summary" ? "text-indigo-400" : "")} ${stringify(item.reading_mode === "description" ? "text-amber-400" : "")} ${stringify(item.reading_mode === "skip" ? "text-rose-400" : "")} `)}>${escape_html(item.reading_mode)}</span></div></div> `);
				Chevron_right($$renderer, { class: "group-hover:text-primary h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors" });
				$$renderer.push(`<!----></button>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <!--[-->`);
		const each_array_1 = ensure_array_like(data.arcs);
		for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
			let arc = each_array_1[$$index_2];
			const arcItems = itemsByArc().grouped[arc.id] || [];
			if (arcItems.length > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="space-y-2"><h3 class="text-primary mb-2 px-2 font-serif text-[10px] font-bold tracking-widest uppercase">${escape_html(arc.title)}</h3> <!--[-->`);
				const each_array_2 = ensure_array_like(arcItems);
				for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
					let item = each_array_2[$$index_1];
					const flatIndex = flatActiveItems().findIndex((f) => f.id === item.id);
					$$renderer.push(`<button${attr_class(`group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${stringify(activeItemIndex === flatIndex ? "bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.03)]" : "border-white/5 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white")}`)}><div class="space-y-1 truncate pr-1"><span class="block truncate font-serif text-xs font-bold transition-colors group-hover:text-white">${escape_html(item.scene?.display_title || item.scene?.author_title || `Sequence ${item.order_index}`)}</span> <div class="flex items-center gap-1.5"><span class="block text-[8px] font-medium text-zinc-600">Chapter ${escape_html(item.scene?.order_index)}</span> <span${attr_class(`origin-left scale-[0.9] rounded border border-white/10 bg-white/5 px-1 text-[8px] font-bold tracking-wider uppercase ${stringify(item.reading_mode === "prose" ? "text-primary" : "")} ${stringify(item.reading_mode === "summary" ? "text-indigo-400" : "")} ${stringify(item.reading_mode === "description" ? "text-amber-400" : "")} ${stringify(item.reading_mode === "skip" ? "text-rose-400" : "")} `)}>${escape_html(item.reading_mode)}</span></div></div> `);
					Chevron_right($$renderer, { class: "group-hover:text-primary h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors" });
					$$renderer.push(`<!----></button>`);
				}
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--> `);
		if (data.items.length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-8 text-center"><p class="text-xs text-zinc-600 italic">This playlist contains no curation items.</p></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> `);
		if (data.session && data.list.user_id === data.session.user.id) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="shrink-0 border-t border-white/5 bg-white/[0.01] p-4"><a${attr("href", `/lists/${stringify(data.list.id)}/edit`)} class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/10">`);
			Square_pen($$renderer, { class: "h-4 w-4 text-zinc-400" });
			$$renderer.push(`<!----> Edit Curation Layout</a></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></aside> <div class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950"><header class="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-900/10 px-8 backdrop-blur-xl"><div class="flex items-center gap-3">`);
		Layers($$renderer, { class: "text-primary h-5 w-5 animate-pulse" });
		$$renderer.push(`<!----> <span class="font-serif text-sm font-bold text-zinc-300">`);
		if (flatActiveItems()[activeItemIndex]) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`Curation Chapter: ${escape_html(flatActiveItems()[activeItemIndex].scene?.display_title || flatActiveItems()[activeItemIndex].scene?.author_title)}`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`Story Overview`);
		}
		$$renderer.push(`<!--]--></span></div> <div class="text-[10px] font-bold text-zinc-500">Curated Narrative Mode Active</div></header> <div class="relative flex-1 overflow-y-auto scroll-smooth p-8 md:p-12"><div class="mx-auto max-w-3xl space-y-24 pb-48">`);
		if (flatActiveItems().length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="space-y-4 py-24 text-center">`);
			Book_open($$renderer, { class: "mx-auto h-12 w-12 text-zinc-700" });
			$$renderer.push(`<!----> <h3 class="font-serif text-lg font-bold text-zinc-300">Empty Curation Playlist</h3> <p class="mx-auto max-w-sm text-sm text-zinc-500">There are no published curated scenes added to this reading list yet.</p></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--[-->`);
			const each_array_3 = ensure_array_like(flatActiveItems());
			for (let index = 0, $$length = each_array_3.length; index < $$length; index++) {
				let item = each_array_3[index];
				const scene = item.scene;
				const mode = forcedProseList[item.id] ? "prose" : item.reading_mode;
				$$renderer.push(`<section${attr("id", `curation-item-${stringify(item.id)}`)} class="curation-section border-b border-white/5 pb-20 last:border-b-0 last:pb-0"${attr("data-index", index)}>`);
				if (item.list_arc_id) {
					$$renderer.push("<!--[0-->");
					const matchedArc = data.arcs.find((a) => a.id === item.list_arc_id);
					const isFirstOfArc = flatActiveItems().findIndex((f) => f.list_arc_id === item.list_arc_id) === index;
					if (matchedArc && isFirstOfArc) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="bg-primary/5 border-primary/10 mt-4 mb-12 rounded-[1.5rem] border p-6 text-center shadow-md select-none"><span class="text-primary mb-1 block text-[8px] font-bold tracking-widest uppercase">Entering Narrative Arc</span> <h3 class="font-serif text-lg font-bold text-white md:text-xl">${escape_html(matchedArc.title)}</h3></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="mb-8 flex items-center gap-3 select-none"><span class="h-[1px] w-6 bg-zinc-800"></span> <h4 class="max-w-xs truncate font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">${escape_html(scene?.display_title || scene?.author_title || `Scene ${index + 1}`)}</h4> `);
				if (item.reading_mode !== "prose") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[8px] font-bold tracking-wider text-indigo-400 uppercase">${escape_html(item.reading_mode)} cut</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (forcedProseList[item.id]) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-bold tracking-wider text-emerald-400 uppercase">Forced Prose Reveal</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <span class="h-[1px] flex-1 bg-zinc-800/40"></span> <span class="shrink-0 font-mono text-[9px] font-bold text-zinc-600 uppercase">${escape_html(formatDate(scene?.published_at))}</span></div> `);
				if (mode === "prose") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<article class="prose-wrapper">`);
					Reader($$renderer, {
						content: scene?.content || "",
						onVisibleBlocksChange: () => {}
					});
					$$renderer.push(`<!----></article> `);
					if (item.reading_mode !== "prose" && forcedProseList[item.id]) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="mt-8 flex justify-end select-none"><button class="flex items-center gap-1.5 rounded-xl border border-white/5 bg-zinc-900 px-4 py-2 text-[10px] font-bold tracking-wide text-zinc-400 uppercase transition-all hover:bg-zinc-800 hover:text-white">`);
						Rotate_ccw($$renderer, { class: "h-3.5 w-3.5" });
						$$renderer.push(`<!----> Restore Curated Cut</button></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div class="relative space-y-6 overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/30 p-8">`);
					if (mode === "summary") {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="space-y-4"><div class="flex items-center gap-2 text-xs font-bold tracking-wider text-indigo-400 uppercase">`);
						File_text($$renderer, { class: "h-4 w-4" });
						$$renderer.push(`<!----> Summarized Version</div> <p class="border-l-2 border-indigo-500/30 pl-4 font-serif text-base leading-relaxed text-zinc-300 italic">"${escape_html(scene?.summary || "No summary was provided by the author.")}"</p></div>`);
					} else if (mode === "description") {
						$$renderer.push("<!--[1-->");
						$$renderer.push(`<div class="space-y-4"><div class="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-400 uppercase">`);
						Compass($$renderer, { class: "h-4 w-4" });
						$$renderer.push(`<!----> Narrative Log / Description</div> <p class="border-l-2 border-amber-500/30 pl-4 text-base leading-relaxed text-zinc-300">${escape_html(scene?.description || "No description log was provided.")}</p></div>`);
					} else if (mode === "skip") {
						$$renderer.push("<!--[2-->");
						$$renderer.push(`<div class="space-y-2 py-4"><div class="flex items-center gap-2 text-xs font-bold tracking-wider text-rose-400 uppercase">`);
						Triangle_alert($$renderer, { class: "h-4 w-4" });
						$$renderer.push(`<!----> Chapter Bypassed</div> <p class="text-sm text-zinc-500">This chapter contains filler scenes, setup sideplots, or lore not critical
												to this custom reading arc curation.</p></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="flex justify-end border-t border-white/5 pt-4"><button class="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold tracking-wider text-zinc-300 uppercase transition-all hover:bg-white/10 hover:text-white">`);
					Play($$renderer, { class: "text-primary fill-primary h-3 w-3" });
					$$renderer.push(`<!----> Read Original Full Prose anyway</button></div></div>`);
				}
				$$renderer.push(`<!--]--></section>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div></div></div></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-7f5d6052.js.map
