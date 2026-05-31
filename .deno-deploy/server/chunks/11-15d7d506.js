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

//#region src/routes/(reader)/library/[id]/+page.server.ts
var load = async ({ params, locals: { supabase } }) => {
	const { id: serialId } = params;
	const { data: serial, error: serialError } = await supabase.from("serials").select(`
      id,
      title,
      color_theme,
      status,
      next_scene_completion_percentage,
      next_scene_update_note,
      teaser_target_scene_id,
      author_id,
      teaser_target_scene:scenes!serials_teaser_target_scene_id_fkey (
        status,
        word_count
      )
    `).eq("id", serialId).single();
	if (serialError || !serial) {
		console.error("Error fetching serial for reader:", serialError);
		throw error(404, "Serial not found");
	}
	const targetScene = serial.teaser_target_scene;
	const autoPlayPercent = targetScene ? Math.min(100, Math.round((targetScene.word_count || 0) / 1e3 * 100)) : 0;
	const manualEditPercent = serial.next_scene_completion_percentage || 0;
	let teaserMetrics = {
		playTimeSeconds: 0,
		editTimeSeconds: 0,
		playKeystrokes: 0,
		editKeystrokes: 0,
		playNetWords: 0,
		editNetWords: 0
	};
	if (serial && serial.teaser_target_scene_id) {
		const { data: sessions } = await supabase.from("writing_sessions").select("session_type, active_duration_seconds, keystrokes, starting_word_count, ending_word_count").eq("scene_id", serial.teaser_target_scene_id);
		if (sessions) sessions.forEach((s) => {
			const net = Math.max(0, (s.ending_word_count || 0) - (s.starting_word_count || 0));
			if (s.session_type === "play") {
				teaserMetrics.playTimeSeconds += s.active_duration_seconds || 0;
				teaserMetrics.playKeystrokes += s.keystrokes || 0;
				teaserMetrics.playNetWords += net;
			} else if (s.session_type === "edit") {
				teaserMetrics.editTimeSeconds += s.active_duration_seconds || 0;
				teaserMetrics.editKeystrokes += s.keystrokes || 0;
				teaserMetrics.editNetWords += net;
			}
		});
	}
	const { data: scenes, error: scenesError } = await supabase.from("scenes").select(`
      id, 
      display_title, 
      author_title, 
      published_at, 
      order_index, 
      status, 
      scheduled_status, 
      scheduled_status_at,
      content_blocks,
      scene_versions(content)
    `).eq("serial_id", serialId).eq("scene_versions.is_active", true).order("order_index", { ascending: true });
	if (scenesError) {
		console.error("Error fetching scenes:", scenesError);
		throw error(500, "Could not load story scenes");
	}
	const now = /* @__PURE__ */ new Date();
	return {
		serial,
		scenes: (scenes || []).filter((scene) => {
			if (scene.status === "Published") return true;
			if (scene.scheduled_status === "Published" && scene.scheduled_status_at) return new Date(scene.scheduled_status_at) <= now;
			return false;
		}).map((scene) => {
			let contentHtml = "";
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
			return {
				id: scene.id,
				display_title: scene.display_title,
				author_title: scene.author_title,
				published_at: scene.published_at,
				order_index: scene.order_index,
				status: scene.status,
				scheduled_status: scene.scheduled_status,
				scheduled_status_at: scene.scheduled_status_at,
				content: contentHtml
			};
		}),
		teaserMetrics,
		autoPlayPercent,
		manualEditPercent
	};
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

const index = 11;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-6501de73.js')).default;
const server_id = "src/routes/(reader)/library/[id]/+page.server.ts";
const imports = ["_app/immutable/nodes/11.BGWoJiID.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/BZQYYah1.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/BuT8oGdW.js","_app/immutable/chunks/Dvas3itb.js","_app/immutable/chunks/DROKvFWg.js","_app/immutable/chunks/DPg0JQl-.js","_app/immutable/chunks/DdhSbIEF.js","_app/immutable/chunks/D16lTyjm.js","_app/immutable/chunks/BTQToySV.js","_app/immutable/chunks/C6zeT9Qp.js","_app/immutable/chunks/BhZ5KCY1.js","_app/immutable/chunks/DGrBo_4K.js"];
const stylesheets = ["_app/immutable/assets/Reader.CzifZ7nP.css","_app/immutable/assets/11.3vOEhdVC.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=11-15d7d506.js.map
