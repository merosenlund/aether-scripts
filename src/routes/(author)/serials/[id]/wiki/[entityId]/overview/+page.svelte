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
		Pencil,
		ArrowRight,
		ChevronDown,
		ChevronRight,
		ExternalLink
	} from '@lucide/svelte';
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { notifications } from '$lib/stores/notifications';
	import { openConfirm, openPrompt } from '$lib/stores/prompt.svelte';
	import {
		createWikiEvent,
		deleteWikiEvent,
		updateWikiEntity,
		updateWikiEventPayload,
		deleteWikiEntity,
		type WikiEntity,
		type WikiEvent
	} from '$lib/api/wiki';
	import { reduceEntityEvents } from '$lib/stores/contextEngine.svelte';
	import type { WikiLayoutContext } from '../../+layout.svelte';
	import EventEditorModal from '$lib/components/wiki/EventEditorModal.svelte';

	let { data } = $props<{ data: any }>();

	// Read from layout context so we always see the optimistically-updated state
	// (layout server load doesn't re-run on same-serial navigation).
	const wiki = getContext<WikiLayoutContext>('wiki');

	const entityId = $derived($page.params.entityId);
	const entity = $derived(wiki.entities.find((e) => e.id === entityId) as WikiEntity | undefined);

	// Derived from context so it stays current after any mutation
	const entityEvents = $derived(wiki.events.filter((ev) => ev.entity_id === entityId));

	// Trigger Event Drawer State
	let showTriggerDrawer = $state(false);
	let newEventType = $state<WikiEvent['event_type']>('add_fact');
	let newEventPayloadFactContent = $state('');
	let newEventPayloadDesc = $state('');
	let newEventPayloadName = $state('');
	let newEventPayloadClockSegments = $state(4);
	let newEventPayloadClockFilled = $state(0);
	let newEventPayloadTrackMax = $state(10);
	let newEventPayloadTrackCurrent = $state(0);
	let newEventPayloadReason = $state('');

	// Inline fact input
	let inlineFactText = $state('');

	// Timeline expansion
	let timelineExpanded = $state(true);

	// Bulk Event Editing
	let isBulkEditing = $state(false);
	let selectedEventIds = $state<string[]>([]);

	// Event Editing Modal
	let editingEvent = $state<WikiEvent | null>(null);
	let showEventModal = $state(false);

	// Inline name editing
	let isEditingName = $state(false);
	let editNameValue = $state('');

	// Inline category editing
	let isEditingCategory = $state(false);
	let editCategoryValue = $state<WikiEntity['category']>('character');

	// Inline fact editing (one at a time, keyed by fact id)
	let editingFactId = $state<string | null>(null);
	let editingFactValue = $state('');

	// Reset drawer state to prevent leaks between entity types
	function resetDrawerState() {
		newEventType = 'add_fact';
		newEventPayloadFactContent = '';
		newEventPayloadDesc = '';
		newEventPayloadName = '';
		newEventPayloadClockSegments = 4;
		newEventPayloadClockFilled = 0;
		newEventPayloadTrackMax = 10;
		newEventPayloadTrackCurrent = 0;
		newEventPayloadReason = '';
	}

	// Derive entity state by reducing events in chronological order via the shared pure reducer
	const entityState = $derived(
		entity
			? reduceEntityEvents(
					[...entityEvents].sort(
						(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
					),
					entity
				)
			: null
	);

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

	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	async function handleSaveName() {
		const newName = editNameValue.trim();
		isEditingName = false;
		if (!entity || !newName || newName === entityState?.name) return;

		try {
			await updateWikiEntity(entity.id, { name: newName });
			wiki.updateEntity(entity.id, { name: newName });
			const createEvent = entityEvents.find((ev) => ev.event_type === 'create');
			if (createEvent) {
				const newPayload = { ...createEvent.payload, name: newName };
				await updateWikiEventPayload(createEvent.id, newPayload);
				wiki.updateEvent(createEvent.id, newPayload);
			}
			notifications.success('Name updated');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to update name');
		}
	}

	async function handleSaveCategory() {
		isEditingCategory = false;
		if (!entity || editCategoryValue === entity.category) return;

		try {
			await updateWikiEntity(entity.id, { category: editCategoryValue });
			wiki.updateEntity(entity.id, { category: editCategoryValue });
			const createEvent = entityEvents.find((ev) => ev.event_type === 'create');
			if (createEvent) {
				const newPayload = { ...createEvent.payload, category: editCategoryValue };
				await updateWikiEventPayload(createEvent.id, newPayload);
				wiki.updateEvent(createEvent.id, newPayload);
			}
			notifications.success('Category updated');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to update category');
		}
	}

	async function handleSaveFact(factId: string) {
		editingFactId = null;
		const newContent = editingFactValue.trim();
		const addFactEvent = entityEvents.find(
			(ev) => ev.event_type === 'add_fact' && ev.payload?.id === factId
		);
		if (!addFactEvent || !newContent || newContent === addFactEvent.payload?.content) return;

		try {
			const newPayload = { ...addFactEvent.payload, content: newContent };
			await updateWikiEventPayload(addFactEvent.id, newPayload);
			wiki.updateEvent(addFactEvent.id, newPayload);
			notifications.success('Fact updated');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to update fact');
		}
	}

	async function handleEventModalSubmit(result: { mode: 'correct' | 'evolve'; payload: any }) {
		if (!editingEvent || !entity) return;
		
		try {
			if (result.mode === 'correct') {
				await updateWikiEventPayload(editingEvent.id, result.payload);
				wiki.updateEvent(editingEvent.id, result.payload);
				notifications.success('Event updated');
			} else if (result.mode === 'evolve') {
				// Evolve creates new events. In the World Manager, they are unanchored.
				const blockId = null; 
				const sceneId = null; // Unanchored events don't strictly need a scene, or we can use the latest? Let's use null.
				
				if (editingEvent.event_type === 'add_fact') {
					// Deactivate old
					const remEv = await createWikiEvent({
						entity_id: entity.id,
						scene_id: sceneId,
						block_id: blockId,
						event_type: 'remove_fact',
						payload: { id: editingEvent.payload?.id }
					});
					wiki.addEvent({ ...remEv, wiki_entities: entity });
					
					// Activate new
					const addEv = await createWikiEvent({
						entity_id: entity.id,
						scene_id: sceneId,
						block_id: blockId,
						event_type: 'add_fact',
						payload: { id: crypto.randomUUID(), content: result.payload.content }
					});
					wiki.addEvent({ ...addEv, wiki_entities: entity });
				} else if (editingEvent.event_type === 'update_name' || editingEvent.event_type === 'create') {
					const ev = await createWikiEvent({
						entity_id: entity.id,
						scene_id: sceneId,
						block_id: blockId,
						event_type: 'update_name',
						payload: { name: result.payload.name }
					});
					wiki.addEvent({ ...ev, wiki_entities: entity });
				} else if (editingEvent.event_type === 'update_description') {
					const ev = await createWikiEvent({
						entity_id: entity.id,
						scene_id: sceneId,
						block_id: blockId,
						event_type: 'update_description',
						payload: { description: result.payload.description }
					});
					wiki.addEvent({ ...ev, wiki_entities: entity });
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

	async function handleBulkDeleteEvents() {
		if (selectedEventIds.length === 0) return;
		const confirmed = await openConfirm(
			'Delete Events',
			`Are you sure you want to delete ${selectedEventIds.length} event(s)? This cannot be undone.`
		);
		if (!confirmed) return;

		try {
			await Promise.all(selectedEventIds.map(id => deleteWikiEvent(id)));
			selectedEventIds.forEach(id => wiki.removeEvent(id));
			selectedEventIds = [];
			isBulkEditing = false;
			notifications.success('Events deleted');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to delete some events');
		}
	}

	async function handleDeleteEntity() {
		if (!entity || !entityState) return;
		const anchoredCount = entityEvents.filter((ev) => ev.block_id).length;
		const confirmed = await openConfirm(
			`Delete "${entityState.name}"?`,
			`This will permanently remove ${entityEvents.length} event${entityEvents.length !== 1 ? 's' : ''} and clear ${anchoredCount} prose anchor${anchoredCount !== 1 ? 's' : ''}. This cannot be undone.`
		);
		if (!confirmed) return;

		try {
			await deleteWikiEntity(entity.id);
			wiki.removeEntity(entity.id);
			notifications.success('Entity deleted');
			goto(`/serials/${data.serial.id}/wiki`);
		} catch (e) {
			console.error(e);
			notifications.error('Failed to delete entity');
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
			wiki.addEvent({ ...ev, wiki_entities: entity, scenes: data.scenes[0] });
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
			wiki.addEvent({ ...ev, wiki_entities: entity, scenes: data.scenes[0] });
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
			wiki.addEvent({ ...ev, wiki_entities: entity, scenes: data.scenes[0] });
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
			case 'update_name':
				payload.name = newEventPayloadName;
				break;
			case 'deactivate_entity':
				// No payload needed
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
			wiki.addEvent({ ...ev, wiki_entities: entity, scenes: data.scenes[0] });
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
			wiki.removeEvent(event.id);
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
				<div data-component="entity-titles" class="flex-1 min-w-0">
					{#if isEditingName}
						<input
							data-component="entity-name-input"
							type="text"
							bind:value={editNameValue}
							use:focusOnMount
							onblur={handleSaveName}
							onkeydown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') isEditingName = false; }}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xl font-bold tracking-tight text-white focus:outline-none"
						/>
					{:else}
						<button
							data-component="entity-name"
							class="group/name flex items-center gap-2 text-xl font-bold tracking-tight text-white"
							onclick={() => { editNameValue = entityState.name; isEditingName = true; }}
						>
							{entityState.name}
							<Pencil data-component="name-edit-hint" size={12} class="text-stone-600 opacity-0 transition-opacity group-hover/name:opacity-100" />
						</button>
					{/if}

					{#if isEditingCategory}
						<select
							data-component="entity-category-select"
							bind:value={editCategoryValue}
							use:focusOnMount
							onchange={handleSaveCategory}
							onblur={() => (isEditingCategory = false)}
							class="mt-0.5 rounded-lg border border-white/20 bg-stone-900 px-2 py-0.5 text-[10px] font-black tracking-widest uppercase focus:outline-none"
						>
							<option value="character">Character</option>
							<option value="location">Location</option>
							<option value="clock">Clock</option>
							<option value="track">Track</option>
							<option value="thread">Thread</option>
						</select>
					{:else}
						<button
							data-component="entity-category"
							class="group/cat text-primary flex items-center gap-1 text-[10px] font-black tracking-widest uppercase"
							onclick={() => { editCategoryValue = entity.category; isEditingCategory = true; }}
						>
							{entity.category}
							<Pencil data-component="cat-edit-hint" size={9} class="text-stone-600 opacity-0 transition-opacity group-hover/cat:opacity-100" />
						</button>
					{/if}
				</div>

				<button
					data-component="entity-delete-btn"
					onclick={handleDeleteEntity}
					title="Delete entity"
					class="mt-1 p-2 text-stone-700 transition-colors hover:text-rose-400"
				>
					<Trash2 size={15} />
				</button>
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
							{@const isEditingThisFact = editingFactId === fact.id}
							<div
								data-component="fact-item"
								class="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10"
							>
								<div data-component="fact-bullet" class="bg-primary/30 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"></div>
								{#if isEditingThisFact}
									<input
										data-component="fact-edit-input"
										type="text"
										bind:value={editingFactValue}
										use:focusOnMount
										onblur={() => handleSaveFact(fact.id)}
										onkeydown={(e) => { if (e.key === 'Enter') handleSaveFact(fact.id); if (e.key === 'Escape') editingFactId = null; }}
										class="flex-1 rounded-lg border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white focus:outline-none"
									/>
								{:else}
									<button
										data-component="fact-content"
										class="group/fact flex-1 text-left text-xs leading-relaxed text-stone-300"
										onclick={() => { editingFactId = fact.id; editingFactValue = fact.content; }}
									>
										{fact.content}
										<Pencil data-component="fact-edit-hint" size={9} class="ml-1 inline-block text-stone-600 opacity-0 transition-opacity group-hover/fact:opacity-100" />
									</button>
								{/if}
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
					<button
						onclick={() => {
							isBulkEditing = !isBulkEditing;
							if (!isBulkEditing) selectedEventIds = [];
						}}
						class="text-primary flex items-center gap-1 text-[10px] font-bold transition-opacity hover:opacity-80 {isBulkEditing ? 'text-rose-400' : ''}"
					>
						{isBulkEditing ? 'Cancel Bulk' : 'Bulk Edit'}
					</button>
					<a
						data-component="view-anchors-link"
						href="/serials/{data.serial.id}/wiki/{entityId}/events"
						class="text-primary ml-2 flex items-center gap-1 text-[10px] font-bold transition-opacity hover:opacity-80"
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
					<div class="flex gap-2 mb-4">
						<button
							data-component="trigger-event-btn"
							onclick={() => { resetDrawerState(); showTriggerDrawer = true; }}
							class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase transition-all hover:border-white/20 hover:text-white"
						>
							<Plus size={14} />
							Trigger Event
						</button>
						{#if isBulkEditing && selectedEventIds.length > 0}
							<button
								onclick={handleBulkDeleteEvents}
								class="flex items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 px-4 py-3 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-rose-500/30 hover:text-rose-300"
							>
								<Trash2 size={14} class="mr-1" />
								Delete ({selectedEventIds.length})
							</button>
						{/if}
					</div>

					<!-- Events List -->
					<div data-component="events-list" class="space-y-2">
						{#each entityEvents as event (event.id)}
							<div
								data-component="event-card"
								class="group relative flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10"
							>
								{#if isBulkEditing}
									<input
										type="checkbox"
										class="mt-1"
										checked={selectedEventIds.includes(event.id)}
										onchange={(e) => {
											if (e.currentTarget.checked) {
												selectedEventIds = [...selectedEventIds, event.id];
											} else {
												selectedEventIds = selectedEventIds.filter(id => id !== event.id);
											}
										}}
									/>
								{/if}
								<div class="flex-1 min-w-0">
									<div data-component="event-type-row" class="flex items-center justify-between">
										<span
											data-component="event-type-badge"
											class="bg-primary/10 text-primary rounded-lg px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase"
										>
											{formatEventType(event.event_type)}
										</span>
										{#if !isBulkEditing}
											<div class="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
												<button
													data-component="event-edit"
													onclick={() => { editingEvent = event; showEventModal = true; }}
													class="text-stone-700 hover:text-white"
												>
													<Pencil size={12} />
												</button>
												<button
													data-component="event-delete"
													onclick={() => handleDeleteEvent(event)}
													class="text-stone-700 hover:text-rose-400"
												>
													<Trash2 size={12} />
												</button>
											</div>
										{/if}
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

									{#if ['add_fact', 'update_description', 'update_name'].includes(event.event_type)}
										{@const field = event.event_type === 'add_fact' ? 'content' : event.event_type === 'update_description' ? 'description' : 'name'}
										{#if event.payload?.[field]}
											<p class="mt-1 text-left text-[10px] text-stone-400 w-full">
												{event.payload[field]}
											</p>
										{/if}
									{/if}
								</div>
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
							<option value="update_name">Update Name</option>
							<option value="update_description">Update Description</option>
							<option value="deactivate_entity">Deactivate Entity</option>
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
					{:else if newEventType === 'update_name'}
						<div data-component="drawer-name" class="space-y-1">
							<label for="new_name" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
								New Name
							</label>
							<input
								id="new_name"
								type="text"
								bind:value={newEventPayloadName}
								class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none"
							/>
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

	<EventEditorModal
		event={editingEvent}
		isOpen={showEventModal}
		onClose={() => { showEventModal = false; editingEvent = null; }}
		onSubmit={handleEventModalSubmit}
	/>
{:else}
	<div data-component="entity-not-found" class="flex flex-1 items-center justify-center">
		<p class="text-sm text-stone-500">Entity not found</p>
	</div>
{/if}
