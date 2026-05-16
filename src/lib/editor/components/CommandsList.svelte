<script lang="ts">
  import { onMount } from 'svelte';
  import { Dices, PenTool, Layout, FileText, Sparkles } from '@lucide/svelte';

  let { items = [], command } = $props<{
    items: any[];
    command: (item: any) => void;
  }>();

  let selectedIndex = $state(0);

  // Reset selection when items change
  $effect(() => {
    if (items) {
      selectedIndex = 0;
    }
  });

  export function onKeyDown({ event }: { event: KeyboardEvent }) {
    if (event.key === 'ArrowUp') {
      selectedIndex = (selectedIndex + items.length - 1) % items.length;
      return true;
    }

    if (event.key === 'ArrowDown') {
      selectedIndex = (selectedIndex + 1) % items.length;
      return true;
    }

    if (event.key === 'Enter') {
      selectItem(selectedIndex);
      return true;
    }

    return false;
  }

  function selectItem(index: number) {
    const item = items[index];
    if (item) {
      command(item);
    }
  }
</script>

<div class="bg-stone-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[240px] p-1.5 backdrop-blur-xl">
  {#if items && items.length}
    <div class="flex flex-col gap-0.5">
      {#each items as item, index}
        <button
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all {index === selectedIndex ? 'bg-primary/20 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'text-stone-400 hover:bg-white/5 hover:text-white'}"
          onmouseenter={() => selectedIndex = index}
          onclick={() => selectItem(index)}
        >
          <div class="w-8 h-8 rounded-lg flex items-center justify-center {index === selectedIndex ? 'bg-primary/20' : 'bg-white/5'}">
            {#if item.icon === 'dice'}
              <Dices class="w-4 h-4" />
            {:else}
              <PenTool class="w-4 h-4" />
            {/if}
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-bold uppercase tracking-wider">{item.title}</span>
            {#if item.description}
              <span class="text-[10px] text-stone-500 font-medium">{item.description}</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="px-3 py-2 text-xs text-stone-500 italic">No commands found</div>
  {/if}
</div>
