<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { Settings, PenTool, BookOpen, Clock, Users, Plus, ChevronRight, FolderPlus, Layers, Save, CheckCircle } from '@lucide/svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { fade, slide } from 'svelte/transition';

  let { data } = $props<{ data: any }>();

  // State
  let showAddArc = $state(false);
  let newArcTitle = $state('');
  let isSavingOrder = $state(false);
  let orderSaved = $state(false);

  // Group scenes by Arc reactive to data.scenes
  let scenesByArc = $state<Record<string, any[]>>({});

  // Initialize and keep state synced with backend data
  $effect(() => {
    const grouped: Record<string, any[]> = { unassigned: [] };
    
    // Initialize groups for arcs
    data.arcs.forEach((arc: any) => {
      grouped[arc.id] = [];
    });

    // Populate groups
    data.scenes.forEach((scene: any) => {
      const key = scene.arc_id || 'unassigned';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(scene);
    });

    // Sort by order_index within each group
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.order_index - b.order_index);
    });

    scenesByArc = grouped;
  });

  const flipDurationMs = 200;

  // DND Handlers
  function handleConsider(arcId: string, e: CustomEvent) {
    scenesByArc[arcId] = e.detail.items;
  }

  async function handleFinalize(arcId: string, e: CustomEvent) {
    scenesByArc[arcId] = e.detail.items;
    
    // Save new order to database
    isSavingOrder = true;
    
    // Calculate new order indexes across all groups
    const updates: { id: string; arc_id: string | null; order_index: number }[] = [];
    
    Object.entries(scenesByArc).forEach(([groupId, items]) => {
      const dbArcId = groupId === 'unassigned' ? null : groupId;
      items.forEach((item, index) => {
        updates.push({
          id: item.id,
          arc_id: dbArcId,
          order_index: index + 1
        });
      });
    });

    const formData = new FormData();
    formData.append('updates', JSON.stringify(updates));

    const response = await fetch('?/updateSceneOrder', {
      method: 'POST',
      body: formData
    });

    isSavingOrder = false;
    
    if (response.ok) {
      orderSaved = true;
      setTimeout(() => orderSaved = false, 2000);
      invalidateAll();
    }
  }

  // Formatting helper
  function formatRelativeTime(dateStr: string | null) {
    if (!dateStr) return 'Unpublished';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }
</script>

<div class="h-full flex flex-col font-sans text-stone-100 bg-stone-950 overflow-hidden relative">
  
  <!-- Hero Section -->
  <div class="h-56 bg-gradient-to-br {data.serial.color_theme || 'from-violet-600 to-indigo-600'} relative overflow-hidden shrink-0">
    <div class="absolute inset-0 bg-black/40"></div>
    <div class="absolute inset-0 opacity-20 mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
    
    <div class="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end bg-gradient-to-t from-stone-950 to-transparent">
      <div class="space-y-2">
        <div class="flex items-center gap-3 text-white/80 text-xs font-bold tracking-widest uppercase">
          <span class="px-2.5 py-1 rounded bg-white/10 border border-white/20 backdrop-blur-md">
            {data.serial.status || 'Active'}
          </span>
          <span class="text-stone-300">Author Console</span>
        </div>
        <h1 class="text-4xl font-bold font-serif drop-shadow-xl">{data.serial.title}</h1>
      </div>
      <div class="flex gap-3">
        <!-- Order status indicators -->
        {#if isSavingOrder}
          <div class="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-stone-400" transition:fade>
            <div class="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            Saving order...
          </div>
        {:else}
          {#if orderSaved}
            <div class="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400" transition:fade>
              <CheckCircle class="w-3.5 h-3.5" />
              Order Saved
            </div>
          {/if}
        {/if}
        
        <button 
          onclick={() => showAddArc = !showAddArc}
          class="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-md rounded-xl font-bold text-xs transition-all flex items-center shadow-lg"
        >
          <FolderPlus class="w-4 h-4 mr-2" />
          Add Arc
        </button>

        <form method="POST" action="?/createScene">
          <button 
            type="submit"
            class="px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all flex items-center text-xs shadow-lg shadow-primary/20"
          >
            <Plus class="w-4 h-4 mr-2" />
            New Scene
          </button>
        </form>
      </div>
    </div>
  </div>

  <!-- Content Workspace split into Columns -->
  <div class="flex-1 overflow-y-auto p-8 relative">
    
    <!-- Add Arc Slide-down Dialog -->
    {#if showAddArc}
      <div transition:slide class="max-w-5xl mx-auto mb-8 bg-stone-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <form method="POST" action="?/createArc" onsubmit={() => showAddArc = false} class="flex gap-4 items-end">
          <div class="flex-1 space-y-1.5">
            <label for="arc_title" class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Arc / Group Title</label>
            <input 
              id="arc_title"
              name="title"
              type="text" 
              required
              bind:value={newArcTitle}
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-primary/50 transition-all font-serif"
              placeholder="e.g. Arc I: The Shadow's Whispers"
            />
          </div>
          <button 
            type="submit"
            class="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-all shadow-md shrink-0"
          >
            Create Arc
          </button>
        </form>
      </div>
    {/if}

    <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      
      <!-- Main Columns: Arcs & Scene boards -->
      <div class="lg:col-span-2 space-y-8 pb-32">
        <h2 class="text-xl font-bold flex items-center border-b border-white/5 pb-3">
          <Layers class="w-5 h-5 mr-3 text-primary" />
          Storyboards & Arcs (Drag & Drop)
        </h2>

        <!-- Storyboard container -->
        <div class="space-y-6">
          {#each data.arcs as arc (arc.id)}
            <div class="bg-stone-900/20 border border-white/5 rounded-3xl p-5 space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="font-serif font-bold text-white/90 text-lg flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-primary/60"></span>
                  {arc.title}
                </h3>
                <span class="text-[9px] font-bold text-stone-600 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">
                  Arc
                </span>
              </div>

              <!-- Dnd Zone for this Arc -->
              <div 
                use:dndzone={{ items: scenesByArc[arc.id] || [], flipDurationMs }} 
                onconsider={(e) => handleConsider(arc.id, e)} 
                onfinalize={(e) => handleFinalize(arc.id, e)}
                class="min-h-16 rounded-2xl border border-dashed border-white/5 p-2 space-y-2 bg-black/10 transition-colors"
              >
                {#if (scenesByArc[arc.id] || []).length === 0}
                  <div class="py-6 text-center text-xs text-stone-600 italic">Drag scenes here to add them to this Arc</div>
                {:else}
                  {#each scenesByArc[arc.id] || [] as scene (scene.id)}
                    <div animate:flip={{ duration: flipDurationMs }}>
                      <a 
                        href="/play/{data.serial.id}/{scene.id}"
                        class="flex items-center justify-between p-3.5 bg-stone-900/60 border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all cursor-grab active:cursor-grabbing"
                      >
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-lg bg-stone-950 flex items-center justify-center border border-white/5">
                            <PenTool class="w-3.5 h-3.5 text-stone-400" />
                          </div>
                          <div>
                            <h4 class="font-bold text-sm text-stone-200">{scene.author_title || 'Untitled Scene'}</h4>
                            <div class="flex items-center text-[10px] text-stone-500 font-medium gap-3">
                              <span class="uppercase tracking-wider font-semibold text-[9px] text-primary">{scene.status}</span>
                              <div class="flex items-center gap-1">
                                <Clock class="w-2.5 h-2.5" />
                                <span>{formatRelativeTime(scene.published_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <ChevronRight class="w-4 h-4 text-stone-600" />
                      </a>
                    </div>
                  {/each}
                {/if}
              </div>
            </div>
          {/each}

          <!-- Unassigned Scenes DND Dropzone -->
          <div class="bg-stone-900/20 border border-white/5 rounded-3xl p-5 space-y-4">
            <h3 class="font-serif font-bold text-stone-400 text-lg flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-stone-700"></span>
              Unassigned Scenes
            </h3>
            
            <div 
              use:dndzone={{ items: scenesByArc.unassigned || [], flipDurationMs }} 
              onconsider={(e) => handleConsider('unassigned', e)} 
              onfinalize={(e) => handleFinalize('unassigned', e)}
              class="min-h-16 rounded-2xl border border-dashed border-white/5 p-2 space-y-2 bg-black/10 transition-colors"
            >
              {#if (scenesByArc.unassigned || []).length === 0}
                <div class="py-6 text-center text-xs text-stone-600 italic">No unassigned scenes</div>
              {:else}
                {#each scenesByArc.unassigned || [] as scene (scene.id)}
                  <div animate:flip={{ duration: flipDurationMs }}>
                    <a 
                      href="/play/{data.serial.id}/{scene.id}"
                      class="flex items-center justify-between p-3.5 bg-stone-900/60 border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all cursor-grab active:cursor-grabbing"
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-stone-950 flex items-center justify-center border border-white/5">
                          <PenTool class="w-3.5 h-3.5 text-stone-400" />
                        </div>
                        <div>
                          <h4 class="font-bold text-sm text-stone-200">{scene.author_title || 'Untitled Scene'}</h4>
                          <div class="flex items-center text-[10px] text-stone-500 font-medium gap-3">
                            <span class="uppercase tracking-wider font-semibold text-[9px] text-primary">{scene.status}</span>
                            <div class="flex items-center gap-1">
                              <Clock class="w-2.5 h-2.5" />
                              <span>{formatRelativeTime(scene.published_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ChevronRight class="w-4 h-4 text-stone-600" />
                    </a>
                  </div>
                {/each}
              {/if}
            </div>
          </div>

        </div>
      </div>

      <!-- Right Column: Analytics At A Glance -->
      <div class="space-y-6">
        <div class="bg-stone-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
          <h3 class="font-bold text-xs tracking-widest uppercase text-stone-500 mb-6 border-b border-white/5 pb-3">At a Glance</h3>
          <div class="space-y-5">
            <div class="flex justify-between items-center">
              <span class="text-stone-400 flex items-center text-sm font-medium">
                <BookOpen class="w-4 h-4 mr-2.5 text-stone-500" /> Total Scenes
              </span>
              <span class="font-bold text-xl">{data.scenes.length}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-stone-400 flex items-center text-sm font-medium">
                <Layers class="w-4 h-4 mr-2.5 text-stone-500" /> Total Arcs
              </span>
              <span class="font-bold text-xl">{data.arcs.length}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-stone-400 flex items-center text-sm font-medium">
                <Users class="w-4 h-4 mr-2.5 text-stone-500" /> Active Readers
              </span>
              <span class="font-bold text-xl text-primary">{data.readersCount}</span>
            </div>
          </div>
        </div>

        <div class="bg-stone-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-4">
          <h3 class="font-bold text-xs tracking-widest uppercase text-stone-500 border-b border-white/5 pb-3">Teaser Status</h3>
          
          <div class="space-y-3">
            <div class="flex justify-between items-center text-xs font-medium">
              <span class="text-stone-400">Next Scene Completion</span>
              <span class="text-primary font-bold font-mono">{data.serial.next_scene_completion_percentage || 0}%</span>
            </div>
            <div class="w-full bg-white/5 border border-white/10 rounded-full h-2 overflow-hidden shadow-inner">
              <div 
                class="bg-primary h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
                style="width: {data.serial.next_scene_completion_percentage || 0}%"
              ></div>
            </div>
            <div class="text-[10px] text-stone-500 leading-relaxed italic bg-white/[0.01] border border-white/5 p-3.5 rounded-xl font-medium">
              "{data.serial.next_scene_update_note || 'No teaser updates set.'}"
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</div>
