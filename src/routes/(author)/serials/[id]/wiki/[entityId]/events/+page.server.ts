import { supabase } from '$lib/supabaseClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { entityId } = params;
	const parentData = await parent();

	// Get events for this entity from parent data
	const entityEvents = (parentData.events || [])
		.filter((ev: any) => ev.entity_id === entityId)
		.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

	// Find the latest scene that has events for this entity
	const scenesWithEvents = new Set(
		entityEvents
			.filter((ev: any) => ev.scene_id)
			.map((ev: any) => ev.scene_id)
	);

	// Get the latest scene (highest order_index) that has events
	const latestScene = (parentData.scenes || [])
		.filter((s: any) => scenesWithEvents.has(s.id))
		.sort((a: any, b: any) => b.order_index - a.order_index)[0];

	// Fetch the actual content_blocks for the latest scene
	let initialSceneContent = null;
	if (latestScene) {
		const { data: sceneData } = await supabase
			.from('scenes')
			.select('id, content_blocks')
			.eq('id', latestScene.id)
			.single();

		if (sceneData) {
			initialSceneContent = {
				id: sceneData.id,
				content_blocks: sceneData.content_blocks
			};
		}
	}

	return {
		entityId,
		entityEvents,
		initialSceneContent,
		latestSceneId: latestScene?.id || null
	};
};
