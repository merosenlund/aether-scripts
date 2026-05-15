<script lang="ts">
  import type { PageData } from './$types';
  import Tiptap from '$lib/editor/Tiptap.svelte';
  import { gameSession } from '$lib/stores/gameSession.svelte';
  import { PenTool, Share2, Eye, Save, Dices, History, Trash2, Clock } from '@lucide/svelte';
  import { fade, fly, slide } from 'svelte/transition';

  let { data } = $props<{ data: PageData }>();
  let content = $state(data.scene.content);
</script>

<svelte:head>
  <title>{data.scene.author_title} - Editor | Aether Scripts</title>
</svelte:head>

<div class="h-screen flex overflow-hidden bg-stone-950 font-sans text-stone-100">
  <!-- Main Editor Area -->
  <main class="flex-1 overflow-y-auto px-8 py-12 flex justify-center scroll-smooth relative">
    <div class="w-full max-w-4xl space-y-12">
      <!-- Editor Header -->
      <header class="flex justify-between items-end border-b border-white/5 pb-8">
        <div class="space-y-2">
          <div class="flex items-center text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
            <span class="w-2 h-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(var(--primary),0.5)] animate-pulse"></span>
            Session Active
          </div>
          <h1 class="text-4xl font-serif font-bold tracking-tight text-white/90 leading-tight">
            {data.scene.author_title}
          </h1>
        </div>
        
        <div class="flex gap-3 pb-1">
          <button class="p-2.5 bg-white/5 border border-white/10 text-stone-400 hover:text-white hover:border-white/20 rounded-xl transition-all shadow-sm" title="Preview">
            <Eye class="w-5 h-5" />
          </button>
          <button class="flex items-center px-6 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-lg shadow-primary/20 transition-all text-sm font-bold">
            <Save class="w-4 h-4 mr-2" />
            Save Draft
          </button>
        </div>
      </header>

      <!-- Editor Canvas -->
      <div class="relative group">
        <Tiptap 
          bind:content 
          onUpdate={(html) => content = html}
        />
      </div>
      
      <!-- Bottom Padding -->
      <div class="h-32"></div>
    </div>

    <!-- Ambient Background Glows -->
    <div class="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
  </main>

  <!-- Sidebar: Assistive Tools -->
  <aside class="w-80 border-l border-white/5 bg-stone-950/40 backdrop-blur-3xl overflow-y-auto flex flex-col z-20 shadow-2xl">
    <div class="p-6 border-b border-white/5 bg-white/5">
      <h2 class="font-bold text-lg flex items-center tracking-tight">
        <Dices class="w-5 h-5 mr-3 text-primary" />
        Game State
      </h2>
    </div>
    
    <div class="flex-1 p-6 space-y-12">
      <!-- Quick Roll -->
      <div class="space-y-4">
        <h3 class="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] flex items-center">
          Roll Fate
          <div class="ml-2 h-px flex-1 bg-white/5"></div>
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <button 
            class="relative overflow-hidden px-4 py-4 bg-stone-900/50 border border-white/5 rounded-2xl text-xs hover:border-primary/50 hover:bg-primary/5 transition-all group font-bold text-left shadow-sm" 
            onclick={() => gameSession.addRoll('1d20', Math.floor(Math.random() * 20) + 1)}
          >
            <span class="block text-stone-500 group-hover:text-primary transition-colors mb-1">D20</span>
            Check Action
            <div class="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
              <Dices class="w-8 h-8" />
            </div>
          </button>
          <button 
            class="relative overflow-hidden px-4 py-4 bg-stone-900/50 border border-white/5 rounded-2xl text-xs hover:border-primary/50 hover:bg-primary/5 transition-all group font-bold text-left shadow-sm" 
            onclick={() => gameSession.addRoll('1d6', Math.floor(Math.random() * 6) + 1)}
          >
            <span class="block text-stone-500 group-hover:text-primary transition-colors mb-1">D6</span>
            Roll Damage
            <div class="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
              <Dices class="w-8 h-8" />
            </div>
          </button>
        </div>
      </div>

      <!-- Roll History -->
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] flex items-center">
            Recent Log
            <div class="ml-2 w-12 h-px bg-white/5"></div>
          </h3>
          {#if gameSession.rolls.length > 0}
            <button 
              class="text-[10px] text-stone-600 hover:text-rose-400 font-bold flex items-center transition-colors" 
              onclick={() => gameSession.clearRolls()}
            >
              <Trash2 class="w-3 h-3 mr-1" />
              CLEAR
            </button>
          {/if}
        </div>
        
        <div class="space-y-3">
          {#if gameSession.rolls.length === 0}
            <div class="p-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]" transition:fade>
              <p class="text-[10px] text-stone-600 font-bold uppercase tracking-widest mb-2">Empty Log</p>
              <p class="text-xs text-stone-700 italic">No rolls recorded in this session.</p>
            </div>
          {:else}
            {#each gameSession.rolls as roll (roll.id)}
              <div 
                transition:fly={{ y: 10, duration: 300 }}
                class="flex justify-between items-center p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group shadow-sm"
              >
                <div class="space-y-1">
                  <span class="block text-[10px] text-primary font-bold tracking-widest uppercase">{roll.formula}</span>
                  <div class="flex items-center text-[10px] text-stone-500 font-medium">
                    <Clock class="w-2.5 h-2.5 mr-1" />
                    {new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div class="relative">
                  <div class="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span class="relative font-bold text-2xl text-white group-hover:text-primary transition-colors">{roll.result}</span>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  </aside>
</div>
