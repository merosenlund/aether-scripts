import { o as onDestroy } from './index-server-db57e4a7.js';
import { b as attr, s as stringify, c as escape_html, i as spread_props, l as derived } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';
import { C as Chart_no_axes_column } from './chart-no-axes-column-963ea183.js';
import { C as Clock } from './clock-731c4c77.js';
import { E as EventEditorModal } from './EventEditorModal-d1c9e0d1.js';
import { P as Plus } from './plus-54415a1e.js';
import { c as contextEngine } from './contextEngine.svelte-fa9b4d62.js';
import { Z as Zap } from './zap-132280ce.js';
import { n as notifications } from './notifications-351a1541.js';
import { s as supabase } from './supabaseClient-824b9cb6.js';
import { u as updateWikiEventPayload, a as getWikiEvents, c as createWikiEvent } from './wiki-7e2bc21a.js';
import { C as CreateWikiEntryModal } from './CreateWikiEntryModal-93f363b7.js';
import { t as telemetryStore } from './Tiptap-e86896e5.js';

//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/type.svelte
function Type($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "type" },
		props,
		{ iconNode: [
			["path", { "d": "M12 4v16" }],
			["path", { "d": "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" }],
			["path", { "d": "M9 20h6" }]
		] }
	]));
}
//#endregion
//#region src/lib/components/WikiSidebar.svelte
function WikiSidebar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { serialId, sceneId, activeBlockId, visibleBlockIds = [], scenes = [], onHighlightBlock = (_blockId) => {}, onFocusBlock = (_blockId) => {} } = $$props;
		let searchQuery = "";
		let showCreateModal = false;
		let editingEvent = null;
		let editingEntity = null;
		let showEventModal = false;
		async function handleEventModalSubmit(result) {
			if (!editingEvent || !editingEntity) return;
			try {
				if (result.mode === "correct") {
					await updateWikiEventPayload(editingEvent.id, result.payload);
					contextEngine.rawEvents = await getWikiEvents(sceneId);
					notifications.success("Event updated");
				} else if (result.mode === "evolve") {
					if (!activeBlockId) {
						notifications.error("Click in the editor to select a block first.");
						return;
					}
					if (editingEvent.event_type === "add_fact") {
						await createWikiEvent({
							entity_id: editingEntity.id,
							scene_id: sceneId,
							block_id: activeBlockId,
							event_type: "remove_fact",
							payload: { id: editingEvent.payload?.id }
						});
						await createWikiEvent({
							entity_id: editingEntity.id,
							scene_id: sceneId,
							block_id: activeBlockId,
							event_type: "add_fact",
							payload: {
								id: crypto.randomUUID(),
								content: result.payload.content
							}
						});
					} else if (editingEvent.event_type === "update_name" || editingEvent.event_type === "create") await createWikiEvent({
						entity_id: editingEntity.id,
						scene_id: sceneId,
						block_id: activeBlockId,
						event_type: "update_name",
						payload: { name: result.payload.name }
					});
					else if (editingEvent.event_type === "update_description") await createWikiEvent({
						entity_id: editingEntity.id,
						scene_id: sceneId,
						block_id: activeBlockId,
						event_type: "update_description",
						payload: { description: result.payload.description }
					});
					contextEngine.rawEvents = await getWikiEvents(sceneId);
					notifications.success("Narrative evolved!");
				}
				showEventModal = false;
				editingEvent = null;
				editingEntity = null;
			} catch (e) {
				console.error(e);
				notifications.error("Failed to process event update");
			}
		}
		async function handleEntryCreated() {
			await contextEngine.loadBaseEntities(serialId);
			contextEngine.rawEvents = await getWikiEvents(sceneId);
		}
		$$renderer.push(`<div data-component="wiki-sidebar-root" class="flex h-full flex-col"><div data-component="search-container" class="space-y-3 px-6 py-4"><div data-component="search-actions" class="flex items-center gap-2"><div data-component="search-box" class="relative flex-1"><input data-component="search-input" type="text"${attr("value", searchQuery)} placeholder="Search the world..." class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition-colors focus:outline-none"/></div> <a data-component="manage-wiki-link"${attr("href", `/serials/${stringify(serialId)}/wiki`)} class="flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-stone-300 transition-all hover:bg-white/10" title="Open World Manager"><span data-component="manage-wiki-text" class="mr-1">Manage</span> <span data-component="manage-wiki-arrow" class="text-[10px]">↗</span></a></div></div> <div data-component="entities-scrollport" class="flex-1 space-y-2 overflow-y-auto px-4 pb-6">`);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div data-component="loading-indicator" class="animate-pulse p-8 text-center"><div data-component="loading-spinner" class="mx-auto mb-4 h-8 w-8 rounded-full bg-white/10"></div> <div data-component="loading-bar" class="mx-auto h-2 w-24 rounded bg-white/10"></div></div>`);
		$$renderer.push(`<!--]--></div> <div data-component="sidebar-actions" class="border-t border-white/5 bg-white/[0.02] p-4"><button data-component="new-entry-btn" class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase transition-all hover:border-white/20 hover:text-white">`);
		Plus($$renderer, { size: 14 });
		$$renderer.push(`<!----> New Wiki Entry</button></div> `);
		CreateWikiEntryModal($$renderer, {
			serialId,
			scenes,
			blockId: activeBlockId,
			open: showCreateModal,
			onClose: () => showCreateModal = false,
			onCreated: handleEntryCreated
		});
		$$renderer.push(`<!----> `);
		EventEditorModal($$renderer, {
			event: editingEvent,
			isOpen: showEventModal,
			onClose: () => {
				showEventModal = false;
				editingEvent = null;
				editingEntity = null;
			},
			onSubmit: handleEventModalSubmit
		});
		$$renderer.push(`<!----></div>`);
	});
}
//#endregion
//#region src/lib/components/editor/EditorTelemetryHUD.svelte
function EditorTelemetryHUD($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { serialId = "", sceneId = "", serialTitle = "", sessionType = "play", initialContent = "" } = $$props;
		let otherScenesWordCount = 0;
		function formatTime(seconds) {
			const hrs = Math.floor(seconds / 3600);
			const mins = Math.floor(seconds % 3600 / 60);
			const secs = seconds % 60;
			if (hrs > 0) return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
			return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
		}
		let seriesWordCount = derived(() => otherScenesWordCount + telemetryStore.currentWordCount);
		let sessionWordsDelta = derived(() => telemetryStore.currentWordCount - telemetryStore.startingWordCount);
		onDestroy(() => {
			handleUnload();
			if (typeof window !== "undefined") window.removeEventListener("beforeunload", handleUnload);
		});
		function handleUnload() {
			if (telemetryStore.isActive) {
				const finalCount = telemetryStore.currentWordCount;
				supabase.from("scenes").update({ word_count: finalCount }).eq("id", sceneId).then();
				telemetryStore.endSession();
			}
		}
		$$renderer.push(`<div class="relative z-30 flex w-full shrink-0 items-center justify-between border-t border-white/5 bg-stone-900/90 px-8 py-3.5 text-xs font-medium text-stone-400 shadow-2xl backdrop-blur-xl"><div class="via-primary/30 absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent"></div> <div class="flex items-center gap-6"><div class="flex items-center gap-2">`);
		Type($$renderer, { class: "h-3.5 w-3.5 text-stone-500" });
		$$renderer.push(`<!----> <span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase">Scene:</span> <span class="font-mono text-sm font-bold text-stone-200">${escape_html(telemetryStore.currentWordCount)}</span> <span class="text-stone-600">words</span></div> <div class="h-4 w-px bg-white/10"></div> <div class="flex items-center gap-2">`);
		Chart_no_axes_column($$renderer, { class: "h-3.5 w-3.5 text-stone-500" });
		$$renderer.push(`<!----> <span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase">Series Total:</span> <span class="font-mono text-sm font-bold text-stone-200">${escape_html(seriesWordCount())}</span> <span class="text-stone-600">words</span></div></div> <div class="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-4 py-1 shadow-inner">`);
		if (sessionWordsDelta() >= 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="font-mono text-[11px] font-bold text-emerald-400">+${escape_html(sessionWordsDelta())}</span>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span class="font-mono text-[11px] font-bold text-rose-400">${escape_html(sessionWordsDelta())}</span>`);
		}
		$$renderer.push(`<!--]--> <span class="text-[10px] font-bold tracking-wider text-stone-600 uppercase">this session</span></div> <div class="flex items-center gap-6"><div class="flex items-center gap-2">`);
		Clock($$renderer, { class: "h-3.5 w-3.5 text-stone-500" });
		$$renderer.push(`<!----> <span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase">Elapsed:</span> <span class="font-mono text-sm font-bold text-stone-200">${escape_html(formatTime(telemetryStore.durationSeconds))}</span></div> <div class="h-4 w-px bg-white/10"></div> <div class="flex items-center gap-2">`);
		Zap($$renderer, { class: "h-3.5 w-3.5 text-stone-500" });
		$$renderer.push(`<!----> <span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase">Speed:</span> <span class="font-mono text-sm font-bold text-stone-200">${escape_html(telemetryStore.wpm)}</span> <span class="text-[10px] font-bold tracking-wider text-stone-600 uppercase">WPM</span></div> <div class="hidden items-center gap-2 sm:flex"><div class="mr-4 h-4 w-px bg-white/10"></div> <span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase">Keystrokes:</span> <span class="font-mono font-bold text-stone-300">${escape_html(telemetryStore.keystrokes)}</span></div></div></div>`);
	});
}

export { EditorTelemetryHUD as E, WikiSidebar as W };
//# sourceMappingURL=EditorTelemetryHUD-4c6b1c75.js.map
