import { supabase } from '../supabaseClient';

export interface WikiEntity {
	id: string;
	serial_id: string;
	name: string;
	category: 'character' | 'thread' | 'clock' | 'location' | 'track' | 'other';
	description?: string;
	metadata: Record<string, unknown>;
	created_at: string;
}

export interface WikiEvent {
	id: string;
	entity_id: string;
	scene_id: string;
	block_id: string | null;
	event_type:
		| 'create'
		| 'update_description'
		| 'add_fact'
		| 'remove_fact'
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
	description = '',
	metadata: Record<string, unknown> = {}
) {
	const { data, error } = await supabase
		.from('wiki_entities')
		.insert({
			serial_id: serialId,
			name,
			category,
			description,
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
