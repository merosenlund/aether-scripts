import { i as index_default, G as GMNote, D as DiceRoller, S as StatBlock, O as OddsCheck, C as ClockBlock, T as TrackBlock, a as OracleBlock } from './index-8b3ef059.js';
import { B as BlockMetadata } from './BlockMetadata-4e11220d.js';
import { e as error } from './index-2b74a932.js';
import { g as generateHTML } from './index-95e195b8.js';
import './index-server-db57e4a7.js';
import './dev-db1ab9cf.js';
import './Icon-f47d171f.js';
import './contextEngine.svelte-fa9b4d62.js';
import './wiki-7e2bc21a.js';
import './supabaseClient-824b9cb6.js';
import './warnDeprecatedPackage-103e47c7.js';
import './createBrowserClient-0790f5fc.js';
import './index-21b402be.js';

//#region src/routes/(reader)/lists/[id]/+page.server.ts
var load = async ({ params, locals: { supabase, getSession } }) => {
	const session = await getSession();
	const { data: list, error: listError } = await supabase.from("reading_lists").select(`
      *,
      serial:serials (
        id,
        title,
        color_theme,
        status,
        author_id
      )
    `).eq("id", params.id).single();
	if (listError || !list) {
		console.error("Error fetching reading list:", listError);
		throw error(404, "Reading list not found");
	}
	if (!list.is_public && (!session || list.user_id !== session.user.id)) throw error(403, "This reading list is private");
	const { data: arcs } = await supabase.from("reading_list_arcs").select("*").eq("list_id", list.id).order("order_index", { ascending: true });
	const { data: items, error: itemsError } = await supabase.from("reading_list_items").select(`
      *,
      scene:scenes (
        id,
        display_title,
        author_title,
        order_index,
        published_at,
        summary,
        description,
        content_blocks,
        scene_versions(content)
      )
    `).eq("list_id", list.id).eq("scene.scene_versions.is_active", true).order("order_index", { ascending: true });
	if (itemsError) {
		console.error("Error loading list items:", itemsError);
		throw error(500, "Failed to load curation list items");
	}
	const compiledItems = (items || []).map((item) => {
		const scene = item.scene;
		let contentHtml = "";
		if (scene) {
			const activeVersion = scene.scene_versions?.[0];
			const jsonContent = activeVersion && activeVersion.content || scene.content_blocks;
			if (jsonContent) try {
				contentHtml = generateHTML(jsonContent, [
					index_default,
					GMNote,
					DiceRoller,
					StatBlock,
					OddsCheck,
					ClockBlock,
					TrackBlock,
					OracleBlock,
					BlockMetadata
				]);
			} catch (err) {
				console.error(`Error generating HTML for scene ${scene.id}:`, err);
			}
		}
		return {
			id: item.id,
			list_id: item.list_id,
			list_arc_id: item.list_arc_id,
			order_index: item.order_index,
			reading_mode: item.reading_mode,
			scene: scene ? {
				id: scene.id,
				display_title: scene.display_title,
				author_title: scene.author_title,
				order_index: scene.order_index,
				published_at: scene.published_at,
				summary: scene.summary,
				description: scene.description,
				content: contentHtml
			} : null
		};
	});
	return {
		list,
		arcs: arcs || [],
		items: compiledItems
	};
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

const index = 8;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-7f5d6052.js')).default;
const server_id = "src/routes/(reader)/lists/[id]/+page.server.ts";
const imports = ["_app/immutable/nodes/8.DszIt6kv.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/CvrWQEAv.js","_app/immutable/chunks/BuT8oGdW.js","_app/immutable/chunks/Dvas3itb.js","_app/immutable/chunks/DPg0JQl-.js","_app/immutable/chunks/DdhSbIEF.js","_app/immutable/chunks/DKiQK1IH2.js","_app/immutable/chunks/CpYKmQlh2.js","_app/immutable/chunks/D16lTyjm.js","_app/immutable/chunks/BTQToySV.js"];
const stylesheets = ["_app/immutable/assets/Reader.CzifZ7nP.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=8-4755fdca.js.map
