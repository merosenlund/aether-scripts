import { e as ensure_array_like, a as attr_class, s as stringify, c as escape_html, b as attr, i as spread_props, l as derived } from './dev-db1ab9cf.js';
import './client-ffaaeca1.js';
import { I as Icon } from './Icon-f47d171f.js';
import { A as Award } from './award-524e0e66.js';
import { C as Calendar } from './calendar-4075bd8d.js';
import { E as Eye } from './eye-849886c2.js';
import { G as Git_branch } from './git-branch-f40f8e55.js';
import { I as Info } from './info-dd6f46ee.js';
import { S as Save } from './save-c09f9a5a.js';
import './supabaseClient-824b9cb6.js';
import './internal-8a8e9ef7.js';
import './index-21b402be.js';
import './warnDeprecatedPackage-103e47c7.js';
import './createBrowserClient-0790f5fc.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/shield-check.svelte
function Shield_check($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "shield-check" },
		props,
		{ iconNode: [["path", { "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { "d": "m9 12 2 2 4-4" }]] }
	]));
}
//#endregion
//#region src/routes/(author)/serials/[id]/scenes/[sceneId]/share/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let initialStatus = data.scene.status || "Playing";
		let initialSemVer = data.scene.semantic_version || "1.0.0";
		let initialScheduledAt = data.scene.scheduled_status_at;
		let activeStatus = initialStatus;
		let semanticVersion = initialSemVer;
		let isScheduled = !!initialScheduledAt;
		let scheduledDate = initialScheduledAt ? initialScheduledAt.split("T")[0] : "";
		let scheduledTime = initialScheduledAt ? initialScheduledAt.split("T")[1]?.substring(0, 5) : "08:00";
		let initialTeaserPercent = data.scene.serials?.next_scene_completion_percentage || 0;
		let initialTeaserNote = data.scene.serials?.next_scene_update_note || "";
		let teaserPercent = initialTeaserPercent;
		let teaserNote = initialTeaserNote;
		let isSavingScene = false;
		let isSavingTeaser = false;
		let isDirty = derived(() => activeStatus !== (data.scene.status || "Playing") || semanticVersion !== (data.scene.semantic_version || "1.0.0") || isScheduled !== !!data.scene.scheduled_status_at || isScheduled && scheduledDate !== (data.scene.scheduled_status_at ? data.scene.scheduled_status_at.split("T")[0] : "") || isScheduled && scheduledTime !== (data.scene.scheduled_status_at ? data.scene.scheduled_status_at.split("T")[1]?.substring(0, 5) : "08:00"));
		const statusLevels = [
			{
				name: "Playing",
				desc: "Currently in active play/journaling mode. Hidden from readers.",
				color: "text-stone-500 bg-stone-500/10"
			},
			{
				name: "Editing",
				desc: "Drafting finished, currently polishing narrative text. Hidden from readers.",
				color: "text-amber-500 bg-amber-500/10"
			},
			{
				name: "Beta",
				desc: "Available only to beta readers or special premium tiers.",
				color: "text-blue-500 bg-blue-500/10"
			},
			{
				name: "Published",
				desc: "Fully released and readable by all subscribers.",
				color: "text-emerald-500 bg-emerald-500/10"
			},
			{
				name: "Hidden",
				desc: "Archived or temporarily hidden from feeds.",
				color: "text-rose-500 bg-rose-500/10"
			}
		];
		$$renderer.push(`<div class="absolute inset-0 overflow-y-auto bg-stone-950 p-8 font-sans text-stone-100"><div class="mx-auto max-w-4xl space-y-8 pb-32"><div class="space-y-2"><h2 class="font-serif text-3xl font-bold text-white/95">Publishing &amp; Sharing Workspace</h2> <p class="max-w-2xl text-sm leading-relaxed text-stone-500">Manage scene visibility, queue scheduled status transitions, tag semantic versions, and
				construct upcoming teaser metrics for your reader base.</p></div> <div class="grid grid-cols-1 gap-8 md:grid-cols-3"><div class="space-y-6 md:col-span-2"><div class="space-y-5 rounded-3xl border border-white/5 bg-stone-900/40 p-6 backdrop-blur-md"><h3 class="flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold tracking-widest text-stone-400 uppercase">`);
		Eye($$renderer, { class: "text-primary h-4 w-4" });
		$$renderer.push(`<!----> Access-Based Status Hierarchy</h3> <div class="grid grid-cols-1 gap-2.5"><!--[-->`);
		const each_array = ensure_array_like(statusLevels);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let level = each_array[$$index];
			$$renderer.push(`<button${attr_class(`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${stringify(activeStatus === level.name ? "border-primary bg-white/[0.03] shadow-[0_0_12px_rgba(var(--primary),0.03)]" : "border-white/5 bg-transparent hover:border-white/10")}`)}><div${attr_class(`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${stringify(activeStatus === level.name ? "border-primary" : "border-stone-600")}`)}>`);
			if (activeStatus === level.name) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="bg-primary h-2.5 w-2.5 animate-pulse rounded-full"></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="space-y-1"><div class="flex items-center gap-2"><span class="text-sm font-bold text-white/90">${escape_html(level.name)}</span> <span${attr_class(`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${stringify(level.color)}`)}>Hierarchy Level</span></div> <p class="text-xs leading-relaxed font-medium text-stone-500">${escape_html(level.desc)}</p></div></button>`);
		}
		$$renderer.push(`<!--]--></div></div> <div class="space-y-5 rounded-3xl border border-white/5 bg-stone-900/40 p-6 backdrop-blur-md"><div class="flex items-center justify-between border-b border-white/5 pb-3"><h3 class="flex items-center gap-2 text-sm font-bold tracking-widest text-stone-400 uppercase">`);
		Calendar($$renderer, { class: "text-primary h-4 w-4" });
		$$renderer.push(`<!----> Scheduled Status Transitions</h3> <button${attr_class(`rounded-xl border px-3.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all ${stringify(isScheduled ? "bg-primary/20 border-primary text-primary" : "border-white/10 bg-white/5 text-stone-500 hover:text-white")}`)}>${escape_html(isScheduled ? "Enabled" : "Disabled")}</button></div> `);
		if (isScheduled) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div class="space-y-1.5"><label for="sched_date" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Release Date</label> <input id="sched_date" type="date"${attr("value", scheduledDate)} class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-stone-100 transition-all focus:outline-none"/></div> <div class="space-y-1.5"><label for="sched_time" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Release Time</label> <input id="sched_time" type="time"${attr("value", scheduledTime)} class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-stone-100 transition-all focus:outline-none"/></div></div> <div class="flex items-start gap-2.5 rounded-2xl border border-white/5 bg-white/[0.01] p-4">`);
			Info($$renderer, { class: "mt-0.5 h-4 w-4 shrink-0 text-stone-500" });
			$$renderer.push(`<!----> <p class="text-[10px] leading-relaxed font-medium text-stone-500">Decoupled Query-Time execution model: Readers' notification schedules in Phase 6
								will actively check this timestamp. A background cron job is not required to publish
								it.</p></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<p class="text-xs text-stone-500 italic">This scene will switch state immediately upon saving.</p>`);
		}
		$$renderer.push(`<!--]--></div></div> <div class="space-y-6"><div class="space-y-5 rounded-3xl border border-white/5 bg-stone-900/40 p-6 backdrop-blur-md"><h3 class="flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold tracking-widest text-stone-400 uppercase">`);
		Git_branch($$renderer, { class: "text-primary h-4 w-4" });
		$$renderer.push(`<!----> Semantic Versioning</h3> <div class="space-y-4"><div class="space-y-1.5"><label for="sem_ver" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Reader-facing Version</label> <input id="sem_ver" type="text"${attr("value", semanticVersion)} class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center font-mono text-sm tracking-widest text-stone-100 transition-all focus:outline-none" placeholder="e.g. 1.0.0"/></div> <div class="grid grid-cols-3 gap-2"><button class="rounded-xl border border-white/5 bg-white/[0.02] py-2 text-[10px] font-bold tracking-wider uppercase transition-all hover:border-white/10 hover:bg-white/5">+ Major</button> <button class="rounded-xl border border-white/5 bg-white/[0.02] py-2 text-[10px] font-bold tracking-wider uppercase transition-all hover:border-white/10 hover:bg-white/5">+ Minor</button> <button class="rounded-xl border border-white/5 bg-white/[0.02] py-2 text-[10px] font-bold tracking-wider uppercase transition-all hover:border-white/10 hover:bg-white/5">+ Patch</button></div> <p class="text-[9px] leading-relaxed font-medium text-stone-500">Use Major for full rewrites, Minor for polish/additions, and Patch for small typo
							fixes.</p></div></div> <div class="space-y-5 rounded-3xl border border-white/5 bg-stone-900/40 p-6 backdrop-blur-md"><h3 class="flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold tracking-widest text-stone-400 uppercase">`);
		Award($$renderer, { class: "text-primary h-4 w-4" });
		$$renderer.push(`<!----> Upcoming Teaser</h3> <div class="space-y-4"><div class="space-y-2"><div class="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase"><label for="teaser_percent" class="text-stone-400">Completion</label> <span class="text-primary font-mono">${escape_html(activeStatus === "Playing" ? Math.min(100, Math.round((data.scene.word_count || 0) / 1e3 * 100)) : teaserPercent)}%</span></div> `);
		if (activeStatus === "Playing") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 text-[10px] leading-relaxed font-medium text-stone-500">ℹ️ Live word count automatic teaser: calculated based on your 1000 words
									rule-of-thumb while in <span class="text-primary font-bold">Playing</span> status.
									Current scene word count: <span class="font-bold text-white">${escape_html(data.scene.word_count || 0)} / 1000</span> words.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div><input id="teaser_percent" type="range" min="0" max="100"${attr("value", teaserPercent)} class="accent-primary h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10"/> <p class="mt-1.5 text-[9px] leading-relaxed font-medium text-stone-500">Adjust this slider manually to represent your editing progress for readers.</p></div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="space-y-1.5"><label for="teaser_note" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Update Teaser Note</label> <textarea id="teaser_note" rows="3" class="focus:border-primary/50 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs leading-relaxed text-stone-200 transition-all focus:outline-none" placeholder="Tease your readers with what's next...">`);
		const $$body = escape_html(teaserNote);
		if ($$body) $$renderer.push(`${$$body}`);
		$$renderer.push(`</textarea></div> <button${attr("disabled", isSavingTeaser, true)} class="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold transition-all hover:border-white/20 hover:bg-white/10">`);
		Save($$renderer, { class: "h-4 w-4 text-stone-400" });
		$$renderer.push(`<!----> ${escape_html("Save Teaser")}</button></div></div></div></div> `);
		if (isDirty()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="fixed bottom-6 left-1/2 z-40 w-full max-w-4xl -translate-x-1/2 px-8"><div class="flex items-center justify-between rounded-2xl border border-white/10 bg-stone-900/90 p-4 shadow-2xl backdrop-blur-xl"><div class="flex items-center gap-2">`);
			Shield_check($$renderer, { class: "h-5 w-5 text-emerald-400" });
			$$renderer.push(`<!----> <span class="text-xs font-bold text-stone-300">Unsaved scene configuration settings.</span></div> <button${attr("disabled", isSavingScene, true)} class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-xl px-6 py-2.5 text-xs font-bold shadow-lg transition-all hover:opacity-90 disabled:opacity-50">`);
			Save($$renderer, { class: "mr-2 h-4 w-4" });
			$$renderer.push(`<!----> ${escape_html("Save Configuration")}</button></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-32ea119b.js.map
