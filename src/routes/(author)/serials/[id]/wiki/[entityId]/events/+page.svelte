<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowLeft, Trash2, Plus } from '@lucide/svelte';
	import ProseViewer from '$lib/components/wiki/ProseViewer.svelte';
	import { fetchSceneContent } from '$lib/api/wikiScenes';
	import { updateWikiEventBlock } from '$lib/api/wiki';
	import { notifications } from '$lib/stores/notifications';
	import type { WikiEntity, WikiEvent } from '$lib/api/wiki';

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
</script>

<svelte:window onkeydown={handleKeydown} />

{#if entity}
	<div data-component="events-page" class="flex min-h-0 flex-1 flex-col overflow-hidden">
		<!-- Re-anchor Banner -->
		{#if reanchorMode}
			<div
				data-component="reanchor-banner"
				class="bg-primary/10 border-primary/30 flex shrink-0 items-center justify-between border-b px-6 py-2.5"
			>
				<p class="text-primary text-xs font-bold">
					Click any paragraph to re-anchor this event. Press <kbd
						class="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px]">Esc</kbd
					> to cancel.
				</p>
				<button
					data-component="cancel-reanchor"
					onclick={cancelReanchor}
					class="text-primary text-[10px] font-bold uppercase tracking-wider hover:underline"
				>
					Cancel
				</button>
			</div>
		{/if}

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
			<div data-component="prose-panel" class="min-h-0 flex-1 overflow-hidden">
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
								<span
									data-component="event-type-badge"
									class="rounded-lg px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase
										{isActive
											? 'bg-primary/20 text-primary'
											: 'bg-white/5 text-stone-400'}"
								>
									{formatEventType(event.event_type)}
								</span>
								{#if event.block_id}
									<span
										data-component="anchored-dot"
										class="bg-primary/50 h-1.5 w-1.5 rounded-full"
										title="Anchored to a block"
									></span>
								{/if}
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
{:else}
	<div
		data-component="entity-not-found"
		class="flex flex-1 items-center justify-center"
	>
		<p class="text-sm text-stone-500">Entity not found</p>
	</div>
{/if}
