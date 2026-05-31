//#region src/routes/(author)/serials/[id]/wiki/[entityId]/events/+page.server.ts
var load = async ({ params, parent, locals: { supabase } }) => {
	const { entityId } = params;
	const parentData = await parent();
	const entityEvents = (parentData.events || []).filter((ev) => ev.entity_id === entityId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
	const scenesWithEvents = new Set(entityEvents.filter((ev) => ev.scene_id).map((ev) => ev.scene_id));
	const latestScene = (parentData.scenes || []).filter((s) => scenesWithEvents.has(s.id)).sort((a, b) => b.order_index - a.order_index)[0];
	let initialSceneContent = null;
	if (latestScene) {
		const { data: sceneData } = await supabase.from("scenes").select("id, content_blocks").eq("id", latestScene.id).single();
		if (sceneData) initialSceneContent = {
			id: sceneData.id,
			content_blocks: sceneData.content_blocks
		};
	}
	return {
		entityId,
		entityEvents,
		initialSceneContent,
		latestSceneId: latestScene?.id || null
	};
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

const index = 19;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-101da178.js')).default;
const server_id = "src/routes/(author)/serials/[id]/wiki/[entityId]/events/+page.server.ts";
const imports = ["_app/immutable/nodes/19.CZ-ACDC6.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/CvrWQEAv.js","_app/immutable/chunks/CmGPvKs1.js","_app/immutable/chunks/D16lTyjm.js","_app/immutable/chunks/XzCqwrd9.js","_app/immutable/chunks/Bd0TLDJt.js","_app/immutable/chunks/Ds28ePDG.js","_app/immutable/chunks/JpPbfvlw.js","_app/immutable/chunks/DbwvtgLl.js","_app/immutable/chunks/BhZ5KCY1.js","_app/immutable/chunks/DGrBo_4K.js","_app/immutable/chunks/DxPyOFsU.js","_app/immutable/chunks/DmqSfy6J.js"];
const stylesheets = ["_app/immutable/assets/19.CBKMs4Jp.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=19-541899d4.js.map
