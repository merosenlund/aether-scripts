<script lang="ts">
	let {
		max = 10,
		current = 0,
		name = ''
	} = $props<{
		max?: number;
		current?: number;
		name?: string;
	}>();
</script>

<div class="group flex w-full flex-col gap-1">
	<div class="flex h-4 w-full gap-1">
		{#each Array(max) as _, i}
			<div
				class="flex-1 rounded-sm border border-stone-700 transition-colors duration-300 {i < current
					? 'bg-primary border-primary'
					: 'bg-stone-900'}"
			></div>
		{/each}
	</div>
	{#if name}
		<span class="text-[10px] font-bold tracking-widest text-stone-500 uppercase">{name}</span>
	{/if}
</div>
