<script lang="ts">
  import type { PageData } from './$types';
  import Tiptap from '$lib/editor/Tiptap.svelte';
  import { gameSession } from '$lib/stores/gameSession.svelte';

  let { data } = $props<{ data: PageData }>();
  
  let content = $state(data.scene.content);
</script>

<svelte:head>
  <title>{data.scene.author_title} - Aether Scripts</title>
</svelte:head>

<div class="h-[calc(100vh)] flex overflow-hidden bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
  <!-- Main Editor Area -->
  <main class="flex-1 overflow-y-auto p-8 flex justify-center">
    <div class="w-full max-w-4xl space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-serif font-bold">{data.scene.author_title}</h1>
        <button class="px-4 py-2 bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-md shadow text-sm font-medium transition-colors">
          Save Scene
        </button>
      </div>

      <Tiptap 
        bind:content 
        onUpdate={(html) => content = html}
      />
    </div>
  </main>

  <!-- Sidebar: Assistive Tools -->
  <aside class="w-80 border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-y-auto flex flex-col shadow-sm z-10">
    <div class="p-4 border-b border-stone-200 dark:border-stone-800">
      <h2 class="font-semibold text-lg">Game Session</h2>
    </div>
    
    <div class="flex-1 p-4 space-y-8">
      <!-- Quick Roll -->
      <div class="space-y-3">
        <h3 class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Quick Actions</h3>
        <div class="grid grid-cols-2 gap-2">
          <button class="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-md text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-sm font-medium" onclick={() => gameSession.addRoll('1d20', Math.floor(Math.random() * 20) + 1)}>
            Roll 1d20
          </button>
          <button class="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-md text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-sm font-medium" onclick={() => gameSession.addRoll('1d6', Math.floor(Math.random() * 6) + 1)}>
            Roll 1d6
          </button>
        </div>
      </div>

      <!-- Roll History Example -->
      <div class="space-y-3">
        <h3 class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Recent Rolls</h3>
        {#if gameSession.rolls.length === 0}
          <p class="text-sm text-stone-400 dark:text-stone-500 italic p-4 text-center border border-dashed rounded-md dark:border-stone-800">No rolls yet.</p>
        {:else}
          <ul class="space-y-2 text-sm">
            {#each gameSession.rolls as roll (roll.id)}
              <li class="flex justify-between items-center p-3 rounded-md border border-stone-100 bg-stone-50 dark:bg-stone-950 dark:border-stone-800 shadow-sm">
                <span class="text-stone-500 dark:text-stone-400 font-mono text-xs">{roll.formula}</span>
                <span class="font-bold text-lg">{roll.result}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </aside>
</div>
