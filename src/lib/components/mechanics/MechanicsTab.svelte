<script lang="ts">
	import { onMount } from 'svelte';
	import { updateWikiEventPayload, getWikiEvents, deleteWikiEvent, type WikiEntity, type WikiEvent } from '$lib/api/wiki';
	import { Plus, Timer, Activity, ChevronRight, Link2, Trash2, Pencil } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import { slide } from 'svelte/transition';
	import { supabase } from '$lib/supabaseClient';
	import { openPrompt, openConfirm } from '$lib/stores/prompt.svelte';
	import { contextEngine } from '$lib/stores/contextEngine.svelte';
	import EventEditorModal from '$lib/components/wiki/EventEditorModal.svelte';

	let {
		serialId,
		sceneId,
		cursorState = { clocks: {} },
		onHighlightBlock = (_blockId: string | null) => {},
		onFocusBlock = (_blockId: string) => {}
	} = $props<{
		serialId: string;
		sceneId: string;
		cursorState?: {
			clocks?: Record<string, { entityId: string; name: string; segments: number; filled: number }>;
		};
		onHighlightBlock?: (blockId: string | null) => void;
		onFocusBlock?: (blockId: string) => void;
	}>();

	let isLoading = $state(true);
	let expandedEntityIds = $state<Set<string>>(new Set());

	let editingEvent = $state<WikiEvent | null>(null);
	let editingEntity = $state<WikiEntity | null>(null);
	let showEventModal = $state(false);

	const entities = $derived(
		contextEngine.baseEntities.filter(
			(e) => e.category?.toLowerCase() === 'clock' || e.category?.toLowerCase() === 'track'
		)
	);

	async function loadMechanics() {
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
			notifications.error('Failed to load mechanics.');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadMechanics();
	});

	async function createNewMechanic(type: 'clock' | 'track') {
		const name = await openPrompt(`New ${type}`, `Enter a name for the new ${type}:`);
		if (!name) return;

		let metadata: Record<string, unknown>;
		if (type === 'clock') {
			const segmentsStr = await openPrompt(
				'Clock Segments',
				'How many segments? (4, 6, 8, 10, 12)',
				'4'
			);
			const segments = parseInt(segmentsStr || '4');
			metadata = { segments: [4, 6, 8, 10, 12].includes(segments) ? segments : 4, filled: 0 };
		} else {
			metadata = { max: 10, current: 0 };
		}

		try {
			const entityId = crypto.randomUUID();
			const { data, error } = await supabase
				.from('wiki_entities')
				.insert({
					id: entityId,
					serial_id: serialId,
					name,
					category: type === 'clock' ? 'Clock' : 'Track',
					metadata
				})
				.select()
				.single();

			if (error) throw error;

			// Write matching event to event sourcing log
			await supabase.from('wiki_events').insert({
				entity_id: entityId,
				scene_id: sceneId,
				block_id: null,
				event_type: 'create',
				payload: { name, category: type === 'clock' ? 'Clock' : 'Track', metadata }
			});

			// Refresh events in contextEngine
			contextEngine.rawEvents = await getWikiEvents(sceneId);

			// Update baseEntities reactively
			contextEngine.baseEntities = [...contextEngine.baseEntities, data as WikiEntity];
			notifications.success(`${type} created!`);
		} catch (e) {
			console.error(e);
			notifications.error(`Failed to create ${type}`);
		}
	}

	async function updateProgress(entity: WikiEntity, delta: number, reason?: string) {
		const reduced = contextEngine.reducedEntities.get(entity.id);
		const currentMetadata = reduced ? reduced.metadata : entity.metadata;
		const isClock = entity.category?.toLowerCase() === 'clock';

		try {
			if (isClock) {
				const payload: Record<string, unknown> = { amount: Math.abs(delta) };
				if (reason) payload.reason = reason;
				await supabase.from('wiki_events').insert({
					entity_id: entity.id,
					scene_id: sceneId,
					block_id: null,
					event_type: delta > 0 ? 'increment_clock' : 'decrement_clock',
					payload
				});
			} else {
				const currentVal = (currentMetadata.current as number) ?? 0;
				const maxVal = (currentMetadata.max as number) ?? 10;
				const newVal = Math.max(0, Math.min(maxVal, currentVal + delta));

				const payload: Record<string, unknown> = { max: maxVal, current: newVal };
				if (reason) payload.reason = reason;
				await supabase.from('wiki_events').insert({
					entity_id: entity.id,
					scene_id: sceneId,
					block_id: null,
					event_type: 'set_track',
					payload
				});
			}

			// Refresh events in contextEngine reactively
			contextEngine.rawEvents = await getWikiEvents(sceneId);
			notifications.success('Progress saved!');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to update progress');
		}
	}

	async function handleProgressClick(entity: WikiEntity, delta: number, event: MouseEvent) {
		if (event.shiftKey) {
			const reason = await openPrompt(
				'Reason',
				`Why is this ${entity.category?.toLowerCase() === 'clock' ? 'clock' : 'track'} changing?`,
				''
			);
			await updateProgress(entity, delta, reason || undefined);
		} else {
			await updateProgress(entity, delta);
		}
	}

	function getReducedMetadata(entity: WikiEntity) {
		const reduced = contextEngine.reducedEntities.get(entity.id);
		return reduced ? reduced.metadata : entity.metadata;
	}

	/** Get all events for a specific entity */
	function getEntityEvents(entityId: string): WikiEvent[] {
		return contextEngine.rawEvents.filter((e) => e.entity_id === entityId);
	}

	/** Check if an event is anchored to a block in the current document */
	function isEventInActiveScene(event: WikiEvent): boolean {
		if (!event.block_id) return false;
		return contextEngine.orderedBlockIds.includes(event.block_id);
	}

	/** Format event type for display */
	function formatEventType(eventType: string): string {
		switch (eventType) {
			case 'create': return 'Created';
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

	async function handleEventModalSubmit(result: { mode: 'correct' | 'evolve'; payload: any }) {
		if (!editingEvent) return;

		try {
			// For mechanics, we currently only support 'correct' mode via the modal (primarily to edit reasons)
			if (result.mode === 'correct') {
				await updateWikiEventPayload(editingEvent.id, result.payload);
				contextEngine.rawEvents = await getWikiEvents(sceneId);
				notifications.success('Event updated');
			}
			showEventModal = false;
			editingEvent = null;
		} catch (e) {
			console.error(e);
			notifications.error('Failed to update event');
		}
	}
</script>

<div data-component="mechanics-root" class="flex h-full flex-col">
	<div data-component="mechanics-list" class="flex-1 space-y-4 overflow-y-auto px-4 py-6">
		{#if isLoading}
			<div data-component="loading-container" class="animate-pulse p-8 text-center">
				<div
					data-component="loading-dot"
					class="mx-auto mb-4 h-8 w-8 rounded-full bg-white/10"
				></div>
			</div>
		{:else if entities.length === 0}
			<div
				data-component="empty-state"
				class="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center"
			>
				<p
					data-component="empty-text"
					class="text-[10px] font-bold tracking-widest text-stone-600 uppercase"
				>
					No mechanics active
				</p>
			</div>
		{:else}
			{#each entities as entity (entity.id)}
				{@const isClock = entity.category?.toLowerCase() === 'clock'}
				{@const reducedMeta = getReducedMetadata(entity)}
				{@const cursorClock = isClock
					? cursorState?.clocks?.[entity.id] || cursorState?.clocks?.[entity.name]
					: null}
				{@const isExpanded = expandedEntityIds.has(entity.id)}
				{@const events = getEntityEvents(entity.id)}

				<div
					data-component="mechanic-card"
					class="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 shadow-sm transition-all duration-300 hover:bg-white/[0.03]"
					transition:slide
				>
					{#if cursorClock}
						<div
							data-component="live-marker"
							class="bg-primary/[0.01] border-primary/10 pointer-events-none absolute inset-0 rounded-2xl border"
						></div>
					{/if}

					<!-- Header: Icon + Name + Expand Toggle -->
					<div data-component="mechanic-header" class="mb-3 flex items-center gap-3">
						<button
							data-component="mechanic-expand-toggle"
							class="flex flex-1 items-center gap-3 text-left"
							onclick={() => toggleExpanded(entity.id)}
						>
							<div
								data-component="mechanic-icon-box"
								class="bg-primary/10 text-primary rounded-lg p-2 transition-all group-hover:scale-105"
							>
								{#if isClock}
									<Timer size={16} />
								{:else}
									<Activity size={16} />
								{/if}
							</div>
							<div data-component="mechanic-titles" class="flex-1 min-w-0">
								<h4
									data-component="mechanic-name"
									class="group-hover:text-primary text-sm leading-tight font-bold text-white transition-colors"
								>
									{entity.name}
								</h4>
								<div data-component="mechanic-subtitle" class="mt-0.5 flex items-center gap-1.5">
									<span
										data-component="mechanic-category"
										class="text-[10px] font-bold tracking-widest text-stone-500 uppercase"
										>{entity.category}</span
									>
									{#if cursorClock}
										<span
											data-component="live-dot"
											class="bg-primary h-1.5 w-1.5 animate-pulse rounded-full"
											title="Cursor Contextual Value"
										></span>
										<span
											data-component="live-label"
											class="text-primary text-[8px] font-bold tracking-wider uppercase">Live</span
										>
									{/if}
								</div>
							</div>
							<ChevronRight
								size={14}
								class="text-stone-500 transition-transform duration-200 {isExpanded ? 'rotate-90' : ''}"
							/>
						</button>
						<button
							data-component="edit-mechanic-button"
							class="hover:text-primary hover:bg-primary/10 ml-2 rounded-lg p-2 text-stone-500 opacity-0 transition-colors group-hover:opacity-100"
							onclick={() => {
								const createEvent = contextEngine.rawEvents.find(evt => evt.entity_id === entity.id && evt.event_type === 'create');
								if (createEvent) {
									editingEvent = createEvent;
									editingEntity = entity;
									showEventModal = true;
								} else {
									notifications.error('Could not find create event for mechanic.');
								}
							}}
							title="Edit mechanic"
						>
							<Pencil size={14} />
						</button>
					</div>

					<!-- Progress Controls (always visible) -->
					<div
						data-component="progress-control-row"
						class="mt-2 flex items-center justify-between gap-4"
					>
						<button
							data-component="decrement-btn"
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 font-bold text-stone-400 hover:bg-white/10 hover:text-white"
							onclick={(e) => handleProgressClick(entity, -1, e)}
							title="Hold Shift to add a reason"
						>
							-
						</button>

						<div
							data-component="progress-val-display"
							class="text-primary flex-1 text-center font-mono text-xl font-bold drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]"
						>
							{#if isClock}
								{#if cursorClock}
									{cursorClock.filled || 0} / {cursorClock.segments}
								{:else}
									{reducedMeta.filled || 0} / {reducedMeta.segments}
								{/if}
							{:else}
								{reducedMeta.current || 0} / {reducedMeta.max || 10}
							{/if}
						</div>

						<button
							data-component="increment-btn"
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 font-bold text-stone-400 hover:bg-white/10 hover:text-white"
							onclick={(e) => handleProgressClick(entity, 1, e)}
							title="Hold Shift to add a reason"
						>
							+
						</button>
					</div>

					<!-- Expandable Event History -->
					{#if isExpanded}
						<div data-component="mechanic-events" class="mt-3 space-y-1 border-t border-white/5 pt-3" transition:slide>
							<span class="text-[9px] font-bold tracking-widest text-stone-600 uppercase">Event History</span>
							{#if events.length === 0}
								<p class="text-[11px] text-stone-600 italic px-2">No events recorded.</p>
							{:else}
								{#each events as event (event.id)}
									{@const isInScene = isEventInActiveScene(event)}
									<div
										data-component="mechanic-event-item"
										role="presentation"
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
										{#if event.payload?.reason}
											<p class="mt-0.5 pl-[18px] text-[10px] italic text-stone-500">
												"{event.payload.reason}"
											</p>
										{/if}
										<div class="flex items-center gap-1 opacity-0 transition-all group-hover/event:opacity-100">
											<button
												class="text-stone-700 hover:text-white"
												onclick={() => { editingEvent = event; showEventModal = true; }}
												title="Edit event"
											>
												<Pencil size={10} />
											</button>
											<button
												class="text-stone-700 hover:text-rose-400"
												onclick={() => handleDeleteEvent(event)}
												title="Delete event"
											>
												<Trash2 size={10} />
											</button>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<div
		data-component="mechanics-actions"
		class="space-y-2 border-t border-white/5 bg-white/[0.02] p-4"
	>
		<button
			data-component="add-clock-btn"
			class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase transition-all hover:border-white/20 hover:text-white"
			onclick={() => createNewMechanic('clock')}
		>
			<Plus size={14} />
			New Clock
		</button>
		<button
			data-component="add-track-btn"
			class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase transition-all hover:border-white/20 hover:text-white"
			onclick={() => createNewMechanic('track')}
		>
			<Plus size={14} />
			New Track
		</button>
	</div>

	<EventEditorModal
		event={editingEvent}
		entity={editingEntity}
		isOpen={showEventModal}
		onClose={() => { showEventModal = false; editingEvent = null; editingEntity = null; }}
		onSubmit={handleEventModalSubmit}
	/>
</div>
