import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
  const session = await getSession();
  
  // 1. Fetch "Recently Updated" serials (serials that have at least one published scene)
  // We'll sort by the most recent published_at among their scenes
  const { data: recentlyUpdated } = await supabase
    .from('serials')
    .select(`
      id,
      title,
      color_theme,
      status,
      scenes!inner(published_at),
      readers:reading_progress(count)
    `)
    .not('scenes.published_at', 'is', null)
    .order('published_at', { referencedTable: 'scenes', ascending: false })
    .limit(6);

  // Group by serial ID and take the top one (Supabase join might return multiple rows per serial if not careful)
  // Actually, we want unique serials. The above might return multiple rows if a serial has multiple published scenes.
  // We'll deduplicate in JS for now or use a more precise query.
  const uniqueSerials = Array.from(new Map(recentlyUpdated?.map(s => [s.id, s])).values());

  let continueReading = null;

  // 2. If signed in, fetch the most recently read item
  if (session) {
    const { data: progress } = await supabase
      .from('reading_progress')
      .select(`
        serial_id,
        current_scene_id,
        current_block_id,
        updated_at,
        serial:serials (
          id,
          title,
          color_theme
        ),
        scene:scenes (
          id,
          display_title,
          author_title
        )
      `)
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (progress) {
      continueReading = {
        serial: progress.serial,
        scene: progress.scene,
        blockId: progress.current_block_id,
        updatedAt: progress.updated_at
      };
    }
  }

  return {
    recentlyUpdated: uniqueSerials.map(s => {
      // Find the most recent published_at among the joined scenes
      const scenes = (s.scenes as any) || [];
      const latestPublishedAt = scenes.reduce((latest: string, current: any) => {
        return (!latest || current.published_at > latest) ? current.published_at : latest;
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
    }),
    continueReading
  };
};
