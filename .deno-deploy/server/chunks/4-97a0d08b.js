//#region src/routes/+page.server.ts
var load = async ({ locals: { supabase, getSession } }) => {
	const session = await getSession();
	const { data: recentlyUpdated } = await supabase.from("serials").select(`
      id,
      title,
      color_theme,
      status,
      scenes!scenes_serial_id_fkey!inner(published_at, status, scheduled_status, scheduled_status_at),
      readers:reading_progress(count)
    `).not("scenes!scenes_serial_id_fkey.published_at", "is", null).order("published_at", {
		referencedTable: "scenes",
		ascending: false
	}).limit(6);
	const uniqueSerials = Array.from(new Map(recentlyUpdated?.map((s) => [s.id, s])).values());
	let continueReading = null;
	if (session) {
		const { data: progress } = await supabase.from("reading_progress").select(`
        serial_id,
        current_scene_id,
        current_block_id,
        updated_at,
        serial:serials (
          id,
          title,
          color_theme
        ),
        scene:scenes (
          id,
          display_title,
          author_title
        )
      `).eq("user_id", session.user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
		if (progress) continueReading = {
			serial: progress.serial,
			scene: progress.scene,
			blockId: progress.current_block_id,
			updatedAt: progress.updated_at
		};
	}
	const { data: featuredLists } = await supabase.from("reading_lists").select(`
      id,
      title,
      is_public,
      created_at,
      serial:serials (
        id,
        title,
        color_theme
      ),
      items:reading_list_items (
        id
      )
    `).eq("is_public", true).order("created_at", { ascending: false }).limit(3);
	return {
		recentlyUpdated: uniqueSerials.map((s) => {
			const rawScenes = s.scenes || [];
			const now = /* @__PURE__ */ new Date();
			const visibleScenes = rawScenes.filter((scene) => {
				if (scene.published_at !== null) return true;
				if (scene.status === "Published") return true;
				if (scene.scheduled_status === "Published" && scene.scheduled_status_at) return new Date(scene.scheduled_status_at) <= now;
				return false;
			});
			const latestPublishedAt = visibleScenes.reduce((latest, current) => {
				const currentPublishedAt = current.published_at || current.scheduled_status_at;
				return !latest || currentPublishedAt > latest ? currentPublishedAt : latest;
			}, null);
			return {
				id: s.id,
				title: s.title,
				color_theme: s.color_theme,
				status: s.status,
				updated_at: latestPublishedAt,
				scenesCount: visibleScenes.length,
				readersCount: s.readers?.[0]?.count || 0
			};
		}),
		continueReading,
		featuredLists: featuredLists || []
	};
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

const index = 4;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-5e250286.js')).default;
const server_id = "src/routes/+page.server.ts";
const imports = ["_app/immutable/nodes/4.BBSbGNNy.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/Df5EYvfa.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/BuT8oGdW.js","_app/immutable/chunks/N1x6iA-l.js","_app/immutable/chunks/B9o4YKQx2.js","_app/immutable/chunks/CivkagOI.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=4-97a0d08b.js.map
