import { s as supabase } from './supabaseClient-824b9cb6.js';

//#region src/lib/api/wiki.ts
async function getWikiEntities(serialId) {
	const { data, error } = await supabase.from("wiki_entities").select("*").eq("serial_id", serialId).order("name");
	if (error) throw error;
	return data;
}
async function getWikiEvents(sceneId) {
	const { data, error } = await supabase.from("wiki_events").select("*, wiki_entities(*)").eq("scene_id", sceneId).order("created_at", { ascending: true });
	if (error) throw error;
	return data;
}
async function createWikiEvent(event) {
	const { data, error } = await supabase.from("wiki_events").insert(event).select().single();
	if (error) throw error;
	return data;
}
async function updateWikiEventPayload(eventId, payload) {
	const { data, error } = await supabase.from("wiki_events").update({ payload }).eq("id", eventId).select().single();
	if (error) throw error;
	return data;
}

export { getWikiEvents as a, createWikiEvent as c, getWikiEntities as g, updateWikiEventPayload as u };
//# sourceMappingURL=wiki-7e2bc21a.js.map
