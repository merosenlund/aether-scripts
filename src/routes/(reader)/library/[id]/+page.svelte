<script lang="ts">
  import Reader from '$lib/components/Reader.svelte';
  import { BookOpen, Compass, ChevronRight, Activity, Calendar, Award, AlertCircle } from '@lucide/svelte';
  import { fade, slide } from 'svelte/transition';

  let { data } = $props<{ data: any }>();

  // State
  let activeSceneIndex = $state(0);
  let showMechanics = $state(false);

  let activeScene = $derived(data.scenes[activeSceneIndex] || null);

  // Formatting date
  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Recently';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
</script>

<div class="h-screen flex bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
  
  <!-- Table of Contents Sidebar -->
  <aside class="w-80 border-r border-white/5 bg-zinc-900/20 backdrop-blur-2xl flex flex-col shrink-0">
    <div class="p-6 border-b border-white/5 bg-white/[0.01]">
      <a 
        href="/library" 
        class="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 mb-4"
      >
        <Compass class="w-3.5 h-3.5" />
        Back to Library
      </a>
      
      <h2 class="text-xl font-bold font-serif text-white tracking-tight leading-tight">
        {data.serial.title}
      </h2>
      <span class="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
        {data.serial.status || 'Active'}
      </span>
    </div>

    <!-- Scenes List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      <h3 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-3">
        Table of Contents
      </h3>
      
      {#if data.scenes.length === 0}
        <div class="p-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
          <p class="text-xs text-zinc-600 italic">No scenes are available yet.</p>
        </div>
      {:else}
        {#each data.scenes as scene, index (scene.id)}
          <button
            onclick={() => activeSceneIndex = index}
            class="w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 group 
              {activeSceneIndex === index 
                ? 'bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.03)]' 
                : 'bg-transparent border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white'}"
          >
            <div class="space-y-1">
              <span class="block text-xs font-serif font-bold group-hover:text-white transition-colors">
                {scene.display_title || scene.author_title || `Scene ${index + 1}`}
              </span>
              <span class="block text-[9px] font-medium text-zinc-600">
                {formatDate(scene.published_at)}
              </span>
            </div>
            <ChevronRight class="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors" />
          </button>
        {/each}
      {/if}
    </div>
  </aside>

  <!-- Main Scene Reading Canvas -->
  <div class="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden relative">
    
    <!-- Top Bar Controls -->
    <header class="h-16 shrink-0 border-b border-white/5 bg-zinc-900/10 backdrop-blur-xl px-8 flex items-center justify-between z-20">
      <div class="flex items-center gap-3">
        <BookOpen class="w-5 h-5 text-primary" />
        <span class="text-sm font-bold text-zinc-300">
          {#if activeScene}
            {activeScene.display_title || activeScene.author_title || `Scene ${activeSceneIndex + 1}`}
          {:else}
            Story Overview
          {/if}
        </span>
      </div>

      <!-- Mechanics Mode Toggle -->
      <button
        onclick={() => showMechanics = !showMechanics}
        class="flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all
          {showMechanics 
            ? 'bg-primary/20 border-primary text-primary shadow-[0_0_12px_rgba(var(--primary),0.1)]' 
            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}"
      >
        <Activity class="w-3.5 h-3.5" />
        Mechanical Cut
      </button>
    </header>

    <!-- Content Scroller -->
    <div class="flex-1 overflow-y-auto p-8 md:p-12 relative scroll-smooth {showMechanics ? 'mechanics-active' : ''}">
      <div class="max-w-3xl mx-auto space-y-16 pb-48">
        
        {#if activeScene}
          <!-- Scene Text -->
          <article class="prose-wrapper">
            <Reader 
              content={activeScene.content || ''} 
              onVisibleBlocksChange={() => {}}
            />
          </article>

          <!-- If last scene, show future teasers -->
          {#if activeSceneIndex === data.scenes.length - 1}
            <div 
              transition:fade 
              class="border border-white/5 bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 backdrop-blur-md rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden"
            >
              <!-- Ambient Glow inside teaser -->
              <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 -z-10"></div>
              
              <div class="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                <Award class="w-4 h-4" />
                Serial Progress Teaser
              </div>

              <div class="space-y-4">
                <div class="flex justify-between items-center text-xs font-medium">
                  <span class="text-zinc-400">Next Scene Completion</span>
                  <span class="text-primary font-bold font-mono">{data.serial.next_scene_completion_percentage || 0}%</span>
                </div>
                <div class="w-full bg-white/5 border border-white/10 rounded-full h-2 overflow-hidden shadow-inner">
                  <div 
                    class="bg-primary h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
                    style="width: {data.serial.next_scene_completion_percentage || 0}%"
                  ></div>
                </div>
                
                <div class="flex gap-3 items-start bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                  <AlertCircle class="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                  <p class="text-xs text-zinc-400 leading-relaxed italic">
                    "{data.serial.next_scene_update_note || 'No teaser updates set.'}"
                  </p>
                </div>
              </div>
            </div>
          {/if}
        {:else}
          <!-- Empty State -->
          <div class="text-center py-24 space-y-4">
            <BookOpen class="w-12 h-12 text-zinc-700 mx-auto" />
            <h3 class="text-lg font-bold text-zinc-300">Select a Scene to Begin</h3>
            <p class="text-zinc-500 max-w-sm mx-auto text-sm">Pick any of the published chapters from the table of contents sidebar to start reading.</p>
          </div>
        {/if}

      </div>
    </div>

  </div>

</div>

<style>
  /* Mechanical cut CSS overrides */
  :global(.mechanics-active .reader-view [data-visibility="journal"]) {
    display: block !important;
  }
</style>
