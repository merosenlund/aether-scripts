<script lang="ts">
  import { BookOpen, ArrowRight, Clock, Users, PenTool } from '@lucide/svelte';
  let { data } = $props();

  function timeAgo(date: string) {
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

<div class="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
  <!-- Hero Section / Continue Reading -->
  <div class="relative px-8 pt-20 pb-32 overflow-hidden">
    <!-- Ambient Background -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full bg-gradient-to-b from-primary/10 to-transparent blur-[120px] -z-10"></div>
    
    <div class="max-w-6xl mx-auto space-y-12">
      {#if data.continueReading}
        <div class="space-y-6">
          <div class="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
            <Clock class="w-4 h-4" />
            Pick up where you left off
          </div>
          
          <div class="relative group max-w-4xl">
            <div class="absolute -inset-1 bg-gradient-to-r {data.continueReading.serial.color_theme} rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div class="relative bg-zinc-900/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
              <div class="flex-1 space-y-4">
                <h1 class="text-4xl md:text-5xl font-bold tracking-tight text-white">
                  {data.continueReading.serial.title}
                </h1>
                <p class="text-xl text-zinc-400">
                  {data.continueReading.scene?.display_title || data.continueReading.scene?.author_title || 'Start Reading'}
                </p>
                <div class="flex gap-4 pt-4">
                  <a 
                    href="/library/{data.continueReading.serial.id}" 
                    class="px-8 py-3 bg-white text-zinc-950 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all"
                  >
                    Continue Reading
                    <ArrowRight class="w-4 h-4" />
                  </a>
                  <a 
                    href="/library" 
                    class="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
                  >
                    Browse Library
                  </a>
                </div>
              </div>
              <div class="w-full md:w-64 aspect-[3/4] rounded-2xl bg-gradient-to-br {data.continueReading.serial.color_theme} shadow-2xl overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-black/20"></div>
                <div class="absolute inset-0 flex items-center justify-center p-6 text-center">
                   <span class="text-2xl font-bold text-white drop-shadow-lg">{data.continueReading.serial.title}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="space-y-8 max-w-3xl">
          <h1 class="text-6xl font-bold tracking-tighter text-white leading-[1.1]">
            Immerse yourself in <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Actual Play</span> fiction.
          </h1>
          <p class="text-xl text-zinc-400 font-medium leading-relaxed">
            Discover a digital-first ecosystem for interactive storytelling. Explore multiverses where lore evolves as you read and the mechanics behind the story are just a toggle away.
          </p>
          <div class="flex gap-4">
            <a 
              href="/library" 
              class="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
            >
              Start Reading
              <ArrowRight class="w-5 h-5" />
            </a>
            {#if data.userRole === 'author'}
              <a 
                href="/write" 
                class="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-md flex items-center gap-2"
              >
                <PenTool class="w-5 h-5" />
                Author Workspace
              </a>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Features Grid -->
  <div class="max-w-6xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
    <div class="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl space-y-3">
      <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
        <BookOpen class="w-6 h-6" />
      </div>
      <h3 class="font-bold text-lg">Progressive Wiki</h3>
      <p class="text-zinc-500 text-sm leading-relaxed">Lore that evolves as you read. Discover facts, characters, and locations only after they've been revealed in the story.</p>
    </div>
    <div class="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl space-y-3">
      <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
        <Users class="w-6 h-6" />
      </div>
      <h3 class="font-bold text-lg">Author's Cut</h3>
      <p class="text-zinc-500 text-sm leading-relaxed">Toggle the "Mechanical Mode" to see the dice rolls, stat blocks, and GM notes that shaped the narrative behind the scenes.</p>
    </div>
    <div class="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl space-y-3">
      <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
        <Clock class="w-6 h-6" />
      </div>
      <h3 class="font-bold text-lg">Live Updates</h3>
      <p class="text-zinc-500 text-sm leading-relaxed">Follow your favorite serials in real-time. Get notified as new scenes are published and watch the multiverse expand.</p>
    </div>
  </div>

  <!-- Recently Updated -->
  <div class="max-w-6xl mx-auto px-8 space-y-12 py-12 border-t border-white/5">
    <div class="flex items-end justify-between">
      <div class="space-y-1">
        <h2 class="text-3xl font-bold tracking-tight">Recently Updated</h2>
        <p class="text-zinc-500">The latest adventures from across the multiverse.</p>
      </div>
      {#if data.recentlyUpdated.length > 0}
        <a href="/library" class="text-primary font-semibold hover:underline flex items-center gap-1">
          View all <ArrowRight class="w-4 h-4" />
        </a>
      {/if}
    </div>

    {#if data.recentlyUpdated.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each data.recentlyUpdated as serial}
          <a href="/library/{serial.id}" class="group block">
            <div class="relative aspect-[16/9] rounded-2xl overflow-hidden mb-4 bg-zinc-900 border border-white/5">
              <div class="absolute inset-0 bg-gradient-to-br {serial.color_theme} opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"></div>
              <div class="absolute inset-0 bg-black/20"></div>
              <div class="absolute bottom-4 left-4">
                <span class="px-2 py-1 bg-black/40 backdrop-blur-md rounded-md text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                  {serial.status}
                </span>
              </div>
            </div>
            <h3 class="text-xl font-bold group-hover:text-primary transition-colors">{serial.title}</h3>
            <div class="flex items-center gap-4 mt-2 text-sm text-zinc-500">
              <span class="flex items-center gap-1">
                <BookOpen class="w-4 h-4" />
                {serial.scenesCount} scenes
              </span>
              {#if serial.updated_at}
                <span class="flex items-center gap-1">
                  <Clock class="w-4 h-4" />
                  {timeAgo(serial.updated_at)}
                </span>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    {:else}
      <div class="bg-zinc-900/30 border border-dashed border-white/10 rounded-3xl p-20 text-center space-y-4">
        <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-zinc-600">
          <BookOpen class="w-8 h-8" />
        </div>
        <div class="space-y-1">
          <h3 class="text-xl font-bold text-zinc-300">The multiverse is quiet... for now.</h3>
          <p class="text-zinc-500 max-w-sm mx-auto">New stories and scenes are being journaled as we speak. Check back soon for the latest updates.</p>
        </div>
        <a href="/library" class="inline-flex items-center gap-2 text-primary font-bold hover:underline">
          Explore the Archives
          <ArrowRight class="w-4 h-4" />
        </a>
      </div>
    {/if}
  </div>
</div>
