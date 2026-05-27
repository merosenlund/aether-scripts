<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { slide } from 'svelte/transition';
	import {
		User,
		MapPin,
		Flag,
		Timer,
		Activity,
		Sparkles,
		Plus,
		Trash2,
		ArrowRight,
		ChevronDown,
		ChevronRight,
		ExternalLink
	} from '@lucide/svelte';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabaseClient';
	import { notifications } from '$lib/stores/notifications';
	import { openConfirm, openPrompt } from '$lib/stores/prompt.svelte';
	import {
		createWikiEvent,
		deleteWikiEvent,
		type WikiEntity,
		type WikiEvent
	} from '$lib/api/wiki';

	let { data } = $props<{ data: any }>();

	const entityId = $derived($page.params.entityId);
	const entity = $derived(data.entities?.find((e: WikiEntity) => e.id === entityId) as WikiEntity);

	// Events filtered for this entity
	let entityEvents = $state<(WikiEvent & { wiki_entities?: WikiEntity; scenes?: any })[]>([]);
	$effect(() => {
		entityEvents = (data.events || []).filter(
			(ev: WikiEvent) => ev.entity_id === entityId
		);
	});

	// Trigger Event Drawer State
	let showTriggerDrawer = $state(false);
	let newEventType = $state<WikiEvent['event_type']>('add_fact');
	let newEventPayloadFactContent = $state('');
	let newEventPayloadDesc = $state('');
	let newEventPayloadClockSegments = $state(4);
	let newEventPayloadClockFilled = $state(0);
	let newEventPayloadTrackMax = $state(10);
	let newEventPayloadTrackCurrent = $state(0);
	let newEventPayloadReason = $state('');

	// Inline fact input
	let inlineFactText = $state('');

	// Timeline expansion
	let timelineExpanded = $state(true);

	// Reset drawer state to prevent leaks between entity types
	function resetDrawerState() {
		newEventType = 'add_fact';
		newEventPayloadFactContent = '';
		newEventPayloadDesc = '';
		newEventPayloadClockSegments = 4;
		newEventPayloadClockFilled = 0;
		newEventPayloadTrackMax = 10;
		newEventPayloadTrackCurrent = 0;
		newEventPayloadReason = '';
	}

	// Derive entity state from events
	function reduceEntityState() {
		if (!entity) return null;

		const entityEvs = entityEvents.slice().reverse();

		const state = {
			name: entity.name,
			category: entity.category,
			description: entity.description || '',
			metadata: { ...entity.metadata } as Record<string, unknown>,
			facts: [] as Array<{ id: string; content: string }>
		};

		for (const ev of entityEvs) {
			switch (ev.event_type) {
				case 'create':
					if (ev.payload.name) state.name = ev.payload.name as string;
					if (ev.payload.description) state.description = ev.payload.description as string;
					state.metadata = {
						...state.metadata,
						...((ev.payload.metadata as Record<string, unknown>) || {})
					};
					break;
				case 'update_description':
					state.description = (ev.payload.description as string) || '';
					break;
				case 'add_fact':
					if (!state.facts.some((f) => f.id === ev.payload.id)) {
						state.facts.push({
							id: (ev.payload.id as string) || ev.id,
							content: (ev.payload.content as string) || ''
						});
					}
					break;
				case 'remove_fact':
					state.facts = state.facts.filter((f) => f.id !== ev.payload.id);
					break;
				case 'set_clock':
					state.metadata = {
						...state.metadata,
						segments: (ev.payload.segments as number) ?? (state.metadata.segments as number) ?? 4,
						filled: (ev.payload.filled as number) ?? (state.metadata.filled as number) ?? 0
					};
					break;
				case 'increment_clock': {
					const incAmount = (ev.payload.amount as number) ?? 1;
					const maxSeg = (state.metadata.segments as number) ?? 4;
					state.metadata.filled = Math.min(
						maxSeg,
						((state.metadata.filled as number) ?? 0) + incAmount
					);
					break;
				}
				case 'decrement_clock': {
					const decAmount = (ev.payload.amount as number) ?? 1;
					state.metadata.filled = Math.max(0, ((state.metadata.filled as number) ?? 0) - decAmount);
					break;
				}
				case 'set_track':
					state.metadata = {
						...state.metadata,
						max: (ev.payload.max as number) ?? (state.metadata.max as number) ?? 10,
						current: (ev.payload.current as number) ?? (state.metadata.current as number) ?? 0
					};
					break;
			}
		}

		return state;
	}

	const entityState = $derived(reduceEntityState());

	function getIcon(category: string) {
		switch (category?.toLowerCase()) {
			case 'character': return User;
			case 'location': return MapPin;
			case 'thread': return Flag;
			case 'clock': return Timer;
			case 'track': return Activity;
			default: return Sparkles;
		}
	}

	// Handle inline fact submission
	async function handleAddInlineFact() {
		if (!inlineFactText.trim() || !entity) return;
		const factId = crypto.randomUUID();
		try {
			const ev = await createWikiEvent({
				entity_id: entity.id,
				scene_id: data.scenes[0]?.id || null,
				block_id: null,
				event_type: 'add_fact',
				payload: { id: factId, content: inlineFactText.trim() }
			});
			entityEvents = [{ ...ev, wiki_entities: entity, scenes: data.scenes[0] }, ...entityEvents];
			data.events = [{ ...ev, wiki_entities: entity, scenes: data.scenes[0] }, ...data.events];
			inlineFactText = '';
			notifications.success('Fact added!');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to add fact');
		}
	}

	// Handle inline clock increment/decrement
	async function handleClockChange(delta: number, event?: MouseEvent) {
		if (!entity) return;
		let reason: string | undefined;
		if (event?.shiftKey) {
			reason = (await openPrompt('Reason', 'Why is this clock changing?', '')) || undefined;
		}

		const payload: Record<string, unknown> = { amount: Math.abs(delta) };
		if (reason) payload.reason = reason;

		try {
			const ev = await createWikiEvent({
				entity_id: entity.id,
				scene_id: data.scenes[0]?.id || null,
				block_id: null,
				event_type: delta > 0 ? 'increment_clock' : 'decrement_clock',
				payload
			});
			entityEvents = [{ ...ev, wiki_entities: entity, scenes: data.scenes[0] }, ...entityEvents];
			data.events = [{ ...ev, wiki_entities: entity, scenes: data.scenes[0] }, ...data.events];
			notifications.success('Clock updated!');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to update clock');
		}
	}

	// Handle inline track change
	async function handleTrackChange(delta: number, event?: MouseEvent) {
		if (!entity || !entityState) return;
		let reason: string | undefined;
		if (event?.shiftKey) {
			reason = (await openPrompt('Reason', 'Why is this track changing?', '')) || undefined;
		}

		const currentVal = (entityState.metadata?.current as number) || 0;
		const maxVal = (entityState.metadata?.max as number) || 10;
		const newVal = Math.max(0, Math.min(maxVal, currentVal + delta));

		const payload: Record<string, unknown> = { max: maxVal, current: newVal };
		if (reason) payload.reason = reason;

		try {
			const ev = await createWikiEvent({
				entity_id: entity.id,
				scene_id: data.scenes[0]?.id || null,
				block_id: null,
				event_type: 'set_track',
				payload
			});
			entityEvents = [{ ...ev, wiki_entities: entity, scenes: data.scenes[0] }, ...entityEvents];
			data.events = [{ ...ev, wiki_entities: entity, scenes: data.scenes[0] }, ...data.events];
			notifications.success('Track updated!');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to update track');
		}
	}

	// Handle event trigger from drawer
	async function handleTriggerEvent() {
		if (!entity) return;

		const payload: Record<string, unknown> = {};

		switch (newEventType) {
			case 'add_fact':
				payload.id = crypto.randomUUID();
				payload.content = newEventPayloadFactContent;
				break;
			case 'update_description':
				payload.description = newEventPayloadDesc;
				break;
			case 'set_clock':
				payload.segments = newEventPayloadClockSegments;
				payload.filled = newEventPayloadClockFilled;
				break;
			case 'increment_clock':
				payload.amount = 1;
				if (newEventPayloadReason.trim()) payload.reason = newEventPayloadReason.trim();
				break;
			case 'decrement_clock':
				payload.amount = 1;
				if (newEventPayloadReason.trim()) payload.reason = newEventPayloadReason.trim();
				break;
			case 'set_track':
				payload.max = newEventPayloadTrackMax;
				payload.current = newEventPayloadTrackCurrent;
				if (newEventPayloadReason.trim()) payload.reason = newEventPayloadReason.trim();
				break;
		}

		try {
			const ev = await createWikiEvent({
				entity_id: entity.id,
				scene_id: data.scenes[0]?.id || null,
				block_id: null,
				event_type: newEventType,
				payload
			});
			entityEvents = [{ ...ev, wiki_entities: entity, scenes: data.scenes[0] }, ...entityEvents];
			data.events = [{ ...ev, wiki_entities: entity, scenes: data.scenes[0] }, ...data.events];
			showTriggerDrawer = false;
			resetDrawerState();
			notifications.success('Event triggered!');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to trigger event');
		}
	}

	// Handle delete event
	async function handleDeleteEvent(event: WikiEvent) {
		const confirmed = await openConfirm(
			'Delete Event',
			'This action cannot be undone. Are you sure you want to delete this event?'
		);
		if (!confirmed) return;

		try {
			await deleteWikiEvent(event.id);
			entityEvents = entityEvents.filter((e) => e.id !== event.id);
			data.events = data.events.filter((e: WikiEvent) => e.id !== event.id);
			notifications.success('Event deleted');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to delete event');
		}
	}

	function formatEventType(type: string) {
		return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

{#if entity && entityState}
	{@const Icon = getIcon(entity.category)}
	<div data-component="overview-page" class="flex min-h-0 flex-1 overflow-hidden">
		<!-- Entity Detail Panel -->
		<div data-component="entity-detail" class="flex-1 overflow-y-auto p-8">
			<!-- Entity Header -->
			<div data-component="entity-header" class="mb-8 flex items-start gap-4">
				<div data-component="entity-icon" class="bg-primary/10 text-primary rounded-2xl p-4">
					<Icon size={24} />
				</div>
				<div>
					<h2 data-component="entity-name" class="text-xl font-bold tracking-tight text-white">
						{entityState.name}
					</h2>
					<span
						data-component="entity-category"
						class="text-primary text-[10px] font-black tracking-widest uppercase"
						>{entity.category}</span
					>
				</div>
			</div>

			<!-- Description -->
			{#if entityState.description}
				<div data-component="entity-description" class="mb-6">
					<h3
						data-component="section-label"
						class="mb-2 text-[10px] font-bold tracking-widest text-stone-500 uppercase"
					>
						Description
					</h3>
					<p data-component="desc-text" class="text-sm leading-relaxed text-stone-400">
						{entityState.description}
					</p>
				</div>
			{/if}

			<!-- Facts Section (for characters/locations/threads) -->
			{#if ['character', 'location', 'thread'].includes(entity.category?.toLowerCase())}
				<div data-component="facts-section" class="mb-6">
					<h3
						data-component="facts-label"
						class="mb-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase"
					>
						Active Facts
					</h3>
					<div data-component="facts-list" class="space-y-2">
						{#each entityState.facts as fact (fact.id)}
							<div
								data-component="fact-item"
								class="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10"
							>
								<div data-component="fact-bullet" class="bg-primary/30 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"></div>
								<p data-component="fact-content" class="flex-1 text-xs leading-relaxed text-stone-300">
									{fact.content}
								</p>
							</div>
						{/each}

						<!-- Inline Add Fact -->
						<form
							data-component="inline-fact-form"
							onsubmit={(e) => { e.preventDefault(); handleAddInlineFact(); }}
							class="flex gap-2"
						>
							<input
								data-component="inline-fact-input"
								type="text"
								bind:value={inlineFactText}
								placeholder="Add a new fact..."
								class="flex-1 rounded-xl border border-dashed border-white/10 bg-transparent px-4 py-2.5 text-xs text-white placeholder-stone-600 transition-colors focus:border-white/20 focus:outline-none"
							/>
							{#if inlineFactText.trim()}
								<button
									data-component="inline-fact-submit"
									type="submit"
									class="bg-primary/20 text-primary rounded-xl px-3 py-2 text-xs font-bold transition-opacity hover:opacity-80"
								>
									<Plus size={14} />
								</button>
							{/if}
						</form>
					</div>
				</div>
			{/if}

			<!-- Clock Visualization -->
			{#if entity.category?.toLowerCase() === 'clock'}
				{@const segments = (entityState.metadata?.segments as number) || 4}
				{@const filled = (entityState.metadata?.filled as number) || 0}
				<div data-component="clock-section" class="mb-6">
					<h3
						data-component="clock-label"
						class="mb-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase"
					>
						Clock Progress
					</h3>
					<div data-component="clock-controls" class="flex items-center gap-4">
						<button
							data-component="clock-dec"
							onclick={(e) => handleClockChange(-1, e)}
							title="Hold Shift to add a reason"
							class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-stone-400 transition-all hover:border-white/20 hover:text-white"
						>
							−
						</button>
						<div data-component="clock-segments" class="flex gap-1.5">
							{#each Array(segments) as _, i}
								<div
									data-component="clock-segment"
									class="h-6 w-6 rounded-full border-2 transition-all {i < filled
										? 'border-primary bg-primary/40'
										: 'border-white/10 bg-white/[0.02]'}"
								></div>
							{/each}
						</div>
						<button
							data-component="clock-inc"
							onclick={(e) => handleClockChange(1, e)}
							title="Hold Shift to add a reason"
							class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-stone-400 transition-all hover:border-white/20 hover:text-white"
						>
							+
						</button>
						<span data-component="clock-count" class="text-xs font-bold text-stone-500">{filled}/{segments}</span>
					</div>
				</div>
			{/if}

			<!-- Track Visualization -->
			{#if entity.category?.toLowerCase() === 'track'}
				{@const max = (entityState.metadata?.max as number) || 10}
				{@const current = (entityState.metadata?.current as number) || 0}
				<div data-component="track-section" class="mb-6">
					<h3
						data-component="track-label"
						class="mb-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase"
					>
						Track Progress
					</h3>
					<div data-component="track-controls" class="flex items-center gap-4">
						<button
							data-component="track-dec"
							onclick={(e) => handleTrackChange(-1, e)}
							title="Hold Shift to add a reason"
							class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-stone-400 transition-all hover:border-white/20 hover:text-white"
						>
							−
						</button>
						<div data-component="track-bar" class="flex-1">
							<div data-component="track-bar-bg" class="h-3 overflow-hidden rounded-full bg-white/5">
								<div
									data-component="track-bar-fill"
									class="bg-primary/60 h-full rounded-full transition-all duration-300"
									style="width: {(current / max) * 100}%"
								></div>
							</div>
						</div>
						<button
							data-component="track-inc"
							onclick={(e) => handleTrackChange(1, e)}
							title="Hold Shift to add a reason"
							class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-stone-400 transition-all hover:border-white/20 hover:text-white"
						>
							+
						</button>
						<span data-component="track-count" class="text-xs font-bold text-stone-500">{current}/{max}</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right Panel: Event Timeline -->
		<aside
			data-component="event-timeline"
			class="flex w-96 shrink-0 flex-col border-l border-white/5 bg-stone-900/20"
		>
			<!-- Timeline Header -->
			<div data-component="timeline-header" class="flex items-center justify-between border-b border-white/5 p-4">
				<div data-component="timeline-title-row" class="flex items-center gap-2">
					<button
						data-component="timeline-toggle"
						onclick={() => (timelineExpanded = !timelineExpanded)}
						class="text-stone-500"
					>
						{#if timelineExpanded}
							<ChevronDown size={14} />
						{:else}
							<ChevronRight size={14} />
						{/if}
					</button>
					<h3 data-component="timeline-title" class="text-[10px] font-bold tracking-widest text-stone-500 uppercase">
						Event Log ({entityEvents.length})
					</h3>
				</div>
				<div data-component="timeline-actions" class="flex items-center gap-2">
					<a
						data-component="view-anchors-link"
						href="/serials/{data.serial.id}/wiki/{entityId}/events"
						class="text-primary flex items-center gap-1 text-[10px] font-bold transition-opacity hover:opacity-80"
					>
						View Anchors
						<ArrowRight size={12} />
					</a>
				</div>
			</div>

			<!-- Timeline Content -->
			{#if timelineExpanded}
				<div data-component="timeline-scroller" class="flex-1 overflow-y-auto p-4" transition:slide>
					<!-- Trigger Event Button -->
					<button
						data-component="trigger-event-btn"
						onclick={() => { resetDrawerState(); showTriggerDrawer = true; }}
						class="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase transition-all hover:border-white/20 hover:text-white"
					>
						<Plus size={14} />
						Trigger Event
					</button>

					<!-- Events List -->
					<div data-component="events-list" class="space-y-2">
						{#each entityEvents as event (event.id)}
							<div
								data-component="event-card"
								class="group relative rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10"
							>
								<div data-component="event-type-row" class="flex items-center justify-between">
									<span
										data-component="event-type-badge"
										class="bg-primary/10 text-primary rounded-lg px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase"
									>
										{formatEventType(event.event_type)}
									</span>
									<button
										data-component="event-delete"
										onclick={() => handleDeleteEvent(event)}
										class="text-stone-700 opacity-0 transition-all hover:text-rose-400 group-hover:opacity-100"
									>
										<Trash2 size={12} />
									</button>
								</div>
								<div data-component="event-meta" class="mt-1.5 flex items-center gap-2 text-[9px] text-stone-600">
									{#if event.scenes}
										<span>{event.scenes.display_title || event.scenes.author_title}</span>
										<span>·</span>
									{/if}
									<span>
										{new Date(event.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
									</span>
								</div>
								{#if event.payload?.reason}
									<p data-component="event-reason" class="mt-1 text-[10px] italic text-stone-500">
										"{event.payload.reason}"
									</p>
								{/if}
								{#if event.event_type === 'add_fact' && event.payload?.content}
									<p data-component="event-fact-preview" class="mt-1 truncate text-[10px] text-stone-400">
										{event.payload.content}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</aside>

		<!-- Trigger Event Drawer -->
		{#if showTriggerDrawer}
			<div
				data-component="trigger-drawer-overlay"
				class="fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-sm"
				role="button"
				tabindex="-1"
				onclick={() => (showTriggerDrawer = false)}
				onkeydown={(e) => { if (e.key === 'Escape') showTriggerDrawer = false; }}
			></div>
			<div
				data-component="trigger-drawer"
				class="fixed top-0 right-0 z-50 flex h-full w-96 flex-col border-l border-white/10 bg-stone-900/95 shadow-2xl backdrop-blur-2xl"
				transition:slide={{ axis: 'x' }}
			>
				<div data-component="drawer-header" class="flex items-center justify-between border-b border-white/5 p-6">
					<h3 data-component="drawer-title" class="text-sm font-bold tracking-tight text-white uppercase">
						Trigger Event
					</h3>
					<button
						data-component="drawer-close"
						onclick={() => (showTriggerDrawer = false)}
						class="p-1 text-stone-400 hover:text-white"
					>
						✕
					</button>
				</div>

				<div data-component="drawer-body" class="flex-1 space-y-4 overflow-y-auto p-6">
					<div data-component="drawer-type-select" class="space-y-1">
						<label for="event_type" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
							Event Type
						</label>
						<select
							id="event_type"
							bind:value={newEventType}
							class="w-full rounded-xl border border-white/10 bg-stone-900 px-4 py-2.5 text-xs text-white focus:outline-none"
						>
							<option value="add_fact">Add Fact</option>
							<option value="remove_fact">Remove Fact</option>
							<option value="update_description">Update Description</option>
							{#if entity.category?.toLowerCase() === 'clock'}
								<option value="increment_clock">Increment Clock</option>
								<option value="decrement_clock">Decrement Clock</option>
								<option value="set_clock">Set Clock</option>
							{/if}
							{#if entity.category?.toLowerCase() === 'track'}
								<option value="set_track">Set Track</option>
							{/if}
						</select>
					</div>

					{#if newEventType === 'add_fact'}
						<div data-component="drawer-fact" class="space-y-1">
							<label for="fact_content" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
								Fact Content
							</label>
							<textarea
								id="fact_content"
								bind:value={newEventPayloadFactContent}
								rows="3"
								class="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none"
							></textarea>
						</div>
					{:else if newEventType === 'update_description'}
						<div data-component="drawer-desc" class="space-y-1">
							<label for="new_desc" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
								New Description
							</label>
							<textarea
								id="new_desc"
								bind:value={newEventPayloadDesc}
								rows="4"
								class="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none"
							></textarea>
						</div>
					{:else if newEventType === 'set_clock'}
						<div data-component="drawer-clock" class="space-y-3">
							<div class="space-y-1">
								<label for="clock_seg" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Segments</label>
								<input id="clock_seg" type="number" bind:value={newEventPayloadClockSegments} class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none" />
							</div>
							<div class="space-y-1">
								<label for="clock_fill" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Filled</label>
								<input id="clock_fill" type="number" bind:value={newEventPayloadClockFilled} class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none" />
							</div>
						</div>
					{:else if newEventType === 'set_track'}
						<div data-component="drawer-track" class="space-y-3">
							<div class="space-y-1">
								<label for="track_max" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Max</label>
								<input id="track_max" type="number" bind:value={newEventPayloadTrackMax} class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none" />
							</div>
							<div class="space-y-1">
								<label for="track_current" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Current</label>
								<input id="track_current" type="number" bind:value={newEventPayloadTrackCurrent} class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none" />
							</div>
						</div>
					{/if}

					<!-- Reason field for clock/track event types -->
					{#if ['increment_clock', 'decrement_clock', 'set_track'].includes(newEventType)}
						<div data-component="drawer-reason" class="space-y-1" transition:slide>
							<label for="event_reason" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
								Reason <span class="font-normal text-stone-600">(optional)</span>
							</label>
							<input
								id="event_reason"
								type="text"
								bind:value={newEventPayloadReason}
								placeholder="Why is this changing?"
								class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none"
							/>
						</div>
					{/if}
				</div>

				<div data-component="drawer-footer" class="border-t border-white/5 p-6">
					<button
						data-component="drawer-submit"
						onclick={handleTriggerEvent}
						class="bg-primary text-primary-foreground w-full rounded-xl py-2.5 text-xs font-bold transition-opacity hover:opacity-90"
					>
						Submit Event
					</button>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div data-component="entity-not-found" class="flex flex-1 items-center justify-center">
		<p class="text-sm text-stone-500">Entity not found</p>
	</div>
{/if}
