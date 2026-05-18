<script lang="ts">
  import { Search, Compass, BookOpen, Plus, ArrowRight, Lock, Globe, Layers, FolderPlus } from '@lucide/svelte';
  import { slide, fade } from 'svelte/transition';

  let { data } = $props<{ data: any }>();

  // State
  let searchQuery = $state('');
  let activeTab = $state<'all' | 'my'>('all');
  let showCreateList = $state(false);
  
  // New list inputs
  let newListTitle = $state('');
  let newListSerialId = $state('');
  let newListIsPublic = $state(false);

  // Derived filtered lists
  const filteredLists = $derived(
    data.lists.filter((list: any) => {
      const matchesSearch = list.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            list.serial?.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isOwnList = list.user_id === data.session?.user?.id;
      const matchesTab = activeTab === 'all' ? list.is_public : (activeTab === 'my' && isOwnList);
      
      return matchesSearch && matchesTab;
    })
  );

  // Form submission check
  function resetCreateForm() {
    newListTitle = '';
    newListSerialId = '';
    newListIsPublic = false;
    showCreateList = false;
  }
</script>

<div class="p-8 max-w-7xl mx-auto space-y-12 pb-32 font-sans text-zinc-100 bg-zinc-950">
  
  <!-- Hero / Header Section -->
  <section class="relative rounded-[2rem] overflow-hidden min-h-[280px] flex items-center p-8 md:p-16 bg-zinc-900 border border-white/5 shadow-2xl">
    <div class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent z-10"></div>
    <div class="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-br from-primary/20 via-indigo-500/10 to-transparent blur-3xl rounded-full translate-x-1/4 -translate-y-1/4"></div>
    
    <div class="relative z-20 max-w-3xl flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-8">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]">
          Curated <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Reading Lists</span> & Cuts.
        </h1>
        <p class="text-zinc-400 text-base md:text-lg max-w-md">
          Explore customized tables of contents, alternate narrative paths, and skipped-filler editions created by the community.
        </p>
      </div>

      {#if data.session}
        <button
          onclick={() => showCreateList = !showCreateList}
          class="px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 text-sm shrink-0 border border-white/10"
        >
          <FolderPlus class="w-4 h-4" />
          Create New List
        </button>
      {/if}
    </div>
  </section>

  <!-- Create List Slide-down Panel -->
  {#if showCreateList}
    <div transition:slide class="max-w-4xl mx-auto bg-zinc-900/60 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 -z-10"></div>
      
      <h3 class="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-6 pb-3 border-b border-white/5">
        <Plus class="w-4 h-4 text-primary" />
        New Reading List
      </h3>

      <form method="POST" action="?/createList" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label for="list_title" class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">List Title</label>
              <input 
                id="list_title"
                name="title"
                type="text" 
                required
                bind:value={newListTitle}
                class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-primary/50 transition-all font-serif"
                placeholder="e.g. Elias' Journey (Action-Only Cut)"
              />
            </div>

            <div class="space-y-1.5">
              <label for="list_serial" class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Target Serial / Series</label>
              <select 
                id="list_serial"
                name="serialId"
                required
                bind:value={newListSerialId}
                class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
              >
                <option value="" disabled class="bg-zinc-900 text-zinc-500">Select a serial...</option>
                {#each data.serials as serial}
                  <option value={serial.id} class="bg-zinc-900 text-zinc-300">{serial.title}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="space-y-4 justify-between flex flex-col">
            <div class="space-y-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Curation Settings</span>
              
              <div class="grid grid-cols-1 gap-3">
                <button 
                  type="button" 
                  onclick={() => newListIsPublic = false}
                  class="p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all {!newListIsPublic ? 'border-primary/40 bg-primary/5 shadow-md' : 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30'}"
                >
                  <div class="flex items-center gap-3">
                    <Lock class="w-4 h-4 text-zinc-400" />
                    <div>
                      <span class="text-xs font-bold text-zinc-200 block">Private List</span>
                      <span class="text-[9px] text-zinc-500 font-medium block">Only visible to you on your custom dashboard</span>
                    </div>
                  </div>
                </button>

                <button 
                  type="button" 
                  onclick={() => newListIsPublic = true}
                  class="p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all {newListIsPublic ? 'border-primary/40 bg-primary/5 shadow-md' : 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30'}"
                >
                  <div class="flex items-center gap-3">
                    <Globe class="w-4 h-4 text-zinc-400" />
                    <div>
                      <span class="text-xs font-bold text-zinc-200 block">Public Curation</span>
                      <span class="text-[9px] text-zinc-500 font-medium block">Publish to the global /lists page for everyone</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <input type="hidden" name="isPublic" value={newListIsPublic ? 'true' : 'false'} />
          </div>
        </div>

        <!-- Submit & Close actions -->
        <div class="flex justify-end gap-3 pt-3 border-t border-white/5">
          <button 
            type="button" 
            onclick={resetCreateForm}
            class="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-xs transition-all text-zinc-300"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-1.5"
          >
            <FolderPlus class="w-4 h-4" />
            Build Curation List
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Filter Toggles & Search -->
  <div class="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
    
    <!-- Tab toggles -->
    <div class="flex gap-2 bg-zinc-900/40 p-1.5 rounded-2xl border border-white/5 shrink-0">
      <button 
        onclick={() => activeTab = 'all'}
        class="px-6 py-2 rounded-xl transition-all text-xs font-bold capitalize whitespace-nowrap flex items-center gap-2
          {activeTab === 'all' 
            ? 'bg-zinc-800 text-white shadow-sm' 
            : 'text-zinc-400 hover:text-white'}"
      >
        <Globe class="w-3.5 h-3.5" />
        Community Lists
      </button>
      
      {#if data.session}
        <button 
          onclick={() => activeTab = 'my'}
          class="px-6 py-2 rounded-xl transition-all text-xs font-bold capitalize whitespace-nowrap flex items-center gap-2
            {activeTab === 'my' 
              ? 'bg-zinc-800 text-white shadow-sm' 
              : 'text-zinc-400 hover:text-white'}"
        >
          <Lock class="w-3.5 h-3.5" />
          My Playlists
        </button>
      {/if}
    </div>

    <!-- Search Input -->
    <div class="relative max-w-md w-full group">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
      <input 
        type="text" 
        bind:value={searchQuery}
        placeholder="Filter by list or serial title..." 
        class="w-full bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/40 transition-all"
      />
    </div>

  </div>

  <!-- Lists Grid -->
  {#if filteredLists.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each filteredLists as list (list.id)}
        <a 
          href="/lists/{list.id}" 
          class="group relative bg-zinc-900/40 border border-white/5 rounded-[2rem] overflow-hidden p-8 hover:border-white/10 hover:bg-zinc-900/60 transition-all duration-300 flex flex-col justify-between min-h-[240px] shadow-lg"
        >
          <!-- Banner Overlay containing color theme gradient -->
          <div class="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r {list.serial?.color_theme || 'from-violet-600 to-indigo-600'} opacity-80 group-hover:opacity-100 transition-opacity"></div>
          
          <div class="space-y-4">
            <!-- Header Badges -->
            <div class="flex items-center justify-between gap-3 select-none">
              <span class="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[160px]">
                {list.serial?.title || 'Unknown Serial'}
              </span>
              
              <div class="flex items-center gap-1.5 shrink-0">
                {#if list.is_public}
                  <span class="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Globe class="w-2.5 h-2.5" />
                    Public
                  </span>
                {:else}
                  <span class="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Lock class="w-2.5 h-2.5" />
                    Private
                  </span>
                {/if}
              </div>
            </div>

            <!-- Title & Info -->
            <h3 class="font-bold text-2xl font-serif leading-tight group-hover:text-primary transition-colors text-white line-clamp-2">
              {list.title}
            </h3>
          </div>

          <!-- Bottom bar -->
          <div class="flex items-center justify-between border-t border-white/5 pt-5 mt-4">
            <div class="text-zinc-400 flex items-center gap-2 text-xs font-semibold">
              <Layers class="w-4 h-4 text-primary" />
              <span>{list.items?.length || 0} {list.items?.length === 1 ? 'chapter' : 'chapters'}</span>
            </div>
            
            <div 
              class="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-zinc-300 group-hover:text-white group-hover:bg-primary group-hover:border-primary flex items-center justify-center transition-all duration-300 shadow-sm"
            >
              <ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <div class="bg-zinc-900/20 border border-dashed border-white/5 rounded-[2rem] p-24 text-center space-y-6">
      <div class="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-600 border border-white/5">
        <Compass class="w-8 h-8" />
      </div>
      <div class="space-y-2">
        <h3 class="text-xl font-bold text-zinc-300">No curations found</h3>
        <p class="text-zinc-500 max-w-sm mx-auto text-sm">
          {#if activeTab === 'my'}
            You haven't created any custom playlists yet. Use "+ Create New List" to get started!
          {:else}
            No community lists match your filters. Try search adjustments.
          {/if}
        </p>
      </div>
      
      {#if searchQuery !== ''}
        <button 
          onclick={() => { searchQuery = ''; }}
          class="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
        >
          Clear search
        </button>
      {/if}
    </div>
  {/if}
</div>
