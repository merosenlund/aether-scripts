import { e as ensure_array_like, b as attr, s as stringify, a as attr_class, c as escape_html, i as spread_props } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';
import { C as Clock } from './clock-731c4c77.js';
import { P as Plus } from './plus-54415a1e.js';
import { U as Users } from './users-3ba02e0c.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/book.svelte
function Book($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "book" },
		props,
		{ iconNode: [["path", { "d": "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }]] }
	]));
}
//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/star.svelte
function Star($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "star" },
		props,
		{ iconNode: [["path", { "d": "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" }]] }
	]));
}
//#endregion
//#region src/routes/(author)/write/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let titleInput = "";
		function timeAgo(date) {
			const now = /* @__PURE__ */ new Date();
			const then = new Date(date);
			const seconds = Math.floor((now.getTime() - then.getTime()) / 1e3);
			if (seconds < 60) return "just now";
			const minutes = Math.floor(seconds / 60);
			if (minutes < 60) return `${minutes}m ago`;
			const hours = Math.floor(minutes / 60);
			if (hours < 24) return `${hours}h ago`;
			const days = Math.floor(hours / 24);
			if (days < 7) return `${days}d ago`;
			return then.toLocaleDateString();
		}
		$$renderer.push(`<div class="mx-auto max-w-7xl space-y-10 p-8"><header class="flex items-end justify-between"><div class="space-y-1"><h1 class="text-4xl font-bold tracking-tight">Your Serials</h1> <p class="text-stone-400">Manage your stories, worlds, and reader community.</p></div> <button class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-lg px-4 py-2 font-semibold shadow-lg transition-all hover:opacity-90">`);
		Plus($$renderer, { class: "mr-2 h-5 w-5" });
		$$renderer.push(`<!----> New Serial</button></header> <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
		const each_array = ensure_array_like(data.serials);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let serial = each_array[$$index];
			$$renderer.push(`<a${attr("href", `/serials/${stringify(serial.id)}`)} class="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-stone-900/50 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50"><div${attr_class(`h-32 bg-gradient-to-br ${stringify(serial.color_theme)} relative overflow-hidden`)}><div class="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/0"></div> <div class="absolute top-4 right-4">`);
			if (serial.status === "pilot") {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="bg-primary text-primary-foreground shadow-primary/20 rounded-md px-2 py-1 text-[10px] font-bold tracking-wider uppercase shadow-lg">Pilot Phase</span>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<span class="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-md">${escape_html(serial.status)}</span>`);
			}
			$$renderer.push(`<!--]--></div></div> <div class="flex flex-1 flex-col p-5"><h2 class="group-hover:text-primary mb-4 text-xl font-bold transition-colors">${escape_html(serial.title)}</h2> <div class="mt-auto grid grid-cols-2 gap-4"><div class="flex items-center text-sm text-stone-400">`);
			Book($$renderer, { class: "mr-2 h-4 w-4 text-stone-500" });
			$$renderer.push(`<!----> ${escape_html(serial.scenesCount)} Scenes</div> <div class="flex items-center text-sm text-stone-400">`);
			Users($$renderer, { class: "mr-2 h-4 w-4 text-stone-500" });
			$$renderer.push(`<!----> ${escape_html(serial.readersCount)} Readers</div></div></div> <div class="flex items-center justify-between border-t border-white/5 bg-stone-950/30 px-5 py-3 text-xs text-stone-500"><div class="flex items-center">`);
			Clock($$renderer, { class: "mr-1 h-3 w-3" });
			$$renderer.push(`<!----> Edited ${escape_html(timeAgo(serial.lastEdit))}</div> `);
			Star($$renderer, { class: "h-4 w-4 cursor-pointer transition-colors hover:text-yellow-500" });
			$$renderer.push(`<!----></div></a>`);
		}
		$$renderer.push(`<!--]--> <button class="group hover:border-primary/50 hover:bg-primary/5 hover:text-primary flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/5 p-8 text-stone-500 transition-all duration-300"><div class="group-hover:bg-primary/20 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 transition-colors">`);
		Plus($$renderer, { class: "h-6 w-6" });
		$$renderer.push(`<!----></div> <span class="font-semibold">Start a new journey</span></button></div></div> <form method="POST" action="?/create" class="hidden"><input type="hidden" name="title"${attr("value", titleInput)}/></form>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-4fc4a9bd.js.map
