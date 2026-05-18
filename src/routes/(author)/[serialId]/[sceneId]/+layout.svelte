<script lang="ts">
  import { page } from '$app/state';
  import { PenTool, Dices, History, Share2, ChevronLeft } from '@lucide/svelte';
  import { fade } from 'svelte/transition';

  let { children, data } = $props<{ children: any, data: any }>();
  let activeTab = $derived(page.url.pathname.split('/').pop() || 'play');
  let serialId = $derived(page.params.serialId);
  let sceneId = $derived(page.params.sceneId);

  const tabs = [
    { id: 'play', name: 'Play', icon: Dices, path: 'play' },
    { id: 'edit', name: 'Edit', icon: PenTool, path: 'edit' },
    { id: 'history', name: 'History', icon: History, path: 'history' },
    { id: 'share', name: 'Share & Publish', icon: Share2, path: 'share' }
  ];
</script>

<div class="h-screen flex flex-col bg-stone-950 font-sans text-stone-100 overflow-hidden relative">
  <!-- Top Navigation Header -->
  <header class="h-16 shrink-0 border-b border-white/5 bg-stone-900/40 backdrop-blur-xl px-6 flex items-center justify-between z-30 shadow-md">
    <div class="flex items-center gap-4">
      <a 
        href="/serials/{serialId}" 
        class="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-stone-400 hover:text-white"
        title="Back to Serial"
      >
        <ChevronLeft class="w-4 h-4" />
      </a>
      <div class="h-4 w-px bg-white/10"></div>
      <div>
        <h2 class="text-xs font-bold text-stone-500 uppercase tracking-widest leading-none mb-1">
          {data.scene.serials?.title || 'Serial'}
        </h2>
        <h1 class="text-sm font-bold text-white/95 leading-none truncate max-w-xs sm:max-w-md">
          {data.scene.author_title || `Scene ${data.scene.order_index}`}
        </h1>
      </div>
    </div>

    <!-- Mode Selector Tabs -->
    <nav class="flex p-1 bg-black/40 border border-white/5 rounded-xl backdrop-blur-md">
      {#each tabs as tab}
        {@const Icon = tab.icon}
        <a
          href="/{serialId}/{sceneId}/{tab.path}"
          class="flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all gap-2 relative {activeTab === tab.id ? 'text-white' : 'text-stone-400 hover:text-white'}"
        >
          {#if activeTab === tab.id}
            <div 
              class="absolute inset-0 bg-primary/20 border border-primary/30 rounded-lg -z-10 shadow-[0_0_12px_rgba(var(--primary),0.15)]"
              transition:fade={{ duration: 150 }}
            ></div>
          {/if}
          <Icon class="w-3.5 h-3.5" />
          <span>{tab.name}</span>
        </a>
      {/each}
    </nav>

    <!-- Right Side Status Badge -->
    <div class="flex items-center gap-3">
      <span class="text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.05)]">
        {data.scene.status || 'Playing'}
      </span>
      {#if data.scene.semantic_version}
        <span class="text-[10px] font-mono font-bold text-stone-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
          v{data.scene.semantic_version}
        </span>
      {/if}
    </div>
  </header>

  <!-- Main Content Area -->
  <main class="flex-1 min-h-0 relative z-10">
    {@render children()}
  </main>

  <!-- Ambient Glow -->
  <div class="absolute top-0 left-1/4 -z-10 w-[600px] h-[600px] bg-primary/5 blur-[140px] rounded-full -translate-y-1/2"></div>
</div>
