import { c as escape_html, e as ensure_array_like, a as attr_class, s as stringify, b as attr, l as derived } from './dev-db1ab9cf.js';
import { A as Activity } from './activity-930605c0.js';
import { A as Arrow_left } from './arrow-left-693621d1.js';
import { B as Book_open } from './book-open-8545439b.js';
import { C as Chart_column } from './chart-column-e579dcca.js';
import { C as Clock } from './clock-731c4c77.js';
import { Z as Zap } from './zap-132280ce.js';
import { L as LineChart } from './LineChart-e2d7d536.js';
import './Icon-f47d171f.js';

//#region src/routes/(author)/analytics/serials/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let serial = derived(() => data.serial);
		let sessions = derived(() => (data.sessions || []).map((s) => {
			const mins = (s.active_duration_seconds || 0) / 60;
			const net = (s.ending_word_count || 0) - (s.starting_word_count || 0);
			const wpm = mins > 0 ? Math.round(Math.max(0, net) / mins) : 0;
			const efficiency = s.net_characters != null && Math.abs(s.net_characters) > 0 && s.keystrokes > 0 ? Math.round(s.keystrokes / Math.abs(s.net_characters) * 10) / 10 : null;
			return {
				...s,
				wpm,
				netWords: net,
				efficiency
			};
		}));
		let scenes = derived(() => data.scenes || []);
		let totalDuration = derived(() => sessions().reduce((s, r) => s + (r.active_duration_seconds || 0), 0));
		let totalNetWords = derived(() => sessions().reduce((s, r) => s + Math.max(0, r.netWords), 0));
		let avgWpm = derived(() => {
			const active = sessions().filter((s) => s.wpm > 0);
			return active.length ? Math.round(active.reduce((s, r) => s + r.wpm, 0) / active.length) : 0;
		});
		let avgFlesch = derived(() => {
			const valid = sessions().filter((s) => s.flesch_reading_ease != null);
			return valid.length ? Math.round(valid.reduce((s, r) => s + r.flesch_reading_ease, 0) / valid.length * 10) / 10 : null;
		});
		let sceneStats = derived(() => {
			const map = /* @__PURE__ */ new Map();
			for (const s of sessions()) {
				if (!s.scene_id) continue;
				const prev = map.get(s.scene_id) ?? {
					sessionCount: 0,
					totalDuration: 0,
					netWords: 0,
					wpms: [],
					fleschs: [],
					firstSession: null
				};
				map.set(s.scene_id, {
					sessionCount: prev.sessionCount + 1,
					totalDuration: prev.totalDuration + (s.active_duration_seconds || 0),
					netWords: prev.netWords + Math.max(0, s.netWords),
					wpms: s.wpm > 0 ? [...prev.wpms, s.wpm] : prev.wpms,
					fleschs: s.flesch_reading_ease != null ? [...prev.fleschs, s.flesch_reading_ease] : prev.fleschs,
					firstSession: prev.firstSession == null || new Date(s.start_time) < new Date(prev.firstSession) ? s.start_time : prev.firstSession
				});
			}
			return scenes().map((scene) => {
				const stats = map.get(scene.id);
				const avgSceneWpm = stats && stats.wpms.length ? Math.round(stats.wpms.reduce((a, b) => a + b, 0) / stats.wpms.length) : null;
				const avgSceneFlesch = stats && stats.fleschs.length ? Math.round(stats.fleschs.reduce((a, b) => a + b, 0) / stats.fleschs.length * 10) / 10 : null;
				const velocity = stats?.firstSession && scene.published_at ? formatVelocity(new Date(stats.firstSession), new Date(scene.published_at)) : null;
				return {
					...scene,
					sessionCount: stats?.sessionCount ?? 0,
					totalDuration: stats?.totalDuration ?? 0,
					totalNetWords: stats?.netWords ?? 0,
					avgWpm: avgSceneWpm,
					avgFlesch: avgSceneFlesch,
					velocity
				};
			});
		});
		function isoWeekKey(date) {
			const d = new Date(date);
			d.setHours(0, 0, 0, 0);
			d.setDate(d.getDate() + 4 - (d.getDay() || 7));
			const ys = new Date(d.getFullYear(), 0, 1);
			const wk = Math.ceil(((d.getTime() - ys.getTime()) / 864e5 + 1) / 7);
			return `${d.getFullYear()}-${String(wk).padStart(2, "0")}`;
		}
		function isoWeekToDate(key) {
			const [yr, wk] = key.split("-").map(Number);
			const jan4 = new Date(yr, 0, 4);
			const ws = new Date(jan4);
			ws.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7 + (wk - 1) * 7);
			return ws.toLocaleDateString("en-CA");
		}
		let wpmTrend = derived(() => {
			const weeks = /* @__PURE__ */ new Map();
			for (const s of [...sessions()].reverse()) {
				if (s.wpm <= 0) continue;
				const wk = isoWeekKey(new Date(s.start_time));
				weeks.set(wk, [...weeks.get(wk) ?? [], s.wpm]);
			}
			return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([wk, wpms]) => ({
				date: isoWeekToDate(wk),
				value: Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length)
			}));
		});
		function formatHours(seconds) {
			const h = Math.floor(seconds / 3600);
			const m = Math.round(seconds % 3600 / 60);
			if (h > 0) return `${h}h ${m}m`;
			return `${m}m`;
		}
		function formatDate(iso) {
			return new Date(iso).toLocaleDateString(void 0, {
				month: "short",
				day: "numeric",
				year: "numeric"
			});
		}
		function formatTime(iso) {
			return new Date(iso).toLocaleTimeString(void 0, {
				hour: "numeric",
				minute: "2-digit"
			});
		}
		function formatVelocity(start, end) {
			const days = Math.round((end.getTime() - start.getTime()) / 864e5);
			if (days < 1) return "< 1 day";
			if (days === 1) return "1 day";
			if (days < 7) return `${days} days`;
			const weeks = Math.round(days / 7);
			return `${weeks} wk${weeks !== 1 ? "s" : ""}`;
		}
		const statusColors = {
			published: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
			playing: "text-primary bg-primary/10 border-primary/20",
			draft: "text-stone-400 bg-white/5 border-white/10"
		};
		$$renderer.push(`<div class="min-h-screen bg-stone-950 pb-16 font-sans text-stone-100"><div class="relative shrink-0 overflow-hidden border-b border-white/5 bg-gradient-to-b from-stone-900/50 via-stone-950 to-stone-950 px-8 py-10"><div class="relative z-10 mx-auto max-w-6xl"><a href="/analytics" class="mb-4 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-stone-500 uppercase transition-colors hover:text-stone-300">`);
		Arrow_left($$renderer, { class: "h-3.5 w-3.5" });
		$$renderer.push(`<!----> Back to Analytics</a> <h1 class="bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text font-serif text-2xl font-bold tracking-tight text-transparent">${escape_html(serial().title)}</h1> <p class="mt-1 text-sm text-stone-500">Serial analytics — ${escape_html(sessions().length)} sessions logged</p></div></div> <div class="mx-auto mt-8 max-w-6xl space-y-8 px-8"><div class="grid grid-cols-2 gap-4 lg:grid-cols-4"><!--[-->`);
		const each_array = ensure_array_like([
			{
				label: "Total Time",
				value: formatHours(totalDuration()),
				sub: "active writing",
				icon: Clock,
				color: "text-primary",
				glow: "bg-primary/5 group-hover:bg-primary/15"
			},
			{
				label: "Net Words",
				value: totalNetWords().toLocaleString(),
				sub: "words added",
				icon: Book_open,
				color: "text-indigo-400",
				glow: "bg-indigo-500/5 group-hover:bg-indigo-500/15"
			},
			{
				label: "Avg Speed",
				value: `${avgWpm()} WPM`,
				sub: "typing velocity",
				icon: Zap,
				color: "text-emerald-400",
				glow: "bg-emerald-500/5 group-hover:bg-emerald-500/15"
			},
			{
				label: "Avg Flesch",
				value: avgFlesch() != null ? String(avgFlesch()) : "—",
				sub: "reading ease",
				icon: Activity,
				color: "text-cyan-400",
				glow: "bg-cyan-500/5 group-hover:bg-cyan-500/15"
			}
		]);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let card = each_array[$$index];
			$$renderer.push(`<div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 transition-all hover:border-white/10"><div${attr_class(`absolute -right-4 -bottom-4 h-16 w-16 rounded-full blur-2xl transition-all ${stringify(card.glow)}`)}></div> <span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">${escape_html(card.label)}</span> <span class="mt-1.5 block font-serif text-xl font-bold text-white">${escape_html(card.value)}</span> <div class="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">`);
			if (card.icon) {
				$$renderer.push("<!--[-->");
				card.icon($$renderer, { class: `h-3.5 w-3.5 ${stringify(card.color)}` });
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
			$$renderer.push(` ${escape_html(card.sub)}</div></div>`);
		}
		$$renderer.push(`<!--]--></div> `);
		if (wpmTrend().length >= 2) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-4 flex items-center gap-2 font-serif text-base font-bold text-white">`);
			Zap($$renderer, { class: "h-4 w-4 text-emerald-400" });
			$$renderer.push(`<!----> Writing Speed Trend</h2> `);
			LineChart($$renderer, {
				data: wpmTrend(),
				color: "emerald",
				height: 120,
				label: "Weekly average WPM for this serial"
			});
			$$renderer.push(`<!----></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">`);
		Chart_column($$renderer, { class: "h-4 w-4 text-emerald-400" });
		$$renderer.push(`<!----> Scene Breakdown</h2> `);
		if (sceneStats().length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<p class="text-center text-sm text-stone-600 italic">No scenes yet.</p>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="overflow-x-auto"><table class="w-full border-collapse text-left text-xs"><thead><tr class="border-b border-white/5 text-[10px] font-bold tracking-widest text-stone-500 uppercase"><th class="pb-3.5 font-bold">Scene</th><th class="pb-3.5 font-bold">Status</th><th class="pb-3.5 font-bold">Sessions</th><th class="pb-3.5 font-bold">Time</th><th class="pb-3.5 font-bold">Net Words</th><th class="pb-3.5 font-bold">Avg WPM</th><th class="pb-3.5 font-bold">Avg Flesch</th><th class="pb-3.5 font-bold">Velocity</th></tr></thead><tbody class="divide-y divide-white/5"><!--[-->`);
			const each_array_1 = ensure_array_like(sceneStats());
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let scene = each_array_1[$$index_1];
				$$renderer.push(`<tr class="group transition-all hover:bg-white/[0.01]"><td class="py-4"><a${attr("href", `/analytics/serials/${stringify(serial().id)}/scenes/${stringify(scene.id)}`)} class="font-bold text-stone-200 hover:text-white hover:underline">${escape_html(scene.display_title || scene.author_title || `Scene ${scene.order_index}`)}</a></td><td class="py-4"><span${attr_class(`rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-widest capitalize ${stringify(statusColors[scene.status?.toLowerCase()] ?? statusColors["draft"])}`)}>${escape_html(scene.status ?? "draft")}</span></td><td class="py-4 font-mono text-stone-400">${escape_html(scene.sessionCount)}</td><td class="py-4 font-mono text-stone-400">${escape_html(formatHours(scene.totalDuration))}</td><td class="py-4 font-mono">`);
				if (scene.totalNetWords > 0) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="font-bold text-emerald-400">+${escape_html(scene.totalNetWords.toLocaleString())}</span>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<span class="text-stone-600">—</span>`);
				}
				$$renderer.push(`<!--]--></td><td class="py-4 font-mono text-stone-300">${escape_html(scene.avgWpm != null ? `${scene.avgWpm} WPM` : "—")}</td><td class="py-4 font-mono text-stone-300">${escape_html(scene.avgFlesch != null ? scene.avgFlesch : "—")}</td><td class="py-4 text-stone-400">${escape_html(scene.velocity ?? "—")}</td></tr>`);
			}
			$$renderer.push(`<!--]--></tbody></table></div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">`);
		Book_open($$renderer, { class: "text-primary h-4 w-4" });
		$$renderer.push(`<!----> Session History</h2> <div class="overflow-x-auto"><table class="w-full border-collapse text-left text-xs"><thead><tr class="border-b border-white/5 text-[10px] font-bold tracking-widest text-stone-500 uppercase"><th class="pb-3.5 font-bold">Date</th><th class="pb-3.5 font-bold">Mode</th><th class="pb-3.5 font-bold">Scene</th><th class="pb-3.5 font-bold">Duration</th><th class="pb-3.5 font-bold">Net Words</th><th class="pb-3.5 font-bold">WPM</th><th class="pb-3.5 font-bold">Efficiency</th><th class="pb-3.5 font-bold">Flesch</th></tr></thead><tbody class="divide-y divide-white/5"><!--[-->`);
		const each_array_2 = ensure_array_like(sessions());
		for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
			let s = each_array_2[$$index_2];
			$$renderer.push(`<tr class="transition-all hover:bg-white/[0.01]"><td class="py-3.5 text-stone-300"><span class="block">${escape_html(formatDate(s.start_time))}</span> <span class="mt-0.5 block text-[10px] text-stone-500">${escape_html(formatTime(s.start_time))}</span></td><td class="py-3.5">`);
			if (s.session_type === "play") {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="bg-primary/10 border-primary/20 text-primary rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase">Play</span>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<span class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">Edit</span>`);
			}
			$$renderer.push(`<!--]--></td><td class="py-3.5">`);
			if (s.scene_id) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<a${attr("href", `/analytics/serials/${stringify(serial().id)}/scenes/${stringify(s.scene_id)}`)} class="text-stone-300 hover:text-white hover:underline">${escape_html(s.scenes?.display_title || s.scenes?.author_title || "—")}</a>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<span class="text-stone-600">—</span>`);
			}
			$$renderer.push(`<!--]--></td><td class="py-3.5 font-mono text-stone-400">${escape_html(formatHours(s.active_duration_seconds))}</td><td class="py-3.5 font-mono">`);
			if (s.netWords >= 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="font-bold text-emerald-400">+${escape_html(s.netWords)}</span>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<span class="font-bold text-rose-400">${escape_html(s.netWords)}</span>`);
			}
			$$renderer.push(`<!--]--></td><td class="py-3.5 font-mono text-stone-300">${escape_html(s.wpm > 0 ? s.wpm : "—")}</td><td class="py-3.5 font-mono text-stone-400">${escape_html(s.efficiency != null ? s.efficiency : "—")}</td><td class="py-3.5 font-mono text-stone-400">${escape_html(s.flesch_reading_ease != null ? s.flesch_reading_ease.toFixed(1) : "—")}</td></tr>`);
		}
		$$renderer.push(`<!--]--></tbody></table></div></div></div></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-bb3e9176.js.map
