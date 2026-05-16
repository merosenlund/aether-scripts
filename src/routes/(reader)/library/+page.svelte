<script lang="ts">
  import { Search, Compass, BookOpen, Clock, Users, ArrowRight, Rocket } from '@lucide/svelte';
  let { data } = $props();

  let searchQuery = $state('');
  let activeFilter = $state('All');

  const filters = ['All', 'pilot', 'active', 'complete', 'hiatus'];

  const filteredSerials = $derived(
    data.serials.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'All' || s.status === activeFilter;
      return matchesSearch && matchesFilter;
    })
  );

  function timeAgo(date: string) {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }
</script>

<div class="p-8 max-w-7xl mx-auto space-y-12 pb-32">
  <!-- Hero Section -->
  <section class="relative rounded-[2rem] overflow-hidden min-h-[320px] flex items-center p-8 md:p-16 bg-zinc-900 border border-white/5 shadow-2xl">
    <div class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent z-10"></div>
    
    <!-- Decorative background elements -->
    <div class="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-br from-primary/20 via-indigo-500/10 to-transparent blur-3xl rounded-full translate-x-1/4 -translate-y-1/4"></div>
    
    <div class="relative z-20 max-w-2xl space-y-8">
      <div class="space-y-4">
        <h1 class="text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
          Explore the <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">multiverse</span> of stories.
        </h1>
        <p class="text-zinc-400 text-lg md:text-xl font-medium max-w-lg">
          Discover hand-crafted adventures, evolving lore, and stories that roll with the dice.
        </p>
      </div>

      <div class="relative max-w-md group">
        <div class="absolute -inset-1 bg-gradient-to-r from-primary/30 to-indigo-500/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
        <div class="relative flex items-center">
          <Search class="absolute left-4 w-5 h-5 text-zinc-500" />
          <input 
            type="text" 
            bind:value={searchQuery}
            placeholder="Search for serials..." 
            class="w-full bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Categories & Filters -->
  <div class="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
    <nav class="flex gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full">
      {#each filters as filter}
        <button 
          onclick={() => activeFilter = filter}
          class="px-6 py-2.5 rounded-xl border transition-all text-sm font-bold capitalize whitespace-nowrap flex items-center gap-2
            {activeFilter === filter 
              ? 'bg-white text-zinc-950 border-white' 
              : 'border-white/5 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'}"
        >
          {#if filter === 'pilot'}
            <Rocket class="w-3.5 h-3.5" />
          {/if}
          {filter}
        </button>
      {/each}
    </nav>
    <div class="text-zinc-500 text-sm font-medium">
      Showing {filteredSerials.length} results
    </div>
  </div>

  <!-- Library Grid -->
  {#if filteredSerials.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each filteredSerials as serial}
        <a href="/library/{serial.id}" class="group block space-y-4">
          <div class="relative aspect-[16/10] bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 shadow-lg group-hover:border-white/20 transition-all duration-300">
             <div class="absolute inset-0 bg-gradient-to-br {serial.color_theme} opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"></div>
             <div class="absolute inset-0 bg-black/20"></div>
             <div class="absolute top-4 right-4">
                {#if serial.status === 'pilot'}
                  <span class="px-2 py-1 bg-primary text-primary-foreground rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-primary/40 animate-pulse">
                    <Rocket class="w-3 h-3" />
                    Pilot Phase
                  </span>
                {:else}
                  <span class="px-2 py-1 bg-black/40 backdrop-blur-md rounded-md text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                    {serial.status}
                  </span>
                {/if}
             </div>
          </div>
          <div class="space-y-1">
            <h3 class="font-bold text-xl leading-tight group-hover:text-primary transition-colors">{serial.title}</h3>
            <div class="flex items-center gap-4 text-sm text-zinc-500">
              <span class="flex items-center gap-1">
                <BookOpen class="w-4 h-4" />
                {serial.scenesCount} scenes
              </span>
              <span class="flex items-center gap-1">
                <Users class="w-4 h-4" />
                {serial.readersCount}
              </span>
              {#if serial.updated_at}
                <span class="flex items-center gap-1">
                  <Clock class="w-4 h-4" />
                  {timeAgo(serial.updated_at)}
                </span>
              {/if}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <div class="bg-zinc-900/30 border border-dashed border-white/10 rounded-[2.5rem] p-24 text-center space-y-6">
      <div class="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700 border border-white/5">
        <Compass class="w-10 h-10" />
      </div>
      <div class="space-y-2">
        <h3 class="text-2xl font-bold text-zinc-300">No stories found</h3>
        <p class="text-zinc-500 max-w-sm mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
      </div>
      <button 
        onclick={() => { searchQuery = ''; activeFilter = 'All'; }}
        class="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
      >
        Clear all filters
      </button>
    </div>
  {/if}
</div>

<style>
  .scrollbar-none::-webkit-scrollbar { display: none; }
  .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
</style>
