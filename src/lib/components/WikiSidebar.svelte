<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createWikiEvent,
		getWikiEvents,
		deleteWikiEvent,
		type WikiEntity,
		type WikiEvent
	} from '$lib/api/wiki';
	import { Sparkles, Pin, User, MapPin, Flag, Timer, Plus, ChevronRight, Link2, Trash2, Activity } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import { fade, slide } from 'svelte/transition';
	import { contextEngine } from '$lib/stores/contextEngine.svelte';
	import { openConfirm } from '$lib/stores/prompt.svelte';

	let {
		serialId,
		sceneId,
		activeBlockId,
		visibleBlockIds = [],
		onHighlightBlock = (_blockId: string | null) => {},
		onFocusBlock = (_blockId: string) => {}
	} = $props<{
		serialId: string;
		sceneId: string;
		activeBlockId: string;
		visibleBlockIds?: string[];
		onHighlightBlock?: (blockId: string | null) => void;
		onFocusBlock?: (blockId: string) => void;
	}>();

	let isLoading = $state(true);
	let searchQuery = $state('');
	let expandedEntityIds = $state<Set<string>>(new Set());

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

	/** Get all events for a specific entity in the active scene */
	function getEntityEvents(entityId: string): WikiEvent[] {
		return contextEngine.rawEvents.filter((e) => e.entity_id === entityId);
	}

	/** Check if an event is anchored to a block in the current scene's document */
	function isEventInActiveScene(event: WikiEvent): boolean {
		if (!event.block_id) return false;
		return contextEngine.orderedBlockIds.includes(event.block_id);
	}

	/** Format event type for display */
	function formatEventType(eventType: string): string {
		switch (eventType) {
			case 'create': return 'Created';
			case 'update_description': return 'Description Updated';
			case 'add_fact': return 'Fact Added';
			case 'remove_fact': return 'Fact Removed';
			case 'set_clock': return 'Clock Set';
			case 'increment_clock': return 'Clock +1';
			case 'decrement_clock': return 'Clock -1';
			case 'set_track': return 'Track Updated';
			case 'anchor': return 'Anchored';
			default: return eventType;
		}
	}

	function toggleExpanded(entityId: string) {
		const next = new Set(expandedEntityIds);
		if (next.has(entityId)) {
			next.delete(entityId);
		} else {
			next.add(entityId);
		}
		expandedEntityIds = next;
	}

	async function handleDeleteEvent(event: WikiEvent) {
		const confirmed = await openConfirm(
			'Delete Event',
			`Delete this "${formatEventType(event.event_type)}" event? This cannot be undone.`
		);
		if (!confirmed) return;

		try {
			await deleteWikiEvent(event.id);
			contextEngine.rawEvents = await getWikiEvents(sceneId);
			notifications.success('Event deleted.');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to delete event.');
		}
	}

	async function handleDeleteFact(entityId: string, factId: string) {
		try {
			await createWikiEvent({
				entity_id: entityId,
				scene_id: sceneId,
				block_id: null,
				event_type: 'remove_fact',
				payload: { id: factId }
			});
			contextEngine.rawEvents = await getWikiEvents(sceneId);
			notifications.success('Fact removed.');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to remove fact.');
		}
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
			case 'track':
				return Activity;
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
				{@const isExpanded = expandedEntityIds.has(entity.id)}
				{@const events = getEntityEvents(entity.id)}
				{@const hasAnchoredEvents = events.some((e) => e.block_id)}
				<div
					data-component="entity-card"
					class="group rounded-2xl border p-4 shadow-sm transition-all {isRevealed
						? 'border-white/5 bg-white/5 opacity-100'
						: 'border-transparent bg-white/[0.01] opacity-20'}"
					transition:slide
				>
					<!-- Header Row: Icon + Name + Actions -->
					<div data-component="entity-header" class="flex items-start justify-between">
						<button
							data-component="entity-expand-toggle"
							class="flex flex-1 items-center gap-3 text-left"
							onclick={() => toggleExpanded(entity.id)}
						>
							<div
								data-component="entity-icon-wrapper"
								class="rounded-lg p-2 {isRevealed
									? 'bg-primary/10 text-primary'
									: 'bg-stone-800 text-stone-600'}"
							>
								<Icon size={16} />
							</div>
							<div data-component="entity-titles" class="flex-1 min-w-0">
								<h4
									data-component="entity-name"
									class="text-sm font-bold {isRevealed
										? 'text-white'
										: 'text-stone-600'} leading-tight"
								>
									{entityState.name}
								</h4>
								<div class="flex items-center gap-1.5">
									<span
										data-component="entity-category"
										class="text-[10px] {isRevealed
											? 'text-stone-500'
											: 'text-stone-700'} font-bold tracking-widest uppercase"
										>{entityState.category}</span
									>
									{#if hasAnchoredEvents}
										<Link2 size={10} class="text-primary/60" />
									{/if}
								</div>
							</div>
							<ChevronRight
								size={14}
								class="text-stone-600 transition-transform duration-200 {isExpanded ? 'rotate-90' : ''}"
							/>
						</button>

						{#if !visibleBlockIds.length}
							<button
								data-component="anchor-button"
								onclick={() => handleAnchor(entity.id)}
								class="hover:text-primary hover:bg-primary/10 ml-2 rounded-lg p-2 text-stone-500 opacity-0 transition-colors group-hover:opacity-100"
								title="Anchor to current block"
							>
								<Pin size={14} />
							</button>
						{/if}
					</div>

					<!-- Expandable Section -->
					{#if isExpanded && isRevealed}
						<div data-component="entity-details" class="mt-3 space-y-3 border-t border-white/5 pt-3" transition:slide>
							<!-- Description -->
							{#if entityState.description}
								<p
									data-component="entity-desc"
									class="text-xs leading-relaxed text-stone-400"
								>
									{entityState.description}
								</p>
							{/if}

							<!-- Facts -->
							{#if entityState.facts.length > 0}
								<div data-component="entity-facts" class="space-y-1">
									<span class="text-[9px] font-bold tracking-widest text-stone-600 uppercase">Facts</span>
									{#each entityState.facts as fact (fact.id)}
										<div
											data-component="entity-fact-item"
											class="group/fact flex items-start justify-between gap-1.5 rounded-lg px-2 py-1 text-[11px] text-stone-400 transition-colors hover:bg-white/5"
										>
											<div class="flex items-start gap-1.5">
												<span data-component="entity-fact-bullet" class="text-primary mt-0.5">•</span>
												<span data-component="entity-fact-text">{fact.content}</span>
											</div>
											<button
												class="text-stone-700 opacity-0 transition-all hover:text-rose-400 group-hover/fact:opacity-100"
												onclick={() => handleDeleteFact(entity.id, fact.id)}
												title="Remove fact"
											>
												<Trash2 size={10} />
											</button>
										</div>
									{/each}
								</div>
							{/if}

							<!-- Events Timeline -->
							{#if events.length > 0}
								<div data-component="entity-events" class="space-y-1">
									<span class="text-[9px] font-bold tracking-widest text-stone-600 uppercase">Events</span>
									{#each events as event (event.id)}
										{@const isInScene = isEventInActiveScene(event)}
										<div
											data-component="entity-event-item"
											class="group/event flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] transition-colors hover:bg-white/5 {isInScene ? 'text-stone-300' : 'text-stone-600'}"
											onmouseenter={() => event.block_id && isInScene ? onHighlightBlock(event.block_id) : null}
											onmouseleave={() => onHighlightBlock(null)}
										>
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												class="flex items-center gap-2 {event.block_id && isInScene ? 'cursor-pointer' : ''}"
												onclick={() => event.block_id && isInScene ? onFocusBlock(event.block_id) : null}
											>
												{#if event.block_id && isInScene}
													<Link2 size={10} class="text-primary/70 shrink-0" />
												{:else if event.block_id}
													<Link2 size={10} class="text-stone-700 shrink-0" />
												{:else}
													<div class="w-[10px] shrink-0"></div>
												{/if}
												<span class="font-medium">{formatEventType(event.event_type)}</span>
												<span class="text-[9px] text-stone-600">
													{new Date(event.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
												</span>
											</div>
											<button
												class="text-stone-700 opacity-0 transition-all hover:text-rose-400 group-hover/event:opacity-100"
												onclick={() => handleDeleteEvent(event)}
												title="Delete event"
											>
												<Trash2 size={10} />
											</button>
										</div>
									{/each}
								</div>
							{/if}
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
