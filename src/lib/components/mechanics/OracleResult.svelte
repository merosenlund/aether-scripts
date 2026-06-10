<script lang="ts">
	import { Sparkles, HelpCircle } from '@lucide/svelte';

	let {
		type = 'fate',
		question = '',
		result = '',
		rolls = [],
		tableName = '',
		note = ''
	} = $props<{
		type?: 'fate' | 'action' | 'describe' | 'table' | 'theme';
		question?: string;
		result?: string;
		rolls?: number[];
		tableName?: string;
		note?: string;
	}>();

	// Color mapping based on result (Mythic style)
	const isExceptional = $derived(result.toLowerCase().includes('exceptional'));
	const isYes = $derived(result.toLowerCase().includes('yes'));
	const isNo = $derived(result.toLowerCase().includes('no'));

	const resultColor = $derived.by(() => {
		if (isExceptional && isYes) return 'text-emerald-400 font-bold';
		if (isExceptional && isNo) return 'text-rose-500 font-bold';
		if (isYes) return 'text-emerald-300';
		if (isNo) return 'text-rose-400';
		return 'text-stone-300';
	});
</script>

<div
	class="border-primary/20 bg-primary/5 group my-4 flex items-start gap-4 rounded-2xl border p-4 shadow-inner"
>
	<div class="bg-primary/20 text-primary rounded-xl p-2">
		{#if type === 'fate'}
			<HelpCircle size={20} />
		{:else}
			<Sparkles size={20} />
		{/if}
	</div>
	<div class="flex-1 space-y-1">
		{#if question || note}
			<div class="text-primary/70 mb-1 text-xs font-bold tracking-widest uppercase">
				{tableName || (type === 'fate' ? 'Fate Check' : type === 'action' ? 'Action Oracle' : type === 'describe' ? 'Descriptor Oracle' : 'Oracle')}
			</div>
			<div class="text-sm text-stone-400 italic">"{question || note}"</div>
		{:else}
			<div class="text-primary/70 mb-1 text-xs font-bold tracking-widest uppercase">
				{tableName || `Oracle (${type})`}
			</div>
		{/if}
		<div class="text-lg tracking-tight {resultColor} flex items-center gap-2">
			{#if rolls && rolls.length > 0}
				<span class="bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded text-sm font-mono leading-none border border-stone-700">({rolls.join(', ')})</span>
			{/if}
			<span>{result}</span>
		</div>
	</div>
</div>
