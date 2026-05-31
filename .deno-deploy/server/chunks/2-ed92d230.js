import { e as error } from './index-2b74a932.js';
import './index-21b402be.js';

//#region src/routes/(author)/serials/[id]/wiki/+layout.server.ts
var load = async ({ params, locals: { supabase } }) => {
	const { id: serialId } = params;
	const { data: serial, error: serialError } = await supabase.from("serials").select("*").eq("id", serialId).single();
	if (serialError || !serial) throw error(404, "Serial not found");
	const { data: scenes, error: scenesError } = await supabase.from("scenes").select("id, author_title, display_title, order_index").eq("serial_id", serialId).order("order_index", { ascending: true });
	if (scenesError) throw scenesError;
	const { data: entities, error: entitiesError } = await supabase.from("wiki_entities").select("*").eq("serial_id", serialId).order("name", { ascending: true });
	if (entitiesError) throw entitiesError;
	let events = [];
	const entityIds = entities?.map((e) => e.id) || [];
	if (entityIds.length > 0) {
		const { data: eventsData, error: eventsError } = await supabase.from("wiki_events").select("*, wiki_entities(*), scenes(*)").in("entity_id", entityIds).order("created_at", { ascending: false });
		if (eventsError) throw eventsError;
		events = eventsData || [];
	}
	return {
		serial,
		scenes: scenes || [],
		entities: entities || [],
		events
	};
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

const index = 2;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-9a951e5e.js')).default;
const server_id = "src/routes/(author)/serials/[id]/wiki/+layout.server.ts";
const imports = ["_app/immutable/nodes/2.Ds2CAPUo.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/Ds28ePDG.js","_app/immutable/chunks/JpPbfvlw.js","_app/immutable/chunks/BZQYYah1.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/CvrWQEAv.js","_app/immutable/chunks/-IX48nSD.js","_app/immutable/chunks/_5R9kj0a.js","_app/immutable/chunks/CWgvYwPi.js","_app/immutable/chunks/vOyDlXtT.js","_app/immutable/chunks/CGc_j63V.js","_app/immutable/chunks/8HtxlkHQ.js","_app/immutable/chunks/Bd0TLDJt.js","_app/immutable/chunks/D-n9VPvU.js","_app/immutable/chunks/DbwvtgLl.js","_app/immutable/chunks/BhZ5KCY1.js","_app/immutable/chunks/DGrBo_4K.js","_app/immutable/chunks/CfZAEH6F.js","_app/immutable/chunks/6FrWQ2fR.js","_app/immutable/chunks/D16lTyjm.js","_app/immutable/chunks/DxPyOFsU.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=2-ed92d230.js.map
