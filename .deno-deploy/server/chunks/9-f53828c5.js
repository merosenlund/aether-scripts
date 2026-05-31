import { r as redirect, e as error, f as fail } from './index-2b74a932.js';
import './index-21b402be.js';

//#region src/routes/(reader)/lists/[id]/edit/+page.server.ts
var load = async ({ params, locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) throw redirect(303, "/login");
	const { data: list, error: listError } = await supabase.from("reading_lists").select(`
      *,
      serial:serials (
        id,
        title,
        color_theme
      )
    `).eq("id", params.id).single();
	if (listError || !list) throw error(404, "Reading list not found");
	if (list.user_id !== session.user.id) throw error(403, "Unauthorized to edit this list");
	const { data: scenes } = await supabase.from("scenes").select("id, author_title, display_title, order_index, status").eq("serial_id", list.serial_id).eq("status", "Published").order("order_index", { ascending: true });
	const { data: items } = await supabase.from("reading_list_items").select("*").eq("list_id", list.id).order("order_index", { ascending: true });
	const { data: arcs } = await supabase.from("reading_list_arcs").select("*").eq("list_id", list.id).order("order_index", { ascending: true });
	return {
		list,
		scenes: scenes || [],
		items: items || [],
		arcs: arcs || []
	};
};
var actions = {
	updateSettings: async ({ request, params, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401);
		const formData = await request.formData();
		const title = formData.get("title");
		const isPublic = formData.get("isPublic") === "true";
		const { error: updateError } = await supabase.from("reading_lists").update({
			title,
			is_public: isPublic
		}).eq("id", params.id).eq("user_id", session.user.id);
		if (updateError) {
			console.error(updateError);
			return fail(500, { message: "Failed to update settings" });
		}
		return { success: true };
	},
	addItem: async ({ request, params, locals: { supabase, getSession } }) => {
		if (!await getSession()) return fail(401);
		const formData = await request.formData();
		const sceneId = formData.get("sceneId");
		const orderIndex = parseInt(formData.get("orderIndex") || "0", 10);
		const { error: insertError } = await supabase.from("reading_list_items").insert({
			list_id: params.id,
			scene_id: sceneId,
			order_index: orderIndex,
			reading_mode: "prose"
		});
		if (insertError) {
			console.error(insertError);
			return fail(500, { message: "Failed to add scene" });
		}
		return { success: true };
	},
	removeItem: async ({ request, locals: { supabase, getSession } }) => {
		if (!await getSession()) return fail(401);
		const itemId = (await request.formData()).get("itemId");
		const { error: deleteError } = await supabase.from("reading_list_items").delete().eq("id", itemId);
		if (deleteError) {
			console.error(deleteError);
			return fail(500, { message: "Failed to remove scene" });
		}
		return { success: true };
	},
	createArc: async ({ request, params, locals: { supabase, getSession } }) => {
		if (!await getSession()) return fail(401);
		const formData = await request.formData();
		const title = formData.get("title");
		const orderIndex = parseInt(formData.get("orderIndex") || "0", 10);
		const { error: insertError } = await supabase.from("reading_list_arcs").insert({
			list_id: params.id,
			title,
			order_index: orderIndex
		});
		if (insertError) {
			console.error(insertError);
			return fail(500, { message: "Failed to create arc" });
		}
		return { success: true };
	},
	deleteArc: async ({ request, locals: { supabase, getSession } }) => {
		if (!await getSession()) return fail(401);
		const arcId = (await request.formData()).get("arcId");
		const { error: deleteError } = await supabase.from("reading_list_arcs").delete().eq("id", arcId);
		if (deleteError) {
			console.error(deleteError);
			return fail(500, { message: "Failed to delete arc" });
		}
		return { success: true };
	},
	updateItems: async ({ request, locals: { supabase, getSession } }) => {
		if (!await getSession()) return fail(401);
		const updatesStr = (await request.formData()).get("updates");
		if (!updatesStr) return fail(400);
		const updates = JSON.parse(updatesStr);
		for (const item of updates) await supabase.from("reading_list_items").update({
			order_index: item.order_index,
			list_arc_id: item.list_arc_id || null,
			reading_mode: item.reading_mode
		}).eq("id", item.id);
		return { success: true };
	}
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions,
	load: load
});

const index = 9;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-65eb095b.js')).default;
const server_id = "src/routes/(reader)/lists/[id]/edit/+page.server.ts";
const imports = ["_app/immutable/nodes/9.CeFXYvvL.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/Ds28ePDG.js","_app/immutable/chunks/JpPbfvlw.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/CvrWQEAv.js","_app/immutable/chunks/BuT8oGdW.js","_app/immutable/chunks/DQklTHYW.js","_app/immutable/chunks/CpYKmQlh2.js","_app/immutable/chunks/_5R9kj0a.js","_app/immutable/chunks/D7Edu2C5.js","_app/immutable/chunks/Meje3KEn.js","_app/immutable/chunks/XzCqwrd9.js","_app/immutable/chunks/8HtxlkHQ.js","_app/immutable/chunks/Di2xvN97.js","_app/immutable/chunks/D16lTyjm.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=9-f53828c5.js.map
