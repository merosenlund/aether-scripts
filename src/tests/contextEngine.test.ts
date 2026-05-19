/// <reference lib="deno.ns" />
import { assertEquals } from 'jsr:@std/assert';
import type { WikiEvent } from '$lib/api/wiki';

// 1. Define Svelte 5 compiler runes on global scope before importing the store
(globalThis as any).$state = (val: any) => val;
const derivedMock = (fn: any) => fn;
derivedMock.by = (fn: any) => {
	// Return an object with a getter so that calling it returns the derived value
	return {
		get value() {
			return fn();
		}
	};
};
(globalThis as any).$derived = derivedMock;

// 2. Dynamically import the contextEngine store and reduceWikiEvents
const { reduceWikiEvents, contextEngine } = await import('$lib/stores/contextEngine.svelte.ts');

Deno.test('reduceWikiEvents: reduces standard fields, descriptions, and facts correctly', () => {
	const events: WikiEvent[] = [
		{
			id: 'ev1',
			entity_id: 'entity-1',
			scene_id: 'scene-1',
			block_id: null,
			event_type: 'create',
			payload: { name: 'Eldrin', category: 'character', description: 'An old wizard.' },
			created_at: '2026-05-19T00:00:00Z',
			wiki_entities: {
				id: 'entity-1',
				serial_id: 'serial-1',
				name: 'Eldrin',
				category: 'character',
				description: 'An old wizard.',
				metadata: {},
				created_at: '2026-05-19T00:00:00Z'
			}
		},
		{
			id: 'ev2',
			entity_id: 'entity-1',
			scene_id: 'scene-1',
			block_id: 'block-1',
			event_type: 'update_description',
			payload: { description: 'An old wizard with a magical staff.' },
			created_at: '2026-05-19T00:01:00Z'
		},
		{
			id: 'ev3',
			entity_id: 'entity-1',
			scene_id: 'scene-1',
			block_id: 'block-2',
			event_type: 'add_fact',
			payload: { id: 'fact-1', content: 'Carries a crystal ball.' },
			created_at: '2026-05-19T00:02:00Z'
		},
		{
			id: 'ev4',
			entity_id: 'entity-1',
			scene_id: 'scene-1',
			block_id: 'block-3',
			event_type: 'add_fact',
			payload: { id: 'fact-2', content: 'Wears red robes.' },
			created_at: '2026-05-19T00:03:00Z'
		},
		{
			id: 'ev5',
			entity_id: 'entity-1',
			scene_id: 'scene-1',
			block_id: 'block-4',
			event_type: 'remove_fact',
			payload: { id: 'fact-1' },
			created_at: '2026-05-19T00:04:00Z'
		}
	];

	// Test 1: Author/unfiltered mode (activeBlockIdsSet = null)
	const unfilteredResult = reduceWikiEvents(events, null);
	const entityUnfiltered = unfilteredResult.get('entity-1');
	assertEquals(entityUnfiltered?.name, 'Eldrin');
	assertEquals(entityUnfiltered?.category, 'character');
	assertEquals(entityUnfiltered?.description, 'An old wizard with a magical staff.');
	assertEquals(entityUnfiltered?.facts.length, 1);
	assertEquals(entityUnfiltered?.facts[0], { id: 'fact-2', content: 'Wears red robes.' });

	// Test 2: Filtered mode (only block-1 and block-2 read)
	const readBlocks = new Set(['block-1', 'block-2']);
	const filteredResult = reduceWikiEvents(events, readBlocks);
	const entityFiltered = filteredResult.get('entity-1');
	assertEquals(entityFiltered?.name, 'Eldrin');
	assertEquals(entityFiltered?.description, 'An old wizard with a magical staff.');
	assertEquals(entityFiltered?.facts.length, 1);
	assertEquals(entityFiltered?.facts[0], { id: 'fact-1', content: 'Carries a crystal ball.' });
});

Deno.test('reduceWikiEvents: reduces clock configuration and step changes', () => {
	const events: WikiEvent[] = [
		{
			id: 'ev-c1',
			entity_id: 'clock-1',
			scene_id: 'scene-1',
			block_id: null,
			event_type: 'create',
			payload: { name: 'Alert Level', category: 'clock' },
			created_at: '2026-05-19T00:00:00Z',
			wiki_entities: {
				id: 'clock-1',
				serial_id: 'serial-1',
				name: 'Alert Level',
				category: 'clock',
				metadata: {},
				created_at: '2026-05-19T00:00:00Z'
			}
		},
		{
			id: 'ev-c2',
			entity_id: 'clock-1',
			scene_id: 'scene-1',
			block_id: null,
			event_type: 'set_clock',
			payload: { segments: 6, filled: 1 },
			created_at: '2026-05-19T00:01:00Z'
		},
		{
			id: 'ev-c3',
			entity_id: 'clock-1',
			scene_id: 'scene-1',
			block_id: null,
			event_type: 'increment_clock',
			payload: { amount: 2 },
			created_at: '2026-05-19T00:02:00Z'
		},
		{
			id: 'ev-c4',
			entity_id: 'clock-1',
			scene_id: 'scene-1',
			block_id: null,
			event_type: 'decrement_clock',
			payload: { amount: 1 },
			created_at: '2026-05-19T00:03:00Z'
		}
	];

	const result = reduceWikiEvents(events, null);
	const clock = result.get('clock-1');
	assertEquals(clock?.name, 'Alert Level');
	assertEquals(clock?.category, 'clock');
	assertEquals(clock?.metadata.segments, 6);
	assertEquals(clock?.metadata.filled, 2);
});

Deno.test('reduceWikiEvents: reduces progress track configuration', () => {
	const events: WikiEvent[] = [
		{
			id: 'ev-t1',
			entity_id: 'track-1',
			scene_id: 'scene-1',
			block_id: null,
			event_type: 'create',
			payload: { name: 'Journey Progress', category: 'track' },
			created_at: '2026-05-19T00:00:00Z',
			wiki_entities: {
				id: 'track-1',
				serial_id: 'serial-1',
				name: 'Journey Progress',
				category: 'track',
				metadata: {},
				created_at: '2026-05-19T00:00:00Z'
			}
		},
		{
			id: 'ev-t2',
			entity_id: 'track-1',
			scene_id: 'scene-1',
			block_id: null,
			event_type: 'set_track',
			payload: { max: 10, current: 4 },
			created_at: '2026-05-19T00:01:00Z'
		}
	];

	const result = reduceWikiEvents(events, null);
	const track = result.get('track-1');
	assertEquals(track?.name, 'Journey Progress');
	assertEquals(track?.category, 'track');
	assertEquals(track?.metadata.max, 10);
	assertEquals(track?.metadata.current, 4);
});

Deno.test('ContextEngineStore: parseDocBlocks parses blocks from Tiptap JSON', () => {
	const docJson = {
		type: 'doc',
		content: [
			{
				type: 'paragraph',
				attrs: { id: 'block-1' },
				content: [{ type: 'text', text: 'Hello world' }]
			},
			{
				type: 'paragraph',
				attrs: { id: 'block-2' },
				content: [{ type: 'text', text: 'Second paragraph' }]
			}
		]
	};

	contextEngine.parseDocBlocks(docJson);
	assertEquals(contextEngine.orderedBlockIds, ['block-1', 'block-2']);
});

Deno.test('ContextEngineStore: markAsRead updates readBlockIds state chronologically', () => {
	contextEngine.orderedBlockIds = ['block-1', 'block-2', 'block-3'];
	contextEngine.readBlockIds.clear();

	// Mark up to block-2 as read
	contextEngine.markAsRead('block-2');
	assertEquals(contextEngine.readBlockIds.has('block-1'), true);
	assertEquals(contextEngine.readBlockIds.has('block-2'), true);
	assertEquals(contextEngine.readBlockIds.has('block-3'), false);

	// Clear reading state
	contextEngine.revealAll();
	assertEquals(contextEngine.readBlockIds.size, 0);
});
