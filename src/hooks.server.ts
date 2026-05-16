import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' });
        });
      },
    },
  });

  event.locals.getSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();
    return session;
  };

  const session = await event.locals.getSession();

  // Basic route protection
  const routeId = event.route.id || '';
  const isAuthorRoute = routeId.startsWith('/(author)');
  const isAccountRoute = routeId.startsWith('/account');

  if (isAuthorRoute || isAccountRoute) {
    if (!session) {
      return new Response('Redirect', { status: 303, headers: { Location: '/login' } });
    }

    if (isAuthorRoute) {
      // Check role
      const { data: roleData } = await event.locals.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (roleData?.role !== 'author') {
        return new Response('Redirect', { status: 303, headers: { Location: '/' } });
      }
    }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
};
