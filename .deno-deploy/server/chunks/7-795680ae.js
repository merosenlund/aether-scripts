import { f as fail, r as redirect } from './index-2b74a932.js';
import './index-21b402be.js';

//#region src/routes/(reader)/lists/+page.server.ts
var load = async ({ locals: { supabase, getSession } }) => {
	const session = await getSession();
	let query = supabase.from("reading_lists").select(`
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
	if (session?.user?.id) query = query.or(`is_public.eq.true,user_id.eq.${session.user.id}`);
	else query = query.eq("is_public", true);
	const { data: listsData, error } = await query.order("created_at", { ascending: false });
	if (error) console.error("Error fetching reading lists:", error);
	const { data: serials } = await supabase.from("serials").select("id, title, color_theme");
	return {
		lists: listsData || [],
		serials: serials || []
	};
};
var actions = { createList: async ({ request, locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) return fail(401, { message: "Unauthorized" });
	const formData = await request.formData();
	const title = formData.get("title");
	const serialId = formData.get("serialId");
	const isPublic = formData.get("isPublic") === "true";
	if (!title || !serialId) return fail(400, { message: "Title and Serial are required." });
	const { data: newList, error } = await supabase.from("reading_lists").insert({
		user_id: session.user.id,
		serial_id: serialId,
		title,
		is_public: isPublic
	}).select().single();
	if (error) {
		console.error("Error creating reading list:", error);
		return fail(500, { message: "Failed to create reading list." });
	}
	throw redirect(303, `/lists/${newList.id}/edit`);
} };

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions,
	load: load
});

const index = 7;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-6820f5f3.js')).default;
const server_id = "src/routes/(reader)/lists/+page.server.ts";
const imports = ["_app/immutable/nodes/7.J5kmR6dc.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/Df5EYvfa.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/DPg0JQl-.js","_app/immutable/chunks/DrNIh-PT2.js","_app/immutable/chunks/DKiQK1IH2.js","_app/immutable/chunks/CpYKmQlh2.js","_app/immutable/chunks/_5R9kj0a.js","_app/immutable/chunks/DwTWZ9qF.js","_app/immutable/chunks/D16lTyjm.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-795680ae.js.map
