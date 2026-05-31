import { a as attr_class, e as ensure_array_like, b as attr, c as escape_html, i as spread_props, s as stringify } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';
import { E as Eye } from './eye-849886c2.js';
import { U as User } from './user-63b71bea.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/shield-alert.svelte
function Shield_alert($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "shield-alert" },
		props,
		{ iconNode: [
			["path", { "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }],
			["path", { "d": "M12 8v4" }],
			["path", { "d": "M12 16h.01" }]
		] }
	]));
}
//#endregion
//#region src/routes/settings/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let readingFontSize = "medium";
		$$renderer.push(`<div data-component="settings-page-container" class="mx-auto w-full max-w-4xl px-8 py-12 text-zinc-100"><div data-component="settings-header" class="mb-8 space-y-2"><h1 data-component="settings-title" class="font-sans text-4xl font-bold tracking-tight text-white">Account Settings</h1> <p data-component="settings-subtitle" class="text-sm text-zinc-500">Manage your reading preferences, profile details, and privacy settings.</p></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div data-component="settings-layout" class="grid grid-cols-1 gap-8 md:grid-cols-4"><div data-component="settings-tabs-sidebar" class="flex flex-col space-y-1 md:col-span-1"><button data-component="tab-button-reading"${attr_class(`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${stringify("bg-white/10 text-white" )}`)}>`);
		Eye($$renderer, {
			"data-component": "tab-icon-reading",
			class: "h-4 w-4"
		});
		$$renderer.push(`<!----> Reading</button> <button data-component="tab-button-profile"${attr_class(`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${stringify("text-zinc-400 hover:bg-white/5 hover:text-white")}`)}>`);
		User($$renderer, {
			"data-component": "tab-button-profile-icon",
			class: "h-4 w-4"
		});
		$$renderer.push(`<!----> Profile</button> <button data-component="tab-button-privacy"${attr_class(`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${stringify("text-zinc-400 hover:bg-white/5 hover:text-white")}`)}>`);
		Shield_alert($$renderer, {
			"data-component": "tab-icon-privacy",
			class: "h-4 w-4"
		});
		$$renderer.push(`<!----> Privacy</button></div> <div data-component="settings-tab-panel-container" class="rounded-3xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-xl md:col-span-3"><form data-component="settings-form" class="space-y-6">`);
		{
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div data-component="reading-section" class="space-y-6"><div data-component="reading-section-header" class="border-b border-white/5 pb-4"><h3 data-component="reading-section-title" class="font-sans text-xl font-semibold text-white">Reading Preferences</h3> <p data-component="reading-section-desc" class="text-xs text-zinc-500">Fine-tune your reading experience across the narrative multiverse.</p></div> <div data-component="font-size-group" class="space-y-2"><span data-component="font-size-label" class="block text-sm font-medium text-zinc-300">Prose Font Size</span> <div data-component="font-size-options" class="flex gap-4"><!--[-->`);
			const each_array = ensure_array_like([
				"small",
				"medium",
				"large"
			]);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let size = each_array[$$index];
				$$renderer.push(`<button${attr("data-component", `font-size-option-${stringify(size)}`)} type="button"${attr_class(`flex-1 rounded-xl border border-white/5 py-3 text-center text-sm font-medium transition-all capitalize ${stringify(readingFontSize === size ? "bg-white text-zinc-950 font-bold border-white" : "bg-white/5 text-zinc-400 hover:bg-white/10")}`)}>${escape_html(size)}</button>`);
			}
			$$renderer.push(`<!--]--></div></div> <div data-component="comment-mode-group" class="space-y-2"><span data-component="comment-mode-label" class="block text-sm font-medium text-zinc-300">Immersion commenting (Phase 6)</span> <div data-component="comment-mode-container" class="space-y-2"><button data-component="comment-mode-option-proximity" type="button"${attr_class(`flex w-full items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:bg-white/10 ${stringify("border-primary/50 bg-primary/5" )}`)}><div data-component="comment-mode-proximity-radio"${attr_class(`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${stringify("border-primary bg-primary" )}`)}>`);
			{
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div data-component="comment-mode-proximity-dot" class="h-1.5 w-1.5 rounded-full bg-white"></div>`);
			}
			$$renderer.push(`<!--]--></div> <div data-component="comment-mode-proximity-text" class="space-y-1"><span data-component="comment-mode-proximity-title" class="block text-sm font-semibold text-white">Proximity Reveal (Recommended)</span> <span data-component="comment-mode-proximity-desc" class="block text-xs text-zinc-500">Inline comments default to hidden. Writing a comment or tapping reveals other comments for that block to preserve immersion.</span></div></button> <button data-component="comment-mode-option-always" type="button"${attr_class(`flex w-full items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:bg-white/10 ${stringify("")}`)}><div data-component="comment-mode-always-radio"${attr_class(`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${stringify("border-zinc-600")}`)}>`);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div data-component="comment-mode-always-text" class="space-y-1"><span data-component="comment-mode-always-title" class="block text-sm font-semibold text-white">Always Show</span> <span data-component="comment-mode-always-desc" class="block text-xs text-zinc-500">Show all inline comment indicators instantly across the entire scene for deep exploration.</span></div></button> <button data-component="comment-mode-option-hide" type="button"${attr_class(`flex w-full items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:bg-white/10 ${stringify("")}`)}><div data-component="comment-mode-hide-radio"${attr_class(`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${stringify("border-zinc-600")}`)}>`);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div data-component="comment-mode-hide-text" class="space-y-1"><span data-component="comment-mode-hide-title" class="block text-sm font-semibold text-white">Hide All Comments</span> <span data-component="comment-mode-hide-desc" class="block text-xs text-zinc-500">No inline comment elements are displayed. Read in perfect isolation.</span></div></button></div></div> <div data-component="scroll-teaser-group" class="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4"><div data-component="scroll-teaser-text" class="space-y-1"><span data-component="scroll-teaser-title" class="block text-sm font-semibold text-white">Progress Teasers</span> <span data-component="scroll-teaser-desc" class="block text-xs text-zinc-500">Display author typing stats, WPM telemetry, and upcoming content indicators at end-of-scroll.</span></div> <button aria-label="Toggle progress teasers" data-component="scroll-teaser-toggle" type="button"${attr_class(`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${stringify("bg-emerald-500")}`)}><span data-component="scroll-teaser-slider"${attr_class(`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${stringify("translate-x-5")}`)}></span></button></div></div>`);
		}
		$$renderer.push(`<!--]--> <div data-component="settings-save-actions" class="flex justify-end border-t border-white/5 pt-6"><button data-component="settings-save-button" type="submit" class="bg-primary text-primary-foreground shadow-primary/20 rounded-xl px-6 py-3 font-semibold shadow-lg transition-opacity hover:opacity-90">Save Changes</button></div></form></div></div></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-fc01f149.js.map
