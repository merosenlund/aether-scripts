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
	payload: Record<string, unknown>;
	created_at: string;
	wiki_entities?: WikiEntity;
}

export async function getWikiEvents(sceneId: string): Promise<WikiEvent[]> {
	return [];
}

export async function getWikiEntities(serialId: string): Promise<WikiEntity[]> {
	return [];
}
