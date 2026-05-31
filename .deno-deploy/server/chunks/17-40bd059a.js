import { r as redirect, e as error, f as fail } from './index-2b74a932.js';
import './index-21b402be.js';

//#region src/routes/(author)/serials/[id]/+page.server.ts
/**
* Verify the active session's user owns the given serial.
* Throws 403 if the serial doesn't exist or belongs to a different author.
* This runs after the hook has already confirmed the caller is a signed-in author,
* so it's purely an ownership check, not an authentication check.
*/
async function assertSerialOwner(supabase, serialId, userId) {
	const { data } = await supabase.from("serials").select("id").eq("id", serialId).eq("author_id", userId).maybeSingle();
	if (!data) throw error(403, "Forbidden");
}
var load = async ({ params, locals: { supabase, getSession } }) => {
	if (!await getSession()) throw redirect(303, "/login");
	const { id: serialId } = params;
	const { data: serial, error: serialError } = await supabase.from("serials").select(`
      *,
      teaser_target_scene:scenes!serials_teaser_target_scene_id_fkey (
        status,
        word_count
      )
    `).eq("id", serialId).single();
	if (serialError || !serial) {
		console.error("Error fetching serial:", serialError);
		throw error(404, "Serial not found");
	}
	const targetScene = serial.teaser_target_scene;
	if (targetScene && targetScene.status === "Playing") serial.next_scene_completion_percentage = Math.min(100, Math.round((targetScene.word_count || 0) / 1e3 * 100));
	const { data: arcs } = await supabase.from("arcs").select("*").eq("serial_id", serialId).order("order_index", { ascending: true });
	const { data: scenes } = await supabase.from("scenes").select("id, arc_id, author_title, status, order_index, published_at, semantic_version").eq("serial_id", serialId).order("order_index", { ascending: true });
	const { count: readersCount } = await supabase.from("reading_progress").select("*", {
		count: "exact",
		head: true
	}).eq("serial_id", serialId);
	return {
		serial,
		arcs: arcs || [],
		scenes: scenes || [],
		readersCount: readersCount || 0
	};
};
var actions = {
	updateSceneOrder: async ({ request, params, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { message: "Unauthorized" });
		await assertSerialOwner(supabase, params.id, session.user.id);
		const updatesStr = (await request.formData()).get("updates");
		if (!updatesStr) return { success: false };
		try {
			const promises = JSON.parse(updatesStr.toString()).map((u) => supabase.from("scenes").update({
				arc_id: u.arc_id || null,
				order_index: u.order_index
			}).eq("id", u.id));
			await Promise.all(promises);
			return { success: true };
		} catch (e) {
			console.error("Failed to parse or save scene updates:", e);
			return { success: false };
		}
	},
	createArc: async ({ request, params, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { message: "Unauthorized" });
		await assertSerialOwner(supabase, params.id, session.user.id);
		const title = (await request.formData()).get("title")?.toString();
		if (!title) return { success: false };
		const { id: serialId } = params;
		const { data: currentArcs } = await supabase.from("arcs").select("order_index").eq("serial_id", serialId).order("order_index", { ascending: false }).limit(1);
		const nextIndex = currentArcs && currentArcs.length > 0 ? currentArcs[0].order_index + 1 : 1;
		const { error } = await supabase.from("arcs").insert({
			serial_id: serialId,
			title,
			order_index: nextIndex
		});
		if (error) return {
			success: false,
			error: error.message
		};
		return { success: true };
	},
	createScene: async ({ params, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { message: "Unauthorized" });
		await assertSerialOwner(supabase, params.id, session.user.id);
		const { id: serialId } = params;
		const { data: currentScenes } = await supabase.from("scenes").select("order_index").eq("serial_id", serialId).order("order_index", { ascending: false }).limit(1);
		const nextIndex = currentScenes && currentScenes.length > 0 ? currentScenes[0].order_index + 1 : 1;
		const { data: newScene, error } = await supabase.from("scenes").insert({
			serial_id: serialId,
			order_index: nextIndex,
			author_title: `Scene ${nextIndex}`,
			status: "Playing"
		}).select().single();
		if (error) {
			console.error("Error creating scene:", error);
			return {
				success: false,
				error: error.message
			};
		}
		throw redirect(303, `/serials/${serialId}/scenes/${newScene.id}/play`);
	},
	updateSerialSettings: async ({ request, params, locals: { supabase, getSession } }) => {
		const session = await getSession();
		if (!session) return fail(401, { message: "Unauthorized" });
		await assertSerialOwner(supabase, params.id, session.user.id);
		const { id: serialId } = params;
		const formData = await request.formData();
		const title = formData.get("title")?.toString();
		const status = formData.get("status")?.toString();
		const colorTheme = formData.get("colorTheme")?.toString();
		if (!title || !status || !colorTheme) return {
			success: false,
			error: "Missing required fields"
		};
		const { error } = await supabase.from("serials").update({
			title,
			status,
			color_theme: colorTheme
		}).eq("id", serialId);
		if (error) {
			console.error("Error updating serial settings:", error);
			return {
				success: false,
				error: error.message
			};
		}
		return { success: true };
	}
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions,
	load: load
});

const index = 17;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-7380d7d4.js')).default;
const server_id = "src/routes/(author)/serials/[id]/+page.server.ts";
const imports = ["_app/immutable/nodes/17.BAO0N58w.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/Ds28ePDG.js","_app/immutable/chunks/JpPbfvlw.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/BuT8oGdW.js","_app/immutable/chunks/Dvas3itb.js","_app/immutable/chunks/mtxTYDQT.js","_app/immutable/chunks/CWgvYwPi.js","_app/immutable/chunks/D-n9VPvU.js","_app/immutable/chunks/DbwvtgLl.js","_app/immutable/chunks/BhZ5KCY1.js","_app/immutable/chunks/DGrBo_4K.js","_app/immutable/chunks/N1x6iA-l.js","_app/immutable/chunks/DrNIh-PT2.js","_app/immutable/chunks/CpYKmQlh2.js","_app/immutable/chunks/B9o4YKQx2.js","_app/immutable/chunks/_5R9kj0a.js","_app/immutable/chunks/D7Edu2C5.js","_app/immutable/chunks/Meje3KEn.js","_app/immutable/chunks/CivkagOI.js","_app/immutable/chunks/8HtxlkHQ.js","_app/immutable/chunks/Di2xvN97.js","_app/immutable/chunks/D16lTyjm.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=17-40bd059a.js.map
