import { fail, redirect } from '@sveltejs/kit';

async function getRedirectPath(supabase: any, userId: string) {
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
    
  return roleData?.role === 'author' ? '/write' : '/';
}

export const load = async ({ locals: { supabase, getSession } }) => {
  const session = await getSession();
  if (session) {
    throw redirect(303, await getRedirectPath(supabase, session.user.id));
  }
};

export const actions = {
  login: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return fail(400, { error: 'Please enter both email and password' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return fail(400, { error: error.message });
    }

    throw redirect(303, await getRedirectPath(supabase, data.user.id));
  },
  
  register: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return fail(400, { error: 'Please enter both email and password' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return fail(400, { error: error.message });
    }
    
    // Fallback if no user is returned immediately (e.g. email confirmation required)
    if (!data.user) {
      return fail(400, { error: 'Registration failed. Please try again.' });
    }

    throw redirect(303, await getRedirectPath(supabase, data.user.id));
  }
};
