import { c as escape_html, e as ensure_array_like, f as attr_style, a as attr_class, s as stringify, b as attr, i as spread_props, l as derived } from './dev-db1ab9cf.js';
import './client-ffaaeca1.js';
import { I as Icon } from './Icon-f47d171f.js';
import { A as Activity } from './activity-930605c0.js';
import { A as Award } from './award-524e0e66.js';
import { B as Book_open } from './book-open-8545439b.js';
import { C as Calendar } from './calendar-4075bd8d.js';
import { C as Chart_column } from './chart-column-e579dcca.js';
import { C as Clock } from './clock-731c4c77.js';
import { F as Flame, P as Pen_line } from './pen-line-5c8bbf37.js';
import { Z as Zap } from './zap-132280ce.js';
import { L as LineChart } from './LineChart-e2d7d536.js';
import './internal-8a8e9ef7.js';
import './index-21b402be.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/arrow-up-right.svelte
function Arrow_up_right($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "arrow-up-right" },
		props,
		{ iconNode: [["path", { "d": "M7 7h10v10" }], ["path", { "d": "M7 17 17 7" }]] }
	]));
}
//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/target.svelte
function Target($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "target" },
		props,
		{ iconNode: [
			["circle", {
				"cx": "12",
				"cy": "12",
				"r": "10"
			}],
			["circle", {
				"cx": "12",
				"cy": "12",
				"r": "6"
			}],
			["circle", {
				"cx": "12",
				"cy": "12",
				"r": "2"
			}]
		] }
	]));
}
//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/trending-up.svelte
function Trending_up($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "trending-up" },
		props,
		{ iconNode: [["path", { "d": "M16 7h6v6" }], ["path", { "d": "m22 7-8.5 8.5-5-5L2 17" }]] }
	]));
}
//#endregion
//#region src/lib/components/analytics/ActivityHeatmap.svelte
function ActivityHeatmap($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { days = [] } = $$props;
		const CELL = 11;
		const STEP = CELL + 2;
		const TOP = 20;
		const LEFT = 24;
		function heatColor(words) {
			if (words === 0) return "#1c1917";
			if (words < 250) return "#14532d";
			if (words < 500) return "#166534";
			if (words < 1e3) return "#15803d";
			return "#4ade80";
		}
		let grid = derived(() => {
			if (!days.length) return [];
			const firstDow = ((/* @__PURE__ */ new Date(days[0].date + "T12:00:00")).getDay() + 6) % 7;
			return days.map((day, i) => {
				const abs = i + firstDow;
				return {
					day,
					col: Math.floor(abs / 7),
					row: abs % 7
				};
			});
		});
		let numCols = derived(() => grid().length ? grid()[grid().length - 1].col + 1 : 52);
		let monthLabels = derived(() => {
			const labels = [];
			let lastMonth = -1;
			for (const cell of grid()) {
				const d = /* @__PURE__ */ new Date(cell.day.date + "T12:00:00");
				const m = d.getMonth();
				if (m !== lastMonth) {
					labels.push({
						label: d.toLocaleDateString(void 0, { month: "short" }),
						col: cell.col
					});
					lastMonth = m;
				}
			}
			return labels;
		});
		const DOW = [
			"Mon",
			"",
			"Wed",
			"",
			"Fri",
			"",
			"Sun"
		];
		let svgW = derived(() => LEFT + numCols() * STEP);
		const svgH = TOP + 7 * STEP;
		function tooltip(day) {
			const d = (/* @__PURE__ */ new Date(day.date + "T12:00:00")).toLocaleDateString(void 0, {
				month: "short",
				day: "numeric",
				year: "numeric"
			});
			if (day.wordCount === 0) return `${d}: no writing`;
			return `${d}: ${day.wordCount.toLocaleString()} words in ${day.sessionCount} session${day.sessionCount !== 1 ? "s" : ""}`;
		}
		$$renderer.push(`<div class="overflow-x-auto pb-1"><svg${attr("viewBox", `0 0 ${stringify(svgW())} ${stringify(svgH)}`)}${attr_style(`height: ${stringify(svgH)}px; min-width: ${stringify(svgW())}px`)} role="img" aria-label="52-week writing activity heatmap"><!--[-->`);
		const each_array = ensure_array_like(monthLabels());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let ml = each_array[$$index];
			$$renderer.push(`<text${attr("x", LEFT + ml.col * STEP)}${attr("y", TOP - 6)} font-size="9" fill="#78716c">${escape_html(ml.label)}</text>`);
		}
		$$renderer.push(`<!--]--><!--[-->`);
		const each_array_1 = ensure_array_like(DOW);
		for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
			let dl = each_array_1[i];
			if (dl) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<text${attr("x", LEFT - 3)}${attr("y", TOP + i * STEP + CELL - 1)} text-anchor="end" font-size="9" fill="#78716c">${escape_html(dl)}</text>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--><!--[-->`);
		const each_array_2 = ensure_array_like(grid());
		for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
			let cell = each_array_2[$$index_2];
			$$renderer.push(`<rect${attr("x", LEFT + cell.col * STEP)}${attr("y", TOP + cell.row * STEP)}${attr("width", CELL)}${attr("height", CELL)} rx="2"${attr("fill", heatColor(cell.day.wordCount))}><title>${escape_html(tooltip(cell.day))}</title></rect>`);
		}
		$$renderer.push(`<!--]--></svg></div>`);
	});
}
//#endregion
//#region src/routes/(author)/analytics/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data, form } = $$props;
		let goals = derived(() => data.goals);
		let streakData = derived(() => data.streakData);
		let sessions = derived(() => {
			return (data.sessions || []).map((s) => {
				const minutes = (s.active_duration_seconds || 0) / 60;
				const netWords = Math.max(0, (s.ending_word_count || 0) - (s.starting_word_count || 0));
				const wpm = minutes > 0 ? Math.round(netWords / minutes) : 0;
				return {
					...s,
					wpm
				};
			});
		});
		let totalDuration = derived(() => sessions().reduce((sum, s) => sum + (s.active_duration_seconds || 0), 0));
		let totalKeystrokes = derived(() => sessions().reduce((sum, s) => sum + (s.keystrokes || 0), 0));
		let averageWpm = derived(() => {
			const active = sessions().filter((s) => s.wpm > 0);
			if (!active.length) return 0;
			return Math.round(active.reduce((sum, s) => sum + s.wpm, 0) / active.length);
		});
		let playStats = derived(() => {
			const ps = sessions().filter((s) => s.session_type === "play");
			return {
				duration: ps.reduce((sum, s) => sum + (s.active_duration_seconds || 0), 0),
				words: ps.reduce((sum, s) => sum + ((s.ending_word_count || 0) - (s.starting_word_count || 0)), 0),
				count: ps.length
			};
		});
		let editStats = derived(() => {
			const es = sessions().filter((s) => s.session_type === "edit");
			return {
				duration: es.reduce((sum, s) => sum + (s.active_duration_seconds || 0), 0),
				words: es.reduce((sum, s) => sum + ((s.ending_word_count || 0) - (s.starting_word_count || 0)), 0),
				count: es.length
			};
		});
		let progressStats = derived(() => {
			const now = /* @__PURE__ */ new Date();
			const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
			const sevenDaysAgo = now.getTime() - 10080 * 60 * 1e3;
			const thirtyDaysAgo = now.getTime() - 720 * 60 * 60 * 1e3;
			let todayWords = 0, weekWords = 0, monthWords = 0;
			for (const s of sessions()) {
				const t = new Date(s.start_time).getTime();
				const net = Math.max(0, (s.ending_word_count || 0) - (s.starting_word_count || 0));
				if (t >= startOfToday) todayWords += net;
				if (t >= sevenDaysAgo) weekWords += net;
				if (t >= thirtyDaysAgo) monthWords += net;
			}
			return {
				todayWords,
				weekWords,
				monthWords
			};
		});
		function isoWeekKey(date) {
			const d = new Date(date);
			d.setHours(0, 0, 0, 0);
			d.setDate(d.getDate() + 4 - (d.getDay() || 7));
			const yearStart = new Date(d.getFullYear(), 0, 1);
			const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
			return `${d.getFullYear()}-${String(week).padStart(2, "0")}`;
		}
		function isoWeekToDate(key) {
			const [yr, wk] = key.split("-").map(Number);
			const jan4 = new Date(yr, 0, 4);
			const weekStart = new Date(jan4);
			weekStart.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7 + (wk - 1) * 7);
			return weekStart.toLocaleDateString("en-CA");
		}
		let trendData = derived(() => {
			const chrono = [...sessions()].reverse();
			const weeks = /* @__PURE__ */ new Map();
			for (const s of chrono) {
				const wk = isoWeekKey(new Date(s.start_time));
				if (!weeks.has(wk)) weeks.set(wk, {
					wpms: [],
					flesch: [],
					efficiency: []
				});
				const b = weeks.get(wk);
				if (s.wpm > 0) b.wpms.push(s.wpm);
				if (s.flesch_reading_ease != null) b.flesch.push(s.flesch_reading_ease);
				const nc = s.net_characters;
				if (nc != null && Math.abs(nc) > 0 && s.keystrokes > 0) b.efficiency.push(s.keystrokes / Math.abs(nc));
			}
			const sorted = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b));
			const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
			return {
				wpm: sorted.map(([wk, b]) => ({
					date: isoWeekToDate(wk),
					value: Math.round(avg(b.wpms) ?? 0)
				})).filter((d) => d.value > 0),
				flesch: sorted.map(([wk, b]) => {
					const v = avg(b.flesch);
					return {
						date: isoWeekToDate(wk),
						value: v != null ? Math.round(v * 10) / 10 : 0
					};
				}).filter((d) => d.value > 0),
				efficiency: sorted.map(([wk, b]) => {
					const v = avg(b.efficiency);
					return {
						date: isoWeekToDate(wk),
						value: v != null ? Math.round(v * 10) / 10 : 0
					};
				}).filter((d) => d.value > 0)
			};
		});
		function formatHours(seconds) {
			const hrs = Math.floor(seconds / 3600);
			const mins = Math.round(seconds % 3600 / 60);
			if (hrs > 0) return `${hrs}h ${mins}m`;
			return `${mins}m`;
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
		$$renderer.push(`<div class="min-h-screen bg-stone-950 pb-16 font-sans text-stone-100"><div class="relative shrink-0 overflow-hidden border-b border-white/5 bg-gradient-to-b from-stone-900/50 via-stone-950 to-stone-950 px-8 py-12"><div class="bg-primary/10 absolute -top-40 left-1/4 h-96 w-96 rounded-full blur-3xl"></div> <div class="absolute -top-30 right-1/4 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl"></div> <div class="relative z-10 mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><h1 class="bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text font-serif text-3xl font-bold tracking-tight text-transparent">Author Analytics Dashboard</h1> <p class="mt-1.5 text-sm font-medium text-stone-400">Visualize your active writing duration, speed, goals, and effort metrics.</p></div> <button class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-stone-200 shadow-lg shadow-black/30 transition-all hover:border-white/20 hover:bg-white/10">`);
		Target($$renderer, { class: "text-primary h-4 w-4" });
		$$renderer.push(`<!----> ${escape_html("Customize Goals")}</button></div></div> <div class="mx-auto mt-8 max-w-6xl px-8">`);
		{
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="space-y-8"><div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-5 flex items-center gap-2 font-serif text-base font-bold text-white">`);
			Flame($$renderer, { class: "text-primary h-4 w-4" });
			$$renderer.push(`<!----> Writing Streak &amp; Consistency</h2> <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"><div class="col-span-2 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 sm:col-span-1"><div class="bg-primary/10 flex-shrink-0 rounded-xl p-3">`);
			Flame($$renderer, { class: "text-primary h-6 w-6" });
			$$renderer.push(`<!----></div> <div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Current Streak</span> <span class="mt-0.5 block font-serif text-2xl font-bold text-white">${escape_html(streakData().currentStreak)}</span> <span class="text-[10px] font-medium text-stone-500">days</span></div></div> <div class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">`);
			Award($$renderer, { class: "h-5 w-5 flex-shrink-0 text-amber-400" });
			$$renderer.push(`<!----> <div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Longest</span> <span class="font-serif text-xl font-bold text-white">${escape_html(streakData().longestStreak)}</span> <span class="ml-1 text-[10px] text-stone-500">days</span></div></div> <div class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">`);
			Calendar($$renderer, { class: "h-5 w-5 flex-shrink-0 text-cyan-400" });
			$$renderer.push(`<!----> <div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">This Week</span> <span class="font-serif text-xl font-bold text-white">${escape_html(streakData().daysThisWeek)}</span> <span class="ml-1 text-[10px] text-stone-500">days</span></div></div> <div class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">`);
			Calendar($$renderer, { class: "h-5 w-5 flex-shrink-0 text-emerald-400" });
			$$renderer.push(`<!----> <div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">This Month</span> <span class="font-serif text-xl font-bold text-white">${escape_html(streakData().daysThisMonth)}</span> <span class="ml-1 text-[10px] text-stone-500">days</span></div></div> <div class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">`);
			Activity($$renderer, { class: "h-5 w-5 flex-shrink-0 text-indigo-400" });
			$$renderer.push(`<!----> <div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">This Year</span> <span class="font-serif text-xl font-bold text-white">${escape_html(streakData().daysThisYear)}</span> <span class="ml-1 text-[10px] text-stone-500">days</span></div></div> <div class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">`);
			Trending_up($$renderer, { class: "h-5 w-5 flex-shrink-0 text-rose-400" });
			$$renderer.push(`<!----> <div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Consistency</span> <span class="font-serif text-xl font-bold text-white">${escape_html(streakData().consistencyScore)}%</span> <span class="block text-[10px] text-stone-500">last 30 days</span></div></div></div></div> <div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-5 flex items-center gap-2 font-serif text-base font-bold text-white">`);
			Calendar($$renderer, { class: "h-4 w-4 text-emerald-400" });
			$$renderer.push(`<!----> Writing Activity — Past Year</h2> `);
			ActivityHeatmap($$renderer, { days: streakData().heatmapDays });
			$$renderer.push(`<!----> <div class="mt-3 flex items-center gap-3 text-[10px] text-stone-600"><span>Less</span> <!--[-->`);
			const each_array_1 = ensure_array_like([
				"#1c1917",
				"#14532d",
				"#166534",
				"#15803d",
				"#4ade80"
			]);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let col = each_array_1[$$index_1];
				$$renderer.push(`<span class="inline-block h-3 w-3 rounded-sm"${attr_style(`background-color: ${stringify(col)}`)}></span>`);
			}
			$$renderer.push(`<!--]--> <span>More</span></div></div> <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 shadow-sm transition-all hover:border-white/10"><div class="bg-primary/5 group-hover:bg-primary/15 absolute -right-4 -bottom-4 h-20 w-20 rounded-full blur-2xl transition-all"></div> <span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Total Duration</span> <span class="mt-2 block font-serif text-2xl font-bold text-white">${escape_html(formatHours(totalDuration()))}</span> <div class="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-stone-400">`);
			Clock($$renderer, { class: "text-primary h-3.5 w-3.5" });
			$$renderer.push(`<!----> <span>Time spent in editor</span></div></div> <div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 shadow-sm transition-all hover:border-white/10"><div class="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/15"></div> <span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Keystroke Effort</span> <span class="mt-2 block font-serif text-2xl font-bold text-white">${escape_html(totalKeystrokes().toLocaleString())}</span> <div class="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-stone-400">`);
			Flame($$renderer, { class: "h-3.5 w-3.5 text-emerald-400" });
			$$renderer.push(`<!----> <span>Physical keyboard actions</span></div></div> <div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 shadow-sm transition-all hover:border-white/10"><div class="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-cyan-500/5 blur-2xl transition-all group-hover:bg-cyan-500/15"></div> <span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Average Speed</span> <span class="mt-2 block font-serif text-2xl font-bold text-white">${escape_html(averageWpm())} <span class="text-xs font-bold text-stone-500">WPM</span></span> <div class="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-stone-400">`);
			Zap($$renderer, { class: "h-3.5 w-3.5 text-cyan-400" });
			$$renderer.push(`<!----> <span>Rolling typing velocity</span></div></div> <div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 shadow-sm transition-all hover:border-white/10"><div class="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-indigo-500/5 blur-2xl transition-all group-hover:bg-indigo-500/15"></div> <span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Total Written</span> <span class="mt-2 block font-serif text-2xl font-bold text-white">${escape_html(sessions().reduce((sum, s) => sum + Math.max(0, (s.ending_word_count || 0) - (s.starting_word_count || 0)), 0).toLocaleString())} <span class="text-xs font-bold text-stone-500">words</span></span> <div class="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-stone-400">`);
			Arrow_up_right($$renderer, { class: "h-3.5 w-3.5 text-indigo-400" });
			$$renderer.push(`<!----> <span>Net words added</span></div></div></div> <div class="grid grid-cols-1 gap-8 lg:grid-cols-3"><div class="relative rounded-3xl border border-white/5 bg-stone-900/10 p-6 lg:col-span-2"><h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">`);
			Target($$renderer, { class: "text-primary h-4 w-4" });
			$$renderer.push(`<!----> Word Milestone Goal Progress</h2> <div class="space-y-6"><!--[-->`);
			const each_array_2 = ensure_array_like([
				{
					label: "Daily Progress",
					words: progressStats().todayWords,
					goal: goals().daily_word_goal,
					gradient: "from-primary to-rose-500"
				},
				{
					label: "Weekly Progress",
					words: progressStats().weekWords,
					goal: goals().weekly_word_goal,
					gradient: "from-primary via-emerald-500 to-emerald-400"
				},
				{
					label: "Monthly Progress",
					words: progressStats().monthWords,
					goal: goals().monthly_word_goal,
					gradient: "from-primary via-purple-600 to-indigo-500"
				}
			]);
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let g = each_array_2[$$index_2];
				$$renderer.push(`<div><div class="mb-2 flex items-center justify-between text-xs font-semibold"><span class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">${escape_html(g.label)}</span> <span class="font-mono text-stone-300">${escape_html(g.words)} / ${escape_html(g.goal || 0)} words</span></div> <div class="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-[2px]"><div${attr_class(`h-full rounded-full bg-gradient-to-r shadow-lg transition-all duration-1000 ${stringify(g.gradient)}`)}${attr_style(`width: ${stringify(g.goal > 0 ? Math.min(100, g.words / g.goal * 100) : 0)}%`)}></div></div></div>`);
			}
			$$renderer.push(`<!--]--></div></div> <div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">`);
			Chart_column($$renderer, { class: "h-4 w-4 text-emerald-400" });
			$$renderer.push(`<!----> Workflows Comparison</h2> <div class="space-y-6"><div class="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4"><div class="bg-primary/10 rounded-xl p-3">`);
			Flame($$renderer, { class: "text-primary h-5 w-5" });
			$$renderer.push(`<!----></div> <div class="min-w-0 flex-1"><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Play mode</span> <span class="mt-0.5 block font-serif text-lg font-bold text-white">${escape_html(formatHours(playStats().duration))}</span> <span class="mt-1 block text-[10px] font-medium text-stone-500">${escape_html(playStats().count)} writing sessions</span></div></div> <div class="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4"><div class="rounded-xl bg-emerald-500/10 p-3">`);
			Pen_line($$renderer, { class: "h-5 w-5 text-emerald-400" });
			$$renderer.push(`<!----></div> <div class="min-w-0 flex-1"><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Edit mode</span> <span class="mt-0.5 block font-serif text-lg font-bold text-white">${escape_html(formatHours(editStats().duration))}</span> <span class="mt-1 block text-[10px] font-medium text-stone-500">${escape_html(editStats().count)} revisions</span></div></div></div></div></div> <div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">`);
			Trending_up($$renderer, { class: "h-4 w-4 text-indigo-400" });
			$$renderer.push(`<!----> Improvement Over Time</h2> <div class="grid grid-cols-1 gap-6 lg:grid-cols-3"><div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4"><h3 class="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-stone-400 uppercase">`);
			Zap($$renderer, { class: "h-3.5 w-3.5 text-emerald-400" });
			$$renderer.push(`<!----> Writing Speed (WPM)</h3> `);
			LineChart($$renderer, {
				data: trendData().wpm,
				color: "emerald",
				height: 110,
				label: "Weekly average WPM over time"
			});
			$$renderer.push(`<!----></div> <div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4"><h3 class="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-stone-400 uppercase">`);
			Book_open($$renderer, { class: "h-3.5 w-3.5 text-indigo-400" });
			$$renderer.push(`<!----> Reading Ease (Flesch)</h3> `);
			LineChart($$renderer, {
				data: trendData().flesch,
				color: "indigo",
				height: 110,
				label: "Weekly average Flesch reading ease over time",
				formatValue: (v) => v.toFixed(0)
			});
			$$renderer.push(`<!----></div> <div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4"><h3 class="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-stone-400 uppercase">`);
			Activity($$renderer, { class: "h-3.5 w-3.5 text-cyan-400" });
			$$renderer.push(`<!----> Keystroke Efficiency</h3> `);
			LineChart($$renderer, {
				data: trendData().efficiency,
				color: "cyan",
				height: 110,
				label: "Weekly average keystrokes per character (lower = more efficient)",
				formatValue: (v) => v.toFixed(1)
			});
			$$renderer.push(`<!----> <p class="mt-2 text-[9px] text-stone-600">Keystrokes ÷ |net chars| — lower means fewer corrections</p></div></div></div> <div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><div class="mb-6 flex items-center justify-between"><h2 class="flex items-center gap-2 font-serif text-base font-bold text-white">`);
			Book_open($$renderer, { class: "text-primary h-4 w-4" });
			$$renderer.push(`<!----> Writing Sessions History</h2> <span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase">${escape_html(sessions().length)} sessions logged</span></div> `);
			if (sessions().length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="rounded-2xl border border-dashed border-white/5 bg-white/[0.02] p-12 text-center"><p class="mb-2 text-[10px] font-bold tracking-widest text-stone-600 uppercase">No historical sessions</p> <p class="text-xs text-stone-700 italic">Start typing in /play or /edit editor routes to log telemetry data.</p></div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="overflow-x-auto"><table class="w-full border-collapse text-left text-xs font-medium"><thead><tr class="border-b border-white/5 text-[10px] font-bold tracking-widest text-stone-500 uppercase"><th class="pb-3.5 font-bold">Date &amp; Time</th><th class="pb-3.5 font-bold">Mode</th><th class="pb-3.5 font-bold">Serial &amp; Scene</th><th class="pb-3.5 font-bold">Duration</th><th class="pb-3.5 font-bold">Net Words</th><th class="pb-3.5 font-bold">Keystrokes</th><th class="pb-3.5 font-bold">Speed</th><th class="pb-3.5 font-bold">Reading Ease</th></tr></thead><tbody class="divide-y divide-white/5"><!--[-->`);
				const each_array_3 = ensure_array_like(sessions());
				for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
					let session = each_array_3[$$index_3];
					$$renderer.push(`<tr class="group transition-all hover:bg-white/[0.01]"><td class="py-4 text-stone-300"><span class="block">${escape_html(formatDate(session.start_time))}</span> <span class="mt-0.5 block text-[10px] font-normal text-stone-500">${escape_html(formatTime(session.start_time))}</span></td><td class="py-4">`);
					if (session.session_type === "play") {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="bg-primary/10 border-primary/20 text-primary rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase">Play</span>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<span class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-emerald-400 uppercase">Edit</span>`);
					}
					$$renderer.push(`<!--]--></td><td class="max-w-xs truncate py-4">`);
					if (session.serials?.id) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<a${attr("href", `/analytics/serials/${stringify(session.serials.id)}`)} class="block truncate font-bold text-stone-200 hover:text-white hover:underline">${escape_html(session.serials?.title || "Unknown Serial")}</a>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<span class="block truncate font-bold text-stone-200">${escape_html(session.serials?.title || "Unknown Serial")}</span>`);
					}
					$$renderer.push(`<!--]--> <span class="mt-0.5 block truncate text-[10px] font-normal text-stone-400">${escape_html(session.scenes?.display_title || session.scenes?.author_title || "—")}</span></td><td class="py-4 font-mono text-stone-300">${escape_html(formatHours(session.active_duration_seconds))}</td><td class="py-4">`);
					if ((session.ending_word_count || 0) >= (session.starting_word_count || 0)) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="font-mono font-bold text-emerald-400">+${escape_html((session.ending_word_count || 0) - (session.starting_word_count || 0))}</span>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<span class="font-mono font-bold text-rose-400">${escape_html((session.ending_word_count || 0) - (session.starting_word_count || 0))}</span>`);
					}
					$$renderer.push(`<!--]--></td><td class="py-4 font-mono font-semibold text-stone-400">${escape_html(session.keystrokes?.toLocaleString() || 0)}</td><td class="py-4 font-mono text-stone-200">${escape_html(session.wpm || 0)} <span class="text-[9px] font-bold tracking-widest text-stone-500 uppercase">WPM</span></td><td class="py-4 font-mono text-stone-400">${escape_html(session.flesch_reading_ease != null ? session.flesch_reading_ease.toFixed(1) : "—")}</td></tr>`);
				}
				$$renderer.push(`<!--]--></tbody></table></div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-032d98ed.js.map
