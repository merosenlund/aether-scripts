import { r as redirect, f as fail } from './index-2b74a932.js';
import './index-21b402be.js';

//#region src/routes/login/+page.server.ts
async function getRedirectPath(supabase, userId) {
	try {
		const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", userId).single();
		return roleData?.role === "author" ? "/write" : "/";
	} catch (e) {
		console.error("Error in getRedirectPath:", e);
		return "/";
	}
}
var load = async ({ locals: { supabase, getSession } }) => {
	try {
		const session = await getSession();
		if (session) throw redirect(303, await getRedirectPath(supabase, session.user.id));
	} catch (e) {
		if (e && typeof e === "object" && "status" in e && "location" in e) throw e;
		console.error("Error in login load:", e);
	}
};
var actions = {
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get("email");
		const password = formData.get("password");
		if (!email || !password) return fail(400, { error: "Please enter both email and password" });
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});
			if (error) return fail(400, { error: error.message });
			throw redirect(303, await getRedirectPath(supabase, data.user.id));
		} catch (e) {
			if (e && typeof e === "object" && "status" in e && "location" in e) throw e;
			console.error("Login action error:", e);
			return fail(500, { error: e.message || "An unexpected error occurred during login." });
		}
	},
	register: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get("email");
		const password = formData.get("password");
		if (!email || !password) return fail(400, { error: "Please enter both email and password" });
		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password
			});
			if (error) {
				console.error("Supabase signUp error object:", error);
				let errorMessage = error.message;
				if (errorMessage === "{}" || !errorMessage) errorMessage = JSON.stringify(error);
				return fail(400, { error: errorMessage });
			}
			if (!data.user) return fail(400, { error: "Registration failed. Please try again." });
			throw redirect(303, await getRedirectPath(supabase, data.user.id));
		} catch (e) {
			if (e && typeof e === "object" && "status" in e && "location" in e) throw e;
			console.error("Register action error:", e);
			return fail(500, { error: e.message || "An unexpected error occurred during registration." });
		}
	}
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions,
	load: load
});

const index = 6;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-c838cb75.js')).default;
const server_id = "src/routes/login/+page.server.ts";
const imports = ["_app/immutable/nodes/6.C6UR_ONi.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/CCi4sbZS.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=6-b93a4c10.js.map
