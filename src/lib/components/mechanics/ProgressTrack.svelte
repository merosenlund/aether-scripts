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
</script>

<div class="group flex w-full flex-col gap-1">
	<div class="flex h-4 w-full gap-1">
		{#each Array(finalMax) as _, i}
			<div
				class="flex-1 rounded-sm border border-stone-700 transition-colors duration-300 {i < finalCurrent
					? 'bg-primary border-primary'
					: 'bg-stone-900'}"
			></div>
		{/each}
	</div>
	{#if finalName}
		<span class="text-[10px] font-bold tracking-widest text-stone-500 uppercase">{finalName}</span>
	{/if}
</div>
