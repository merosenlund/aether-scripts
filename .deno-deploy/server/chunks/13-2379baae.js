import { r as redirect, e as error, f as fail } from './index-2b74a932.js';
import './index-21b402be.js';

//#region src/routes/(author)/write/+page.server.ts
var load = async ({ locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) throw redirect(303, "/login");
	const { data: serials, error: serialsError } = await supabase.from("serials").select(`
      id,
      title,
      color_theme,
      status,
      created_at,
      scenes:scenes!scenes_serial_id_fkey(count),
      readers:reading_progress(count)
    `).eq("author_id", session.user.id).order("created_at", { ascending: false });
	if (serialsError) {
		console.error("Error fetching serials:", serialsError);
		throw error(500, "Could not fetch serials");
	}
	return { serials: await Promise.all(serials.map(async (serial) => {
		const { data: latestUpdate } = await supabase.from("scene_updates").select("created_at").in("scene_id", (await supabase.from("scenes").select("id").eq("serial_id", serial.id)).data?.map((s) => s.id) || []).order("created_at", { ascending: false }).limit(1).maybeSingle();
		return {
			...serial,
			scenesCount: serial.scenes?.[0]?.count || 0,
			readersCount: serial.readers?.[0]?.count || 0,
			lastEdit: latestUpdate?.created_at || serial.created_at
		};
	})) };
};
var actions = { create: async ({ request, locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) throw redirect(303, "/login");
	const title = ((await request.formData()).get("title") || "Untitled Serial").trim();
	const gradients = [
		"from-rose-500 to-orange-500",
		"from-emerald-400 to-cyan-500",
		"from-blue-500 to-indigo-500",
		"from-purple-500 to-pink-500",
		"from-amber-400 to-rose-500",
		"from-violet-600 to-indigo-600"
	];
	const colorTheme = gradients[Math.floor(Math.random() * gradients.length)];
	const { data: newSerial, error: createError } = await supabase.from("serials").insert({
		author_id: session.user.id,
		title,
		color_theme: colorTheme,
		status: "pilot"
	}).select("id").single();
	if (createError || !newSerial) {
		console.error("Error creating serial:", createError);
		return fail(500, { error: "Failed to create serial" });
	}
	const { error: sceneError } = await supabase.from("scenes").insert({
		serial_id: newSerial.id,
		order_index: 1,
		author_title: "Scene 1",
		status: "Playing"
	});
	if (sceneError) console.error("Error creating initial scene:", sceneError);
	throw redirect(303, `/serials/${newSerial.id}`);
} };

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions,
	load: load
});

const index = 13;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-4fc4a9bd.js')).default;
const server_id = "src/routes/(author)/write/+page.server.ts";
const imports = ["_app/immutable/nodes/13.C00mBQb4.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/N1x6iA-l.js","_app/immutable/chunks/_5R9kj0a.js","_app/immutable/chunks/CivkagOI.js","_app/immutable/chunks/DmqSfy6J.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=13-2379baae.js.map
