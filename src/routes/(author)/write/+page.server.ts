import { error, redirect, fail } from '@sveltejs/kit';
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
      scenes:scenes!scenes_serial_id_fkey(count),
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

export const actions = {
  create: async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) {
      throw redirect(303, '/login');
    }

    const formData = await request.formData();
    const title = (formData.get('title') as string || 'Untitled Serial').trim();

    const gradients = [
      'from-rose-500 to-orange-500',
      'from-emerald-400 to-cyan-500',
      'from-blue-500 to-indigo-500',
      'from-purple-500 to-pink-500',
      'from-amber-400 to-rose-500',
      'from-violet-600 to-indigo-600'
    ];
    const colorTheme = gradients[Math.floor(Math.random() * gradients.length)];

    const { data: newSerial, error: createError } = await supabase
      .from('serials')
      .insert({
        author_id: session.user.id,
        title,
        color_theme: colorTheme,
        status: 'pilot'
      })
      .select('id')
      .single();

    if (createError || !newSerial) {
      console.error('Error creating serial:', createError);
      return fail(500, { error: 'Failed to create serial' });
    }

    throw redirect(303, `/serials/${newSerial.id}`);
  }
};
