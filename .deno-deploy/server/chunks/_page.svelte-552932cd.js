import { e as ensure_array_like, a as attr_class, s as stringify, c as escape_html } from './dev-db1ab9cf.js';
import { C as Calendar } from './calendar-4075bd8d.js';
import { H as History } from './history-591ca8e4.js';
import './supabaseClient-824b9cb6.js';
import './Tiptap-e86896e5.js';
import './Icon-f47d171f.js';
import './warnDeprecatedPackage-103e47c7.js';
import './createBrowserClient-0790f5fc.js';
import './index-server-db57e4a7.js';
import './index-8b3ef059.js';
import './contextEngine.svelte-fa9b4d62.js';
import './wiki-7e2bc21a.js';
import './notifications-351a1541.js';
import './BlockMetadata-4e11220d.js';
import './index-a7c7ef40.js';

//#region src/routes/(author)/serials/[id]/scenes/[sceneId]/history/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		data.scene.content_blocks;
		let selectedVersionId = null;
		function formatDate(dateStr) {
			return new Date(dateStr).toLocaleDateString(void 0, {
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit"
			});
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="absolute inset-0 flex overflow-hidden bg-stone-950 font-sans text-stone-100"><aside class="flex w-80 shrink-0 flex-col border-r border-white/5 bg-stone-900/10"><div class="border-b border-white/5 bg-white/[0.02] p-6"><h3 class="flex items-center gap-2 text-xs font-bold tracking-widest text-stone-500 uppercase">`);
			History($$renderer, { class: "text-primary h-4 w-4" });
			$$renderer.push(`<!----> Snapshot History</h3> <p class="mt-1 text-[10px] leading-relaxed font-medium text-stone-600">Select a read-only snapshot from the past to compare against your active track.</p></div> <div class="flex-1 space-y-2.5 overflow-y-auto p-4">`);
			if (data.versions.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-8 text-center"><p class="mb-1 text-[10px] font-bold tracking-widest text-stone-600 uppercase">No Snapshots</p> <p class="text-xs text-stone-700 italic">Save a snapshot in the Editor to start version tracking.</p></div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(data.versions);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let ver = each_array[$$index];
					$$renderer.push(`<button${attr_class(`group flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${stringify(selectedVersionId === ver.id ? "bg-primary/10 border-primary shadow-[0_0_12px_rgba(var(--primary),0.05)]" : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5")}`)}><div class="flex w-full items-center justify-between"><span${attr_class(`text-xs font-bold tracking-wider uppercase ${stringify(selectedVersionId === ver.id ? "text-primary" : "text-stone-300")}`)}>Snapshot v${escape_html(ver.version_number)}</span> <span class="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold text-stone-500 uppercase">${escape_html(ver.stage)}</span></div> <div class="flex items-center gap-1.5 text-[10px] font-medium text-stone-500">`);
					Calendar($$renderer, { class: "h-3 w-3 text-stone-600" });
					$$renderer.push(`<!----> <span>${escape_html(formatDate(ver.created_at))}</span></div></button>`);
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div></aside> <div class="relative flex flex-1 overflow-hidden">`);
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"><div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-white/[0.02]">`);
			History($$renderer, { class: "h-8 w-8 text-stone-600" });
			$$renderer.push(`<!----></div> <h3 class="mb-2 font-serif text-lg font-bold text-white/90">Compare Historical Snapshots</h3> <p class="max-w-md text-sm leading-relaxed text-stone-500">Select any past version from the left panel to open the side-by-side comparison screen.
					You'll be able to review history and cherry-pick elements back into your current timeline.</p></div>`);
			$$renderer.push(`<!--]--></div></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-552932cd.js.map
