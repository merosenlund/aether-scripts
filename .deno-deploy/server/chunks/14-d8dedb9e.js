import { e as error, f as fail } from './index-2b74a932.js';
import './index-21b402be.js';

//#region src/lib/analytics/streaks.ts
function toLocalDate(ts) {
	return new Date(ts).toLocaleDateString("en-CA");
}
function computeStreaks(sessions) {
	const dayMap = /* @__PURE__ */ new Map();
	for (const s of sessions) {
		const date = toLocalDate(s.start_time);
		const prev = dayMap.get(date) ?? {
			sessionCount: 0,
			wordCount: 0
		};
		dayMap.set(date, {
			sessionCount: prev.sessionCount + 1,
			wordCount: prev.wordCount + Math.max(0, (s.ending_word_count ?? 0) - (s.starting_word_count ?? 0))
		});
	}
	const today = /* @__PURE__ */ new Date();
	const todayStr = toLocalDate(today.toISOString());
	let currentStreak = 0;
	const cursor = new Date(today);
	while (dayMap.has(cursor.toLocaleDateString("en-CA"))) {
		currentStreak++;
		cursor.setDate(cursor.getDate() - 1);
	}
	const sortedDates = Array.from(dayMap.keys()).sort();
	let longestStreak = 0;
	let run = 0;
	let prevDate = null;
	for (const dateStr of sortedDates) {
		const d = /* @__PURE__ */ new Date(dateStr + "T12:00:00");
		if (prevDate) run = Math.round((d.getTime() - prevDate.getTime()) / 864e5) === 1 ? run + 1 : 1;
		else run = 1;
		longestStreak = Math.max(longestStreak, run);
		prevDate = d;
	}
	const dow = today.getDay();
	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - (dow + 6) % 7);
	startOfWeek.setHours(0, 0, 0, 0);
	let daysThisWeek = 0;
	const wc = new Date(startOfWeek);
	while (wc <= today) {
		if (dayMap.has(wc.toLocaleDateString("en-CA"))) daysThisWeek++;
		wc.setDate(wc.getDate() + 1);
	}
	const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	let daysThisMonth = 0;
	const mc = new Date(startOfMonth);
	while (mc <= today) {
		if (dayMap.has(mc.toLocaleDateString("en-CA"))) daysThisMonth++;
		mc.setDate(mc.getDate() + 1);
	}
	const yearPrefix = String(today.getFullYear());
	let daysThisYear = 0;
	for (const dateStr of dayMap.keys()) if (dateStr.startsWith(yearPrefix) && dateStr <= todayStr) daysThisYear++;
	let consistencyCount = 0;
	for (let i = 0; i < 30; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		if (dayMap.has(d.toLocaleDateString("en-CA"))) consistencyCount++;
	}
	const consistencyScore = Math.round(consistencyCount / 30 * 100);
	const heatmapDays = [];
	for (let i = 363; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = d.toLocaleDateString("en-CA");
		const entry = dayMap.get(dateStr);
		heatmapDays.push({
			date: dateStr,
			sessionCount: entry?.sessionCount ?? 0,
			wordCount: entry?.wordCount ?? 0
		});
	}
	return {
		currentStreak,
		longestStreak,
		daysThisWeek,
		daysThisMonth,
		daysThisYear,
		consistencyScore,
		heatmapDays
	};
}
//#endregion
//#region src/routes/(author)/analytics/+page.server.ts
var load = async ({ locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) throw error(401, "Unauthorized");
	const { data: goals } = await supabase.from("author_goals").select("*").eq("user_id", session.user.id).maybeSingle();
	const { data: sessions } = await supabase.from("writing_sessions").select(`
      *,
      serials (id, title),
      scenes (author_title, display_title)
    `).eq("author_id", session.user.id).order("start_time", { ascending: false });
	const streakData = computeStreaks(sessions || []);
	return {
		goals: goals || {
			daily_word_goal: 0,
			weekly_word_goal: 0,
			monthly_word_goal: 0
		},
		sessions: sessions || [],
		streakData
	};
};
var actions = { updateGoals: async ({ request, locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) return fail(401, { message: "Unauthorized" });
	const formData = await request.formData();
	const daily = parseInt(formData.get("daily_word_goal")) || 0;
	const weekly = parseInt(formData.get("weekly_word_goal")) || 0;
	const monthly = parseInt(formData.get("monthly_word_goal")) || 0;
	const { error: upsertError } = await supabase.from("author_goals").upsert({
		user_id: session.user.id,
		daily_word_goal: daily,
		weekly_word_goal: weekly,
		monthly_word_goal: monthly
	}, { onConflict: "user_id" });
	if (upsertError) {
		console.error("Error updating goals:", upsertError);
		return fail(500, { message: "Failed to update goals" });
	}
	return { success: true };
} };

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions,
	load: load
});

const index = 14;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-032d98ed.js')).default;
const server_id = "src/routes/(author)/analytics/+page.server.ts";
const imports = ["_app/immutable/nodes/14.CQj4h9Wc.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/Ds28ePDG.js","_app/immutable/chunks/JpPbfvlw.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/BZQYYah1.js","_app/immutable/chunks/DfdA6H8B.js","_app/immutable/chunks/BuT8oGdW.js","_app/immutable/chunks/zREZrY-N.js","_app/immutable/chunks/DwYR74N-.js","_app/immutable/chunks/N1x6iA-l.js","_app/immutable/chunks/Cre98aRL2.js","_app/immutable/chunks/Bevh5KnR.js","_app/immutable/chunks/8HtxlkHQ.js","_app/immutable/chunks/D16lTyjm.js","_app/immutable/chunks/B3UdjAg1.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=14-d8dedb9e.js.map
