<script lang="ts">
	import { contextEngine, reduceWikiEvents } from '$lib/stores/contextEngine.svelte';

	let {
		entityId = null,
		blockId = null,
		max = 10,
		current = 0,
		name = ''
	} = $props<{
		entityId?: string | null;
		blockId?: string | null;
		max?: number;
		current?: number;
		name?: string;
	}>();

	const activeBlockIdsSetForNode = $derived.by(() => {
		if (!blockId) return null;
		const index = contextEngine.orderedBlockIds.indexOf(blockId);
		if (index === -1) return null;

		const set = new Set<string>();
		for (let i = 0; i <= index; i++) {
			set.add(contextEngine.orderedBlockIds[i]);
		}
		return set;
	});

	const derivedState = $derived.by(() => {
		if (!entityId) return null;

		let eventIndex = -1;
		if (blockId) {
			eventIndex = contextEngine.rawEvents.findIndex(
				(e) => e.entity_id === entityId && e.block_id === blockId
			);
		}

		let filteredEvents;
		if (eventIndex !== -1) {
			filteredEvents = contextEngine.rawEvents.slice(0, eventIndex + 1);
		} else {
			const filterSet = activeBlockIdsSetForNode;
			filteredEvents = contextEngine.rawEvents.filter((event) => {
				if (!filterSet) return true;
				if (!event.block_id) {
					return event.event_type === 'create' || event.event_type === 'set_track';
				}
				return filterSet.has(event.block_id);
			});
		}

		const reducedMap = reduceWikiEvents(
			filteredEvents,
			null,
			contextEngine.baseEntities
		);
		return reducedMap.get(entityId) || null;
	});

	const finalMax = $derived(
		derivedState?.metadata?.max !== undefined
			? (derivedState.metadata.max as number)
			: max
	);

	const finalCurrent = $derived(
		derivedState?.metadata?.current !== undefined
			? (derivedState.metadata.current as number)
			: current
	);

	const finalName = $derived(derivedState?.name || name);

	// Find the specific event anchored to this block to get its reason/description
	const blockEvent = $derived(
		blockId
			? contextEngine.rawEvents.find((e) => e.block_id === blockId)
			: null
	);

	const textElement = $derived(
		blockEvent?.payload?.reason ||
		blockEvent?.payload?.description ||
		blockEvent?.payload?.content
	);
</script>

<div
	data-component="track-block-wrapper"
	class="group flex w-full items-center gap-4"
>
	<div
		data-component="track-inner-column"
		class="flex-1 flex flex-col gap-1"
	>
		<div
			data-component="track-segments-row"
			class="flex h-4 w-full gap-1"
		>
			{#each Array(finalMax) as _, i}
				<div
					data-component="track-segment"
					class="flex-1 rounded-sm border border-stone-700 transition-colors duration-300 {i < finalCurrent
						? 'bg-primary border-primary'
						: 'bg-stone-900'}"
				></div>
			{/each}
		</div>
		{#if finalName}
			<span
				data-component="track-name"
				class="text-[10px] font-bold tracking-widest text-stone-500 uppercase"
			>
				{finalName}
			</span>
		{/if}
	</div>

	{#if textElement}
		<div
			data-component="track-reason-container"
			class="flex flex-col justify-center border-l border-white/10 pl-4 max-w-[200px] shrink-0"
		>
			<span
				data-component="track-reason-label"
				class="text-[9px] font-bold tracking-widest text-stone-500 uppercase"
			>
				{blockEvent?.payload?.reason ? 'Reason' : 'Details'}
			</span>
			<p
				data-component="track-reason-text"
				class="mt-1 text-xs italic text-stone-400 leading-normal"
			>
				"{textElement}"
			</p>
		</div>
	{/if}
</div>
