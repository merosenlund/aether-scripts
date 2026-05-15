<script lang="ts">
  import { Search, Compass, Heart, BookMarked } from '@lucide/svelte';

  const trending = [
    { id: '1', title: 'The Obsidian Citadel', author: 'Mitch', readers: '14.2k', rating: 4.8, tags: ['Dark Fantasy', 'TTRPG'] },
    { id: '3', title: 'Whispers of the Void', author: 'Sarah', readers: '3.2k', rating: 4.9, tags: ['Cosmic Horror', 'Solo'] },
    { id: '4', title: 'Steel & Soul', author: 'Alex', readers: '8.5k', rating: 4.7, tags: ['Mecha', 'Sci-Fi'] },
  ];
</script>

<div class="p-8 max-w-7xl mx-auto space-y-12">
  <!-- Hero Section -->
  <section class="relative rounded-3xl overflow-hidden h-80 flex items-center p-12 bg-stone-900 border border-white/10 shadow-2xl">
    <div class="absolute inset-0 bg-gradient-to-r from-stone-950 to-transparent z-10"></div>
    <div class="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-br from-primary/20 to-indigo-500/20 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4"></div>
    
    <div class="relative z-20 max-w-xl space-y-6">
      <h1 class="text-5xl font-bold tracking-tight text-white leading-tight">Explore the multiverse of stories.</h1>
      <div class="relative max-w-md">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
        <input 
          type="text" 
          placeholder="Search for adventures, authors, or tags..." 
          class="w-full bg-stone-800/50 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>
    </div>
  </section>

  <!-- Categories -->
  <nav class="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
    {#each ['All', 'Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance', 'Actual Play'] as category}
      <button class="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium whitespace-nowrap">
        {category}
      </button>
    {/each}
  </nav>

  <!-- Trending Section -->
  <section class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold flex items-center">
        <Compass class="w-6 h-6 mr-3 text-primary" />
        Trending Now
      </h2>
      <button class="text-sm text-primary hover:underline font-medium">View All</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each trending as story}
        <div class="group relative space-y-4">
          <div class="aspect-[16/10] bg-stone-900 rounded-2xl overflow-hidden border border-white/5 shadow-lg group-hover:border-white/20 transition-all">
             <div class="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
               <BookMarked class="w-12 h-12 text-stone-700 group-hover:text-primary transition-colors" />
             </div>
          </div>
          <div class="space-y-1">
            <h3 class="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{story.title}</h3>
            <p class="text-sm text-stone-500">by {story.author}</p>
          </div>
          <div class="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-stone-500">
            <div class="flex gap-2">
              {#each story.tags as tag}
                <span class="px-2 py-1 rounded bg-stone-900 border border-white/5">{tag}</span>
              {/each}
            </div>
            <div class="flex items-center text-primary">
              <Heart class="w-3 h-3 mr-1 fill-primary" />
              {story.rating}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .scrollbar-none::-webkit-scrollbar { display: none; }
  .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
</style>
