import { b as attr, c as escape_html } from './dev-db1ab9cf.js';
import { X } from './x-a5e0e5e8.js';
import './supabaseClient-824b9cb6.js';

//#region src/lib/components/wiki/CreateWikiEntryModal.svelte
function CreateWikiEntryModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { serialId, scenes = [], blockId = null, open = false, onClose = () => {}, onCreated = (_entity, _event) => {} } = $$props;
		let newEntityName = "";
		let newEntityCategory = "character";
		let newEntityDesc = "";
		let isCreating = false;
		if (open) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div data-component="create-entry-modal-overlay" class="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md"><div data-component="create-entry-modal-container" class="relative w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-stone-900/90 p-6 shadow-2xl backdrop-blur-3xl"><div data-component="modal-header" class="flex items-center justify-between"><h3 data-component="modal-title" class="text-sm font-bold tracking-tight text-white uppercase">New Wiki Entry</h3> <button data-component="modal-close-btn" class="p-1 text-stone-400 hover:text-white">`);
			X($$renderer, { size: 16 });
			$$renderer.push(`<!----></button></div> <div data-component="modal-body" class="space-y-4"><div data-component="form-name" class="space-y-1"><label for="new_entry_name" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Entry Name</label> <input id="new_entry_name" type="text"${attr("value", newEntityName)} placeholder="e.g. Elena the Mystic" class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white transition-colors focus:outline-none"/></div> <div data-component="form-cat" class="space-y-1"><label for="new_entry_cat" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Category</label> `);
			$$renderer.select({
				id: "new_entry_cat",
				value: newEntityCategory,
				class: "w-full rounded-xl border border-white/10 bg-stone-900 px-4 py-2.5 text-xs text-white focus:outline-none"
			}, ($$renderer) => {
				$$renderer.option({ value: "character" }, ($$renderer) => {
					$$renderer.push(`Character`);
				});
				$$renderer.option({ value: "location" }, ($$renderer) => {
					$$renderer.push(`Location`);
				});
				$$renderer.option({ value: "clock" }, ($$renderer) => {
					$$renderer.push(`Progress Clock`);
				});
				$$renderer.option({ value: "track" }, ($$renderer) => {
					$$renderer.push(`Progress Track`);
				});
				$$renderer.option({ value: "thread" }, ($$renderer) => {
					$$renderer.push(`Lore Thread`);
				});
			});
			$$renderer.push(`</div> <div data-component="form-desc" class="space-y-1"><label for="new_entry_desc" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Brief Description</label> <textarea id="new_entry_desc" placeholder="Short introductory description..." rows="3" class="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none">`);
			const $$body = escape_html(newEntityDesc);
			if ($$body) $$renderer.push(`${$$body}`);
			$$renderer.push(`</textarea></div> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div data-component="modal-footer" class="flex gap-3 pt-2"><button data-component="modal-submit"${attr("disabled", isCreating, true)} class="bg-primary text-primary-foreground flex-1 rounded-xl py-2.5 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50">${escape_html("Create Entry")}</button> <button data-component="modal-cancel" class="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold hover:bg-white/5">Cancel</button></div></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}

export { CreateWikiEntryModal as C };
//# sourceMappingURL=CreateWikiEntryModal-93f363b7.js.map
