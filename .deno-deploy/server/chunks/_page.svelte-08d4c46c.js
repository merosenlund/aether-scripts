import { b as attr, s as stringify, c as escape_html, e as ensure_array_like, l as derived } from './dev-db1ab9cf.js';
import { A as Activity } from './activity-930605c0.js';
import { A as Arrow_left } from './arrow-left-693621d1.js';
import { B as Book_open } from './book-open-8545439b.js';
import { C as Clock } from './clock-731c4c77.js';
import { P as Pen_line, F as Flame } from './pen-line-5c8bbf37.js';
import { G as Git_branch } from './git-branch-f40f8e55.js';
import { T as Timer } from './timer-6bd4adc3.js';
import { Z as Zap } from './zap-132280ce.js';
import { L as LineChart } from './LineChart-e2d7d536.js';
import './Icon-f47d171f.js';

//#region src/routes/(author)/analytics/serials/[id]/scenes/[sceneId]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let scene = derived(() => data.scene);
		let serialId = derived(() => data.serialId);
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
		let playSessions = derived(() => sessions().filter((s) => s.session_type === "play"));
		let editSessions = derived(() => sessions().filter((s) => s.session_type === "edit"));
		let editDepth = derived(() => editSessions().length);
		let revisionRatio = derived(() => {
			if (!playSessions().length || !scene().word_count) return null;
			const firstPlayEnd = playSessions()[0].ending_word_count || 0;
			if (firstPlayEnd === 0) return null;
			const ratio = scene().word_count / firstPlayEnd;
			return Math.round(ratio * 100) / 100;
		});
		let sceneVelocity = derived(() => {
			if (!sessions().length || !scene().published_at) return null;
			const first = new Date(sessions()[0].start_time);
			const pub = new Date(scene().published_at);
			const days = Math.round((pub.getTime() - first.getTime()) / 864e5);
			if (days < 1) return "< 1 day";
			if (days === 1) return "1 day";
			if (days < 7) return `${days} days`;
			const weeks = Math.round(days / 7);
			return `${weeks} week${weeks !== 1 ? "s" : ""}`;
		});
		let latestReadability = derived(() => {
			for (let i = sessions().length - 1; i >= 0; i--) {
				const s = sessions()[i];
				if (s.flesch_reading_ease != null) return s;
			}
			return null;
		});
		let readabilityTrend = derived(() => sessions().filter((s) => s.flesch_reading_ease != null).map((s) => ({
			date: new Date(s.start_time).toLocaleDateString("en-CA"),
			value: s.flesch_reading_ease
		})));
		let playAggregate = derived(() => ({
			duration: playSessions().reduce((a, s) => a + (s.active_duration_seconds || 0), 0),
			netWords: playSessions().reduce((a, s) => a + Math.max(0, s.netWords), 0),
			count: playSessions().length
		}));
		let editAggregate = derived(() => ({
			duration: editSessions().reduce((a, s) => a + (s.active_duration_seconds || 0), 0),
			netWords: editSessions().reduce((a, s) => a + s.netWords, 0),
			count: editSessions().length
		}));
		let wpmTrend = derived(() => sessions().filter((s) => s.wpm > 0).map((s) => ({
			date: new Date(s.start_time).toLocaleDateString("en-CA"),
			value: s.wpm
		})));
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
		function fleschLabel(score) {
			if (score >= 90) return "Very Easy";
			if (score >= 70) return "Easy";
			if (score >= 60) return "Standard";
			if (score >= 50) return "Fairly Difficult";
			if (score >= 30) return "Difficult";
			return "Very Difficult";
		}
		let sceneName = derived(() => scene().display_title || scene().author_title || `Scene ${scene().order_index}`);
		$$renderer.push(`<div class="min-h-screen bg-stone-950 pb-16 font-sans text-stone-100"><div class="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-stone-900/50 via-stone-950 to-stone-950 px-8 py-10"><div class="relative z-10 mx-auto max-w-6xl"><a${attr("href", `/analytics/serials/${stringify(serialId())}`)} class="mb-4 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-stone-500 uppercase transition-colors hover:text-stone-300">`);
		Arrow_left($$renderer, { class: "h-3.5 w-3.5" });
		$$renderer.push(`<!----> Back to Serial Analytics</a> <h1 class="bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text font-serif text-2xl font-bold tracking-tight text-transparent">${escape_html(sceneName())}</h1> <p class="mt-1 text-sm text-stone-500">Scene analytics — ${escape_html(sessions().length)} session${escape_html(sessions().length !== 1 ? "s" : "")} logged</p></div></div> <div class="mx-auto mt-8 max-w-6xl space-y-8 px-8"><div class="grid grid-cols-2 gap-4 lg:grid-cols-4"><div class="relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 transition-all hover:border-white/10"><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Edit Depth</span> <span class="mt-1.5 block font-serif text-2xl font-bold text-white">${escape_html(editDepth())}</span> <div class="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">`);
		Pen_line($$renderer, { class: "h-3.5 w-3.5 text-emerald-400" });
		$$renderer.push(`<!----> edit sessions before publish</div></div> <div class="relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 transition-all hover:border-white/10"><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Scene Velocity</span> <span class="mt-1.5 block font-serif text-2xl font-bold text-white">${escape_html(sceneVelocity() ?? "—")}</span> <div class="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">`);
		Timer($$renderer, { class: "h-3.5 w-3.5 text-cyan-400" });
		$$renderer.push(`<!----> first draft → published</div></div> <div class="relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 transition-all hover:border-white/10"><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Revision Ratio</span> <span class="mt-1.5 block font-serif text-2xl font-bold text-white">${escape_html(revisionRatio() != null ? `${revisionRatio()}×` : "—")}</span> <div class="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">`);
		Git_branch($$renderer, { class: "h-3.5 w-3.5 text-indigo-400" });
		$$renderer.push(`<!----> published ÷ first draft words</div></div> <div class="relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 transition-all hover:border-white/10"><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Current Words</span> <span class="mt-1.5 block font-serif text-2xl font-bold text-white">${escape_html((scene().word_count || 0).toLocaleString())}</span> <div class="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">`);
		Book_open($$renderer, { class: "h-3.5 w-3.5 text-rose-400" });
		$$renderer.push(`<!----> scene word count</div></div></div> <div class="grid grid-cols-1 gap-4 lg:grid-cols-2"><div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-5 flex items-center gap-2 font-serif text-base font-bold text-white">`);
		Flame($$renderer, { class: "text-primary h-4 w-4" });
		$$renderer.push(`<!----> Play Sessions</h2> <div class="grid grid-cols-3 gap-4"><div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Count</span> <span class="mt-1 block font-serif text-xl font-bold text-white">${escape_html(playAggregate().count)}</span></div> <div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Time</span> <span class="mt-1 block font-serif text-xl font-bold text-white">${escape_html(formatHours(playAggregate().duration))}</span></div> <div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Words</span> <span class="mt-1 block font-serif text-xl font-bold text-emerald-400">+${escape_html(playAggregate().netWords.toLocaleString())}</span></div></div></div> <div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-5 flex items-center gap-2 font-serif text-base font-bold text-white">`);
		Pen_line($$renderer, { class: "h-4 w-4 text-emerald-400" });
		$$renderer.push(`<!----> Edit Sessions</h2> <div class="grid grid-cols-3 gap-4"><div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Count</span> <span class="mt-1 block font-serif text-xl font-bold text-white">${escape_html(editAggregate().count)}</span></div> <div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Time</span> <span class="mt-1 block font-serif text-xl font-bold text-white">${escape_html(formatHours(editAggregate().duration))}</span></div> <div><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Net Words</span> `);
		if (editAggregate().netWords >= 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="mt-1 block font-serif text-xl font-bold text-emerald-400">+${escape_html(editAggregate().netWords.toLocaleString())}</span>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span class="mt-1 block font-serif text-xl font-bold text-rose-400">${escape_html(editAggregate().netWords.toLocaleString())}</span>`);
		}
		$$renderer.push(`<!--]--></div></div></div></div> `);
		if (latestReadability()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-5 flex items-center gap-2 font-serif text-base font-bold text-white">`);
			Activity($$renderer, { class: "h-4 w-4 text-indigo-400" });
			$$renderer.push(`<!----> Prose Metrics <span class="ml-auto text-[10px] font-normal tracking-wider text-stone-600 uppercase">from most recent session</span></h2> <div class="grid grid-cols-2 gap-4 lg:grid-cols-4"><div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4"><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Reading Ease</span> <span class="mt-1.5 block font-serif text-xl font-bold text-white">${escape_html(latestReadability().flesch_reading_ease?.toFixed(1))}</span> <span class="text-[10px] text-stone-500">${escape_html(fleschLabel(latestReadability().flesch_reading_ease))}</span></div> <div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4"><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Avg Sentence</span> <span class="mt-1.5 block font-serif text-xl font-bold text-white">${escape_html(latestReadability().avg_sentence_length?.toFixed(1))}</span> <span class="text-[10px] text-stone-500">words per sentence</span></div> <div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4"><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Avg Word Length</span> <span class="mt-1.5 block font-serif text-xl font-bold text-white">${escape_html(latestReadability().avg_word_length?.toFixed(1))}</span> <span class="text-[10px] text-stone-500">chars per word</span></div> <div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4"><span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase">Vocabulary</span> <span class="mt-1.5 block font-serif text-xl font-bold text-white">${escape_html(latestReadability().type_token_ratio != null ? (latestReadability().type_token_ratio * 100).toFixed(1) + "%" : "—")}</span> <span class="text-[10px] text-stone-500">lexical diversity (500w)</span></div></div> `);
			if (readabilityTrend().length >= 2) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="mt-6"><h3 class="mb-3 text-[10px] font-bold tracking-wider text-stone-500 uppercase">Reading Ease Over Sessions</h3> `);
				LineChart($$renderer, {
					data: readabilityTrend(),
					color: "indigo",
					height: 100,
					label: "Flesch reading ease per session",
					formatValue: (v) => v.toFixed(0)
				});
				$$renderer.push(`<!----></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (wpmTrend().length >= 2) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-4 flex items-center gap-2 font-serif text-base font-bold text-white">`);
			Zap($$renderer, { class: "h-4 w-4 text-emerald-400" });
			$$renderer.push(`<!----> Writing Speed Per Session</h2> `);
			LineChart($$renderer, {
				data: wpmTrend(),
				color: "emerald",
				height: 110,
				label: "WPM per session for this scene"
			});
			$$renderer.push(`<!----></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6"><h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">`);
		Clock($$renderer, { class: "text-primary h-4 w-4" });
		$$renderer.push(`<!----> Session Timeline</h2> `);
		if (sessions().length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<p class="text-center text-sm text-stone-600 italic">No sessions yet for this scene.</p>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="overflow-x-auto"><table class="w-full border-collapse text-left text-xs"><thead><tr class="border-b border-white/5 text-[10px] font-bold tracking-widest text-stone-500 uppercase"><th class="pb-3.5 font-bold">#</th><th class="pb-3.5 font-bold">Date</th><th class="pb-3.5 font-bold">Mode</th><th class="pb-3.5 font-bold">Duration</th><th class="pb-3.5 font-bold">Start Words</th><th class="pb-3.5 font-bold">Net Words</th><th class="pb-3.5 font-bold">WPM</th><th class="pb-3.5 font-bold">Efficiency</th><th class="pb-3.5 font-bold">Flesch</th></tr></thead><tbody class="divide-y divide-white/5"><!--[-->`);
			const each_array = ensure_array_like(sessions());
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let s = each_array[i];
				$$renderer.push(`<tr class="transition-all hover:bg-white/[0.01]"><td class="py-3.5 font-mono text-stone-600">${escape_html(i + 1)}</td><td class="py-3.5 text-stone-300"><span class="block">${escape_html(formatDate(s.start_time))}</span> <span class="mt-0.5 block text-[10px] text-stone-500">${escape_html(formatTime(s.start_time))}</span></td><td class="py-3.5">`);
				if (s.session_type === "play") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="bg-primary/10 border-primary/20 text-primary rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase">Play</span>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<span class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">Edit</span>`);
				}
				$$renderer.push(`<!--]--></td><td class="py-3.5 font-mono text-stone-400">${escape_html(formatHours(s.active_duration_seconds))}</td><td class="py-3.5 font-mono text-stone-500">${escape_html(s.starting_word_count)}</td><td class="py-3.5 font-mono">`);
				if (s.netWords >= 0) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="font-bold text-emerald-400">+${escape_html(s.netWords)}</span>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<span class="font-bold text-rose-400">${escape_html(s.netWords)}</span>`);
				}
				$$renderer.push(`<!--]--></td><td class="py-3.5 font-mono text-stone-300">${escape_html(s.wpm > 0 ? s.wpm : "—")}</td><td class="py-3.5 font-mono text-stone-400">${escape_html(s.efficiency != null ? s.efficiency : "—")}</td><td class="py-3.5 font-mono text-stone-400">${escape_html(s.flesch_reading_ease != null ? s.flesch_reading_ease.toFixed(1) : "—")}</td></tr>`);
			}
			$$renderer.push(`<!--]--></tbody></table></div>`);
		}
		$$renderer.push(`<!--]--></div></div></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-08d4c46c.js.map
