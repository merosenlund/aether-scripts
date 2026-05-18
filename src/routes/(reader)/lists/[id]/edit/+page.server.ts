import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, getSession } }) => {
  const session = await getSession();
  if (!session) {
    throw redirect(303, '/login');
  }

  // Load reading list
  const { data: list, error: listError } = await supabase
    .from('reading_lists')
    .select(`
      *,
      serial:serials (
        id,
        title,
        color_theme
      )
    `)
    .eq('id', params.id)
    .single();

  if (listError || !list) {
    throw error(404, 'Reading list not found');
  }

  // Authorize owner
  if (list.user_id !== session.user.id) {
    throw error(403, 'Unauthorized to edit this list');
  }

  // Load all published scenes from the target serial
  const { data: scenes } = await supabase
    .from('scenes')
    .select('id, author_title, display_title, order_index, status')
    .eq('serial_id', list.serial_id)
    .eq('status', 'Published')
    .order('order_index', { ascending: true });

  // Load current list items
  const { data: items } = await supabase
    .from('reading_list_items')
    .select('*')
    .eq('list_id', list.id)
    .order('order_index', { ascending: true });

  // Load current list arcs
  const { data: arcs } = await supabase
    .from('reading_list_arcs')
    .select('*')
    .eq('list_id', list.id)
    .order('order_index', { ascending: true });

  return {
    list,
    scenes: scenes || [],
    items: items || [],
    arcs: arcs || []
  };
};

export const actions = {
  updateSettings: async ({ request, params, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) return fail(401);

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const isPublic = formData.get('isPublic') === 'true';

    const { error: updateError } = await supabase
      .from('reading_lists')
      .update({ title, is_public: isPublic })
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error(updateError);
      return fail(500, { message: 'Failed to update settings' });
    }

    return { success: true };
  },

  addItem: async ({ request, params, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) return fail(401);

    const formData = await request.formData();
    const sceneId = formData.get('sceneId') as string;
    const orderIndex = parseInt(formData.get('orderIndex') as string || '0', 10);

    const { error: insertError } = await supabase
      .from('reading_list_items')
      .insert({
        list_id: params.id,
        scene_id: sceneId,
        order_index: orderIndex,
        reading_mode: 'prose'
      });

    if (insertError) {
      console.error(insertError);
      return fail(500, { message: 'Failed to add scene' });
    }

    return { success: true };
  },

  removeItem: async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) return fail(401);

    const formData = await request.formData();
    const itemId = formData.get('itemId') as string;

    const { error: deleteError } = await supabase
      .from('reading_list_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error(deleteError);
      return fail(500, { message: 'Failed to remove scene' });
    }

    return { success: true };
  },

  createArc: async ({ request, params, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) return fail(401);

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const orderIndex = parseInt(formData.get('orderIndex') as string || '0', 10);

    const { error: insertError } = await supabase
      .from('reading_list_arcs')
      .insert({
        list_id: params.id,
        title,
        order_index: orderIndex
      });

    if (insertError) {
      console.error(insertError);
      return fail(500, { message: 'Failed to create arc' });
    }

    return { success: true };
  },

  deleteArc: async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) return fail(401);

    const formData = await request.formData();
    const arcId = formData.get('arcId') as string;

    const { error: deleteError } = await supabase
      .from('reading_list_arcs')
      .delete()
      .eq('id', arcId);

    if (deleteError) {
      console.error(deleteError);
      return fail(500, { message: 'Failed to delete arc' });
    }

    return { success: true };
  },

  updateItems: async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) return fail(401);

    const formData = await request.formData();
    const updatesStr = formData.get('updates') as string;
    if (!updatesStr) return fail(400);

    const updates = JSON.parse(updatesStr);
    
    // Update all items
    for (const item of updates) {
      await supabase
        .from('reading_list_items')
        .update({
          order_index: item.order_index,
          list_arc_id: item.list_arc_id || null,
          reading_mode: item.reading_mode
        })
        .eq('id', item.id);
    }

    return { success: true };
  }
};
