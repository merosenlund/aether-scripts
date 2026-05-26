<script lang="ts">
	import { onMount } from 'svelte';
	import { createWikiEvent, getWikiEvents, type WikiEntity } from '$lib/api/wiki';
	import { Sparkles, Pin, User, MapPin, Flag, Timer, Plus } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import { fade, slide } from 'svelte/transition';
	import { contextEngine } from '$lib/stores/contextEngine.svelte';

	let {
		serialId,
		sceneId,
		activeBlockId,
		visibleBlockIds = []
	} = $props<{
		serialId: string;
		sceneId: string;
		activeBlockId: string;
		visibleBlockIds?: string[];
	}>();

	let isLoading = $state(true);
	let searchQuery = $state('');

	onMount(async () => {
		try {
			if (contextEngine.baseEntities.length === 0) {
				await contextEngine.loadBaseEntities(serialId);
			}
			// Initialize events in contextEngine if not loaded
			if (contextEngine.rawEvents.length === 0) {
				contextEngine.rawEvents = await getWikiEvents(sceneId);
			}
		} catch (e) {
			console.error(e);
			notifications.error('Failed to load wiki.');
		} finally {
			isLoading = false;
		}
	});

	// An entity is "revealed" if it has an event that is within the current readBlockIds
	// OR if we are in editor/author mode (where visibleBlockIds length is 0)
	const revealedEntityIds = $derived.by(() => {
		if (!visibleBlockIds || visibleBlockIds.length === 0) {
			return new Set(contextEngine.baseEntities.map((e) => e.id));
		}
		return new Set(contextEngine.reducedEntities.keys());
	});

	async function handleAnchor(entityId: string) {
		if (!activeBlockId) {
			notifications.error('Click in the editor to select a block first.');
			return;
		}

		try {
			await createWikiEvent({
				entity_id: entityId,
				scene_id: sceneId,
				block_id: activeBlockId,
				event_type: 'anchor',
				payload: {}
			});
			notifications.success('Linked to block!');
			// Reload raw events in the contextEngine reactively
			contextEngine.rawEvents = await getWikiEvents(sceneId);
		} catch (e) {
			console.error(e);
			notifications.error('Failed to link entity.');
		}
	}

	const filteredEntities = $derived(
		contextEngine.baseEntities.filter((e) => {
			const state = getEntityState(e);
			return state.name.toLowerCase().includes(searchQuery.toLowerCase());
		})
	);

	function getEntityState(entity: WikiEntity) {
		const reduced = contextEngine.reducedEntities.get(entity.id);
		if (reduced) {
			return {
				name: reduced.name || entity.name,
				category: reduced.category || entity.category,
				description: reduced.description || entity.description,
				facts: reduced.facts || []
			};
		}
		return {
			name: entity.name,
			category: entity.category,
			description: entity.description,
			facts: []
		};
	}

	function getIcon(category: string) {
		switch (category?.toLowerCase()) {
			case 'character':
				return User;
			case 'location':
				return MapPin;
			case 'thread':
				return Flag;
			case 'clock':
				return Timer;
			default:
				return Sparkles;
		}
	}
</script>

<div data-component="wiki-sidebar-root" class="flex h-full flex-col">
	<div data-component="search-container" class="space-y-3 px-6 py-4">
		<div data-component="search-actions" class="flex items-center gap-2">
			<div data-component="search-box" class="relative flex-1">
				<input
					data-component="search-input"
					type="text"
					bind:value={searchQuery}
					placeholder="Search the world..."
					class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition-colors focus:outline-none"
				/>
			</div>
			<a
				data-component="manage-wiki-link"
				href="/serials/{serialId}/wiki"
				target="_blank"
				class="flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-stone-300 transition-all hover:bg-white/10"
				title="Open World Manager in new tab"
			>
				<span data-component="manage-wiki-text" class="mr-1">Manage</span>
				<span data-component="manage-wiki-arrow" class="text-[10px]">↗</span>
			</a>
		</div>
	</div>

	<div data-component="entities-scrollport" class="flex-1 space-y-2 overflow-y-auto px-4 pb-6">
		{#if isLoading}
			<div data-component="loading-indicator" class="animate-pulse p-8 text-center">
				<div
					data-component="loading-spinner"
					class="mx-auto mb-4 h-8 w-8 rounded-full bg-white/10"
				></div>
				<div data-component="loading-bar" class="mx-auto h-2 w-24 rounded bg-white/10"></div>
			</div>
		{:else if filteredEntities.length === 0}
			<div
				data-component="empty-state"
				class="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center"
			>
				<p
					data-component="empty-title"
					class="text-[10px] font-bold tracking-widest text-stone-600 uppercase"
				>
					No entries found
				</p>
			</div>
		{:else}
			{#each filteredEntities as entity (entity.id)}
				{@const isRevealed = revealedEntityIds.has(entity.id)}
				{@const entityState = getEntityState(entity)}
				{@const Icon = getIcon(entityState.category)}
				<div
					data-component="entity-card"
					class="group rounded-2xl border p-4 shadow-sm transition-all {isRevealed
						? 'border-white/5 bg-white/5 opacity-100'
						: 'border-transparent bg-white/[0.01] opacity-20'}"
					transition:slide
				>
					<div data-component="entity-header" class="mb-2 flex items-start justify-between">
						<div data-component="entity-meta-group" class="flex items-center gap-3">
							<div
								data-component="entity-icon-wrapper"
								class="rounded-lg p-2 {isRevealed
									? 'bg-primary/10 text-primary'
									: 'bg-stone-800 text-stone-600'}"
							>
								<Icon size={16} />
							</div>
							<div data-component="entity-titles">
								<h4
									data-component="entity-name"
									class="text-sm font-bold {isRevealed
										? 'text-white'
										: 'text-stone-600'} leading-tight"
								>
									{entityState.name}
								</h4>
								<span
									data-component="entity-category"
									class="text-[10px] {isRevealed
										? 'text-stone-500'
										: 'text-stone-700'} font-bold tracking-widest uppercase"
									>{entityState.category}</span
								>
							</div>
						</div>

						{#if !visibleBlockIds.length}
							<button
								data-component="anchor-button"
								onclick={() => handleAnchor(entity.id)}
								class="hover:text-primary hover:bg-primary/10 rounded-lg p-2 text-stone-500 opacity-0 transition-colors group-hover:opacity-100"
								title="Anchor to current block"
							>
								<Pin size={14} />
							</button>
						{/if}
					</div>

					{#if entityState.description && isRevealed}
						<p
							data-component="entity-desc"
							class="line-clamp-2 text-xs leading-relaxed text-stone-400"
							transition:fade
						>
							{entityState.description}
						</p>
					{/if}

					{#if entityState.facts.length > 0 && isRevealed}
						<div data-component="entity-facts" class="mt-3 space-y-1 border-t border-white/5 pt-2">
							{#each entityState.facts as fact (fact.id)}
								<div
									data-component="entity-fact-item"
									class="flex items-start gap-1.5 text-[11px] text-stone-400"
								>
									<span data-component="entity-fact-bullet" class="text-primary mt-0.5">•</span>
									<span data-component="entity-fact-text">{fact.content}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<div data-component="sidebar-actions" class="border-t border-white/5 bg-white/[0.02] p-4">
		<button
			data-component="new-entry-btn"
			class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase transition-all hover:border-white/20 hover:text-white"
		>
			<Plus size={14} />
			New Wiki Entry
		</button>
	</div>
</div>
