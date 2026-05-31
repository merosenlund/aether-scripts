//#region src/routes/(reader)/library/+page.server.ts
var load = async ({ locals: { supabase } }) => {
	const { data: serialsData } = await supabase.from("serials").select(`
      id,
      title,
      color_theme,
      status,
      scenes!scenes_serial_id_fkey!inner(published_at, status, scheduled_status, scheduled_status_at),
      readers:reading_progress(count)
    `).not("scenes!scenes_serial_id_fkey.published_at", "is", null).order("title", { ascending: true });
	const uniqueSerials = Array.from(new Map(serialsData?.map((s) => [s.id, s])).values());
	const now = /* @__PURE__ */ new Date();
	return { serials: uniqueSerials.map((s) => {
		const visibleScenes = (s.scenes || []).filter((scene) => {
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
	}) };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

const index = 10;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-c31470f8.js')).default;
const server_id = "src/routes/(reader)/library/+page.server.ts";
const imports = ["_app/immutable/nodes/10.77rV5cPn.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/BuT8oGdW.js","_app/immutable/chunks/N1x6iA-l.js","_app/immutable/chunks/DPg0JQl-.js","_app/immutable/chunks/DwTWZ9qF.js","_app/immutable/chunks/CivkagOI.js"];
const stylesheets = ["_app/immutable/assets/10.DjxA2Dzt.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=10-3d66d06d.js.map
