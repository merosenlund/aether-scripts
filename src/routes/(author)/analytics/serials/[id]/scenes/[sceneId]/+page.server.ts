import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) {
		throw redirect(303, '/login');
	}

	const { id: serialId, sceneId } = params;

	// Verify scene belongs to current author via serial ownership
	const { data: scene, error: sceneError } = await supabase
		.from('scenes')
		.select(
			`
      id, author_title, display_title, order_index, word_count, published_at, status,
      serials!inner (id, title, author_id)
    `
		)
		.eq('id', sceneId)
		.eq('serial_id', serialId)
		.eq('serials.author_id', session.user.id)
		.single();

	if (sceneError || !scene) {
		throw error(404, 'Scene not found');
	}

	// Sessions for this scene, oldest first for timeline view
	const { data: sessions } = await supabase
		.from('writing_sessions')
		.select(
			`
      id, session_type, start_time, end_time,
      active_duration_seconds, starting_word_count, ending_word_count,
      keystrokes, net_characters,
      flesch_reading_ease, avg_sentence_length, avg_word_length, type_token_ratio
    `
		)
		.eq('author_id', session.user.id)
		.eq('scene_id', sceneId)
		.order('start_time', { ascending: true });

	return {
		scene,
		serialId,
		sessions: sessions || []
	};
};
