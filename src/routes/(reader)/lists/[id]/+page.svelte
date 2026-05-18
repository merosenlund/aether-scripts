<script lang="ts">
  import Reader from '$lib/components/Reader.svelte';
  import { Compass, BookOpen, ChevronRight, Layers, Eye, FileText, ArrowLeft, Globe, Lock, Play, Edit, RotateCcw, AlertTriangle } from '@lucide/svelte';
  import { fade, slide } from 'svelte/transition';

  let { data } = $props<{ data: any }>();

  // State
  let activeItemIndex = $state(0);
  let containerElement = $state<HTMLElement | null>(null);
  
  // Local bypass state to allow readers to force-reveal skipped or summarized prose
  let forcedProseList = $state<Record<string, boolean>>({});

  // Group items by their list_arc_id
  const itemsByArc = $derived.by(() => {
    const unassigned: any[] = [];
    const grouped: Record<string, any[]> = {};

    // Initialize groupings
    data.arcs.forEach((arc: any) => {
      grouped[arc.id] = [];
    });

    data.items.forEach((item: any) => {
      if (item.list_arc_id && grouped[item.list_arc_id]) {
        grouped[item.list_arc_id].push(item);
      } else {
        unassigned.push(item);
      }
    });

    return {
      unassigned,
      grouped
    };
  });

  // Flat helper list of active items for indexing and scrolling
  const flatActiveItems = $derived(
    data.items.filter((item: any) => item.scene !== null)
  );

  // Scroll to selected scene in the reading canvas
  function scrollToItem(itemId: string, index: number) {
    activeItemIndex = index;
    const element = document.getElementById(`curation-item-${itemId}`);
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

  // Scroll spy effect to keep the table of contents active item in sync
  $effect(() => {
    if (!containerElement) return;

    const sections = containerElement.querySelectorAll('.curation-section');
    const observerOptions = {
      root: containerElement,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const indexAttr = entry.target.getAttribute('data-index');
          if (indexAttr !== null) {
            activeItemIndex = parseInt(indexAttr, 10);
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
  
  <!-- Left Side Curation Table of Contents -->
  <aside class="w-80 border-r border-white/5 bg-zinc-900/20 backdrop-blur-2xl flex flex-col shrink-0">
    
    <div class="p-6 border-b border-white/5 bg-white/[0.01]">
      <a 
        href="/lists" 
        class="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 mb-4"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        Back to Playlists
      </a>
      
      <h2 class="text-xl font-bold font-serif text-white tracking-tight leading-tight line-clamp-2">
        {data.list.title}
      </h2>
      <div class="flex flex-wrap items-center gap-2 mt-3 select-none">
        <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
          {data.list.serial?.title}
        </span>
        {#if data.list.is_public}
          <span class="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Globe class="w-2.5 h-2.5" /> Public
          </span>
        {:else}
          <span class="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Lock class="w-2.5 h-2.5" /> Private
          </span>
        {/if}
      </div>
    </div>

    <!-- Active Curation TOC Items -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      
      <!-- Unassigned items -->
      {#if itemsByArc.unassigned.length > 0}
        <div class="space-y-2">
          <h3 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">
            Introductory Chapters
          </h3>
          
          {#each itemsByArc.unassigned as item, uIdx}
            {@const flatIndex = flatActiveItems.findIndex((f: any) => f.id === item.id)}
            <button
              onclick={() => scrollToItem(item.id, flatIndex)}
              class="w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group 
                {activeItemIndex === flatIndex 
                  ? 'bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.03)]' 
                  : 'bg-transparent border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white'}"
            >
              <div class="space-y-1 truncate pr-1">
                <span class="block text-xs font-serif font-bold group-hover:text-white transition-colors truncate">
                  {item.scene?.display_title || item.scene?.author_title || `Sequence ${item.order_index}`}
                </span>
                
                <div class="flex items-center gap-1.5">
                  <span class="block text-[8px] font-medium text-zinc-600">
                    Chapter {item.scene?.order_index}
                  </span>
                  <span class="text-[8px] px-1 bg-white/5 border border-white/10 rounded uppercase tracking-wider font-bold scale-[0.9] origin-left
                    {item.reading_mode === 'prose' ? 'text-primary' : ''}
                    {item.reading_mode === 'summary' ? 'text-indigo-400' : ''}
                    {item.reading_mode === 'description' ? 'text-amber-400' : ''}
                    {item.reading_mode === 'skip' ? 'text-rose-400' : ''}
                  ">
                    {item.reading_mode}
                  </span>
                </div>
              </div>
              <ChevronRight class="w-3.5 h-3.5 text-zinc-600 group-hover:text-primary transition-colors shrink-0" />
            </button>
          {/each}
        </div>
      {/if}

      <!-- Custom grouped Arcs -->
      {#each data.arcs as arc}
        {@const arcItems = itemsByArc.grouped[arc.id] || []}
        {#if arcItems.length > 0}
          <div class="space-y-2">
            <h3 class="text-[10px] font-bold text-primary uppercase tracking-widest px-2 mb-2 font-serif">
              {arc.title}
            </h3>

            {#each arcItems as item}
              {@const flatIndex = flatActiveItems.findIndex((f: any) => f.id === item.id)}
              <button
                onclick={() => scrollToItem(item.id, flatIndex)}
                class="w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group 
                  {activeItemIndex === flatIndex 
                    ? 'bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.03)]' 
                    : 'bg-transparent border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white'}"
              >
                <div class="space-y-1 truncate pr-1">
                  <span class="block text-xs font-serif font-bold group-hover:text-white transition-colors truncate">
                    {item.scene?.display_title || item.scene?.author_title || `Sequence ${item.order_index}`}
                  </span>
                  
                  <div class="flex items-center gap-1.5">
                    <span class="block text-[8px] font-medium text-zinc-600">
                      Chapter {item.scene?.order_index}
                    </span>
                    <span class="text-[8px] px-1 bg-white/5 border border-white/10 rounded uppercase tracking-wider font-bold scale-[0.9] origin-left
                      {item.reading_mode === 'prose' ? 'text-primary' : ''}
                      {item.reading_mode === 'summary' ? 'text-indigo-400' : ''}
                      {item.reading_mode === 'description' ? 'text-amber-400' : ''}
                      {item.reading_mode === 'skip' ? 'text-rose-400' : ''}
                    ">
                      {item.reading_mode}
                    </span>
                  </div>
                </div>
                <ChevronRight class="w-3.5 h-3.5 text-zinc-600 group-hover:text-primary transition-colors shrink-0" />
              </button>
            {/each}
          </div>
        {/if}
      {/each}
      
      {#if data.items.length === 0}
        <div class="p-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
          <p class="text-xs text-zinc-600 italic">This playlist contains no curation items.</p>
        </div>
      {/if}

    </div>

    <!-- Edit dashboard quick link if owns list -->
    {#if data.session && data.list.user_id === data.session.user.id}
      <div class="p-4 border-t border-white/5 bg-white/[0.01] shrink-0">
        <a 
          href="/lists/{data.list.id}/edit"
          class="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
        >
          <Edit class="w-4 h-4 text-zinc-400" />
          Edit Curation Layout
        </a>
      </div>
    {/if}

  </aside>

  <!-- Reading Canvas Area -->
  <div class="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden relative">
    
    <!-- Header -->
    <header class="h-16 shrink-0 border-b border-white/5 bg-zinc-900/10 backdrop-blur-xl px-8 flex items-center justify-between z-20">
      <div class="flex items-center gap-3">
        <Layers class="w-5 h-5 text-primary animate-pulse" />
        <span class="text-sm font-bold text-zinc-300 font-serif">
          {#if flatActiveItems[activeItemIndex]}
            Curation Chapter: {flatActiveItems[activeItemIndex].scene?.display_title || flatActiveItems[activeItemIndex].scene?.author_title}
          {:else}
            Story Overview
          {/if}
        </span>
      </div>

      <div class="text-[10px] text-zinc-500 font-bold">
        Curated Narrative Mode Active
      </div>
    </header>

    <!-- Reading Stream Content viewport -->
    <div 
      bind:this={containerElement}
      class="flex-1 overflow-y-auto p-8 md:p-12 relative scroll-smooth"
    >
      <div class="max-w-3xl mx-auto space-y-24 pb-48">
        
        {#if flatActiveItems.length === 0}
          <div class="text-center py-24 space-y-4">
            <BookOpen class="w-12 h-12 text-zinc-700 mx-auto" />
            <h3 class="text-lg font-bold text-zinc-300 font-serif">Empty Curation Playlist</h3>
            <p class="text-zinc-500 max-w-sm mx-auto text-sm">There are no published curated scenes added to this reading list yet.</p>
          </div>
        {:else}
          
          {#each flatActiveItems as item, index (item.id)}
            {@const scene = item.scene}
            {@const mode = forcedProseList[item.id] ? 'prose' : item.reading_mode}
            
            <section 
              id="curation-item-{item.id}"
              class="curation-section border-b border-white/5 pb-20 last:border-b-0 last:pb-0"
              data-index={index}
            >
              <!-- Arc Title Reveal Header if first item of that arc -->
              {#if item.list_arc_id}
                {@const matchedArc = data.arcs.find((a: any) => a.id === item.list_arc_id)}
                {@const isFirstOfArc = flatActiveItems.findIndex((f: any) => f.list_arc_id === item.list_arc_id) === index}
                
                {#if matchedArc && isFirstOfArc}
                  <div transition:slide class="mb-12 mt-4 bg-primary/5 border border-primary/10 rounded-[1.5rem] p-6 text-center select-none shadow-md">
                    <span class="text-[8px] font-bold text-primary tracking-widest uppercase block mb-1">Entering Narrative Arc</span>
                    <h3 class="text-lg md:text-xl font-bold font-serif text-white">{matchedArc.title}</h3>
                  </div>
                {/if}
              {/if}

              <!-- Scene Header Header -->
              <div class="mb-8 flex items-center gap-3 select-none">
                <span class="w-6 h-[1px] bg-zinc-800"></span>
                <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-mono truncate max-w-xs">
                  {scene?.display_title || scene?.author_title || `Scene ${index + 1}`}
                </h4>
                
                <!-- If the reading mode was altered (e.g. Summarized/Bypassed), show indicator -->
                {#if item.reading_mode !== 'prose'}
                  <span class="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[8px] font-bold uppercase tracking-wider">
                    {item.reading_mode} cut
                  </span>
                {/if}

                {#if forcedProseList[item.id]}
                  <span class="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[8px] font-bold uppercase tracking-wider">
                    Forced Prose Reveal
                  </span>
                {/if}

                <span class="flex-1 h-[1px] bg-zinc-800/40"></span>
                <span class="text-[9px] font-mono text-zinc-600 font-bold uppercase shrink-0">{formatDate(scene?.published_at)}</span>
              </div>

              <!-- Rendering modes selection rendering -->
              {#if mode === 'prose'}
                <article class="prose-wrapper">
                  <Reader 
                    content={scene?.content || ''} 
                    onVisibleBlocksChange={() => {}}
                  />
                </article>

                {#if item.reading_mode !== 'prose' && forcedProseList[item.id]}
                  <div class="mt-8 flex justify-end select-none">
                    <button 
                      onclick={() => forcedProseList[item.id] = false}
                      class="px-4 py-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 hover:text-white rounded-xl text-[10px] text-zinc-400 font-bold tracking-wide uppercase transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw class="w-3.5 h-3.5" />
                      Restore Curated Cut
                    </button>
                  </div>
                {/if}

              {:else}
                
                <!-- Alternate modes (Summary / Description / Skipped) -->
                <div class="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 relative overflow-hidden space-y-6">
                  
                  {#if mode === 'summary'}
                    <div class="space-y-4">
                      <div class="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                        <FileText class="w-4 h-4" />
                        Summarized Version
                      </div>
                      <p class="text-zinc-300 italic text-base font-serif leading-relaxed pl-4 border-l-2 border-indigo-500/30">
                        "{scene?.summary || 'No summary was provided by the author.'}"
                      </p>
                    </div>
                  {:else if mode === 'description'}
                    <div class="space-y-4">
                      <div class="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                        <Compass class="w-4 h-4" />
                        Narrative Log / Description
                      </div>
                      <p class="text-zinc-300 text-base leading-relaxed pl-4 border-l-2 border-amber-500/30">
                        {scene?.description || 'No description log was provided.'}
                      </p>
                    </div>
                  {:else if mode === 'skip'}
                    <div class="space-y-2 py-4">
                      <div class="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                        <AlertTriangle class="w-4 h-4" />
                        Chapter Bypassed
                      </div>
                      <p class="text-zinc-500 text-sm">
                        This chapter contains filler scenes, setup sideplots, or lore not critical to this custom reading arc curation.
                      </p>
                    </div>
                  {/if}

                  <!-- Reveal actions at bottom of summaries/skipped cards -->
                  <div class="pt-4 border-t border-white/5 flex justify-end">
                    <button 
                      onclick={() => forcedProseList[item.id] = true}
                      class="px-4 py-2 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 rounded-xl text-[10px] text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    >
                      <Play class="w-3 h-3 text-primary fill-primary" />
                      Read Original Full Prose anyway
                    </button>
                  </div>

                </div>

              {/if}

            </section>
          {/each}

        {/if}

      </div>
    </div>

  </div>

</div>
