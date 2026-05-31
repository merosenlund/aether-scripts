import { m as setContext, b as attr, s as stringify, c as escape_html, e as ensure_array_like, a as attr_class, l as derived, d as store_get, g as unsubscribe_stores } from './dev-db1ab9cf.js';
import { g as goto } from './client-ffaaeca1.js';
import { A as Activity } from './activity-930605c0.js';
import { A as Arrow_left } from './arrow-left-693621d1.js';
import { F as Flag, M as Map_pin } from './map-pin-dddfec13.js';
import { P as Plus } from './plus-54415a1e.js';
import { r as reduceEntityEvents, S as Sparkles } from './contextEngine.svelte-fa9b4d62.js';
import { T as Timer } from './timer-6bd4adc3.js';
import { U as User } from './user-63b71bea.js';
import { p as page } from './stores-225b455b.js';
import { C as CreateWikiEntryModal } from './CreateWikiEntryModal-93f363b7.js';
import './internal-8a8e9ef7.js';
import './index-21b402be.js';
import './Icon-f47d171f.js';
import './wiki-7e2bc21a.js';
import './supabaseClient-824b9cb6.js';
import './warnDeprecatedPackage-103e47c7.js';
import './createBrowserClient-0790f5fc.js';
import './x-a5e0e5e8.js';

//#region src/routes/(author)/serials/[id]/wiki/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { data, children } = $$props;
		let entities = [...data.entities];
		let events = [...data.events];
		let scenes = [...data.scenes];
		let serial = data.serial;
		setContext("wiki", {
			get entities() {
				return entities;
			},
			get events() {
				return events;
			},
			addEvent(event) {
				events = [event, ...events];
			},
			removeEvent(eventId) {
				events = events.filter((e) => e.id !== eventId);
			},
			updateEntity(entityId, updates) {
				entities = entities.map((e) => e.id === entityId ? {
					...e,
					...updates
				} : e);
			},
			updateEvent(eventId, payload) {
				events = events.map((ev) => ev.id === eventId ? {
					...ev,
					payload
				} : ev);
			},
			removeEntity(entityId) {
				entities = entities.filter((e) => e.id !== entityId);
				events = events.filter((ev) => ev.entity_id !== entityId);
			}
		});
		let searchQuery = "";
		let selectedCategory = "all";
		const activeEntityId = derived(() => store_get($$store_subs ??= {}, "$page", page).params.entityId || null);
		const currentSubRoute = derived(() => () => {
			if (store_get($$store_subs ??= {}, "$page", page).url.pathname.endsWith("/events")) return "events";
			return "overview";
		});
		let showCreateModal = false;
		function reduceEntityState(entityId) {
			const entity = entities.find((e) => e.id === entityId);
			if (!entity) return null;
			return reduceEntityEvents(events.filter((ev) => ev.entity_id === entityId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), entity);
		}
		const filteredEntities = derived(() => entities.filter((e) => {
			const reduced = reduceEntityState(e.id);
			if (reduced && reduced.isActive === false) return false;
			const matchSearch = (reduced?.name ?? e.name).toLowerCase().includes(searchQuery.toLowerCase()) || (reduced?.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
			const matchCat = selectedCategory === "all" ;
			return matchSearch && matchCat;
		}));
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
		function handleEntityCreated(entity, event) {
			entities = [...entities, entity];
			if (event) events = [event, ...events];
			goto(`/serials/${serial.id}/wiki/${entity.id}/overview`);
		}
		$$renderer.push(`<div data-component="wiki-dashboard-layout" class="absolute inset-0 flex flex-col overflow-hidden bg-stone-950 font-sans text-stone-100"><header data-component="dashboard-header" class="z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-stone-900/40 px-8 backdrop-blur-2xl"><div data-component="header-left" class="flex items-center gap-4"><a data-component="back-link"${attr("href", `/serials/${stringify(serial.id)}`)} class="rounded-xl border border-white/10 p-2 text-stone-400 transition-all hover:border-white/20 hover:text-white">`);
		Arrow_left($$renderer, { size: 16 });
		$$renderer.push(`<!----></a> <div data-component="header-titles"><h1 data-component="dashboard-title" class="flex items-center gap-2 text-base leading-tight font-bold text-white">${escape_html(serial.title)} <span data-component="title-badge" class="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase">World Manager</span></h1> <p data-component="dashboard-subtitle" class="mt-0.5 text-[10px] font-bold tracking-widest text-stone-500 uppercase">Append-Only Chronicle &amp; Lore Sourcing Log</p></div></div> <button data-component="new-wiki-entry-btn" class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-xl px-5 py-2.5 font-sans text-xs font-bold shadow-lg transition-all hover:opacity-90">`);
		Plus($$renderer, { class: "mr-2 h-4 w-4" });
		$$renderer.push(`<!----> New Wiki Entry</button></header> <div data-component="dashboard-workspace" class="flex min-h-0 flex-1 overflow-hidden"><aside data-component="sidebar-entities" class="flex min-h-0 w-80 shrink-0 flex-col border-r border-white/5 bg-stone-900/10"><div data-component="sidebar-search-area" class="space-y-4 border-b border-white/5 p-6"><input data-component="search-input" type="text"${attr("value", searchQuery)} placeholder="Search world index..." class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-stone-500 transition-colors focus:outline-none"/> <div data-component="category-filters" class="flex flex-wrap gap-1.5"><!--[-->`);
		const each_array = ensure_array_like([
			"all",
			"character",
			"location",
			"clock",
			"track",
			"thread"
		]);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let cat = each_array[$$index];
			$$renderer.push(`<button data-component="category-filter-btn"${attr_class(`rounded-lg px-2.5 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all ${stringify(selectedCategory === cat ? "border border-white/20 bg-white/10 text-white" : "border border-transparent bg-transparent text-stone-500 hover:text-white")}`)}>${escape_html(cat)}</button>`);
		}
		$$renderer.push(`<!--]--> <div class="w-full h-px bg-white/5 my-1"></div> <button data-component="inactive-filter-btn"${attr_class(`rounded-lg px-2.5 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all ${stringify("border border-transparent bg-transparent text-stone-500 hover:text-white")}`)}>Show Inactive</button></div></div> <div data-component="entities-scroller" class="flex-1 space-y-1.5 overflow-y-auto p-4">`);
		if (filteredEntities().length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div data-component="sidebar-empty" class="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-8 text-center"><p data-component="sidebar-empty-text" class="text-[10px] font-bold tracking-widest text-stone-600 uppercase">No entries match filters</p></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--[-->`);
			const each_array_1 = ensure_array_like(filteredEntities());
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let entity = each_array_1[$$index_1];
				const reducedState = reduceEntityState(entity.id);
				const Icon = getIcon(entity.category);
				const isSelected = activeEntityId() === entity.id;
				$$renderer.push(`<a data-component="entity-card-select"${attr("href", `/serials/${stringify(serial.id)}/wiki/${stringify(entity.id)}/${stringify(currentSubRoute()())}`)}${attr_class(`group flex w-full items-start justify-between rounded-xl border p-4 text-left transition-all ${stringify(isSelected ? "bg-primary/10 border-primary/30 text-white" : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/5")}`)}><div data-component="card-left" class="flex min-w-0 items-start gap-3"><div data-component="card-icon-box"${attr_class(`shrink-0 rounded-lg p-2 transition-transform group-hover:scale-105 ${stringify(isSelected ? "bg-primary/20 text-primary" : "bg-stone-800 text-stone-400")}`)}>`);
				if (Icon) {
					$$renderer.push("<!--[-->");
					Icon($$renderer, { size: 14 });
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
				$$renderer.push(`</div> <div data-component="card-titles" class="min-w-0"><h4 data-component="card-name" class="truncate text-xs leading-snug font-bold">${escape_html(reducedState?.name || entity.name)}</h4> <span data-component="card-category" class="text-[9px] font-bold tracking-wider text-stone-500 uppercase">${escape_html(entity.category)}</span></div></div> `);
				if (isSelected) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div data-component="selection-marker" class="bg-primary mt-1.5 h-1.5 w-1.5 animate-pulse rounded-full"></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></a>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div></aside> <main data-component="main-workspace" class="relative flex min-h-0 flex-1 flex-col bg-stone-950">`);
		children($$renderer);
		$$renderer.push(`<!----></main></div> `);
		CreateWikiEntryModal($$renderer, {
			serialId: serial.id,
			scenes,
			open: showCreateModal,
			onClose: () => showCreateModal = false,
			onCreated: handleEntityCreated
		});
		$$renderer.push(`<!----></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-9a951e5e.js.map
