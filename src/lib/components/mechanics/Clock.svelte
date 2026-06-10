<script lang="ts">
	import { contextEngine, reduceWikiEvents } from '$lib/stores/contextEngine.svelte';

	let {
		entityId = null,
		blockId = null,
		segments = 4,
		filled = 0,
		name = '',
		action = 'create'
	} = $props<{
		entityId?: string | null;
		blockId?: string | null;
		segments?: number;
		filled?: number;
		name?: string;
		action?: 'create' | 'increment' | 'decrement';
	}>();

	const derivedState = $derived.by(() => {
		if (!entityId) return null;

		let slicedEvents = contextEngine.rawEvents;
		if (blockId) {
			const index = contextEngine.rawEvents.findIndex((e) => e.block_id === blockId);
			if (index !== -1) {
				slicedEvents = contextEngine.rawEvents.slice(0, index + 1);
			} else {
				// Fallback: if event not in database yet, filter using block sequence in document
				const blockIndex = contextEngine.orderedBlockIds.indexOf(blockId);
				if (blockIndex !== -1) {
					const visibleBlocks = new Set(contextEngine.orderedBlockIds.slice(0, blockIndex + 1));
					slicedEvents = contextEngine.rawEvents.filter(
						(e) => !e.block_id || visibleBlocks.has(e.block_id)
					);
				}
			}
		}

		const reducedMap = reduceWikiEvents(
			slicedEvents,
			null, // No additional block-visibility filtering needed
			null,
			contextEngine.baseEntities
		);
		return reducedMap.get(entityId) || null;
	});

	const finalSegments = $derived(
		derivedState?.metadata?.segments !== undefined
			? (derivedState.metadata.segments as number)
			: segments
	);

	const finalFilled = $derived(
		derivedState?.metadata?.filled !== undefined
			? (derivedState.metadata.filled as number)
			: filled
	);

	const finalName = $derived(derivedState?.name || name);

	// Validate segments (must be an even number between 4 and 12 for standard clocks)
	const validSegments = $derived([4, 6, 8, 10, 12].includes(finalSegments) ? finalSegments : 4);

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

	// Calculate SVG paths for segments
	function getSegmentPath(index: number, total: number) {
		const center = 50;
		const radius = 45; // Leave some margin
		const startAngle = (index * 360) / total - 90;
		const endAngle = ((index + 1) * 360) / total - 90;

		const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
		const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
		const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
		const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);

		const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

		return `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
	}
</script>

<div
	data-component="clock-block-wrapper"
	class="group relative flex items-center gap-4 p-1"
>
	<div
		data-component="clock-inner-column"
		class="relative flex flex-col items-center gap-2"
	>
		{#if action === 'increment'}
			<div
				data-component="action-badge-increment"
				class="absolute top-0 right-0 z-10 animate-pulse rounded-full border border-emerald-400 bg-emerald-500 px-1.5 py-0.5 font-sans text-[9px] font-black text-stone-950 shadow-lg select-none"
			>
				+1
			</div>
		{:else if action === 'decrement'}
			<div
				data-component="action-badge-decrement"
				class="absolute top-0 right-0 z-10 animate-pulse rounded-full border border-rose-400 bg-rose-500 px-1.5 py-0.5 font-sans text-[9px] font-black text-stone-950 shadow-lg select-none"
			>
				-1
			</div>
		{/if}

		<svg
			viewBox="0 0 100 100"
			class="h-16 w-16 transform transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]"
		>
			<circle cx="50" cy="50" r="45" class="fill-stone-950 stroke-stone-800 stroke-[1.5]" />

			{#each Array(validSegments) as _, i}
				<path
					d={getSegmentPath(i, validSegments)}
					class="stroke-stone-950 stroke-[1.5] transition-all duration-500 {i < finalFilled
						? 'fill-primary drop-shadow-[0_0_4px_var(--color-primary)]'
						: 'fill-stone-900/60'}"
				/>
			{/each}
		</svg>
		{#if finalName}
			<div
				data-component="clock-labels"
				class="flex flex-col items-center"
			>
				<span
					data-component="clock-name"
					class="text-center text-xs leading-tight font-bold text-stone-300 transition-colors group-hover:text-white"
				>
					{finalName}
				</span>
				<span
					data-component="clock-action"
					class="mt-1 text-[9px] font-bold tracking-widest text-stone-500 uppercase"
				>
					{#if action === 'create'}
						Start ({finalFilled}/{validSegments})
					{:else if action === 'increment'}
						Incremented ({finalFilled}/{validSegments})
					{:else if action === 'decrement'}
						Decremented ({finalFilled}/{validSegments})
					{:else}
						{action} ({finalFilled}/{validSegments})
					{/if}
				</span>
			</div>
		{/if}
	</div>

	{#if textElement}
		<div
			data-component="clock-reason-container"
			class="flex flex-col justify-center border-l border-white/10 pl-4 max-w-[200px] shrink-0"
		>
			<span
				data-component="clock-reason-label"
				class="text-[9px] font-bold tracking-widest text-stone-500 uppercase"
			>
				{blockEvent?.payload?.reason ? 'Reason' : 'Details'}
			</span>
			<p
				data-component="clock-reason-text"
				class="mt-1 text-xs italic text-stone-400 leading-normal"
			>
				"{textElement}"
			</p>
		</div>
	{/if}
</div>
