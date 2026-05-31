import { fail, redirect } from '@sveltejs/kit';

async function getRedirectPath(supabase: any, userId: string) {
	try {
		const { data: roleData } = await supabase
			.from('user_roles')
			.select('role')
			.eq('user_id', userId)
			.single();

		return roleData?.role === 'author' ? '/write' : '/';
	} catch (e) {
		console.error('Error in getRedirectPath:', e);
		return '/';
	}
}

export const load = async ({ locals: { supabase, getSession } }) => {
	try {
		const session = await getSession();
		if (session) {
			throw redirect(303, await getRedirectPath(supabase, session.user.id));
		}
	} catch (e) {
		// If redirect is thrown, rethrow it so SvelteKit handles it
		if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
			throw e;
		}
		console.error('Error in login load:', e);
	}
};

export const actions = {
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim();
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Please enter both email and password' });
		}

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) {
				return fail(400, { error: error.message });
			}

			const redirectPath = await getRedirectPath(supabase, data.user.id);
			throw redirect(303, redirectPath);
		} catch (e: any) {
			if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
				throw e; // Rethrow SvelteKit redirects
			}
			console.error('Login action error:', e);
			return fail(500, { error: e.message || 'An unexpected error occurred during login.' });
		}
	},

	register: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim();
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Please enter both email and password' });
		}

		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password
			});

			if (error) {
				console.error('Supabase signUp error object:', error);
				let errorMessage = error.message;
				if (errorMessage === '{}' || !errorMessage) {
					errorMessage = JSON.stringify(error);
				}
				return fail(400, { error: errorMessage });
			}

			// Fallback if no user is returned immediately (e.g. email confirmation required)
			if (!data.user) {
				return fail(400, { error: 'Registration failed. Please try again.' });
			}

			const redirectPath = await getRedirectPath(supabase, data.user.id);
			throw redirect(303, redirectPath);
		} catch (e: any) {
			if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
				throw e; // Rethrow SvelteKit redirects
			}
			console.error('Register action error:', e);
			return fail(500, { error: e.message || 'An unexpected error occurred during registration.' });
		}
	}
};
