import { getWikiEvents, type WikiEvent } from '$lib/api/wiki';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

export interface ReducedEntity {
	id: string;
	name: string;
	category: string;
	description: string;
	metadata: Record<string, unknown>;
	facts: { id: string; content: string }[];
}

export function reduceWikiEvents(
	events: WikiEvent[],
	activeBlockIdsSet: Set<string> | SvelteSet<string> | null
) {
	const entitiesMap = new SvelteMap<string, ReducedEntity>();

	// Filter events based on block-level chronological visibility
	const filteredEvents = events.filter((event) => {
		// If activeBlockIdsSet is null, we are in author/edit mode where everything is visible
		if (!activeBlockIdsSet) return true;

		// If event is unanchored (block_id is null), it is visible globally in the scene
		if (!event.block_id) return true;

		// Otherwise, check if the event's block has been read/scrolled to
		return activeBlockIdsSet.has(event.block_id);
	});

	// Sequentially reduce the events
	for (const event of filteredEvents) {
		const entityId = event.entity_id;

		if (!entitiesMap.has(entityId)) {
			// Lazy initialize basic entity fields
			entitiesMap.set(entityId, {
				id: entityId,
				name: event.wiki_entities?.name || '',
				category: event.wiki_entities?.category || 'other',
				description: event.wiki_entities?.description || '',
				metadata: {},
				facts: []
			});
		}

		const entity = entitiesMap.get(entityId)!;

		switch (event.event_type) {
			case 'create':
				if (event.payload.name) entity.name = event.payload.name as string;
				if (event.payload.category) entity.category = event.payload.category as string;
				if (event.payload.description) entity.description = event.payload.description as string;
				entity.metadata = {
					...entity.metadata,
					...(event.payload.metadata as Record<string, unknown>)
				};
				break;
			case 'update_description':
				entity.description = event.payload.description as string;
				break;
			case 'add_fact': {
				const factId = (event.payload.id as string) || event.id;
				// Ensure we don't add duplicate facts if reduced multiple times
				if (!entity.facts.some((f) => f.id === factId)) {
					entity.facts.push({
						id: factId,
						content: event.payload.content as string
					});
				}
				break;
			}
			case 'remove_fact': {
				const removeId = event.payload.id as string;
				entity.facts = entity.facts.filter((f) => f.id !== removeId);
				break;
			}
			case 'set_clock':
				entity.metadata = {
					...entity.metadata,
					segments: (event.payload.segments as number) ?? (entity.metadata.segments as number) ?? 4,
					filled: (event.payload.filled as number) ?? (entity.metadata.filled as number) ?? 0
				};
				break;
			case 'increment_clock': {
				const incAmount = (event.payload.amount as number) ?? 1;
				const maxSegments = (entity.metadata.segments as number) ?? 4;
				entity.metadata.filled = Math.min(
					maxSegments,
					((entity.metadata.filled as number) ?? 0) + incAmount
				);
				break;
			}
			case 'decrement_clock': {
				const decAmount = (event.payload.amount as number) ?? 1;
				entity.metadata.filled = Math.max(0, ((entity.metadata.filled as number) ?? 0) - decAmount);
				break;
			}
			case 'set_track':
				entity.metadata = {
					...entity.metadata,
					max: (event.payload.max as number) ?? (entity.metadata.max as number) ?? 10,
					current: (event.payload.current as number) ?? (entity.metadata.current as number) ?? 0
				};
				break;
		}
	}

	return entitiesMap;
}

class ContextEngineStore {
	// Raw event streams
	rawEvents = $state<WikiEvent[]>([]);

	// Sequence of blocks in the active document
	orderedBlockIds = $state<string[]>([]);

	// Set of block IDs that have been read/scrolled into view
	readBlockIds = $state<SvelteSet<string>>(new SvelteSet());

	// Derive the reduced entities state reactively
	reducedEntities = $derived.by(() => {
		// If readBlockIds is empty, we default to author mode (show all events)
		const filterSet = this.readBlockIds.size > 0 ? this.readBlockIds : null;
		return this.rawEvents.length > 0
			? reduceWikiEvents(this.rawEvents, filterSet)
			: new SvelteMap<string, ReducedEntity>();
	});

	// Helper to load events for a scene
	async initScene(sceneId: string, docJson: unknown) {
		this.rawEvents = await getWikiEvents(sceneId);
		this.parseDocBlocks(docJson);
		this.readBlockIds.clear();
	}

	// Parse Tiptap JSON to construct the physical block ordering
	parseDocBlocks(docJson: unknown) {
		const blocks: string[] = [];
		if (docJson) {
			const parsed =
				typeof docJson === 'string' ? JSON.parse(docJson) : (docJson as Record<string, unknown>);
			if (parsed && Array.isArray(parsed.content)) {
				(parsed.content as unknown[]).forEach((node) => {
					if (node && typeof node === 'object' && 'attrs' in node) {
						const attrs = (node as { attrs: Record<string, unknown> }).attrs;
						if (
							attrs &&
							typeof attrs === 'object' &&
							'id' in attrs &&
							typeof attrs.id === 'string'
						) {
							blocks.push(attrs.id);
						}
					}
				});
			}
		}
		this.orderedBlockIds = blocks;
	}

	// Mark all blocks up to a specific block ID as read
	markAsRead(upToBlockId: string) {
		const index = this.orderedBlockIds.indexOf(upToBlockId);
		if (index === -1) return;

		const newRead = new SvelteSet<string>();
		for (let i = 0; i <= index; i++) {
			newRead.add(this.orderedBlockIds[i]);
		}
		this.readBlockIds = newRead;
	}

	// Clear reading state (reveals all events)
	revealAll() {
		this.readBlockIds.clear();
	}
}

export const contextEngine = new ContextEngineStore();
