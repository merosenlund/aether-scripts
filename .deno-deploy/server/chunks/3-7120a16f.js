import { r as redirect, e as error } from './index-2b74a932.js';
import './index-21b402be.js';

//#region src/routes/(author)/serials/[id]/scenes/[sceneId]/+layout.server.ts
var load = async ({ params, locals: { supabase, getSession } }) => {
	if (!await getSession()) throw redirect(303, "/login");
	const { id: serialId, sceneId } = params;
	const { data: scene, error: sceneError } = await supabase.from("scenes").select(`
      *,
      serials!scenes_serial_id_fkey (
        id,
        title,
        color_theme,
        next_scene_completion_percentage,
        next_scene_update_note
      )
    `).eq("id", sceneId).eq("serial_id", serialId).single();
	if (sceneError || !scene) {
		console.error("Error fetching scene:", sceneError);
		throw error(404, "Scene not found");
	}
	const { data: versions } = await supabase.from("scene_versions").select("id, version_number, stage, created_at").eq("scene_id", sceneId).order("version_number", { ascending: false });
	return {
		scene,
		versions: versions || []
	};
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

const index = 3;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-2e5e7bae.js')).default;
const server_id = "src/routes/(author)/serials/[id]/scenes/[sceneId]/+layout.server.ts";
const imports = ["_app/immutable/nodes/3.9iEt156j.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/CCWPcr1F.js","_app/immutable/chunks/CTFPAtyy.js","_app/immutable/chunks/tAgVCxpj2.js","_app/immutable/chunks/B9o4YKQx2.js","_app/immutable/chunks/BTvH1qg5.js","_app/immutable/chunks/Ds28ePDG.js","_app/immutable/chunks/JpPbfvlw.js","_app/immutable/chunks/D16lTyjm.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=3-7120a16f.js.map
