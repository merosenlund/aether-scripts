import { supabase } from '../supabaseClient';

export interface WikiEntity {
	id: string;
	serial_id: string;
	name: string;
	category: 'character' | 'thread' | 'clock' | 'location' | 'track' | 'other';
	metadata: Record<string, unknown>;
	created_at: string;
}

export interface WikiEvent {
	id: string;
	entity_id: string;
	scene_id: string | null;
	block_id: string | null;
	event_type:
		| 'create'
		| 'update_name'
		| 'update_description'
		| 'add_fact'
		| 'remove_fact'
		| 'deactivate_entity'
		| 'set_clock'
		| 'increment_clock'
		| 'decrement_clock'
		| 'set_track'
		| 'anchor';
	payload: Record<string, unknown>; // e.g., { content: '...' } or { segments: 4, filled: 1 }
	created_at: string;
	wiki_entities?: WikiEntity; // Populated via join if requested
}

export async function getWikiEntities(serialId: string) {
	const { data, error } = await supabase
		.from('wiki_entities')
		.select('*')
		.eq('serial_id', serialId)
		.order('name');

	if (error) throw error;
	return data as WikiEntity[];
}

export async function createWikiEntity(
	serialId: string,
	name: string,
	category: WikiEntity['category'],
	metadata: Record<string, unknown> = {}
) {
	const { data, error } = await supabase
		.from('wiki_entities')
		.insert({
			serial_id: serialId,
			name,
			category,
			metadata
		})
		.select()
		.single();

	if (error) throw error;
	return data as WikiEntity;
}

export async function getWikiEvents(sceneId: string) {
	const { data, error } = await supabase
		.from('wiki_events')
		.select('*, wiki_entities(*)')
		.eq('scene_id', sceneId)
		.order('created_at', { ascending: true });

	if (error) throw error;
	return data as (WikiEvent & { wiki_entities: WikiEntity })[];
}

export async function getWikiEventsForSerial(serialId: string) {
	// First get all entity IDs for the serial
	const { data: entities, error: entitiesError } = await supabase
		.from('wiki_entities')
		.select('id')
		.eq('serial_id', serialId);

	if (entitiesError) throw entitiesError;

	const entityIds = entities.map((e) => e.id);
	if (entityIds.length === 0) return [];

	// Then get all events for those entities
	const { data, error } = await supabase
		.from('wiki_events')
		.select('*, wiki_entities(*)')
		.in('entity_id', entityIds)
		.order('created_at', { ascending: true });

	if (error) throw error;
	return data as (WikiEvent & { wiki_entities: WikiEntity })[];
}

export async function createWikiEvent(event: Omit<WikiEvent, 'id' | 'created_at'>) {
	const { data, error } = await supabase.from('wiki_events').insert(event).select().single();

	if (error) throw error;
	return data as WikiEvent;
}

export async function updateWikiEventPayload(eventId: string, payload: Record<string, unknown>) {
	const { data, error } = await supabase
		.from('wiki_events')
		.update({ payload })
		.eq('id', eventId)
		.select()
		.single();

	if (error) throw error;
	return data as WikiEvent;
}

export async function updateWikiEventBlock(
	eventId: string,
	blockId: string | null,
	sceneId?: string
) {
	const updates: Record<string, unknown> = { block_id: blockId };
	if (sceneId !== undefined) updates.scene_id = sceneId;

	const { data, error } = await supabase
		.from('wiki_events')
		.update(updates)
		.eq('id', eventId)
		.select()
		.single();

	if (error) throw error;
	return data as WikiEvent;
}

export async function deleteWikiEvent(eventId: string) {
	const { error } = await supabase.from('wiki_events').delete().eq('id', eventId);

	if (error) throw error;
	return true;
}

export async function updateWikiEntity(
	entityId: string,
	updates: Partial<Pick<WikiEntity, 'name' | 'category'>>
) {
	const { data, error } = await supabase
		.from('wiki_entities')
		.update(updates)
		.eq('id', entityId)
		.select()
		.single();

	if (error) throw error;
	return data as WikiEntity;
}

export async function deleteWikiEntity(entityId: string) {
	const { error } = await supabase.from('wiki_entities').delete().eq('id', entityId);

	if (error) throw error;
	return true;
}
