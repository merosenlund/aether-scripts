import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
  const session = await getSession();

  if (!session) {
    throw redirect(303, '/login');
  }

  // 1. Fetch serials for the logged-in author
  // We include counts for scenes and unique readers using Supabase's count shorthand
  const { data: serials, error: serialsError } = await supabase
    .from('serials')
    .select(`
      id,
      title,
      color_theme,
      status,
      created_at,
      scenes:scenes(count),
      readers:reading_progress(count)
    `)
    .eq('author_id', session.user.id)
    .order('created_at', { ascending: false });

  if (serialsError) {
    console.error('Error fetching serials:', serialsError);
    throw error(500, 'Could not fetch serials');
  }

  // 2. Fetch the latest update timestamp for each serial
  // We need to look into scene_updates table for the most recent activity
  const serialsWithUpdates = await Promise.all(
    serials.map(async (serial) => {
      const { data: latestUpdate } = await supabase
        .from('scene_updates')
        .select('created_at')
        .in('scene_id', (
          await supabase
            .from('scenes')
            .select('id')
            .eq('serial_id', serial.id)
        ).data?.map(s => s.id) || [])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        ...serial,
        scenesCount: serial.scenes?.[0]?.count || 0,
        readersCount: serial.readers?.[0]?.count || 0,
        lastEdit: latestUpdate?.created_at || serial.created_at
      };
    })
  );

  return {
    serials: serialsWithUpdates
  };
};
