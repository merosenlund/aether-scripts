import { b as attr, c as escape_html, a as attr_class, s as stringify } from './dev-db1ab9cf.js';
import { B as Book_open } from './book-open-8545439b.js';
import { F as File_text } from './file-text-6819df47.js';
import { W as WikiSidebar, E as EditorTelemetryHUD } from './EditorTelemetryHUD-4c6b1c75.js';
import { S as Save } from './save-c09f9a5a.js';
import './supabaseClient-824b9cb6.js';
import { T as Tiptap } from './Tiptap-e86896e5.js';
import './Icon-f47d171f.js';
import './index-server-db57e4a7.js';
import './chart-no-axes-column-963ea183.js';
import './clock-731c4c77.js';
import './EventEditorModal-d1c9e0d1.js';
import './plus-54415a1e.js';
import './contextEngine.svelte-fa9b4d62.js';
import './wiki-7e2bc21a.js';
import './zap-132280ce.js';
import './notifications-351a1541.js';
import './CreateWikiEntryModal-93f363b7.js';
import './x-a5e0e5e8.js';
import './warnDeprecatedPackage-103e47c7.js';
import './createBrowserClient-0790f5fc.js';
import './index-8b3ef059.js';
import './BlockMetadata-4e11220d.js';
import './index-a7c7ef40.js';

//#endregion
//#region src/routes/(author)/serials/[id]/scenes/[sceneId]/edit/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let content = data.scene.content_blocks || "";
		data.scene.author_title || "";
		data.scene.display_title || "";
		data.scene.description || "";
		data.scene.summary || "";
		let activeBlockId = "";
		let visibleBlockIds = [];
		let editorComponent = void 0;
		let saveStatus = "synced";
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="absolute inset-0 flex flex-col overflow-hidden bg-stone-950 font-sans text-stone-100"><div class="flex min-h-0 flex-1 overflow-hidden"><div class="animate-fade-in relative flex flex-1 flex-col items-center overflow-hidden px-8 pt-8"><div class="flex h-full min-h-0 w-full max-w-4xl flex-col"><div class="mb-6 flex shrink-0 items-center justify-between"><div class="flex items-center gap-2"><div class="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-widest text-stone-400 uppercase select-none transition-all duration-300 shadow-sm">`);
			if (saveStatus === "saving") {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="relative flex h-1.5 w-1.5"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span> <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></span></span> <span class="text-amber-400/90 animate-pulse font-bold">Saving...</span>`);
			} else if (saveStatus === "error") {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`<span class="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span> <span class="text-rose-400 font-extrabold">Save Error</span>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span> <span class="text-stone-400 text-opacity-80">Synced</span>`);
			}
			$$renderer.push(`<!--]--></div></div> <div class="flex gap-3"><button${attr("disabled", editorComponent?.getIsSaving?.(), true)} class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-xl px-5 py-2 text-xs font-bold shadow-lg transition-all hover:opacity-90 disabled:opacity-50">`);
			Save($$renderer, { class: "mr-2 h-3.5 w-3.5" });
			$$renderer.push(`<!----> ${escape_html("Create Snapshot")}</button></div></div> <div class="group relative min-h-0 flex-1">`);
			Tiptap($$renderer, {
				initialContent: data.scene.content_blocks || null,
				sceneId: data.scene.id,
				serialId: data.scene.serial_id,
				wikiFilterMode: "author",
				onUpdate: (html) => content = html,
				get content() {
					return content;
				},
				set content($$value) {
					content = $$value;
					$$settled = false;
				},
				get saveStatus() {
					return saveStatus;
				},
				set saveStatus($$value) {
					saveStatus = $$value;
					$$settled = false;
				},
				get activeBlockId() {
					return activeBlockId;
				},
				set activeBlockId($$value) {
					activeBlockId = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----></div></div></div> <aside class="z-20 flex w-85 flex-col overflow-y-auto border-l border-white/5 bg-stone-900/20 shadow-2xl backdrop-blur-3xl"><div class="flex gap-2 border-b border-white/5 bg-white/5 p-4"><button${attr_class(`flex flex-1 items-center justify-center rounded-lg py-2 text-[10px] font-bold tracking-widest uppercase transition-all ${stringify("bg-primary shadow-primary/20 text-white shadow-lg" )}`)}>`);
			Book_open($$renderer, { class: "mr-2 h-3.5 w-3.5" });
			$$renderer.push(`<!----> Wiki</button> <button${attr_class(`flex flex-1 items-center justify-center rounded-lg py-2 text-[10px] font-bold tracking-widest uppercase transition-all ${stringify("text-stone-500 hover:bg-white/5 hover:text-white")}`)}>`);
			File_text($$renderer, { class: "mr-2 h-3.5 w-3.5" });
			$$renderer.push(`<!----> Meta</button></div> <div class="flex-1 overflow-hidden">`);
			{
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="h-full">`);
				WikiSidebar($$renderer, {
					serialId: data.scene.serial_id,
					sceneId: data.scene.id,
					scenes: [{
						id: data.scene.id,
						author_title: data.scene.author_title,
						display_title: data.scene.display_title,
						order_index: data.scene.order_index
					}],
					activeBlockId,
					visibleBlockIds
				});
				$$renderer.push(`<!----></div>`);
			}
			$$renderer.push(`<!--]--></div></aside></div> `);
			EditorTelemetryHUD($$renderer, {
				serialId: data.scene.serial_id,
				sceneId: data.scene.id,
				serialTitle: data.scene.serials?.title || "",
				sessionType: "edit",
				initialContent: data.scene.content_blocks || ""
			});
			$$renderer.push(`<!----></div>`);
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
//# sourceMappingURL=_page.svelte-939498a1.js.map
