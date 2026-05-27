/**
 * EntityHeadIndex — Tracks the chronological "head" block position for each wiki entity.
 *
 * The "head" of an entity is the last event (by document block order) that is anchored
 * to a block in the current scene. This determines whether a slash command like
 * `/increment` should offer that entity at the cursor's current position.
 *
 * Rule: An entity is available for modification at a given cursor position if and only if
 * the entity's head is at or before the cursor in the document's block ordering,
 * OR the entity has no anchored events (unanchored entities are always available).
 */

import { contextEngine } from './contextEngine.svelte';

export interface EntityHead {
	blockId: string | null;
	blockIndex: number; // -1 if unanchored
}

/**
 * Derive the head block index for a given entity by scanning rawEvents
 * and finding the last event (by document block order) with a non-null block_id.
 */
function computeEntityHeadMap(): Map<string, EntityHead> {
	const headMap = new Map<string, EntityHead>();
	const orderedBlockIds = contextEngine.orderedBlockIds;

	// Build a fast lookup: blockId → index in document order
	const blockIndexLookup = new Map<string, number>();
	for (let i = 0; i < orderedBlockIds.length; i++) {
		blockIndexLookup.set(orderedBlockIds[i], i);
	}

	for (const event of contextEngine.rawEvents) {
		const entityId = event.entity_id;

		if (!event.block_id) {
			// Unanchored event — only set head if we haven't seen an anchored one yet
			if (!headMap.has(entityId)) {
				headMap.set(entityId, { blockId: null, blockIndex: -1 });
			}
			continue;
		}

		const blockIndex = blockIndexLookup.get(event.block_id) ?? -1;
		const current = headMap.get(entityId);

		if (!current || blockIndex > current.blockIndex) {
			headMap.set(entityId, { blockId: event.block_id, blockIndex });
		}
	}

	return headMap;
}

/**
 * Check if an entity is available for modification at a given cursor block position.
 *
 * Returns true if:
 *   - The entity has no anchored events (head is unanchored → always available)
 *   - The entity's head block is at or before the cursor block in document order
 */
export function isEntityAvailableAtBlock(entityId: string, cursorBlockId: string): boolean {
	const headMap = computeEntityHeadMap();
	const head = headMap.get(entityId);

	// Entity not found in events at all — it exists as a base entity, always available
	if (!head) return true;

	// Entity has no anchored events — always available
	if (head.blockIndex === -1) return true;

	// Find cursor position in the document ordering
	const cursorIndex = contextEngine.orderedBlockIds.indexOf(cursorBlockId);

	// If cursor block not found in ordering, default to available (safety)
	if (cursorIndex === -1) return true;

	// Entity is available if its head is at or before the cursor
	return head.blockIndex <= cursorIndex;
}
