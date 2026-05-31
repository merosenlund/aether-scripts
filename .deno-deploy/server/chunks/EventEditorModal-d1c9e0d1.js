import { i as spread_props, c as escape_html, a as attr_class, b as attr, l as derived, s as stringify } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/pencil.svelte
function Pencil($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "pencil" },
		props,
		{ iconNode: [["path", { "d": "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }], ["path", { "d": "m15 5 4 4" }]] }
	]));
}
//#endregion
//#region src/lib/components/wiki/EventEditorModal.svelte
function EventEditorModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { event, isOpen, onClose, onSubmit } = $$props;
		let editedContent = "";
		let editedReason = "";
		const canEvolve = derived(() => event && [
			"add_fact",
			"update_name",
			"update_description"
		].includes(event.event_type));
		function formatEventType(type) {
			return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
		}
		if (isOpen && event) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4" role="button" tabindex="-1"><div class="w-full max-w-md rounded-2xl border border-white/10 bg-stone-900 shadow-2xl overflow-hidden" role="dialog" tabindex="-1"><div class="border-b border-white/5 p-4 flex items-center justify-between bg-white/[0.02]"><h3 class="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2">Edit <span class="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[9px]">${escape_html(formatEventType(event.event_type))}</span></h3> <button class="text-stone-500 hover:text-white transition-colors">✕</button></div> <div class="p-6 space-y-6">`);
			if (canEvolve()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="flex bg-stone-950/50 rounded-lg p-1 border border-white/5"><button${attr_class(`flex-1 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-md transition-all ${stringify("bg-primary text-primary-foreground" )}`)}>Correct Typo</button> <button${attr_class(`flex-1 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-md transition-all ${stringify("text-stone-500 hover:text-stone-300")}`)}>Evolve Narrative</button></div> `);
				{
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="text-[10px] text-stone-400 bg-white/5 rounded-lg p-3"><strong>Correct Mode:</strong> Edits the event payload directly. Use this to fix spelling mistakes or reword something without changing the chronological history.</div>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="space-y-4">`);
			if ([
				"add_fact",
				"update_name",
				"update_description",
				"create"
			].includes(event.event_type)) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="space-y-1.5"><label for="edit-content-input" class="text-[10px] font-bold tracking-widest text-stone-500 uppercase">${escape_html(event.event_type === "add_fact" ? "Fact Content" : event.event_type === "update_description" ? "Description" : "Name")}</label> `);
				if (event.event_type === "update_name" || event.event_type === "create") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<input id="edit-content-input" type="text"${attr("value", editedContent)} class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"/>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<textarea id="edit-content-input" rows="3" class="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50">`);
					const $$body = escape_html(editedContent);
					if ($$body) $$renderer.push(`${$$body}`);
					$$renderer.push(`</textarea>`);
				}
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="space-y-1.5"><label for="edit-reason-input" class="text-[10px] font-bold tracking-widest text-stone-500 uppercase">Reason <span class="font-normal normal-case opacity-50">(optional)</span></label> <input id="edit-reason-input" type="text"${attr("value", editedReason)} placeholder="Why did this happen?" class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"/></div></div></div> <div class="border-t border-white/5 p-4 flex gap-3 bg-white/[0.02]"><button class="flex-1 py-2.5 text-xs font-bold text-stone-400 hover:text-white transition-colors">Cancel</button> <button${attr_class(`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${stringify("bg-primary text-primary-foreground hover:opacity-90")}`)}>${escape_html("Save Changes")}</button></div></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}

export { EventEditorModal as E, Pencil as P };
//# sourceMappingURL=EventEditorModal-d1c9e0d1.js.map
