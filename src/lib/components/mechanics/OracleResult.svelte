<script lang="ts">
	import { Sparkles, HelpCircle } from '@lucide/svelte';

	let {
		type = 'fate',
		question = '',
		result = ''
	} = $props<{
		type?: 'fate' | 'theme';
		question?: string;
		result?: string;
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
		{#if question}
			<div class="text-primary/70 mb-1 text-xs font-bold tracking-widest uppercase">
				{type === 'fate' ? 'Fate Question' : 'Theme Query'}
			</div>
			<div class="text-sm text-stone-400 italic">"{question}"</div>
		{:else}
			<div class="text-primary/70 mb-1 text-xs font-bold tracking-widest uppercase">
				Oracle ({type})
			</div>
		{/if}
		<div class="text-lg tracking-tight {resultColor}">
			{result}
		</div>
	</div>
</div>
