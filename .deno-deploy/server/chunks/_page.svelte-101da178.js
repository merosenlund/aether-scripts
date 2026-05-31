import { b as attr, s as stringify, c as escape_html, e as ensure_array_like, a as attr_class, a6 as html, a7 as bind_props, l as derived, i as spread_props, d as store_get, g as unsubscribe_stores } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';
import { A as Arrow_left } from './arrow-left-693621d1.js';
import { P as Pencil, E as EventEditorModal } from './EventEditorModal-d1c9e0d1.js';
import { T as Trash_2 } from './trash-2-84c1de2c.js';
import { n as notifications } from './notifications-351a1541.js';
import { p as page } from './stores-225b455b.js';
import { s as supabase } from './supabaseClient-824b9cb6.js';
import { u as updateWikiEventPayload, c as createWikiEvent } from './wiki-7e2bc21a.js';
import './client-ffaaeca1.js';
import './internal-8a8e9ef7.js';
import './index-21b402be.js';
import './warnDeprecatedPackage-103e47c7.js';
import './createBrowserClient-0790f5fc.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/link.svelte
function Link($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "link" },
		props,
		{ iconNode: [["path", { "d": "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }], ["path", { "d": "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }]] }
	]));
}
//#endregion
//#region src/lib/components/wiki/ProseViewer.svelte
function ProseViewer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/**
		* ProseViewer — Read-only Tiptap content renderer with block-level click targets.
		*
		* Renders Tiptap JSON as styled paragraphs matching the editor's typography.
		* Each top-level block gets a data-block-id wrapper that supports:
		*   - Anchor indicators (left border accent) for blocks connected to events
		*   - Hover effects in re-anchor mode
		*   - Click-to-select for re-anchoring
		*/
		let { scenes = [], anchoredBlockIds = /* @__PURE__ */ new Set(), highlightedBlockId = null, reanchorMode = false, onBlockClick = (_blockId, _sceneId) => {}, onRequestPreviousScene = () => {}, onRequestNextScene = () => {} } = $$props;
		function renderInline(nodes) {
			if (!nodes) return "";
			return nodes.map((node) => {
				if (node.type === "text") {
					let text = escapeHtml(node.text || "");
					if (node.marks) for (const mark of node.marks) switch (mark.type) {
						case "bold":
							text = `<strong>${text}</strong>`;
							break;
						case "italic":
							text = `<em>${text}</em>`;
							break;
						case "code":
							text = `<code>${text}</code>`;
							break;
						case "strike":
							text = `<s>${text}</s>`;
							break;
					}
					return text;
				}
				if (node.type === "hardBreak") return "<br>";
				return "";
			}).join("");
		}
		function escapeHtml(text) {
			return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
		}
		function getBlockText(node) {
			if (node.text) return node.text;
			if (!node.content) return "";
			return node.content.map(getBlockText).join("");
		}
		function getSceneBlocks(scene) {
			if (!scene.content_blocks?.content) return [];
			return scene.content_blocks.content.filter((node) => node.attrs?.id).map((node) => ({
				id: node.attrs.id,
				node
			}));
		}
		function scrollToBlock(blockId) {}
		$$renderer.push(`<div data-component="prose-viewer" class="prose-viewer scroll-container h-full overflow-y-auto svelte-1u5xii2"><div data-component="sentinel-top" data-sentinel="top" class="h-1 svelte-1u5xii2"></div> <!--[-->`);
		const each_array = ensure_array_like(scenes);
		for (let sceneIdx = 0, $$length = each_array.length; sceneIdx < $$length; sceneIdx++) {
			let scene = each_array[sceneIdx];
			const blocks = getSceneBlocks(scene);
			if (sceneIdx > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div data-component="scene-divider" class="my-8 flex items-center gap-4 px-8 svelte-1u5xii2"><div class="h-px flex-1 bg-white/5 svelte-1u5xii2"></div> <span class="text-[9px] font-bold tracking-widest text-stone-600 uppercase svelte-1u5xii2">Scene ${escape_html(scene.order_index)}: ${escape_html(scene.title)}</span> <div class="h-px flex-1 bg-white/5 svelte-1u5xii2"></div></div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div data-component="scene-header" class="px-8 pt-2 pb-4 svelte-1u5xii2"><span class="text-[9px] font-bold tracking-widest text-stone-600 uppercase svelte-1u5xii2">Scene ${escape_html(scene.order_index)}: ${escape_html(scene.title)}</span></div>`);
			}
			$$renderer.push(`<!--]-->  `);
			if (blocks.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div data-component="empty-scene" class="px-8 py-4 text-xs italic text-stone-700 svelte-1u5xii2">No content in this scene</div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--[-->`);
				const each_array_1 = ensure_array_like(blocks);
				for (let blockIdx = 0, $$length = each_array_1.length; blockIdx < $$length; blockIdx++) {
					let block = each_array_1[blockIdx];
					const isAnchored = anchoredBlockIds.has(block.id);
					const isHighlighted = highlightedBlockId === block.id;
					getBlockText(block.node);
					$$renderer.push(`<div data-component="prose-block"${attr("data-block-id", block.id)}${attr_class(`prose-block group relative px-8 py-1 transition-all ${stringify(isAnchored ? "border-l-2 border-primary/40" : "border-l-2 border-transparent")} ${stringify(isHighlighted ? "bg-primary/10 border-primary" : "")} ${stringify(reanchorMode ? "cursor-pointer hover:bg-white/5" : "")}`, "svelte-1u5xii2")}>`);
					if (isAnchored) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div data-component="anchor-indicator" class="text-primary/40 absolute top-1/2 left-2 -translate-y-1/2 svelte-1u5xii2">`);
						Link($$renderer, { size: 10 });
						$$renderer.push(`<!----></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (block.node.type === "heading") {
						$$renderer.push("<!--[0-->");
						const level = block.node.attrs?.level || 2;
						if (level === 1) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<h1 class="font-serif text-2xl leading-relaxed font-bold text-stone-200 svelte-1u5xii2">${html(renderInline(block.node.content))}</h1>`);
						} else if (level === 2) {
							$$renderer.push("<!--[1-->");
							$$renderer.push(`<h2 class="font-serif text-xl leading-relaxed font-bold text-stone-200 svelte-1u5xii2">${html(renderInline(block.node.content))}</h2>`);
						} else {
							$$renderer.push("<!--[-1-->");
							$$renderer.push(`<h3 class="font-serif text-lg leading-relaxed font-bold text-stone-300 svelte-1u5xii2">${html(renderInline(block.node.content))}</h3>`);
						}
						$$renderer.push(`<!--]-->`);
					} else if (block.node.type === "gmNote" || block.node.attrs?.visibility === "journal") {
						$$renderer.push("<!--[1-->");
						$$renderer.push(`<div class="rounded-lg border-l-2 border-stone-600/30 bg-stone-800/20 py-1 pr-4 pl-4 italic text-stone-500 svelte-1u5xii2">${html(renderInline(block.node.content))}</div>`);
					} else if (block.node.type === "clockBlock" || block.node.type === "trackBlock" || block.node.type === "diceRoller" || block.node.type === "oracleBlock" || block.node.type === "statBlock") {
						$$renderer.push("<!--[2-->");
						$$renderer.push(`<div class="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-xs text-stone-500 svelte-1u5xii2"><span class="font-bold uppercase tracking-wider svelte-1u5xii2">${escape_html(block.node.type.replace(/([A-Z])/g, " $1").trim())}</span> `);
						if (block.node.attrs?.name) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`: ${escape_html(block.node.attrs.name)}`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></div>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<p class="font-serif text-lg leading-relaxed text-stone-300 svelte-1u5xii2">${html(renderInline(block.node.content) || "&nbsp;")}</p>`);
					}
					$$renderer.push(`<!--]--></div>`);
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--> <div data-component="sentinel-bottom" data-sentinel="bottom" class="h-1 svelte-1u5xii2"></div></div>`);
		bind_props($$props, { scrollToBlock });
	});
}
//#endregion
//#region src/lib/api/wikiScenes.ts
/**
* Fetch a single scene's Tiptap JSON content for the ProseViewer.
*/
async function fetchSceneContent(sceneId) {
	const { data, error } = await supabase.from("scenes").select("id, content_blocks").eq("id", sceneId).single();
	if (error) {
		console.error("Failed to fetch scene content:", error);
		return null;
	}
	return data;
}
//#endregion
//#region src/routes/(author)/serials/[id]/wiki/[entityId]/events/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { data } = $$props;
		const entityId = derived(() => store_get($$store_subs ??= {}, "$page", page).params.entityId);
		const entity = derived(() => (data.entities || []).find((e) => e.id === entityId()));
		const serial = derived(() => data.serial);
		const allScenes = derived(() => (data.scenes || []).sort((a, b) => a.order_index - b.order_index));
		let entityEvents = [...data.entityEvents || []];
		const anchoredBlockIds = derived(() => new Set(entityEvents.filter((ev) => ev.block_id).map((ev) => ev.block_id)));
		let loadedScenes = [];
		let loadingScene = false;
		let reanchorMode = false;
		let reanchorEventId = null;
		let highlightedBlockId = null;
		let editingEvent = null;
		let showEventModal = false;
		async function handleBlockClick(blockId, sceneId) {
			return;
		}
		async function loadScene(sceneId) {
			if (loadedScenes.some((s) => s.id === sceneId) || loadingScene) return;
			loadingScene = true;
			const content = await fetchSceneContent(sceneId);
			const sceneMeta = allScenes().find((s) => s.id === sceneId);
			if (content && sceneMeta) {
				const newScene = {
					id: sceneMeta.id,
					title: sceneMeta.display_title || sceneMeta.author_title || "Untitled",
					order_index: sceneMeta.order_index,
					content_blocks: content.content_blocks
				};
				loadedScenes = [...loadedScenes, newScene].sort((a, b) => a.order_index - b.order_index);
			}
			loadingScene = false;
		}
		function loadPreviousScene() {
			if (loadedScenes.length === 0 || loadingScene) return;
			const firstLoaded = loadedScenes[0];
			const prevScene = allScenes().find((s) => s.order_index === firstLoaded.order_index - 1);
			if (prevScene) loadScene(prevScene.id);
		}
		function loadNextScene() {
			if (loadedScenes.length === 0 || loadingScene) return;
			const lastLoaded = loadedScenes[loadedScenes.length - 1];
			const nextScene = allScenes().find((s) => s.order_index === lastLoaded.order_index + 1);
			if (nextScene) loadScene(nextScene.id);
		}
		function formatEventType(type) {
			return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
		}
		async function handleEventModalSubmit(result) {
			if (!editingEvent || !entity()) return;
			try {
				if (result.mode === "correct") {
					await updateWikiEventPayload(editingEvent.id, result.payload);
					entityEvents = entityEvents.map((e) => e.id === editingEvent?.id ? {
						...e,
						payload: result.payload
					} : e);
					notifications.success("Event updated");
				} else if (result.mode === "evolve") {
					const blockId = null;
					const sceneId = null;
					if (editingEvent.event_type === "add_fact") {
						const remEv = await createWikiEvent({
							entity_id: entity().id,
							scene_id: sceneId,
							block_id: blockId,
							event_type: "remove_fact",
							payload: { id: editingEvent.payload?.id }
						});
						const addEv = await createWikiEvent({
							entity_id: entity().id,
							scene_id: sceneId,
							block_id: blockId,
							event_type: "add_fact",
							payload: {
								id: crypto.randomUUID(),
								content: result.payload.content
							}
						});
						entityEvents = [
							...entityEvents,
							remEv,
							addEv
						].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
					} else if (editingEvent.event_type === "update_name" || editingEvent.event_type === "create") {
						const ev = await createWikiEvent({
							entity_id: entity().id,
							scene_id: sceneId,
							block_id: blockId,
							event_type: "update_name",
							payload: { name: result.payload.name }
						});
						entityEvents = [...entityEvents, ev].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
					} else if (editingEvent.event_type === "update_description") {
						const ev = await createWikiEvent({
							entity_id: entity().id,
							scene_id: sceneId,
							block_id: blockId,
							event_type: "update_description",
							payload: { description: result.payload.description }
						});
						entityEvents = [...entityEvents, ev].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
					}
					notifications.success("Narrative evolved!");
				}
				showEventModal = false;
				editingEvent = null;
			} catch (e) {
				console.error(e);
				notifications.error("Failed to process event update");
			}
		}
		if (entity()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div data-component="events-page" class="flex min-h-0 flex-1 flex-col overflow-hidden"><div data-component="events-header" class="flex shrink-0 items-center gap-4 border-b border-white/5 px-6 py-3"><a data-component="back-to-overview"${attr("href", `/serials/${stringify(serial().id)}/wiki/${stringify(entityId())}/overview`)} class="flex items-center gap-1.5 text-xs text-stone-500 transition-colors hover:text-white">`);
			Arrow_left($$renderer, { size: 14 });
			$$renderer.push(`<!----> Overview</a> <div data-component="header-divider" class="h-4 w-px bg-white/10"></div> <h2 data-component="entity-name" class="text-sm font-bold text-white">${escape_html(entity().name)}</h2> <span data-component="entity-cat-badge" class="text-primary bg-primary/10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">${escape_html(entity().category)}</span></div> <div data-component="events-workspace" class="flex min-h-0 flex-1 overflow-hidden"><div data-component="prose-panel" class="flex min-h-0 flex-1 flex-col overflow-hidden">`);
			if (loadedScenes.length > 0) {
				$$renderer.push("<!--[0-->");
				ProseViewer($$renderer, {
					scenes: loadedScenes,
					anchoredBlockIds: anchoredBlockIds(),
					highlightedBlockId,
					reanchorMode,
					onBlockClick: handleBlockClick,
					onRequestPreviousScene: loadPreviousScene,
					onRequestNextScene: loadNextScene
				});
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div data-component="no-scenes" class="flex h-full items-center justify-center text-sm text-stone-600">No scenes with events found for this entity</div>`);
			}
			$$renderer.push(`<!--]--></div> <aside data-component="events-sidebar" class="flex w-80 shrink-0 flex-col border-l border-white/5 bg-stone-900/20"><div data-component="sidebar-header" class="border-b border-white/5 px-4 py-3"><h3 data-component="sidebar-title" class="text-[10px] font-bold tracking-widest text-stone-500 uppercase">Chronological Log (${escape_html(entityEvents.length)})</h3></div> <div data-component="sidebar-scroller" class="flex-1 space-y-1.5 overflow-y-auto p-3"><!--[-->`);
			const each_array = ensure_array_like(entityEvents);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let event = each_array[$$index];
				const isActive = reanchorEventId === event.id;
				$$renderer.push(`<div data-component="event-entry"${attr_class(`group cursor-pointer rounded-xl border p-3 transition-all ${stringify(isActive ? "border-primary/30 bg-primary/10" : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5")}`)}><div data-component="event-type-row" class="flex items-center justify-between"><div data-component="event-badge-group" class="flex items-center gap-2">`);
				if (event.block_id) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span data-component="anchored-dot" class="bg-primary/50 h-1.5 w-1.5 rounded-full shrink-0" title="Anchored to a block"></span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <span data-component="event-type-badge"${attr_class(`rounded-lg px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${stringify(isActive ? "bg-primary/20 text-primary" : "bg-white/5 text-stone-400")}`)}>${escape_html(formatEventType(event.event_type))}</span></div> <div class="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100"><button data-component="edit-event-btn" class="text-stone-700 hover:text-white" title="Edit event">`);
				Pencil($$renderer, { size: 12 });
				$$renderer.push(`<!----></button> <button data-component="delete-event-btn" class="text-stone-700 hover:text-rose-400" title="Delete event">`);
				Trash_2($$renderer, { size: 12 });
				$$renderer.push(`<!----></button></div></div> <div data-component="event-meta" class="mt-1.5 text-[9px] text-stone-600">`);
				if (event.scenes) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span>${escape_html(event.scenes.display_title || event.scenes.author_title)}</span> <span class="mx-1">·</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <span>${escape_html(new Date(event.created_at).toLocaleDateString([], {
					month: "short",
					day: "numeric"
				}))}</span></div> `);
				if (event.payload?.reason) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<p data-component="event-reason" class="mt-1 text-[10px] italic text-stone-500">"${escape_html(event.payload.reason)}"</p>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (event.event_type === "add_fact" && event.payload?.content) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<p data-component="event-fact" class="mt-1 truncate text-[10px] text-stone-500">${escape_html(event.payload.content)}</p>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (isActive) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<p data-component="active-hint" class="text-primary mt-2 text-[9px] font-bold">← Click a block to re-anchor</p>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--></div></aside></div></div> `);
			EventEditorModal($$renderer, {
				event: editingEvent,
				isOpen: showEventModal,
				onClose: () => {
					showEventModal = false;
					editingEvent = null;
				},
				onSubmit: handleEventModalSubmit
			});
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div data-component="entity-not-found" class="flex flex-1 items-center justify-center"><p class="text-sm text-stone-500">Entity not found</p></div>`);
		}
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-101da178.js.map
