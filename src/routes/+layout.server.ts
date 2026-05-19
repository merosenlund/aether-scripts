export const load = async ({ locals: { supabase, getSession }, cookies }) => {
	const session = await getSession();
	let userRole = null;

	if (session) {
		const { data: roleData } = await supabase
			.from('user_roles')
			.select('role')
			.eq('user_id', session.user.id)
			.single();

		userRole = roleData?.role || null;
	}

	return {
		session,
		userRole,
		cookies: cookies.getAll()
	};
};
