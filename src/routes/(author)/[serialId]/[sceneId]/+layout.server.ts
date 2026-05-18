import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals: { supabase, getSession } }) => {
  const session = await getSession();

  if (!session) {
    throw redirect(303, '/login');
  }

  const { serialId, sceneId } = params;

  // Fetch the scene and verify access
  const { data: scene, error: sceneError } = await supabase
    .from('scenes')
    .select(`
      *,
      serials!scenes_serial_id_fkey (
        id,
        title,
        color_theme,
        next_scene_completion_percentage,
        next_scene_update_note
      )
    `)
    .eq('id', sceneId)
    .eq('serial_id', serialId)
    .single();

  if (sceneError || !scene) {
    console.error('Error fetching scene:', sceneError);
    throw error(404, 'Scene not found');
  }

  // Fetch scene versions (snapshots) for history
  const { data: versions } = await supabase
    .from('scene_versions')
    .select('id, version_number, stage, created_at')
    .eq('scene_id', sceneId)
    .order('version_number', { ascending: false });

  return {
    scene,
    versions: versions || []
  };
};
