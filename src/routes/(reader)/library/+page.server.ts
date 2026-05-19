import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	// Fetch all serials that have at least one published scene
	const { data: serialsData } = await supabase
		.from('serials')
		.select(
			`
      id,
      title,
      color_theme,
      status,
      scenes!scenes_serial_id_fkey!inner(published_at),
      readers:reading_progress(count)
    `
		)
		.not('scenes!scenes_serial_id_fkey.published_at', 'is', null)
		.order('title', { ascending: true });

	// Deduplicate and map
	const uniqueSerials = Array.from(new Map(serialsData?.map((s) => [s.id, s])).values());

	const serials = uniqueSerials.map((s) => {
		const scenes = (s.scenes as any) || [];
		const latestPublishedAt = scenes.reduce((latest: string, current: any) => {
			return !latest || current.published_at > latest ? current.published_at : latest;
		}, null);

		return {
			id: s.id,
			title: s.title,
			color_theme: s.color_theme,
			status: s.status,
			updated_at: latestPublishedAt,
			scenesCount: scenes.length,
			readersCount: (s.readers as any)?.[0]?.count || 0
		};
	});

	return {
		serials
	};
};
