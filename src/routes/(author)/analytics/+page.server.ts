import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	// Fetch Goals
	const { data: goals } = await supabase
		.from('author_goals')
		.select('*')
		.eq('user_id', session.user.id)
		.maybeSingle();

	// Fetch Sessions
	const { data: sessions } = await supabase
		.from('writing_sessions')
		.select(
			`
      *,
      serials (title),
      scenes (author_title, display_title)
    `
		)
		.eq('author_id', session.user.id)
		.order('start_time', { ascending: false });

	return {
		goals: goals || { daily_word_goal: 0, weekly_word_goal: 0, monthly_word_goal: 0 },
		sessions: sessions || []
	};
};

export const actions: Actions = {
	updateGoals: async ({ request, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const daily = parseInt(formData.get('daily_word_goal') as string) || 0;
		const weekly = parseInt(formData.get('weekly_word_goal') as string) || 0;
		const monthly = parseInt(formData.get('monthly_word_goal') as string) || 0;

		const { error: upsertError } = await supabase.from('author_goals').upsert(
			{
				user_id: session.user.id,
				daily_word_goal: daily,
				weekly_word_goal: weekly,
				monthly_word_goal: monthly
			},
			{ onConflict: 'user_id' }
		);

		if (upsertError) {
			console.error('Error updating goals:', upsertError);
			return fail(500, { message: 'Failed to update goals' });
		}

		return { success: true };
	}
};
