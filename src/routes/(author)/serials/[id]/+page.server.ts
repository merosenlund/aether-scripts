import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, getSession } }) => {
  const session = await getSession();
  if (!session) {
    throw redirect(303, '/login');
  }

  const { id: serialId } = params;

  // 1. Fetch Serial Details
  const { data: serial, error: serialError } = await supabase
    .from('serials')
    .select('*')
    .eq('id', serialId)
    .single();

  if (serialError || !serial) {
    console.error('Error fetching serial:', serialError);
    throw error(404, 'Serial not found');
  }

  // 2. Fetch Arcs
  const { data: arcs } = await supabase
    .from('arcs')
    .select('*')
    .eq('serial_id', serialId)
    .order('order_index', { ascending: true });

  // 3. Fetch Scenes
  const { data: scenes } = await supabase
    .from('scenes')
    .select('id, arc_id, author_title, status, order_index, published_at, semantic_version')
    .eq('serial_id', serialId)
    .order('order_index', { ascending: true });

  // 4. Fetch Active Readers count
  const { count: readersCount } = await supabase
    .from('reading_progress')
    .select('*', { count: 'exact', head: true })
    .eq('serial_id', serialId);

  return {
    serial,
    arcs: arcs || [],
    scenes: scenes || [],
    readersCount: readersCount || 0
  };
};

export const actions: Actions = {
  updateSceneOrder: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const updatesStr = formData.get('updates');
    if (!updatesStr) return { success: false };

    try {
      const updates = JSON.parse(updatesStr.toString()) as { id: string; arc_id: string | null; order_index: number }[];

      // Perform updates
      const promises = updates.map((u) => 
        supabase
          .from('scenes')
          .update({ arc_id: u.arc_id || null, order_index: u.order_index })
          .eq('id', u.id)
      );

      await Promise.all(promises);
      return { success: true };
    } catch (e) {
      console.error('Failed to parse or save scene updates:', e);
      return { success: false };
    }
  },

  createArc: async ({ request, params, locals: { supabase } }) => {
    const formData = await request.formData();
    const title = formData.get('title')?.toString();
    if (!title) return { success: false };

    const { id: serialId } = params;

    // Get max order index for arc
    const { data: currentArcs } = await supabase
      .from('arcs')
      .select('order_index')
      .eq('serial_id', serialId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextIndex = currentArcs && currentArcs.length > 0
      ? currentArcs[0].order_index + 1
      : 1;

    const { error } = await supabase
      .from('arcs')
      .insert({
        serial_id: serialId,
        title,
        order_index: nextIndex
      });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  createScene: async ({ params, locals: { supabase } }) => {
    const { id: serialId } = params;

    // Get max order index for scene
    const { data: currentScenes } = await supabase
      .from('scenes')
      .select('order_index')
      .eq('serial_id', serialId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextIndex = currentScenes && currentScenes.length > 0
      ? currentScenes[0].order_index + 1
      : 1;

    const { data: newScene, error } = await supabase
      .from('scenes')
      .insert({
        serial_id: serialId,
        order_index: nextIndex,
        author_title: `Untitled Scene ${nextIndex}`,
        status: 'Playing'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scene:', error);
      return { success: false, error: error.message };
    }

    throw redirect(303, `/play/${serialId}/${newScene.id}`);
  }
};
