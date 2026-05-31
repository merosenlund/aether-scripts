import { P as PUBLIC_SUPABASE_ANON_KEY, a as PUBLIC_SUPABASE_URL } from './warnDeprecatedPackage-103e47c7.js';
import { c as createServerClient } from './createServerClient-03f5eddc.js';

//#region src/hooks.server.ts
var handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { cookies: {
		getAll: () => event.cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				event.cookies.set(name, value, {
					...options,
					path: "/"
				});
			});
		}
	} });
	event.locals.getSession = async () => {
		try {
			const { data: { session } } = await event.locals.supabase.auth.getSession();
			if (session) {
				const { data: { user }, error } = await event.locals.supabase.auth.getUser();
				if (error || !user) {
					try {
						await event.locals.supabase.auth.signOut();
					} catch (signOutError) {
						console.error("Error during signOut on invalid session:", signOutError);
					}
					return null;
				}
			}
			return session;
		} catch (e) {
			console.error("Error in event.locals.getSession:", e);
			return null;
		}
	};
	let session = null;
	try {
		session = await event.locals.getSession();
	} catch (e) {
		console.error("Error getting session in hooks handle:", e);
	}
	const routeId = event.route.id || "";
	const isAuthorRoute = routeId.startsWith("/(author)");
	const isAccountRoute = routeId.startsWith("/account");
	const isSettingsRoute = routeId.startsWith("/settings");
	if (isAuthorRoute || isAccountRoute || isSettingsRoute) {
		if (!session) return new Response("Redirect", {
			status: 303,
			headers: { Location: "/login" }
		});
		if (isAuthorRoute) {
			const { data: roleData } = await event.locals.supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
			if (roleData?.role !== "author") return new Response("Redirect", {
				status: 303,
				headers: { Location: "/" }
			});
		}
	}
	return resolve(event, { filterSerializedResponseHeaders(name) {
		return name === "content-range" || name === "x-supabase-api-version";
	} });
};

export { handle };
//# sourceMappingURL=hooks.server-c6f57710.js.map
