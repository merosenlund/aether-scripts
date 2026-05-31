<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowLeft, Trash2, Plus, Pencil } from '@lucide/svelte';
	import ProseViewer from '$lib/components/wiki/ProseViewer.svelte';
	import { fetchSceneContent } from '$lib/api/wikiScenes';
	import { updateWikiEventBlock, deleteWikiEvent, updateWikiEventPayload, createWikiEvent } from '$lib/api/wiki';
	import { notifications } from '$lib/stores/notifications';
	import { openConfirm } from '$lib/stores/prompt.svelte';
	import type { WikiEntity, WikiEvent } from '$lib/api/wiki';
	import EventEditorModal from '$lib/components/wiki/EventEditorModal.svelte';

	let { data } = $props<{ data: any }>();

	const entityId = $derived($page.params.entityId);
	const entity = $derived(
		(data.entities || []).find((e: WikiEntity) => e.id === entityId) as WikiEntity | undefined
	);
	const serial = $derived(data.serial);
	const allScenes = $derived(
		(data.scenes || []).sort((a: any, b: any) => a.order_index - b.order_index)
	);

	// Events for this entity (from page server load, chronological)
	let entityEvents = $state<(WikiEvent & { scenes?: any })[]>([...(data.entityEvents || [])]);

	// Anchored block IDs for this entity
	const anchoredBlockIds = $derived(
		new Set(
			entityEvents
				.filter((ev) => ev.block_id)
				.map((ev) => ev.block_id as string)
		)
	);

	// ── Loaded Scenes for ProseViewer ──
	interface LoadedScene {
		id: string;
		title: string;
		order_index: number;
		content_blocks: any;
	}

	let loadedScenes = $state<LoadedScene[]>([]);
	let loadingScene = $state(false);

	// Initialize with the latest scene from server load
	$effect(() => {
		if (data.initialSceneContent && data.latestSceneId) {
			const sceneMeta = allScenes.find((s: any) => s.id === data.latestSceneId);
			if (sceneMeta) {
				loadedScenes = [
					{
						id: sceneMeta.id,
						title: sceneMeta.display_title || sceneMeta.author_title || 'Untitled',
						order_index: sceneMeta.order_index,
						content_blocks: data.initialSceneContent.content_blocks
					}
				];
			}
		}
	});

	// ── Re-anchor Mode ──
	let reanchorMode = $state(false);
	let reanchorEventId = $state<string | null>(null);
	let highlightedBlockId = $state<string | null>(null);

	// Event Editing Modal
	let editingEvent = $state<WikiEvent | null>(null);
	let showEventModal = $state(false);

	let proseViewer: ProseViewer | undefined = $state();

	function handleEventClick(event: WikiEvent) {
		if (reanchorMode && reanchorEventId === event.id) {
			// Cancel re-anchor if clicking the same event
			cancelReanchor();
			return;
		}

		reanchorMode = true;
		reanchorEventId = event.id;
		highlightedBlockId = event.block_id || null;

		// Scroll to the block if it exists
		if (event.block_id && proseViewer) {
			// Check if the block's scene is loaded
			const blockScene = entityEvents.find(
				(ev) => ev.id === event.id
			)?.scene_id;

			if (blockScene) {
				const isLoaded = loadedScenes.some((s) => s.id === blockScene);
				if (!isLoaded) {
					// Load the scene then scroll
					loadScene(blockScene).then(() => {
						setTimeout(() => proseViewer?.scrollToBlock(event.block_id!), 100);
					});
				} else {
					setTimeout(() => proseViewer?.scrollToBlock(event.block_id!), 50);
				}
			}
		}
	}

	function cancelReanchor() {
		reanchorMode = false;
		reanchorEventId = null;
		highlightedBlockId = null;
	}

	async function handleBlockClick(blockId: string, sceneId: string) {
		if (!reanchorMode || !reanchorEventId) return;

		try {
			// Update the event's block_id and scene_id
			await updateWikiEventBlock(reanchorEventId, blockId, sceneId);

			// Update local state
			entityEvents = entityEvents.map((ev) =>
				ev.id === reanchorEventId ? { ...ev, block_id: blockId, scene_id: sceneId } : ev
			);

			highlightedBlockId = blockId;
			notifications.success('Event anchor updated!');
			cancelReanchor();
		} catch (e) {
			console.error(e);
			notifications.error('Failed to update anchor');
		}
	}

	// ── Lazy Scene Loading ──
	async function loadScene(sceneId: string) {
		if (loadedScenes.some((s) => s.id === sceneId) || loadingScene) return;
		loadingScene = true;

		const content = await fetchSceneContent(sceneId);
		const sceneMeta = allScenes.find((s: any) => s.id === sceneId);

		if (content && sceneMeta) {
			const newScene: LoadedScene = {
				id: sceneMeta.id,
				title: sceneMeta.display_title || sceneMeta.author_title || 'Untitled',
				order_index: sceneMeta.order_index,
				content_blocks: content.content_blocks
			};

			// Insert in order
			const updated = [...loadedScenes, newScene].sort(
				(a, b) => a.order_index - b.order_index
			);
			loadedScenes = updated;
		}

		loadingScene = false;
	}

	function loadPreviousScene() {
		if (loadedScenes.length === 0 || loadingScene) return;
		const firstLoaded = loadedScenes[0];
		const prevScene = allScenes.find(
			(s: any) => s.order_index === firstLoaded.order_index - 1
		);
		if (prevScene) loadScene(prevScene.id);
	}

	function loadNextScene() {
		if (loadedScenes.length === 0 || loadingScene) return;
		const lastLoaded = loadedScenes[loadedScenes.length - 1];
		const nextScene = allScenes.find(
			(s: any) => s.order_index === lastLoaded.order_index + 1
		);
		if (nextScene) loadScene(nextScene.id);
	}

	// Listen for Escape to cancel re-anchor
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && reanchorMode) {
			cancelReanchor();
		}
	}

	function formatEventType(type: string) {
		return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	async function handleDeleteEvent(event: WikiEvent) {
		const confirmed = await openConfirm(
			'Delete Event',
			`Delete this "${formatEventType(event.event_type)}" event? This cannot be undone.`
		);
		if (!confirmed) return;

		try {
			await deleteWikiEvent(event.id);
			entityEvents = entityEvents.filter((ev) => ev.id !== event.id);
			notifications.success('Event deleted.');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to delete event.');
		}
	}

	async function handleEventModalSubmit(result: { mode: 'correct' | 'evolve'; payload: any }) {
		if (!editingEvent || !entity) return;
		
		try {
			if (result.mode === 'correct') {
				await updateWikiEventPayload(editingEvent.id, result.payload);
				entityEvents = entityEvents.map(e => e.id === editingEvent?.id ? { ...e, payload: result.payload } : e);
				notifications.success('Event updated');
			} else if (result.mode === 'evolve') {
				// Evolve creates new events. In the World Manager, they are unanchored.
				const blockId = null; 
				const sceneId = null;
				
				if (editingEvent.event_type === 'add_fact') {
					const remEv = await createWikiEvent({
						entity_id: entity.id,
						scene_id: sceneId,
						block_id: blockId,
						event_type: 'remove_fact',
						payload: { id: editingEvent.payload?.id }
					});
					const addEv = await createWikiEvent({
						entity_id: entity.id,
						scene_id: sceneId,
						block_id: blockId,
						event_type: 'add_fact',
						payload: { id: crypto.randomUUID(), content: result.payload.content }
					});
					entityEvents = [...entityEvents, remEv, addEv].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
				} else if (editingEvent.event_type === 'update_name' || editingEvent.event_type === 'create') {
					const ev = await createWikiEvent({
						entity_id: entity.id,
						scene_id: sceneId,
						block_id: blockId,
						event_type: 'update_name',
						payload: { name: result.payload.name }
					});
					entityEvents = [...entityEvents, ev].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
				} else if (editingEvent.event_type === 'update_description') {
					const ev = await createWikiEvent({
						entity_id: entity.id,
						scene_id: sceneId,
						block_id: blockId,
						event_type: 'update_description',
						payload: { description: result.payload.description }
					});
					entityEvents = [...entityEvents, ev].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
				}
				notifications.success('Narrative evolved!');
			}
			showEventModal = false;
			editingEvent = null;
		} catch (e) {
			console.error(e);
			notifications.error('Failed to process event update');
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if entity}
	<div data-component="events-page" class="flex min-h-0 flex-1 flex-col overflow-hidden">
		<!-- Header -->
		<div
			data-component="events-header"
			class="flex shrink-0 items-center gap-4 border-b border-white/5 px-6 py-3"
		>
			<a
				data-component="back-to-overview"
				href="/serials/{serial.id}/wiki/{entityId}/overview"
				class="flex items-center gap-1.5 text-xs text-stone-500 transition-colors hover:text-white"
			>
				<ArrowLeft size={14} />
				Overview
			</a>
			<div data-component="header-divider" class="h-4 w-px bg-white/10"></div>
			<h2 data-component="entity-name" class="text-sm font-bold text-white">{entity.name}</h2>
			<span
				data-component="entity-cat-badge"
				class="text-primary bg-primary/10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
				>{entity.category}</span
			>
		</div>

		<!-- Main Content Area -->
		<div data-component="events-workspace" class="flex min-h-0 flex-1 overflow-hidden">
			<!-- Left: Prose Viewer -->
			<div data-component="prose-panel" class="flex min-h-0 flex-1 flex-col overflow-hidden">
				{#if loadedScenes.length > 0}
					<ProseViewer
						bind:this={proseViewer}
						scenes={loadedScenes}
						{anchoredBlockIds}
						{highlightedBlockId}
						{reanchorMode}
						onBlockClick={handleBlockClick}
						onRequestPreviousScene={loadPreviousScene}
						onRequestNextScene={loadNextScene}
					/>
				{:else}
					<div
						data-component="no-scenes"
						class="flex h-full items-center justify-center text-sm text-stone-600"
					>
						No scenes with events found for this entity
					</div>
				{/if}
			</div>

			<!-- Right: Event Timeline Sidebar -->
			<aside
				data-component="events-sidebar"
				class="flex w-80 shrink-0 flex-col border-l border-white/5 bg-stone-900/20"
			>
				<div
					data-component="sidebar-header"
					class="border-b border-white/5 px-4 py-3"
				>
					<h3
						data-component="sidebar-title"
						class="text-[10px] font-bold tracking-widest text-stone-500 uppercase"
					>
						Chronological Log ({entityEvents.length})
					</h3>
				</div>

				<div
					data-component="sidebar-scroller"
					class="flex-1 space-y-1.5 overflow-y-auto p-3"
				>
					{#each entityEvents as event (event.id)}
						{@const isActive = reanchorEventId === event.id}

						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							data-component="event-entry"
							class="group cursor-pointer rounded-xl border p-3 transition-all
								{isActive
									? 'border-primary/30 bg-primary/10'
									: 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5'}"
							onclick={() => handleEventClick(event)}
						>
							<div
								data-component="event-type-row"
								class="flex items-center justify-between"
							>
								<div
									data-component="event-badge-group"
									class="flex items-center gap-2"
								>
									{#if event.block_id}
										<span
											data-component="anchored-dot"
											class="bg-primary/50 h-1.5 w-1.5 rounded-full shrink-0"
											title="Anchored to a block"
										></span>
									{/if}
									<span
										data-component="event-type-badge"
										class="rounded-lg px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase
											{isActive
												? 'bg-primary/20 text-primary'
												: 'bg-white/5 text-stone-400'}"
									>
										{formatEventType(event.event_type)}
									</span>
								</div>
								<div class="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
									<button
										data-component="edit-event-btn"
										class="text-stone-700 hover:text-white"
										onclick={(e) => { e.stopPropagation(); editingEvent = event; showEventModal = true; }}
										title="Edit event"
									>
										<Pencil size={12} />
									</button>
									<button
										data-component="delete-event-btn"
										class="text-stone-700 hover:text-rose-400"
										onclick={(e) => { e.stopPropagation(); handleDeleteEvent(event); }}
										title="Delete event"
									>
										<Trash2 size={12} />
									</button>
								</div>
							</div>

							<div
								data-component="event-meta"
								class="mt-1.5 text-[9px] text-stone-600"
							>
								{#if event.scenes}
									<span
										>{event.scenes.display_title ||
											event.scenes.author_title}</span
									>
									<span class="mx-1">·</span>
								{/if}
								<span>
									{new Date(event.created_at).toLocaleDateString([], {
										month: 'short',
										day: 'numeric'
									})}
								</span>
							</div>

							{#if event.payload?.reason}
								<p
									data-component="event-reason"
									class="mt-1 text-[10px] italic text-stone-500"
								>
									"{event.payload.reason}"
								</p>
							{/if}

							{#if event.event_type === 'add_fact' && event.payload?.content}
								<p
									data-component="event-fact"
									class="mt-1 truncate text-[10px] text-stone-500"
								>
									{event.payload.content}
								</p>
							{/if}

							{#if isActive}
								<p
									data-component="active-hint"
									class="text-primary mt-2 text-[9px] font-bold"
								>
									← Click a block to re-anchor
								</p>
							{/if}
						</div>
					{/each}
				</div>
			</aside>
		</div>
	</div>

	<EventEditorModal
		event={editingEvent}
		isOpen={showEventModal}
		onClose={() => { showEventModal = false; editingEvent = null; }}
		onSubmit={handleEventModalSubmit}
	/>
{:else}
	<div
		data-component="entity-not-found"
		class="flex flex-1 items-center justify-center"
	>
		<p class="text-sm text-stone-500">Entity not found</p>
	</div>
{/if}
