<script lang="ts">
  import { Sparkles, HelpCircle } from '@lucide/svelte';

  let { type = 'fate', question = '', result = '' } = $props<{
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

<div class="flex items-start gap-4 p-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-inner my-4 group">
  <div class="p-2 rounded-xl bg-primary/20 text-primary">
    {#if type === 'fate'}
      <HelpCircle size={20} />
    {:else}
      <Sparkles size={20} />
    {/if}
  </div>
  <div class="flex-1 space-y-1">
    {#if question}
      <div class="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">
        {type === 'fate' ? 'Fate Question' : 'Theme Query'}
      </div>
      <div class="text-sm italic text-stone-400">"{question}"</div>
    {:else}
      <div class="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">
        Oracle ({type})
      </div>
    {/if}
    <div class="text-lg tracking-tight {resultColor}">
      {result}
    </div>
  </div>
</div>
