<script lang="ts">
  import type { PageData } from './$types';
  import Reader from '$lib/components/Reader.svelte';
  import Tiptap from '$lib/editor/Tiptap.svelte';
  import WikiSidebar from '$lib/components/WikiSidebar.svelte';
  import MechanicsTab from '$lib/components/mechanics/MechanicsTab.svelte';
  import { PenTool, Share2, Eye, Save, Dices, History, Trash2, Clock, BookOpen, Activity } from '@lucide/svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { gameSession } from '$lib/stores/gameSession.svelte';

  let { data } = $props<{ data: PageData }>();
  let content = $state(data.scene.content);
  let activeBlockId = $state('');
  let visibleBlockIds = $state<string[]>([]);
  let activeTab = $state('wiki');
  let isPreview = $state(false);
</script>

<svelte:head>
  <title>{data.scene.author_title} - Editor | Aether Scripts</title>
</svelte:head>

<div class="absolute inset-0 flex overflow-hidden bg-stone-950 font-sans text-stone-100">
  <!-- Main Editor Area -->
  <div class="flex-1 overflow-y-auto overflow-x-hidden px-8 py-12 flex justify-center scroll-smooth relative">
    <div class="w-full max-w-4xl space-y-12">
      <!-- Editor Header -->
      <header class="flex justify-between items-end border-b border-white/5 pb-8">
        <div class="space-y-2">
          <div class="flex items-center text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
            <span class="w-2 h-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(var(--primary),0.5)] animate-pulse"></span>
            {isPreview ? 'Reader Mode' : 'Session Active'}
          </div>
          <h1 class="text-4xl font-serif font-bold tracking-tight text-white/90 leading-tight">
            {data.scene.author_title}
          </h1>
        </div>
        
        <div class="flex gap-3 pb-1">
          <button 
            onclick={() => isPreview = !isPreview}
            class="p-2.5 border transition-all shadow-sm rounded-xl {isPreview ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-stone-400 hover:text-white hover:border-white/20'}" 
            title={isPreview ? "Back to Editor" : "Reader Preview"}
          >
            <Eye class="w-5 h-5" />
          </button>
          {#if !isPreview}
            <button class="flex items-center px-6 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-lg shadow-primary/20 transition-all text-sm font-bold">
              <Save class="w-4 h-4 mr-2" />
              Save Draft
            </button>
          {/if}
        </div>
      </header>

      <!-- Editor Canvas -->
      <div class="relative group">
        {#if isPreview}
          <div in:fade>
            <Reader 
              {content} 
              onVisibleBlocksChange={(ids) => visibleBlockIds = ids} 
            />
          </div>
        {:else}
          <Tiptap 
            bind:content 
            bind:activeBlockId
            sceneId={data.scene.id}
            onUpdate={(html) => content = html}
          />
        {/if}
      </div>
      
      <!-- Bottom Padding -->
      <div class="h-32"></div>
    </div>

    <!-- Ambient Background Glows -->
    <div class="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
  </div>

  <!-- Sidebar: Assistive Tools -->
  <aside class="w-80 border-l border-white/5 bg-stone-950/40 backdrop-blur-3xl overflow-y-auto flex flex-col z-20 shadow-2xl">
    <div class="p-4 border-b border-white/5 bg-white/5 flex gap-2">
      <button 
        onclick={() => activeTab = 'log'}
        class="flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all {activeTab === 'log' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-stone-500 hover:text-white hover:bg-white/5'}"
      >
        <Dices class="w-3.5 h-3.5 mr-2" />
        Log
      </button>
      <button 
        onclick={() => activeTab = 'wiki'}
        class="flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all {activeTab === 'wiki' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-stone-500 hover:text-white hover:bg-white/5'}"
      >
        <BookOpen class="w-3.5 h-3.5 mr-2" />
        Wiki
      </button>
      <button 
        onclick={() => activeTab = 'mechanics'}
        class="flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all {activeTab === 'mechanics' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-stone-500 hover:text-white hover:bg-white/5'}"
      >
        <Activity class="w-3.5 h-3.5 mr-2" />
        Mech
      </button>
    </div>
    
    <div class="flex-1 overflow-hidden">
      {#if activeTab === 'log'}
        <div class="p-6 space-y-4 h-full overflow-y-auto" in:fade>
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
      {:else if activeTab === 'mechanics'}
        <div class="h-full" in:fade>
          <MechanicsTab 
            serialId={data.scene.serial_id} 
            sceneId={data.scene.id} 
          />
        </div>
      {:else}
        <div class="h-full" in:fade>
          <WikiSidebar 
            serialId={data.scene.serial_id} 
            sceneId={data.scene.id} 
            {activeBlockId} 
            {visibleBlockIds}
          />
        </div>
      {/if}
    </div>
  </aside>
</div>
