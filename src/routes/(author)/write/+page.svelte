<script lang="ts">
  import { Plus, Book, Users, Star, Clock } from '@lucide/svelte';
  import type { PageData } from './$types';
  import { openPrompt } from '$lib/stores/prompt.svelte';

  let { data } = $props();

  let titleInput = $state('');
  let formRef: HTMLFormElement | undefined = $state(undefined);

  async function handleCreateSerial() {
    const title = await openPrompt(
      'Create New Serial',
      'Enter a title for your new actual-play interactive story:',
      'My New Serial'
    );
    if (title && title.trim()) {
      titleInput = title.trim();
      setTimeout(() => {
        if (formRef) {
          formRef.submit();
        }
      }, 0);
    }
  }

  function timeAgo(date: string | Date) {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString();
  }
</script>

<div class="p-8 max-w-7xl mx-auto space-y-10">
  <!-- Header -->
  <header class="flex justify-between items-end">
    <div class="space-y-1">
      <h1 class="text-4xl font-bold tracking-tight">Your Serials</h1>
      <p class="text-stone-400">Manage your stories, worlds, and reader community.</p>
    </div>
    <button 
      onclick={handleCreateSerial}
      class="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
    >
      <Plus class="w-5 h-5 mr-2" />
      New Serial
    </button>
  </header>

  <!-- Serials Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each data.serials as serial}
      <a 
        href="/serials/{serial.id}"
        class="group relative flex flex-col bg-stone-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
      >
        <!-- Card Header / Cover Art Placeholder -->
        <div class="h-32 bg-gradient-to-br {serial.color_theme} relative overflow-hidden">
          <div class="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
          <div class="absolute top-4 right-4">
            {#if serial.status === 'pilot'}
              <span class="px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                Pilot Phase
              </span>
            {:else}
              <span class="px-2 py-1 rounded-md bg-black/40 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                {serial.status}
              </span>
            {/if}
          </div>
        </div>

        <!-- Content -->
        <div class="p-5 flex-1 flex flex-col">
          <h2 class="text-xl font-bold mb-4 group-hover:text-primary transition-colors">{serial.title}</h2>
          
          <div class="grid grid-cols-2 gap-4 mt-auto">
            <div class="flex items-center text-stone-400 text-sm">
              <Book class="w-4 h-4 mr-2 text-stone-500" />
              {serial.scenesCount} Scenes
            </div>
            <div class="flex items-center text-stone-400 text-sm">
              <Users class="w-4 h-4 mr-2 text-stone-500" />
              {serial.readersCount} Readers
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-white/5 bg-stone-950/30 flex justify-between items-center text-xs text-stone-500">
          <div class="flex items-center">
            <Clock class="w-3 h-3 mr-1" />
            Edited {timeAgo(serial.lastEdit)}
          </div>
          <Star class="w-4 h-4 hover:text-yellow-500 transition-colors cursor-pointer" />
        </div>
      </a>
    {/each}

    <!-- Empty/Create Card -->
    <button 
      onclick={handleCreateSerial}
      class="group flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-stone-500 hover:text-primary"
    >
      <div class="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Plus class="w-6 h-6" />
      </div>
      <span class="font-semibold">Start a new journey</span>
    </button>
  </div>
</div>

<!-- Hidden Form to trigger SvelteKit creation action -->
<form 
  bind:this={formRef} 
  method="POST" 
  action="?/create" 
  class="hidden"
>
  <input type="hidden" name="title" value={titleInput} />
</form>

