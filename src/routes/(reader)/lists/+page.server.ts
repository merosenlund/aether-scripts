import type { PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
  const session = await getSession();
  
  let query = supabase
    .from('reading_lists')
    .select(`
      id,
      title,
      is_public,
      created_at,
      user_id,
      serial:serials (
        id,
        title,
        color_theme,
        status
      ),
      items:reading_list_items (
        id
      )
    `);

  if (session?.user?.id) {
    query = query.or(`is_public.eq.true,user_id.eq.${session.user.id}`);
  } else {
    query = query.eq('is_public', true);
  }

  const { data: listsData, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reading lists:', error);
  }

  // Fetch available serials for list creation
  const { data: serials } = await supabase
    .from('serials')
    .select('id, title, color_theme');

  return {
    lists: listsData || [],
    serials: serials || []
  };
};

export const actions = {
  createList: async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const serialId = formData.get('serialId') as string;
    const isPublic = formData.get('isPublic') === 'true';

    if (!title || !serialId) {
      return fail(400, { message: 'Title and Serial are required.' });
    }

    const { data: newList, error } = await supabase
      .from('reading_lists')
      .insert({
        user_id: session.user.id,
        serial_id: serialId,
        title,
        is_public: isPublic
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reading list:', error);
      return fail(500, { message: 'Failed to create reading list.' });
    }

    throw redirect(303, `/lists/${newList.id}/edit`);
  }
};
