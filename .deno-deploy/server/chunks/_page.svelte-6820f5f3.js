import { a as attr_class, b as attr, e as ensure_array_like, s as stringify, c as escape_html, l as derived } from './dev-db1ab9cf.js';
import { A as Arrow_right } from './arrow-right-ccf77b9c.js';
import { C as Compass } from './compass-09b8f898.js';
import { F as Folder_plus } from './folder-plus-d439ffb0.js';
import { G as Globe, L as Lock } from './lock-1533b680.js';
import { L as Layers } from './layers-397d5d71.js';
import { S as Search } from './search-00ee5269.js';
import './Icon-f47d171f.js';

//#region src/routes/(reader)/lists/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let searchQuery = "";
		const filteredLists = derived(() => data.lists.filter((list) => {
			const matchesSearch = list.title.toLowerCase().includes(searchQuery.toLowerCase()) || list.serial?.title.toLowerCase().includes(searchQuery.toLowerCase());
			list.user_id === data.session?.user?.id;
			const matchesTab = list.is_public ;
			return matchesSearch && matchesTab;
		}));
		$$renderer.push(`<div class="mx-auto max-w-7xl space-y-12 bg-zinc-950 p-8 pb-32 font-sans text-zinc-100"><section class="relative flex min-h-[280px] items-center overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900 p-8 shadow-2xl md:p-16"><div class="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"></div> <div class="from-primary/20 absolute top-0 right-0 h-full w-2/3 translate-x-1/4 -translate-y-1/4 rounded-full bg-gradient-to-br via-indigo-500/10 to-transparent blur-3xl"></div> <div class="relative z-20 flex w-full max-w-3xl flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div class="space-y-4"><h1 class="text-4xl leading-[1.1] font-bold tracking-tight text-white md:text-5xl">Curated <span class="from-primary bg-gradient-to-r to-indigo-400 bg-clip-text text-transparent">Reading Lists</span> &amp; Cuts.</h1> <p class="max-w-md text-base text-zinc-400 md:text-lg">Explore customized tables of contents, alternate narrative paths, and skipped-filler
					editions created by the community.</p></div> `);
		if (data.session) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button class="bg-primary text-primary-foreground shadow-primary/20 flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 px-6 py-3.5 text-sm font-bold shadow-lg transition-all hover:opacity-90">`);
			Folder_plus($$renderer, { class: "h-4 w-4" });
			$$renderer.push(`<!----> Create New List</button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></section> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div class="flex shrink-0 gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-1.5"><button${attr_class(`flex items-center gap-2 rounded-xl px-6 py-2 text-xs font-bold whitespace-nowrap capitalize transition-all ${stringify("bg-zinc-800 text-white shadow-sm" )}`)}>`);
		Globe($$renderer, { class: "h-3.5 w-3.5" });
		$$renderer.push(`<!----> Community Lists</button> `);
		if (data.session) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button${attr_class(`flex items-center gap-2 rounded-xl px-6 py-2 text-xs font-bold whitespace-nowrap capitalize transition-all ${stringify("text-zinc-400 hover:text-white")}`)}>`);
			Lock($$renderer, { class: "h-3.5 w-3.5" });
			$$renderer.push(`<!----> My Playlists</button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <div class="group relative w-full max-w-md">`);
		Search($$renderer, { class: "absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" });
		$$renderer.push(`<!----> <input type="text"${attr("value", searchQuery)} placeholder="Filter by list or serial title..." class="focus:border-primary/40 w-full rounded-2xl border border-white/5 bg-zinc-900/50 py-3 pr-4 pl-11 text-sm text-white backdrop-blur-xl transition-all placeholder:text-zinc-500 focus:outline-none"/></div></div> `);
		if (filteredLists().length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
			const each_array_1 = ensure_array_like(filteredLists());
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let list = each_array_1[$$index_1];
				$$renderer.push(`<a${attr("href", `/lists/${stringify(list.id)}`)} class="group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/40 p-8 shadow-lg transition-all duration-300 hover:border-white/10 hover:bg-zinc-900/60"><div${attr_class(`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${stringify(list.serial?.color_theme || "from-violet-600 to-indigo-600")} opacity-80 transition-opacity group-hover:opacity-100`)}></div> <div class="space-y-4"><div class="flex items-center justify-between gap-3 select-none"><span class="max-w-[160px] truncate font-mono text-[10px] font-bold tracking-widest text-zinc-400 uppercase">${escape_html(list.serial?.title || "Unknown Serial")}</span> <div class="flex shrink-0 items-center gap-1.5">`);
				if (list.is_public) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400 uppercase">`);
					Globe($$renderer, { class: "h-2.5 w-2.5" });
					$$renderer.push(`<!----> Public</span>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<span class="flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-indigo-400 uppercase">`);
					Lock($$renderer, { class: "h-2.5 w-2.5" });
					$$renderer.push(`<!----> Private</span>`);
				}
				$$renderer.push(`<!--]--></div></div> <h3 class="group-hover:text-primary line-clamp-2 font-serif text-2xl leading-tight font-bold text-white transition-colors">${escape_html(list.title)}</h3></div> <div class="mt-4 flex items-center justify-between border-t border-white/5 pt-5"><div class="flex items-center gap-2 text-xs font-semibold text-zinc-400">`);
				Layers($$renderer, { class: "text-primary h-4 w-4" });
				$$renderer.push(`<!----> <span>${escape_html(list.items?.length || 0)} ${escape_html(list.items?.length === 1 ? "chapter" : "chapters")}</span></div> <div class="group-hover:bg-primary group-hover:border-primary flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 shadow-sm transition-all duration-300 group-hover:text-white">`);
				Arrow_right($$renderer, { class: "h-4 w-4 transition-transform group-hover:translate-x-0.5" });
				$$renderer.push(`<!----></div></div></a>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="space-y-6 rounded-[2rem] border border-dashed border-white/5 bg-zinc-900/20 p-24 text-center"><div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-zinc-900 text-zinc-600">`);
			Compass($$renderer, { class: "h-8 w-8" });
			$$renderer.push(`<!----></div> <div class="space-y-2"><h3 class="text-xl font-bold text-zinc-300">No curations found</h3> <p class="mx-auto max-w-sm text-sm text-zinc-500">`);
			{
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`No community lists match your filters. Try search adjustments.`);
			}
			$$renderer.push(`<!--]--></p></div> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-6820f5f3.js.map
