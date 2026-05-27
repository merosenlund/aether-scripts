import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) {
		throw redirect(303, '/login');
	}

	const { id: serialId } = params;

	// Verify serial belongs to current author
	const { data: serial, error: serialError } = await supabase
		.from('serials')
		.select('id, title, status')
		.eq('id', serialId)
		.eq('author_id', session.user.id)
		.single();

	if (serialError || !serial) {
		throw error(404, 'Serial not found');
	}

	// All sessions for this serial (oldest first for trend/timeline views)
	const { data: sessions } = await supabase
		.from('writing_sessions')
		.select(
			`
      id, session_type, start_time, end_time,
      active_duration_seconds, starting_word_count, ending_word_count,
      keystrokes, net_characters, flesch_reading_ease, avg_sentence_length,
      avg_word_length, type_token_ratio,
      scene_id,
      scenes (id, author_title, display_title, order_index)
    `
		)
		.eq('author_id', session.user.id)
		.eq('serial_id', serialId)
		.order('start_time', { ascending: false });

	// All scenes in this serial for the breakdown table
	const { data: scenes } = await supabase
		.from('scenes')
		.select('id, author_title, display_title, order_index, word_count, published_at, status')
		.eq('serial_id', serialId)
		.order('order_index', { ascending: true });

	return {
		serial,
		sessions: sessions || [],
		scenes: scenes || []
	};
};
