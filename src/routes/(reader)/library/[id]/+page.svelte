<script lang="ts">
  import Reader from '$lib/components/Reader.svelte';
  import { authorPresence } from '$lib/stores/authorPresence.svelte';
  import { BookOpen, Compass, ChevronRight, Activity, Calendar, Award, AlertCircle } from '@lucide/svelte';
  import { fade, slide } from 'svelte/transition';

  let { data } = $props<{ data: any }>();

  // State
  let activeSceneIndex = $state(0);
  let showMechanics = $state(false);
  let containerElement = $state<HTMLElement | null>(null);

  // Smoothly scroll the content viewport to the targeted scene
  function scrollToScene(sceneId: string, index: number) {
    activeSceneIndex = index;
    const element = document.getElementById(`scene-${sceneId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Formatting date
  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Recently';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Subscribe to author presence
  $effect(() => {
    if (data.serial?.author_id) {
      authorPresence.subscribeToAuthor(data.serial.author_id);
    }
    return () => {
      authorPresence.cleanup();
    };
  });

  // Svelte 5 effect to spy on the user's scroll position and auto-highlight Table of Contents
  $effect(() => {
    if (!containerElement) return;

    const sections = containerElement.querySelectorAll('.scene-section');
    const observerOptions = {
      root: containerElement,
      rootMargin: '-20% 0px -60% 0px', // Focus the active threshold triggers in the upper center of viewport
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const indexAttr = entry.target.getAttribute('data-index');
          if (indexAttr !== null) {
            activeSceneIndex = parseInt(indexAttr, 10);
          }
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  });
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
            onclick={() => scrollToScene(scene.id, index)}
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
          {#if data.scenes[activeSceneIndex]}
            {data.scenes[activeSceneIndex].display_title || data.scenes[activeSceneIndex].author_title || `Scene ${activeSceneIndex + 1}`}
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
    <div 
      bind:this={containerElement}
      class="flex-1 overflow-y-auto p-8 md:p-12 relative scroll-smooth {showMechanics ? 'mechanics-active' : ''}"
    >
      <div class="max-w-3xl mx-auto space-y-24 pb-48">
        
        {#if data.scenes.length === 0}
          <!-- Empty State -->
          <div class="text-center py-24 space-y-4">
            <BookOpen class="w-12 h-12 text-zinc-700 mx-auto" />
            <h3 class="text-lg font-bold text-zinc-300">No Published Chapters</h3>
            <p class="text-zinc-500 max-w-sm mx-auto text-sm">There are no published scenes available to read for this serial yet.</p>
          </div>
        {:else}
          <!-- Continuous Scroll Stream of Scenes -->
          {#each data.scenes as scene, index (scene.id)}
            <section 
              id="scene-{scene.id}" 
              class="scene-section border-b border-white/5 pb-20 last:border-b-0 last:pb-0" 
              data-index={index}
            >
              <!-- Scene Header Header -->
              <div class="mb-10 flex items-center gap-3 select-none">
                <span class="w-6 h-[1px] bg-zinc-800"></span>
                <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-mono">
                  {scene.display_title || scene.author_title || `Scene ${index + 1}`}
                </h4>
                <span class="flex-1 h-[1px] bg-zinc-800/40"></span>
                <span class="text-[9px] font-mono text-zinc-600 font-bold uppercase">{formatDate(scene.published_at)}</span>
              </div>

              <!-- Scene Text Canvas -->
              <article class="prose-wrapper">
                <Reader 
                  content={scene.content || ''} 
                  onVisibleBlocksChange={() => {}}
                />
              </article>
            </section>
          {/each}

          <!-- Ambient Bottom Progress Teaser (End of Scroll Reward) -->
          {#if data.serial.next_scene_completion_percentage > 0 || data.serial.next_scene_update_note}
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
                
                {#if data.serial.next_scene_update_note}
                  <div class="flex gap-3 items-start bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                    <AlertCircle class="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <p class="text-xs text-zinc-400 leading-relaxed italic">
                      "{data.serial.next_scene_update_note}"
                    </p>
                  </div>
                {/if}

                <!-- Live Presence Sync indicator -->
                {#if authorPresence.authorStatus.isOnline}
                  <div class="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/10 shadow-sm animate-fade-in" transition:slide>
                    <div class="flex items-center gap-3">
                      <div class="relative flex h-2.5 w-2.5">
                        {#if authorPresence.authorStatus.isTyping}
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500 animate-pulse"></span>
                        {:else}
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        {/if}
                      </div>
                      
                      <div class="space-y-0.5">
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Author Activity</span>
                        {#if authorPresence.authorStatus.isTyping}
                          <span class="block text-xs text-purple-400 font-bold">Typing live...</span>
                        {:else}
                          <span class="block text-xs text-emerald-400 font-semibold">Active online</span>
                        {/if}
                      </div>
                    </div>

                    {#if authorPresence.authorStatus.currentSerialTitle}
                      <div class="text-right hidden sm:block">
                        <span class="block text-[9px] font-bold uppercase tracking-wider text-zinc-600 font-mono">Working On</span>
                        <span class="block text-xs text-zinc-300 font-serif italic max-w-[200px] truncate">
                          "{authorPresence.authorStatus.currentSerialTitle}"
                        </span>
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
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
