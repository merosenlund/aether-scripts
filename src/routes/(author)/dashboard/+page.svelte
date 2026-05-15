<script lang="ts">
  import { Plus, Book, Users, Star, Clock } from '@lucide/svelte';

  const serials = [
    { 
      id: '1', 
      title: 'The Obsidian Citadel', 
      scenes: 24, 
      readers: 1420, 
      status: 'Active',
      gradient: 'from-violet-600 to-indigo-600',
      lastEdit: '2 hours ago'
    },
    { 
      id: '2', 
      title: 'Neon Drifters', 
      scenes: 12, 
      readers: 850, 
      status: 'Draft',
      gradient: 'from-emerald-600 to-teal-600',
      lastEdit: '1 day ago'
    },
    { 
      id: '3', 
      title: 'Whispers of the Void', 
      scenes: 45, 
      readers: 3200, 
      status: 'Active',
      gradient: 'from-rose-600 to-orange-600',
      lastEdit: '5 mins ago'
    },
  ];
</script>

<div class="p-8 max-w-7xl mx-auto space-y-10">
  <!-- Header -->
  <header class="flex justify-between items-end">
    <div class="space-y-1">
      <h1 class="text-4xl font-bold tracking-tight">Your Serials</h1>
      <p class="text-stone-400">Manage your stories, worlds, and reader community.</p>
    </div>
    <button class="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
      <Plus class="w-5 h-5 mr-2" />
      New Serial
    </button>
  </header>

  <!-- Serials Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each serials as serial}
      <a 
        href="/serials/{serial.id}"
        class="group relative flex flex-col bg-stone-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
      >
        <!-- Card Header / Cover Art Placeholder -->
        <div class="h-32 bg-gradient-to-br {serial.gradient} relative overflow-hidden">
          <div class="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
          <div class="absolute top-4 right-4">
            <span class="px-2 py-1 rounded-md bg-black/40 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
              {serial.status}
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="p-5 flex-1 flex flex-col">
          <h2 class="text-xl font-bold mb-4 group-hover:text-primary transition-colors">{serial.title}</h2>
          
          <div class="grid grid-cols-2 gap-4 mt-auto">
            <div class="flex items-center text-stone-400 text-sm">
              <Book class="w-4 h-4 mr-2 text-stone-500" />
              {serial.scenes} Scenes
            </div>
            <div class="flex items-center text-stone-400 text-sm">
              <Users class="w-4 h-4 mr-2 text-stone-500" />
              {serial.readers} Readers
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-white/5 bg-stone-950/30 flex justify-between items-center text-xs text-stone-500">
          <div class="flex items-center">
            <Clock class="w-3 h-3 mr-1" />
            Edited {serial.lastEdit}
          </div>
          <Star class="w-4 h-4 hover:text-yellow-500 transition-colors cursor-pointer" />
        </div>
      </a>
    {/each}

    <!-- Empty/Create Card -->
    <button class="group flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-stone-500 hover:text-primary">
      <div class="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Plus class="w-6 h-6" />
      </div>
      <span class="font-semibold">Start a new journey</span>
    </button>
  </div>
</div>
