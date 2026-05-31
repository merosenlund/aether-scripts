import { b as attr, e as ensure_array_like, a as attr_class, c as escape_html, s as stringify, i as spread_props, l as derived } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';
import { B as Book_open } from './book-open-8545439b.js';
import { C as Clock } from './clock-731c4c77.js';
import { C as Compass } from './compass-09b8f898.js';
import { S as Search } from './search-00ee5269.js';
import { U as Users } from './users-3ba02e0c.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/rocket.svelte
function Rocket($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "rocket" },
		props,
		{ iconNode: [
			["path", { "d": "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" }],
			["path", { "d": "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" }],
			["path", { "d": "M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" }],
			["path", { "d": "M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" }]
		] }
	]));
}
//#endregion
//#region src/routes/(reader)/library/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let searchQuery = "";
		let activeFilter = "All";
		const filters = [
			"All",
			"pilot",
			"active",
			"complete",
			"hiatus"
		];
		const filteredSerials = derived(() => data.serials.filter((s) => {
			const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesFilter = activeFilter === "All" ;
			return matchesSearch && matchesFilter;
		}));
		function timeAgo(date) {
			if (!date) return "Never";
			const seconds = Math.floor(((/* @__PURE__ */ new Date()).getTime() - new Date(date).getTime()) / 1e3);
			let interval = seconds / 31536e3;
			if (interval > 1) return Math.floor(interval) + " years ago";
			interval = seconds / 2592e3;
			if (interval > 1) return Math.floor(interval) + " months ago";
			interval = seconds / 86400;
			if (interval > 1) return Math.floor(interval) + " days ago";
			interval = seconds / 3600;
			if (interval > 1) return Math.floor(interval) + " hours ago";
			interval = seconds / 60;
			if (interval > 1) return Math.floor(interval) + " minutes ago";
			return Math.floor(seconds) + " seconds ago";
		}
		$$renderer.push(`<div class="mx-auto max-w-7xl space-y-12 p-8 pb-32"><section class="relative flex min-h-[320px] items-center overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900 p-8 shadow-2xl md:p-16"><div class="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"></div> <div class="from-primary/20 absolute top-0 right-0 h-full w-2/3 translate-x-1/4 -translate-y-1/4 rounded-full bg-gradient-to-br via-indigo-500/10 to-transparent blur-3xl"></div> <div class="relative z-20 max-w-2xl space-y-8"><div class="space-y-4"><h1 class="text-5xl leading-[1.1] font-bold tracking-tight text-white md:text-6xl">Explore the <span class="from-primary bg-gradient-to-r to-indigo-400 bg-clip-text text-transparent">multiverse</span> of stories.</h1> <p class="max-w-lg text-lg font-medium text-zinc-400 md:text-xl">Discover hand-crafted adventures, evolving lore, and stories that roll with the dice.</p></div> <div class="group relative max-w-md"><div class="from-primary/30 absolute -inset-1 rounded-2xl bg-gradient-to-r to-indigo-500/30 opacity-0 blur transition duration-500 group-focus-within:opacity-100"></div> <div class="relative flex items-center">`);
		Search($$renderer, { class: "absolute left-4 h-5 w-5 text-zinc-500" });
		$$renderer.push(`<!----> <input type="text"${attr("value", searchQuery)} placeholder="Search for serials..." class="focus:border-primary/50 w-full rounded-2xl border border-white/10 bg-zinc-900/80 py-4 pr-4 pl-12 text-white backdrop-blur-xl transition-all placeholder:text-zinc-500 focus:outline-none"/></div></div></div></section> <div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><nav class="scrollbar-none flex max-w-full gap-2 overflow-x-auto pb-2 svelte-11vd8mz"><!--[-->`);
		const each_array = ensure_array_like(filters);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let filter = each_array[$$index];
			$$renderer.push(`<button${attr_class(`flex items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-bold whitespace-nowrap capitalize transition-all ${stringify(activeFilter === filter ? "border-white bg-white text-zinc-950" : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white")}`)}>`);
			if (filter === "pilot") {
				$$renderer.push("<!--[0-->");
				Rocket($$renderer, { class: "h-3.5 w-3.5" });
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> ${escape_html(filter)}</button>`);
		}
		$$renderer.push(`<!--]--></nav> <div class="text-sm font-medium text-zinc-500">Showing ${escape_html(filteredSerials().length)} results</div></div> `);
		if (filteredSerials().length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
			const each_array_1 = ensure_array_like(filteredSerials());
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let serial = each_array_1[$$index_1];
				$$renderer.push(`<a${attr("href", `/library/${stringify(serial.id)}`)} class="group block space-y-4"><div class="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/5 bg-zinc-900 shadow-lg transition-all duration-300 group-hover:border-white/20"><div${attr_class(`absolute inset-0 bg-gradient-to-br ${stringify(serial.color_theme)} opacity-60 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90`, "svelte-11vd8mz")}></div> <div class="absolute inset-0 bg-black/20"></div> <div class="absolute top-4 right-4">`);
				if (serial.status === "pilot") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="bg-primary text-primary-foreground shadow-primary/40 flex animate-pulse items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold tracking-widest uppercase shadow-lg">`);
					Rocket($$renderer, { class: "h-3 w-3" });
					$$renderer.push(`<!----> Pilot Phase</span>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<span class="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-md">${escape_html(serial.status)}</span>`);
				}
				$$renderer.push(`<!--]--></div></div> <div class="space-y-1"><h3 class="group-hover:text-primary text-xl leading-tight font-bold transition-colors">${escape_html(serial.title)}</h3> <div class="flex items-center gap-4 text-sm text-zinc-500"><span class="flex items-center gap-1">`);
				Book_open($$renderer, { class: "h-4 w-4" });
				$$renderer.push(`<!----> ${escape_html(serial.scenesCount)} scenes</span> <span class="flex items-center gap-1">`);
				Users($$renderer, { class: "h-4 w-4" });
				$$renderer.push(`<!----> ${escape_html(serial.readersCount)}</span> `);
				if (serial.updated_at) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="flex items-center gap-1">`);
					Clock($$renderer, { class: "h-4 w-4" });
					$$renderer.push(`<!----> ${escape_html(timeAgo(serial.updated_at))}</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div></div></a>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="space-y-6 rounded-[2.5rem] border border-dashed border-white/10 bg-zinc-900/30 p-24 text-center"><div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/5 bg-zinc-900 text-zinc-700">`);
			Compass($$renderer, { class: "h-10 w-10" });
			$$renderer.push(`<!----></div> <div class="space-y-2"><h3 class="text-2xl font-bold text-zinc-300">No stories found</h3> <p class="mx-auto max-w-sm text-zinc-500">Try adjusting your search or filters to find what you're looking for.</p></div> <button class="rounded-xl border border-white/10 bg-white/5 px-8 py-3 font-bold text-white transition-all hover:bg-white/10">Clear all filters</button></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-c31470f8.js.map
