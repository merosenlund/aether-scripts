import { r as redirect, e as error } from './index-2b74a932.js';
import './index-21b402be.js';

//#region src/routes/(author)/analytics/serials/[id]/+page.server.ts
var load = async ({ params, locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) throw redirect(303, "/login");
	const { id: serialId } = params;
	const { data: serial, error: serialError } = await supabase.from("serials").select("id, title, status").eq("id", serialId).eq("author_id", session.user.id).single();
	if (serialError || !serial) throw error(404, "Serial not found");
	const { data: sessions } = await supabase.from("writing_sessions").select(`
      id, session_type, start_time, end_time,
      active_duration_seconds, starting_word_count, ending_word_count,
      keystrokes, net_characters, flesch_reading_ease, avg_sentence_length,
      avg_word_length, type_token_ratio,
      scene_id,
      scenes (id, author_title, display_title, order_index)
    `).eq("author_id", session.user.id).eq("serial_id", serialId).order("start_time", { ascending: false });
	const { data: scenes } = await supabase.from("scenes").select("id, author_title, display_title, order_index, word_count, published_at, status").eq("serial_id", serialId).order("order_index", { ascending: true });
	return {
		serial,
		sessions: sessions || [],
		scenes: scenes || []
	};
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

const index = 15;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-bb3e9176.js')).default;
const server_id = "src/routes/(author)/analytics/serials/[id]/+page.server.ts";
const imports = ["_app/immutable/nodes/15.CRs8eof0.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/BZQYYah1.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/CvrWQEAv.js","_app/immutable/chunks/BuT8oGdW.js","_app/immutable/chunks/DwYR74N-.js","_app/immutable/chunks/N1x6iA-l.js","_app/immutable/chunks/Bevh5KnR.js","_app/immutable/chunks/B3UdjAg1.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=15-6e529871.js.map
