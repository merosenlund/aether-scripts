import { n as getContext, c as escape_html, e as ensure_array_like, b as attr, a as attr_class, f as attr_style, s as stringify, i as spread_props, l as derived, d as store_get, g as unsubscribe_stores } from './dev-db1ab9cf.js';
import './client-ffaaeca1.js';
import { I as Icon } from './Icon-f47d171f.js';
import { A as Activity } from './activity-930605c0.js';
import { A as Arrow_right } from './arrow-right-ccf77b9c.js';
import { F as Flag, M as Map_pin } from './map-pin-dddfec13.js';
import { P as Pencil, E as EventEditorModal } from './EventEditorModal-d1c9e0d1.js';
import { P as Plus } from './plus-54415a1e.js';
import { S as Sparkles, r as reduceEntityEvents } from './contextEngine.svelte-fa9b4d62.js';
import { T as Timer } from './timer-6bd4adc3.js';
import { T as Trash_2 } from './trash-2-84c1de2c.js';
import { U as User } from './user-63b71bea.js';
import { n as notifications } from './notifications-351a1541.js';
import { p as page } from './stores-225b455b.js';
import { u as updateWikiEventPayload, c as createWikiEvent } from './wiki-7e2bc21a.js';
import './internal-8a8e9ef7.js';
import './index-21b402be.js';
import './supabaseClient-824b9cb6.js';
import './warnDeprecatedPackage-103e47c7.js';
import './createBrowserClient-0790f5fc.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/chevron-down.svelte
function Chevron_down($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "chevron-down" },
		props,
		{ iconNode: [["path", { "d": "m6 9 6 6 6-6" }]] }
	]));
}
//#endregion
//#region src/routes/(author)/serials/[id]/wiki/[entityId]/overview/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { data } = $$props;
		const wiki = getContext("wiki");
		const entityId = derived(() => store_get($$store_subs ??= {}, "$page", page).params.entityId);
		const entity = derived(() => wiki.entities.find((e) => e.id === entityId()));
		const entityEvents = derived(() => wiki.events.filter((ev) => ev.entity_id === entityId()));
		let inlineFactText = "";
		let editingEvent = null;
		let showEventModal = false;
		let editingFactId = null;
		let editingFactValue = "";
		const entityState = derived(() => entity() ? reduceEntityEvents([...entityEvents()].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), entity()) : null);
		function getIcon(category) {
			switch (category?.toLowerCase()) {
				case "character": return User;
				case "location": return Map_pin;
				case "thread": return Flag;
				case "clock": return Timer;
				case "track": return Activity;
				default: return Sparkles;
			}
		}
		async function handleEventModalSubmit(result) {
			if (!editingEvent || !entity()) return;
			try {
				if (result.mode === "correct") {
					await updateWikiEventPayload(editingEvent.id, result.payload);
					wiki.updateEvent(editingEvent.id, result.payload);
					notifications.success("Event updated");
				} else if (result.mode === "evolve") {
					const blockId = null;
					const sceneId = null;
					if (editingEvent.event_type === "add_fact") {
						const remEv = await createWikiEvent({
							entity_id: entity().id,
							scene_id: sceneId,
							block_id: blockId,
							event_type: "remove_fact",
							payload: { id: editingEvent.payload?.id }
						});
						wiki.addEvent({
							...remEv,
							wiki_entities: entity()
						});
						const addEv = await createWikiEvent({
							entity_id: entity().id,
							scene_id: sceneId,
							block_id: blockId,
							event_type: "add_fact",
							payload: {
								id: crypto.randomUUID(),
								content: result.payload.content
							}
						});
						wiki.addEvent({
							...addEv,
							wiki_entities: entity()
						});
					} else if (editingEvent.event_type === "update_name" || editingEvent.event_type === "create") {
						const ev = await createWikiEvent({
							entity_id: entity().id,
							scene_id: sceneId,
							block_id: blockId,
							event_type: "update_name",
							payload: { name: result.payload.name }
						});
						wiki.addEvent({
							...ev,
							wiki_entities: entity()
						});
					} else if (editingEvent.event_type === "update_description") {
						const ev = await createWikiEvent({
							entity_id: entity().id,
							scene_id: sceneId,
							block_id: blockId,
							event_type: "update_description",
							payload: { description: result.payload.description }
						});
						wiki.addEvent({
							...ev,
							wiki_entities: entity()
						});
					}
					notifications.success("Narrative evolved!");
				}
				showEventModal = false;
				editingEvent = null;
			} catch (e) {
				console.error(e);
				notifications.error("Failed to process event update");
			}
		}
		function formatEventType(type) {
			return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
		}
		if (entity() && entityState()) {
			$$renderer.push("<!--[0-->");
			const Icon = getIcon(entity().category);
			$$renderer.push(`<div data-component="overview-page" class="flex min-h-0 flex-1 overflow-hidden"><div data-component="entity-detail" class="flex-1 overflow-y-auto p-8"><div data-component="entity-header" class="mb-8 flex items-start gap-4"><div data-component="entity-icon" class="bg-primary/10 text-primary rounded-2xl p-4">`);
			if (Icon) {
				$$renderer.push("<!--[-->");
				Icon($$renderer, { size: 24 });
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
			$$renderer.push(`</div> <div data-component="entity-titles" class="flex-1 min-w-0">`);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<button data-component="entity-name" class="group/name flex items-center gap-2 text-xl font-bold tracking-tight text-white">${escape_html(entityState().name)} `);
			Pencil($$renderer, {
				"data-component": "name-edit-hint",
				size: 12,
				class: "text-stone-600 opacity-0 transition-opacity group-hover/name:opacity-100"
			});
			$$renderer.push(`<!----></button>`);
			$$renderer.push(`<!--]--> `);
			{
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<button data-component="entity-category" class="group/cat text-primary flex items-center gap-1 text-[10px] font-black tracking-widest uppercase">${escape_html(entity().category)} `);
				Pencil($$renderer, {
					"data-component": "cat-edit-hint",
					size: 9,
					class: "text-stone-600 opacity-0 transition-opacity group-hover/cat:opacity-100"
				});
				$$renderer.push(`<!----></button>`);
			}
			$$renderer.push(`<!--]--></div> <button data-component="entity-delete-btn" title="Delete entity" class="mt-1 p-2 text-stone-700 transition-colors hover:text-rose-400">`);
			Trash_2($$renderer, { size: 15 });
			$$renderer.push(`<!----></button></div> `);
			if (entityState().description) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div data-component="entity-description" class="mb-6"><h3 data-component="section-label" class="mb-2 text-[10px] font-bold tracking-widest text-stone-500 uppercase">Description</h3> <p data-component="desc-text" class="text-sm leading-relaxed text-stone-400">${escape_html(entityState().description)}</p></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if ([
				"character",
				"location",
				"thread"
			].includes(entity().category?.toLowerCase())) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div data-component="facts-section" class="mb-6"><h3 data-component="facts-label" class="mb-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase">Active Facts</h3> <div data-component="facts-list" class="space-y-2"><!--[-->`);
				const each_array = ensure_array_like(entityState().facts);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let fact = each_array[$$index];
					const isEditingThisFact = editingFactId === fact.id;
					$$renderer.push(`<div data-component="fact-item" class="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10"><div data-component="fact-bullet" class="bg-primary/30 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"></div> `);
					if (isEditingThisFact) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<input data-component="fact-edit-input" type="text"${attr("value", editingFactValue)} class="flex-1 rounded-lg border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white focus:outline-none"/>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<button data-component="fact-content" class="group/fact flex-1 text-left text-xs leading-relaxed text-stone-300">${escape_html(fact.content)} `);
						Pencil($$renderer, {
							"data-component": "fact-edit-hint",
							size: 9,
							class: "ml-1 inline-block text-stone-600 opacity-0 transition-opacity group-hover/fact:opacity-100"
						});
						$$renderer.push(`<!----></button>`);
					}
					$$renderer.push(`<!--]--></div>`);
				}
				$$renderer.push(`<!--]--> <form data-component="inline-fact-form" class="flex gap-2"><input data-component="inline-fact-input" type="text"${attr("value", inlineFactText)} placeholder="Add a new fact..." class="flex-1 rounded-xl border border-dashed border-white/10 bg-transparent px-4 py-2.5 text-xs text-white placeholder-stone-600 transition-colors focus:border-white/20 focus:outline-none"/> `);
				if (inlineFactText.trim());
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></form></div></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (entity().category?.toLowerCase() === "clock") {
				$$renderer.push("<!--[0-->");
				const segments = entityState().metadata?.segments || 4;
				const filled = entityState().metadata?.filled || 0;
				$$renderer.push(`<div data-component="clock-section" class="mb-6"><h3 data-component="clock-label" class="mb-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase">Clock Progress</h3> <div data-component="clock-controls" class="flex items-center gap-4"><button data-component="clock-dec" title="Hold Shift to add a reason" class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-stone-400 transition-all hover:border-white/20 hover:text-white">−</button> <div data-component="clock-segments" class="flex gap-1.5"><!--[-->`);
				const each_array_1 = ensure_array_like(Array(segments));
				for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
					each_array_1[i];
					$$renderer.push(`<div data-component="clock-segment"${attr_class(`h-6 w-6 rounded-full border-2 transition-all ${stringify(i < filled ? "border-primary bg-primary/40" : "border-white/10 bg-white/[0.02]")}`)}></div>`);
				}
				$$renderer.push(`<!--]--></div> <button data-component="clock-inc" title="Hold Shift to add a reason" class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-stone-400 transition-all hover:border-white/20 hover:text-white">+</button> <span data-component="clock-count" class="text-xs font-bold text-stone-500">${escape_html(filled)}/${escape_html(segments)}</span></div></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (entity().category?.toLowerCase() === "track") {
				$$renderer.push("<!--[0-->");
				const max = entityState().metadata?.max || 10;
				const current = entityState().metadata?.current || 0;
				$$renderer.push(`<div data-component="track-section" class="mb-6"><h3 data-component="track-label" class="mb-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase">Track Progress</h3> <div data-component="track-controls" class="flex items-center gap-4"><button data-component="track-dec" title="Hold Shift to add a reason" class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-stone-400 transition-all hover:border-white/20 hover:text-white">−</button> <div data-component="track-bar" class="flex-1"><div data-component="track-bar-bg" class="h-3 overflow-hidden rounded-full bg-white/5"><div data-component="track-bar-fill" class="bg-primary/60 h-full rounded-full transition-all duration-300"${attr_style(`width: ${stringify(current / max * 100)}%`)}></div></div></div> <button data-component="track-inc" title="Hold Shift to add a reason" class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-stone-400 transition-all hover:border-white/20 hover:text-white">+</button> <span data-component="track-count" class="text-xs font-bold text-stone-500">${escape_html(current)}/${escape_html(max)}</span></div></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <aside data-component="event-timeline" class="flex w-96 shrink-0 flex-col border-l border-white/5 bg-stone-900/20"><div data-component="timeline-header" class="flex items-center justify-between border-b border-white/5 p-4"><div data-component="timeline-title-row" class="flex items-center gap-2"><button data-component="timeline-toggle" class="text-stone-500">`);
			$$renderer.push("<!--[0-->");
			Chevron_down($$renderer, { size: 14 });
			$$renderer.push(`<!--]--></button> <h3 data-component="timeline-title" class="text-[10px] font-bold tracking-widest text-stone-500 uppercase">Event Log (${escape_html(entityEvents().length)})</h3></div> <div data-component="timeline-actions" class="flex items-center gap-2"><button${attr_class(`text-primary flex items-center gap-1 text-[10px] font-bold transition-opacity hover:opacity-80 ${stringify("")}`)}>${escape_html("Bulk Edit")}</button> <a data-component="view-anchors-link"${attr("href", `/serials/${stringify(data.serial.id)}/wiki/${stringify(entityId())}/events`)} class="text-primary ml-2 flex items-center gap-1 text-[10px] font-bold transition-opacity hover:opacity-80">View Anchors `);
			Arrow_right($$renderer, { size: 12 });
			$$renderer.push(`<!----></a></div></div> `);
			{
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div data-component="timeline-scroller" class="flex-1 overflow-y-auto p-4"><div class="flex gap-2 mb-4"><button data-component="trigger-event-btn" class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase transition-all hover:border-white/20 hover:text-white">`);
				Plus($$renderer, { size: 14 });
				$$renderer.push(`<!----> Trigger Event</button> `);
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div> <div data-component="events-list" class="space-y-2"><!--[-->`);
				const each_array_2 = ensure_array_like(entityEvents());
				for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
					let event = each_array_2[$$index_2];
					$$renderer.push(`<div data-component="event-card" class="group relative flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10">`);
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="flex-1 min-w-0"><div data-component="event-type-row" class="flex items-center justify-between"><span data-component="event-type-badge" class="bg-primary/10 text-primary rounded-lg px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">${escape_html(formatEventType(event.event_type))}</span> `);
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100"><button data-component="event-edit" class="text-stone-700 hover:text-white">`);
					Pencil($$renderer, { size: 12 });
					$$renderer.push(`<!----></button> <button data-component="event-delete" class="text-stone-700 hover:text-rose-400">`);
					Trash_2($$renderer, { size: 12 });
					$$renderer.push(`<!----></button></div>`);
					$$renderer.push(`<!--]--></div> <div data-component="event-meta" class="mt-1.5 flex items-center gap-2 text-[9px] text-stone-600">`);
					if (event.scenes) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span>${escape_html(event.scenes.display_title || event.scenes.author_title)}</span> <span>·</span>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <span>${escape_html(new Date(event.created_at).toLocaleDateString([], {
						month: "short",
						day: "numeric"
					}))}</span></div> `);
					if (event.payload?.reason) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<p data-component="event-reason" class="mt-1 text-[10px] italic text-stone-500">"${escape_html(event.payload.reason)}"</p>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if ([
						"add_fact",
						"update_description",
						"update_name"
					].includes(event.event_type)) {
						$$renderer.push("<!--[0-->");
						const field = event.event_type === "add_fact" ? "content" : event.event_type === "update_description" ? "description" : "name";
						if (event.payload?.[field]) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<p class="mt-1 text-left text-[10px] text-stone-400 w-full">${escape_html(event.payload[field])}</p>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div></div>`);
				}
				$$renderer.push(`<!--]--></div></div>`);
			}
			$$renderer.push(`<!--]--></aside> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> `);
			EventEditorModal($$renderer, {
				event: editingEvent,
				isOpen: showEventModal,
				onClose: () => {
					showEventModal = false;
					editingEvent = null;
				},
				onSubmit: handleEventModalSubmit
			});
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div data-component="entity-not-found" class="flex flex-1 items-center justify-center"><p class="text-sm text-stone-500">Entity not found</p></div>`);
		}
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-02b172b5.js.map
