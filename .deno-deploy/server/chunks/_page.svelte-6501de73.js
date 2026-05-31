import { c as escape_html, e as ensure_array_like, a as attr_class, b as attr, s as stringify, f as attr_style } from './dev-db1ab9cf.js';
import { A as Activity } from './activity-930605c0.js';
import { B as Book_open } from './book-open-8545439b.js';
import { C as Chevron_right } from './chevron-right-c66109d9.js';
import { C as Circle_alert } from './circle-alert-0efd9811.js';
import { C as Compass } from './compass-09b8f898.js';
import { F as File_text } from './file-text-6819df47.js';
import { R as Reader } from './Reader-d480f7c6.js';
import { s as supabase } from './supabaseClient-824b9cb6.js';
import './Icon-f47d171f.js';
import './index-server-db57e4a7.js';
import './warnDeprecatedPackage-103e47c7.js';
import './createBrowserClient-0790f5fc.js';

//#region src/lib/stores/authorPresence.svelte.ts
var AuthorPresenceManager = class {
	channel = null;
	currentAuthorId = "";
	status = {
		isOnline: false,
		isTyping: false
	};
	get authorStatus() {
		return this.status;
	}
	/**
	* For Readers: Subscribe to an author's presence channel to see if they are active/typing
	*/
	subscribeToAuthor(authorId) {
		if (this.channel && this.currentAuthorId === authorId) return;
		this.cleanup();
		this.currentAuthorId = authorId;
		this.status = {
			isOnline: false,
			isTyping: false
		};
		this.channel = supabase.channel(`author-presence:${authorId}`);
		this.channel.on("presence", { event: "sync" }, () => {
			const presenceState = this.channel.presenceState();
			const keys = Object.keys(presenceState);
			if (keys.length > 0) {
				const authorPresences = presenceState[keys[0]];
				if (authorPresences && authorPresences.length > 0) {
					const activePresence = authorPresences[0];
					this.status = {
						isOnline: true,
						isTyping: activePresence.isTyping || false,
						currentSerialId: activePresence.currentSerialId,
						currentSerialTitle: activePresence.currentSerialTitle,
						currentSceneId: activePresence.currentSceneId
					};
					return;
				}
			}
			this.status = {
				isOnline: false,
				isTyping: false
			};
		}).subscribe();
	}
	/**
	* For Authors: Broadcast status (online, typing, current serial)
	*/
	async startBroadcasting(authorId, data) {
		if (this.channel && this.currentAuthorId === authorId) {
			await this.updateBroadcast(data);
			return;
		}
		this.cleanup();
		this.currentAuthorId = authorId;
		this.channel = supabase.channel(`author-presence:${authorId}`);
		this.channel.subscribe(async (status) => {
			if (status === "SUBSCRIBED") await this.channel.track({
				isTyping: data.isTyping,
				currentSerialId: data.currentSerialId,
				currentSerialTitle: data.currentSerialTitle,
				currentSceneId: data.currentSceneId,
				online_at: (/* @__PURE__ */ new Date()).toISOString()
			});
		});
	}
	async updateBroadcast(data) {
		if (this.channel) await this.channel.track({
			isTyping: data.isTyping,
			currentSerialId: data.currentSerialId,
			currentSerialTitle: data.currentSerialTitle,
			currentSceneId: data.currentSceneId,
			online_at: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	cleanup() {
		if (this.channel) {
			supabase.removeChannel(this.channel);
			this.channel = null;
		}
		this.status = {
			isOnline: false,
			isTyping: false
		};
	}
};
var authorPresence = new AuthorPresenceManager();

//#region src/routes/(reader)/library/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let activeSceneIndex = 0;
		function formatDate(dateStr) {
			if (!dateStr) return "Recently";
			return new Date(dateStr).toLocaleDateString(void 0, {
				month: "short",
				day: "numeric",
				year: "numeric"
			});
		}
		$$renderer.push(`<div class="flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100"><aside class="flex w-80 shrink-0 flex-col border-r border-white/5 bg-zinc-900/20 backdrop-blur-2xl"><div class="border-b border-white/5 bg-white/[0.01] p-6"><a href="/library" class="mb-4 flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-white">`);
		Compass($$renderer, { class: "h-3.5 w-3.5" });
		$$renderer.push(`<!----> Back to Library</a> <h2 class="font-serif text-xl leading-tight font-bold tracking-tight text-white">${escape_html(data.serial.title)}</h2> <span class="mt-2 inline-block rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">${escape_html(data.serial.status || "Active")}</span></div> <div class="flex-1 space-y-2 overflow-y-auto p-4"><h3 class="mb-3 px-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Table of Contents</h3> `);
		if (data.scenes.length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-8 text-center"><p class="text-xs text-zinc-600 italic">No scenes are available yet.</p></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(data.scenes);
			for (let index = 0, $$length = each_array.length; index < $$length; index++) {
				let scene = each_array[index];
				$$renderer.push(`<button${attr_class(`group flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all ${stringify(activeSceneIndex === index ? "bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.03)]" : "border-white/5 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white")}`)}><div class="space-y-1"><span class="block font-serif text-xs font-bold transition-colors group-hover:text-white">${escape_html(scene.display_title || scene.author_title || `Scene ${index + 1}`)}</span> <span class="block text-[9px] font-medium text-zinc-600">${escape_html(formatDate(scene.published_at))}</span></div> `);
				Chevron_right($$renderer, { class: "group-hover:text-primary h-4 w-4 text-zinc-600 transition-colors" });
				$$renderer.push(`<!----></button>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div></aside> <div class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950"><header class="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-900/10 px-8 backdrop-blur-xl"><div class="flex items-center gap-3">`);
		Book_open($$renderer, { class: "text-primary h-5 w-5" });
		$$renderer.push(`<!----> <span class="text-sm font-bold text-zinc-300">`);
		if (data.scenes[activeSceneIndex]) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`${escape_html(data.scenes[activeSceneIndex].display_title || data.scenes[activeSceneIndex].author_title || `Scene ${activeSceneIndex + 1}`)}`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`Story Overview`);
		}
		$$renderer.push(`<!--]--></span></div> <button${attr_class(`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${stringify("border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white")}`)}>`);
		Activity($$renderer, { class: "h-3.5 w-3.5" });
		$$renderer.push(`<!----> Mechanical Cut</button></header> <div${attr_class(`relative flex-1 overflow-y-auto scroll-smooth p-8 md:p-12 ${stringify("")}`)}><div class="mx-auto max-w-3xl space-y-24 pb-48">`);
		if (data.scenes.length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="space-y-4 py-24 text-center">`);
			Book_open($$renderer, { class: "mx-auto h-12 w-12 text-zinc-700" });
			$$renderer.push(`<!----> <h3 class="text-lg font-bold text-zinc-300">No Published Chapters</h3> <p class="mx-auto max-w-sm text-sm text-zinc-500">There are no published scenes available to read for this serial yet.</p></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--[-->`);
			const each_array_1 = ensure_array_like(data.scenes);
			for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
				let scene = each_array_1[index];
				$$renderer.push(`<section${attr("id", `scene-${stringify(scene.id)}`)} class="scene-section border-b border-white/5 pb-20 last:border-b-0 last:pb-0"${attr("data-index", index)}><div class="mb-10 flex items-center gap-3 select-none"><span class="h-[1px] w-6 bg-zinc-800"></span> <h4 class="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">${escape_html(scene.display_title || scene.author_title || `Scene ${index + 1}`)}</h4> <span class="h-[1px] flex-1 bg-zinc-800/40"></span> <span class="font-mono text-[9px] font-bold text-zinc-600 uppercase">${escape_html(formatDate(scene.published_at))}</span></div> <article class="prose-wrapper">`);
				Reader($$renderer, {
					content: scene.content || "",
					onVisibleBlocksChange: () => {}
				});
				$$renderer.push(`<!----></article></section>`);
			}
			$$renderer.push(`<!--]--> `);
			if (data.serial.teaser_target_scene_id) {
				$$renderer.push("<!--[0-->");
				const targetSceneStatus = data.serial.teaser_target_scene?.status || "Playing";
				const nextSceneNum = data.scenes.length + 1;
				$$renderer.push(`<div class="relative space-y-6 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 p-6 backdrop-blur-md md:p-8"><div class="bg-primary/10 absolute top-0 right-0 -z-10 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full blur-[40px]"></div> <div class="flex flex-col justify-between gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center"><div class="text-primary flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase">`);
				Activity($$renderer, { class: "h-4 w-4" });
				$$renderer.push(`<!----> Scene ${escape_html(nextSceneNum)} Status</div> <div class="flex items-center gap-2"><span class="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Current Stage:</span> `);
				if (targetSceneStatus === "Playing") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="flex animate-pulse items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-indigo-400 uppercase"><span class="h-1.5 w-1.5 rounded-full bg-indigo-400"></span> Drafting (Play Phase)</span>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<span class="flex animate-pulse items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Revision (Edit Phase)</span>`);
				}
				$$renderer.push(`<!--]--></div></div> <div class="grid grid-cols-1 gap-6 md:grid-cols-2"><div class="space-y-4 rounded-2xl border border-white/5 bg-white/[0.01] p-5"><div class="flex items-center justify-between text-xs font-bold tracking-wider text-indigo-400 uppercase"><span class="flex items-center gap-1.5">`);
				File_text($$renderer, { class: "h-3.5 w-3.5" });
				$$renderer.push(`<!----> 1. Drafting</span> <span class="font-mono text-zinc-300">${escape_html(data.autoPlayPercent)}%</span></div> <div class="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-inner"><div class="h-full rounded-full bg-indigo-500 transition-all duration-500"${attr_style(`width: ${stringify(data.autoPlayPercent)}%`)}></div></div> <div class="grid grid-cols-3 gap-2 pt-2 text-center"><div class="space-y-0.5 rounded-xl border border-white/5 bg-white/[0.01] p-2"><span class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase">Word Count</span> <span class="block font-mono text-xs font-bold text-zinc-200">${escape_html(data.serial.teaser_target_scene?.word_count || 0)} / 1000</span></div> <div class="space-y-0.5 rounded-xl border border-white/5 bg-white/[0.01] p-2"><span class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase">Play Effort</span> <span class="block font-mono text-xs font-bold text-zinc-200">${escape_html(data.teaserMetrics.playKeystrokes || 0)} Keys</span></div> <div class="space-y-0.5 rounded-xl border border-white/5 bg-white/[0.01] p-2"><span class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase">Play Time</span> <span class="block font-mono text-xs font-bold text-zinc-200">${escape_html(Math.round(data.teaserMetrics.playTimeSeconds / 60))} Mins</span></div></div></div> <div class="space-y-4 rounded-2xl border border-white/5 bg-white/[0.01] p-5"><div class="flex items-center justify-between text-xs font-bold tracking-wider text-emerald-400 uppercase"><span class="flex items-center gap-1.5">`);
				Compass($$renderer, { class: "h-3.5 w-3.5" });
				$$renderer.push(`<!----> 2. Revision</span> <span class="font-mono text-zinc-300">${escape_html(data.manualEditPercent)}%</span></div> <div class="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-inner"><div class="h-full rounded-full bg-emerald-500 transition-all duration-500"${attr_style(`width: ${stringify(data.manualEditPercent)}%`)}></div></div> <div class="grid grid-cols-2 gap-2 pt-2 text-center"><div class="space-y-0.5 rounded-xl border border-white/5 bg-white/[0.01] p-2"><span class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase">Edit Effort</span> <span class="block font-mono text-xs font-bold text-zinc-200">${escape_html(data.teaserMetrics.editKeystrokes || 0)} Keys</span></div> <div class="space-y-0.5 rounded-xl border border-white/5 bg-white/[0.01] p-2"><span class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase">Edit Time</span> <span class="block font-mono text-xs font-bold text-zinc-200">${escape_html(Math.round(data.teaserMetrics.editTimeSeconds / 60))} Mins</span></div></div></div></div> `);
				if (data.serial.next_scene_update_note) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.01] p-4">`);
					Circle_alert($$renderer, { class: "mt-0.5 h-4 w-4 shrink-0 text-zinc-500" });
					$$renderer.push(`<!----> <p class="text-xs leading-relaxed text-zinc-400 italic">"${escape_html(data.serial.next_scene_update_note)}"</p></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (authorPresence.authorStatus.isOnline) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="animate-fade-in flex items-center justify-between rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] p-4 shadow-sm"><div class="flex items-center gap-3"><div class="relative flex h-2.5 w-2.5">`);
					if (authorPresence.authorStatus.isTyping) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span> <span class="relative inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-purple-500"></span>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span> <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>`);
					}
					$$renderer.push(`<!--]--></div> <div class="space-y-0.5"><span class="block text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Author Activity</span> `);
					if (authorPresence.authorStatus.isTyping) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="block text-xs font-bold text-purple-400">Typing live...</span>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<span class="block text-xs font-semibold text-emerald-400">Active online</span>`);
					}
					$$renderer.push(`<!--]--></div></div> `);
					if (authorPresence.authorStatus.currentSerialTitle) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="hidden text-right sm:block"><span class="block font-mono text-[9px] font-bold tracking-wider text-zinc-600 uppercase">Working On</span> <span class="block max-w-[200px] truncate font-serif text-xs text-zinc-300 italic">"${escape_html(authorPresence.authorStatus.currentSerialTitle)}"</span></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div></div></div></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-6501de73.js.map
