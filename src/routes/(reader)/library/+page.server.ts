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
      scenes!scenes_serial_id_fkey!inner(published_at, status, scheduled_status, scheduled_status_at),
      readers:reading_progress(count)
    `
		)
		.not('scenes!scenes_serial_id_fkey.published_at', 'is', null)
		.order('title', { ascending: true });

	// Deduplicate and map
	const uniqueSerials = Array.from(new Map(serialsData?.map((s) => [s.id, s])).values());

	const now = new Date();
	const serials = uniqueSerials.map((s) => {
		const rawScenes = (s.scenes as any) || [];
		const visibleScenes = rawScenes.filter((scene: any) => {
			if (scene.published_at !== null) return true;
			if (scene.status === 'Published') return true;
			if (scene.scheduled_status === 'Published' && scene.scheduled_status_at) {
				return new Date(scene.scheduled_status_at) <= now;
			}
			return false;
		});

		const latestPublishedAt = visibleScenes.reduce((latest: string, current: any) => {
			const currentPublishedAt = current.published_at || current.scheduled_status_at;
			return !latest || currentPublishedAt > latest ? currentPublishedAt : latest;
		}, null);

		return {
			id: s.id,
			title: s.title,
			color_theme: s.color_theme,
			status: s.status,
			updated_at: latestPublishedAt,
			scenesCount: visibleScenes.length,
			readersCount: (s.readers as any)?.[0]?.count || 0
		};
	});

	return {
		serials
	};
};
