import { i as spread_props, l as derived } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';
import { g as getWikiEntities, a as getWikiEvents } from './wiki-7e2bc21a.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/sparkles.svelte
function Sparkles($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "sparkles" },
		props,
		{ iconNode: [
			["path", { "d": "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" }],
			["path", { "d": "M20 2v4" }],
			["path", { "d": "M22 4h-4" }],
			["circle", {
				"cx": "4",
				"cy": "20",
				"r": "2"
			}]
		] }
	]));
}
var SvelteSet = globalThis.Set;
var SvelteMap = globalThis.Map;
//#endregion
//#region src/lib/stores/contextEngine.svelte.ts
function reduceEntityEvents(events, baseEntity) {
	const state = {
		id: baseEntity.id,
		name: baseEntity.name || "",
		category: baseEntity.category || "other",
		description: "",
		metadata: { ...baseEntity.metadata || {} },
		facts: [],
		isActive: false
	};
	for (const event of events) switch (event.event_type) {
		case "create":
			state.isActive = true;
			if (event.payload.name) state.name = event.payload.name;
			if (event.payload.category) state.category = event.payload.category;
			if (event.payload.description) state.description = event.payload.description;
			state.metadata = {
				...state.metadata,
				...event.payload.metadata || {}
			};
			break;
		case "deactivate_entity":
			state.isActive = false;
			break;
		case "update_name":
			if (event.payload.name) state.name = event.payload.name;
			break;
		case "update_description":
			state.description = event.payload.description;
			break;
		case "add_fact": {
			const factId = event.payload.id || event.id;
			if (!state.facts.some((f) => f.id === factId)) state.facts.push({
				id: factId,
				content: event.payload.content
			});
			break;
		}
		case "remove_fact": {
			const removeId = event.payload.id;
			state.facts = state.facts.filter((f) => f.id !== removeId);
			break;
		}
		case "set_clock":
			state.metadata = {
				...state.metadata,
				segments: event.payload.segments ?? state.metadata.segments ?? 4,
				filled: event.payload.filled ?? state.metadata.filled ?? 0
			};
			break;
		case "increment_clock": {
			const incAmount = event.payload.amount ?? 1;
			const maxSegments = state.metadata.segments ?? 4;
			state.metadata.filled = Math.min(maxSegments, (state.metadata.filled ?? 0) + incAmount);
			break;
		}
		case "decrement_clock": {
			const decAmount = event.payload.amount ?? 1;
			state.metadata.filled = Math.max(0, (state.metadata.filled ?? 0) - decAmount);
			break;
		}
		case "set_track":
			state.metadata = {
				...state.metadata,
				max: event.payload.max ?? state.metadata.max ?? 10,
				current: event.payload.current ?? state.metadata.current ?? 0
			};
			break;
	}
	return state;
}
function reduceWikiEvents(events, activeBlockIdsSet, baseEntities = []) {
	const filteredEvents = events.filter((event) => {
		if (!activeBlockIdsSet) return true;
		if (!event.block_id) return true;
		return activeBlockIdsSet.has(event.block_id);
	});
	const eventsByEntity = /* @__PURE__ */ new Map();
	for (const event of filteredEvents) {
		const bucket = eventsByEntity.get(event.entity_id) || [];
		bucket.push(event);
		eventsByEntity.set(event.entity_id, bucket);
	}
	const baseEntityMap = new Map(baseEntities.map((e) => [e.id, e]));
	const allEntityIds = new Set([...baseEntityMap.keys(), ...eventsByEntity.keys()]);
	const entitiesMap = new SvelteMap();
	for (const entityId of allEntityIds) {
		const entityEvents = eventsByEntity.get(entityId) || [];
		const base = baseEntityMap.get(entityId) ?? entityEvents[0]?.wiki_entities ?? {
			id: entityId,
			serial_id: "",
			name: "",
			category: "other",
			metadata: {},
			created_at: ""
		};
		entitiesMap.set(entityId, reduceEntityEvents(entityEvents, base));
	}
	return entitiesMap;
}
var ContextEngineStore = class {
	rawEvents = [];
	baseEntities = [];
	orderedBlockIds = [];
	readBlockIds = new SvelteSet();
	showAll = false;
	#reducedEntities = derived(() => {
		const filterSet = this.showAll ? null : this.readBlockIds;
		return reduceWikiEvents(this.rawEvents, filterSet, this.baseEntities);
	});
	get reducedEntities() {
		return this.#reducedEntities();
	}
	set reducedEntities($$value) {
		return this.#reducedEntities($$value);
	}
	async loadBaseEntities(serialId) {
		this.baseEntities = await getWikiEntities(serialId);
	}
	async initScene(sceneId, docJson, serialId, showAll = false) {
		this.rawEvents = await getWikiEvents(sceneId);
		this.parseDocBlocks(docJson);
		this.readBlockIds.clear();
		this.showAll = showAll;
		if (serialId) await this.loadBaseEntities(serialId);
	}
	async refreshEvents(sceneId, docJson, serialId) {
		this.rawEvents = await getWikiEvents(sceneId);
		this.parseDocBlocks(docJson);
		if (serialId) await this.loadBaseEntities(serialId);
	}
	parseDocBlocks(docJson) {
		const blocks = [];
		if (docJson) {
			const parsed = typeof docJson === "string" ? JSON.parse(docJson) : docJson;
			if (parsed && Array.isArray(parsed.content)) parsed.content.forEach((node) => {
				if (node && typeof node === "object" && "attrs" in node) {
					const attrs = node.attrs;
					if (attrs && typeof attrs === "object" && "id" in attrs && typeof attrs.id === "string") blocks.push(attrs.id);
				}
			});
		}
		this.orderedBlockIds = blocks;
	}
	markAsRead(upToBlockId) {
		const index = this.orderedBlockIds.indexOf(upToBlockId);
		if (index === -1) return;
		const newRead = new SvelteSet();
		for (let i = 0; i <= index; i++) newRead.add(this.orderedBlockIds[i]);
		this.readBlockIds = newRead;
	}
	revealAll() {
		this.showAll = true;
		this.readBlockIds.clear();
	}
};
var contextEngine = new ContextEngineStore();

export { Sparkles as S, reduceWikiEvents as a, contextEngine as c, reduceEntityEvents as r };
//# sourceMappingURL=contextEngine.svelte-fa9b4d62.js.map
