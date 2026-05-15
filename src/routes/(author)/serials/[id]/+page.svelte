<script lang="ts">
  import { page } from '$app/state';
  import { Settings, PenTool, BookOpen, Clock, Users, Plus, ChevronRight } from '@lucide/svelte';

  // Placeholder data depending on the ID
  let serialId = $derived(page.params.id);
  
  let serialTitle = $derived(
    serialId === '1' ? 'The Obsidian Citadel' : 
    serialId === '2' ? 'Neon Drifters' : 
    'Whispers of the Void'
  );

  let gradient = $derived(
    serialId === '1' ? 'from-violet-600 to-indigo-600' :
    serialId === '2' ? 'from-emerald-600 to-teal-600' :
    'from-rose-600 to-orange-600'
  );

  const scenes = [
    { id: 'scene-1', title: 'Arrival at the Gates', status: 'Published', date: '2 days ago' },
    { id: 'scene-2', title: 'The Inner Ward', status: 'Published', date: '1 day ago' },
    { id: 'scene-3', title: 'Shadows in the Keep', status: 'Draft', date: 'Just now' }
  ];
</script>

<div class="h-full flex flex-col font-sans text-stone-100 bg-stone-950">
  <!-- Hero Section -->
  <div class="h-64 bg-gradient-to-br {gradient} relative overflow-hidden shrink-0">
    <div class="absolute inset-0 bg-black/40"></div>
    <!-- Ambient texture -->
    <div class="absolute inset-0 opacity-20 mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
    
    <div class="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end bg-gradient-to-t from-stone-950 to-transparent">
      <div class="space-y-2">
        <div class="flex items-center gap-3 text-white/80 text-sm font-bold tracking-widest uppercase">
          <span class="px-2 py-0.5 rounded bg-white/10 border border-white/20 backdrop-blur-md">Active</span>
          <span>Fantasy</span>
        </div>
        <h1 class="text-5xl font-bold font-serif drop-shadow-xl">{serialTitle}</h1>
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl font-bold transition-all flex items-center shadow-lg">
          <Settings class="w-4 h-4 mr-2" />
          Settings
        </button>
      </div>
    </div>
  </div>

  <!-- Content Grid -->
  <div class="flex-1 overflow-y-auto p-8">
    <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Main Column: Scenes -->
      <div class="lg:col-span-2 space-y-6">
        <div class="flex justify-between items-center border-b border-white/10 pb-4">
          <h2 class="text-2xl font-bold flex items-center">
            <BookOpen class="w-6 h-6 mr-3 text-primary" />
            Scenes & Chapters
          </h2>
          <button class="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all flex items-center shadow-lg shadow-primary/20">
            <Plus class="w-4 h-4 mr-2" />
            New Scene
          </button>
        </div>

        <div class="space-y-3">
          {#each scenes as scene}
            <a 
              href="/play/{serialId}/{scene.id}"
              class="group flex items-center justify-between p-4 bg-stone-900/50 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-white/10 transition-all duration-300"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-stone-950 flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-colors">
                  <PenTool class="w-4 h-4 text-stone-400 group-hover:text-primary" />
                </div>
                <div>
                  <h3 class="font-bold text-lg group-hover:text-white text-stone-200 transition-colors">{scene.title}</h3>
                  <div class="flex items-center text-xs text-stone-500 font-medium">
                    <span class="mr-3">{scene.status}</span>
                    <Clock class="w-3 h-3 mr-1" />
                    {scene.date}
                  </div>
                </div>
              </div>
              <div class="text-stone-600 group-hover:text-primary transition-colors">
                <ChevronRight class="w-5 h-5" />
              </div>
            </a>
          {/each}
        </div>
      </div>

      <!-- Sidebar Column: Stats & Entities -->
      <div class="space-y-6">
        <div class="glass-card rounded-2xl p-6">
          <h3 class="font-bold text-sm tracking-widest uppercase text-stone-500 mb-6 border-b border-white/10 pb-3">At a Glance</h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-stone-400 flex items-center"><BookOpen class="w-4 h-4 mr-2" /> Total Scenes</span>
              <span class="font-bold text-xl">{scenes.length}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-stone-400 flex items-center"><Users class="w-4 h-4 mr-2" /> Active Readers</span>
              <span class="font-bold text-xl text-primary">1,420</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</div>
