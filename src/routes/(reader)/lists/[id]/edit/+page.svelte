<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { Settings, BookOpen, Compass, Plus, ChevronRight, Layers, Save, Trash2, ArrowLeft, Eye, EyeOff, Check, X, GripVertical } from '@lucide/svelte';
  import { slide, fade } from 'svelte/transition';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  let { data } = $props<{ data: any }>();

  // State
  let editTitle = $state(data.list.title);
  let editIsPublic = $state(data.list.is_public);
  let showSettings = $state(false);
  let showAddArc = $state(false);
  let newArcTitle = $state('');

  let isSaving = $state(false);
  let saveSuccess = $state(false);

  // Curation items matching svelte-dnd-action requirements (needs unique id, let's map list items)
  let itemsState = $state<any[]>([]);

  // Synchronize state with data from backend load
  $effect(() => {
    // Each list item needs its scene's title joined for UI rendering
    itemsState = data.items.map((item: any) => {
      const scene = data.scenes.find((s: any) => s.id === item.scene_id);
      return {
        ...item,
        scene_title: scene?.display_title || scene?.author_title || `Scene ${scene?.order_index || ''}`
      };
    }).sort((a: any, b: any) => a.order_index - b.order_index);
  });

  const flipDurationMs = 200;

  // DND Handlers
  function handleConsider(e: CustomEvent) {
    itemsState = e.detail.items;
  }

  function handleFinalize(e: CustomEvent) {
    itemsState = e.detail.items;
  }

  // Update a specific item's reading mode locally in state
  function updateLocalMode(itemId: string, mode: 'prose' | 'summary' | 'description' | 'skip') {
    itemsState = itemsState.map(item => {
      if (item.id === itemId) {
        return { ...item, reading_mode: mode };
      }
      return item;
    });
  }

  // Update a specific item's arc locally in state
  function updateLocalArc(itemId: string, arcId: string | null) {
    itemsState = itemsState.map(item => {
      if (item.id === itemId) {
        return { ...item, list_arc_id: arcId };
      }
      return item;
    });
  }

  // Save all items (order, arc, mode) back to database
  async function saveCuration() {
    isSaving = true;
    
    // Recalculate order indices
    const updates = itemsState.map((item, index) => ({
      id: item.id,
      order_index: index + 1,
      list_arc_id: item.list_arc_id,
      reading_mode: item.reading_mode
    }));

    const formData = new FormData();
    formData.append('updates', JSON.stringify(updates));

    const response = await fetch('?/updateItems', {
      method: 'POST',
      body: formData
    });

    isSaving = false;
    if (response.ok) {
      saveSuccess = true;
      setTimeout(() => saveSuccess = false, 2000);
      invalidateAll();
    }
  }

  // Quick check if a scene is already added to the curation list
  function isSceneCurated(sceneId: string) {
    return itemsState.some(item => item.scene_id === sceneId);
  }
</script>

<div class="h-screen flex flex-col font-sans text-zinc-100 bg-zinc-950 overflow-hidden relative">
  
  <!-- Header / Top Bar -->
  <header class="h-16 shrink-0 border-b border-white/5 bg-zinc-900/10 backdrop-blur-xl px-8 flex items-center justify-between z-20">
    <div class="flex items-center gap-4">
      <a 
        href="/lists" 
        class="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
      >
        <ArrowLeft class="w-4 h-4" />
      </a>
      <div class="space-y-0.5">
        <span class="block text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider">Curation Hub / {data.list.serial?.title}</span>
        <h2 class="block text-sm font-bold text-white font-serif">{data.list.title}</h2>
      </div>
    </div>

    <div class="flex items-center gap-3">
      {#if saveSuccess}
        <span transition:fade class="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
          <Check class="w-3.5 h-3.5" />
          Curation Saved
        </span>
      {/if}

      <button 
        onclick={() => { showSettings = !showSettings; showAddArc = false; }}
        class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
      >
        <Settings class="w-3.5 h-3.5" />
        List Settings
      </button>

      <button 
        onclick={() => { showAddArc = !showAddArc; showSettings = false; }}
        class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
      >
        <Plus class="w-3.5 h-3.5" />
        Add Arc Section
      </button>

      <button 
        onclick={saveCuration}
        disabled={isSaving}
        class="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-1.5 border border-white/10 disabled:opacity-50"
      >
        {#if isSaving}
          <div class="w-3 h-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></div>
        {:else}
          <Save class="w-3.5 h-3.5" />
        {/if}
        Save Curation Layout
      </button>
    </div>
  </header>

  <!-- Workspace area -->
  <div class="flex-1 flex overflow-hidden relative">
    
    <!-- Left panel: Chapters sidebar -->
    <aside class="w-96 border-r border-white/5 bg-zinc-900/10 backdrop-blur-2xl flex flex-col shrink-0 overflow-y-auto p-6 space-y-6">
      
      <!-- List Settings Dropdown Panel -->
      {#if showSettings}
        <div transition:slide class="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
          <h4 class="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Settings class="w-3.5 h-3.5" />
            Meta Settings
          </h4>
          
          <form method="POST" action="?/updateSettings" onsubmit={() => showSettings = false} class="space-y-4">
            <div class="space-y-1.5">
              <label for="settings_title" class="text-[9px] font-bold uppercase tracking-wider text-zinc-400">List Title</label>
              <input 
                id="settings_title"
                name="title"
                type="text" 
                required
                bind:value={editTitle}
                class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-primary/50 transition-all font-serif"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Visibility</label>
              <input type="hidden" name="isPublic" value={editIsPublic ? 'true' : 'false'} />
              
              <div class="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onclick={() => editIsPublic = false}
                  class="py-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all {!editIsPublic ? 'border-primary bg-primary/10 text-white' : 'border-white/5 bg-black/20 text-zinc-400 hover:border-white/10'}"
                >
                  <EyeOff class="w-3 h-3" /> Private
                </button>
                <button 
                  type="button" 
                  onclick={() => editIsPublic = true}
                  class="py-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all {editIsPublic ? 'border-primary bg-primary/10 text-white' : 'border-white/5 bg-black/20 text-zinc-400 hover:border-white/10'}"
                >
                  <Eye class="w-3 h-3" /> Public
                </button>
              </div>
            </div>

            <button 
              type="submit"
              class="w-full py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1 border border-white/10 shadow-md"
            >
              <Save class="w-3.5 h-3.5" /> Save Meta
            </button>
          </form>
        </div>
      {/if}

      <!-- Add Arc Section Slidedown -->
      {#if showAddArc}
        <div transition:slide class="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
          <h4 class="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Layers class="w-3.5 h-3.5" />
            Create Reading Section
          </h4>
          
          <form method="POST" action="?/createArc" onsubmit={() => showAddArc = false} class="space-y-4">
            <div class="space-y-1.5">
              <label for="arc_title" class="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Section Title</label>
              <input 
                id="arc_title"
                name="title"
                type="text" 
                required
                bind:value={newArcTitle}
                class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-primary/50 transition-all font-serif"
                placeholder="e.g. Act I: The Awakening"
              />
              <input type="hidden" name="orderIndex" value={data.arcs.length + 1} />
            </div>

            <button 
              type="submit"
              class="w-full py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1 border border-white/10 shadow-md"
            >
              <Plus class="w-3.5 h-3.5" /> Create Section
            </button>
          </form>
        </div>
      {/if}

      <!-- Available published scenes lists -->
      <div class="space-y-4">
        <div>
          <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <BookOpen class="w-4 h-4 text-primary" />
            Published Scenes ({data.scenes.length})
          </h3>
          <p class="text-[10px] text-zinc-500 mt-1">Select chapters from the original serial to include in your curation.</p>
        </div>

        <div class="space-y-2">
          {#each data.scenes as scene}
            {@const curated = isSceneCurated(scene.id)}
            <div class="p-3 bg-zinc-900/40 border border-white/5 rounded-xl flex items-center justify-between gap-3 group hover:border-white/10 transition-all">
              <div class="space-y-0.5 truncate pr-2">
                <span class="block text-xs font-serif font-bold text-zinc-200 truncate">{scene.display_title || scene.author_title || `Scene ${scene.order_index}`}</span>
                <span class="block text-[8px] font-mono text-zinc-500 uppercase">Chapter {scene.order_index}</span>
              </div>

              {#if curated}
                <span class="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 select-none">
                  <Check class="w-3 h-3" /> Included
                </span>
              {:else}
                <form method="POST" action="?/addItem">
                  <input type="hidden" name="sceneId" value={scene.id} />
                  <input type="hidden" name="orderIndex" value={itemsState.length + 1} />
                  <button 
                    type="submit"
                    class="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all"
                  >
                    <Plus class="w-3 h-3 text-zinc-400 group-hover:text-primary transition-colors" /> Add
                  </button>
                </form>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Custom Sections list (deletion/ordering) -->
      {#if data.arcs.length > 0}
        <div class="space-y-4 pt-4 border-t border-white/5">
          <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <Layers class="w-4 h-4 text-primary" />
            Custom Sections ({data.arcs.length})
          </h3>
          
          <div class="space-y-2">
            {#each data.arcs as arc}
              <div class="p-3 bg-zinc-900/40 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                <span class="text-xs font-bold text-zinc-300 font-serif truncate">{arc.title}</span>
                
                <form method="POST" action="?/deleteArc" onsubmit={() => {
                  // Reset any local arc assignments that point to this deleted arc
                  itemsState = itemsState.map(i => i.list_arc_id === arc.id ? { ...i, list_arc_id: null } : i);
                }}>
                  <input type="hidden" name="arcId" value={arc.id} />
                  <button 
                    type="submit"
                    class="p-1 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-all shrink-0"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            {/each}
          </div>
        </div>
      {/if}

    </aside>

    <!-- Main Builder Panel: Curation Playlist Builder -->
    <main class="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden relative p-8">
      
      <div class="max-w-4xl mx-auto w-full h-full flex flex-col space-y-6 pb-24">
        
        <div class="border-b border-white/5 pb-4 flex justify-between items-end">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2 font-serif">
              Playlist Curations
            </h3>
            <p class="text-xs text-zinc-500 mt-1">Reorder chapters, group them into your custom sections, and adjust their individual reading modes.</p>
          </div>

          <div class="text-[10px] text-zinc-400 font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
            {itemsState.length} chapters curated
          </div>
        </div>

        {#if itemsState.length === 0}
          <div class="flex-1 border border-dashed border-white/5 bg-zinc-900/10 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center space-y-4">
            <Layers class="w-12 h-12 text-zinc-800" />
            <h4 class="text-sm font-bold text-zinc-400">Your Playlist is Empty</h4>
            <p class="text-xs text-zinc-600 max-w-xs">Use the side column to add published chapters, then customize their orders and settings here.</p>
          </div>
        {:else}
          
          <div class="flex-1 overflow-y-auto space-y-4 pr-2">
            
            <!-- Drag & Drop Container -->
            <div 
              use:dndzone={{ items: itemsState, flipDurationMs }} 
              onconsider={handleConsider} 
              onfinalize={handleFinalize}
              class="space-y-3 min-h-64"
            >
              {#each itemsState as item, index (item.id)}
                <div 
                  animate:flip={{ duration: flipDurationMs }}
                  class="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 hover:bg-zinc-900/60 transition-all duration-300 relative group"
                >
                  <!-- Drag Handle & Basic Title info -->
                  <div class="flex items-center gap-3 w-full md:w-auto">
                    <div class="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors p-1 shrink-0">
                      <GripVertical class="w-4 h-4" />
                    </div>
                    <div class="space-y-0.5 truncate">
                      <span class="block text-xs font-serif font-bold text-zinc-200 truncate">{item.scene_title}</span>
                      <span class="block text-[8px] font-mono text-zinc-500 uppercase font-bold">Sequence {index + 1}</span>
                    </div>
                  </div>

                  <!-- Edit layout settings (Reading Mode, Arc Selection) -->
                  <div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    
                    <!-- Arc assignment dropdown -->
                    {#if data.arcs.length > 0}
                      <div class="flex items-center gap-1">
                        <span class="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mr-1">Section:</span>
                        <select 
                          value={item.list_arc_id || ''} 
                          onchange={(e) => updateLocalArc(item.id, (e.target as HTMLSelectElement).value || null)}
                          class="bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 text-[10px] font-medium text-zinc-300 focus:outline-none focus:border-primary/50 cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {#each data.arcs as arc}
                            <option value={arc.id}>{arc.title}</option>
                          {/each}
                        </select>
                      </div>
                    {/if}

                    <!-- Reading Mode toggle buttons -->
                    <div class="flex items-center gap-1 bg-black/40 border border-white/5 p-1 rounded-xl shrink-0">
                      <button 
                        onclick={() => updateLocalMode(item.id, 'prose')}
                        class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all
                          {item.reading_mode === 'prose' ? 'bg-primary/20 text-primary font-bold' : 'text-zinc-500 hover:text-zinc-300'}"
                      >
                        Prose
                      </button>
                      <button 
                        onclick={() => updateLocalMode(item.id, 'summary')}
                        class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all
                          {item.reading_mode === 'summary' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'}"
                      >
                        Summary
                      </button>
                      <button 
                        onclick={() => updateLocalMode(item.id, 'description')}
                        class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all
                          {item.reading_mode === 'description' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'}"
                      >
                        Desc
                      </button>
                      <button 
                        onclick={() => updateLocalMode(item.id, 'skip')}
                        class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all
                          {item.reading_mode === 'skip' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'}"
                      >
                        Skip
                      </button>
                    </div>

                    <!-- Remove scene from curation list entirely -->
                    <form method="POST" action="?/removeItem">
                      <input type="hidden" name="itemId" value={item.id} />
                      <button 
                        type="submit"
                        class="p-1.5 bg-white/5 border border-white/10 hover:border-red-500/20 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-xl transition-all"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </form>

                  </div>
                </div>
              {/each}
            </div>

          </div>
        {/if}

      </div>
    </main>

  </div>

</div>
