import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals: { supabase } }) => {
	const { id: serialId } = params;

	// 1. Fetch Serial Details
	const { data: serial, error: serialError } = await supabase
		.from('serials')
		.select('*')
		.eq('id', serialId)
		.single();

	if (serialError || !serial) {
		throw error(404, 'Serial not found');
	}

	// 2. Fetch all Scenes for this Serial
	const { data: scenes, error: scenesError } = await supabase
		.from('scenes')
		.select('id, author_title, display_title, order_index')
		.eq('serial_id', serialId)
		.order('order_index', { ascending: true });

	if (scenesError) throw scenesError;

	// 3. Fetch all Wiki Entities for this Serial
	const { data: entities, error: entitiesError } = await supabase
		.from('wiki_entities')
		.select('*')
		.eq('serial_id', serialId)
		.order('name', { ascending: true });

	if (entitiesError) throw entitiesError;

	// 4. Fetch all Wiki Events for these Entities
	let events: unknown[] = [];
	const entityIds = entities?.map((e) => e.id) || [];

	if (entityIds.length > 0) {
		const { data: eventsData, error: eventsError } = await supabase
			.from('wiki_events')
			.select('*, wiki_entities(*), scenes(*)')
			.in('entity_id', entityIds)
			.order('created_at', { ascending: false });

		if (eventsError) throw eventsError;
		events = eventsData || [];
	}

	return {
		serial,
		scenes: scenes || [],
		entities: entities || [],
		events
	};
};
