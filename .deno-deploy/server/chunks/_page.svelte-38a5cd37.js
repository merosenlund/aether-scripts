import { c as escape_html, i as spread_props } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';
import { U as User } from './user-63b71bea.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/log-out.svelte
function Log_out($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "log-out" },
		props,
		{ iconNode: [
			["path", { "d": "m16 17 5-5-5-5" }],
			["path", { "d": "M21 12H9" }],
			["path", { "d": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
		] }
	]));
}
//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/mail.svelte
function Mail($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "mail" },
		props,
		{ iconNode: [["path", { "d": "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" }], ["rect", {
			"x": "2",
			"y": "4",
			"width": "20",
			"height": "16",
			"rx": "2"
		}]] }
	]));
}
//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/shield.svelte
function Shield($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "shield" },
		props,
		{ iconNode: [["path", { "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }]] }
	]));
}
//#endregion
//#region src/routes/account/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		$$renderer.push(`<div class="mx-auto max-w-4xl space-y-8 p-8 pb-32"><div class="relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl md:p-12"><div class="absolute inset-0 -z-10 bg-gradient-to-r from-violet-600/10 via-indigo-500/10 to-transparent"></div> <div class="absolute top-0 right-0 -z-10 h-72 w-72 translate-x-1/4 -translate-y-1/4 rounded-full bg-indigo-500/10 blur-3xl"></div> <div class="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left"><div class="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] border border-white/10 bg-zinc-950/50 shadow-inner">`);
		User($$renderer, { class: "h-12 w-12 text-indigo-400" });
		$$renderer.push(`<!----></div> <div class="space-y-4"><div class="space-y-1"><div class="flex flex-wrap items-center justify-center gap-3 md:justify-start"><h1 class="text-3xl font-extrabold tracking-tight text-white md:text-4xl">User Profile</h1> `);
		if (data.userRole) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-bold tracking-widest text-violet-300 uppercase">${escape_html(data.userRole)}</span>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <p class="text-zinc-400 font-medium">Manage your writer-reader account and settings.</p></div></div></div></div> <div class="grid grid-cols-1 gap-6 md:grid-cols-2"><div class="rounded-2xl border border-white/5 bg-zinc-900/30 p-6 space-y-6"><h2 class="text-lg font-bold text-white flex items-center gap-2">`);
		Shield($$renderer, { class: "h-5 w-5 text-indigo-400" });
		$$renderer.push(`<!----> Account Security</h2> <div class="space-y-4"><div class="flex items-center justify-between rounded-xl bg-zinc-900/50 p-4 border border-white/5"><div class="flex items-center gap-3">`);
		Mail($$renderer, { class: "h-5 w-5 text-zinc-500" });
		$$renderer.push(`<!----> <div><p class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Email Address</p> <p class="text-sm font-medium text-white">${escape_html(data.session?.user?.email || "Not signed in")}</p></div></div></div> <div class="flex items-center justify-between rounded-xl bg-zinc-900/50 p-4 border border-white/5"><div class="flex items-center gap-3">`);
		User($$renderer, { class: "h-5 w-5 text-zinc-500" });
		$$renderer.push(`<!----> <div><p class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">User Identifier</p> <p class="text-xs font-mono text-zinc-400 truncate max-w-[200px] md:max-w-xs">${escape_html(data.session?.user?.id || "N/A")}</p></div></div></div></div></div> <div class="rounded-2xl border border-white/5 bg-zinc-900/30 p-6 flex flex-col justify-between space-y-6"><div class="space-y-2"><h2 class="text-lg font-bold text-white flex items-center gap-2">`);
		Log_out($$renderer, { class: "h-5 w-5 text-rose-400" });
		$$renderer.push(`<!----> Session Management</h2> <p class="text-sm text-zinc-400">Sign out of your active session on this device to clear all local cookies and storage.</p></div> <form method="POST" action="?/logout"><button type="submit" class="group flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-6 py-3.5 text-sm font-bold text-rose-400 transition-all duration-300 hover:bg-rose-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-rose-500/20 active:scale-[0.98]">`);
		Log_out($$renderer, { class: "h-4 w-4 transition-transform group-hover:translate-x-0.5" });
		$$renderer.push(`<!----> Sign Out of Account</button></form></div></div></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-38a5cd37.js.map
