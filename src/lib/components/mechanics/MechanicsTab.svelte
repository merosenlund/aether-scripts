<script lang="ts">
  import { onMount } from 'svelte';
  import { getWikiEntities, type WikiEntity } from '$lib/api/wiki';
  import { Plus, Timer, Activity } from '@lucide/svelte';
  import { notifications } from '$lib/stores/notifications';
  import { slide } from 'svelte/transition';
  import { supabase } from '$lib/supabaseClient';
  import { openPrompt } from '$lib/stores/prompt.svelte';

  let { serialId, sceneId } = $props<{
    serialId: string;
    sceneId: string;
  }>();

  let entities = $state<WikiEntity[]>([]);
  let isLoading = $state(true);

  async function loadMechanics() {
    try {
      const data = await getWikiEntities(serialId);
      entities = data.filter(e => e.category === 'clock' || e.category === 'track');
    } catch (e) {
      console.error(e);
      notifications.error('Failed to load mechanics.');
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadMechanics();
  });

  async function createNewMechanic(type: 'clock' | 'track') {
    const name = await openPrompt(`New ${type}`, `Enter a name for the new ${type}:`);
    if (!name) return;
    
    let metadata = {};
    if (type === 'clock') {
      const segmentsStr = await openPrompt('Clock Segments', 'How many segments? (4, 6, 8, 10, 12)', '4');
      const segments = parseInt(segmentsStr || '4');
      metadata = { segments: [4, 6, 8, 10, 12].includes(segments) ? segments : 4, filled: 0 };
    } else {
      metadata = { max: 10, current: 0 };
    }

    try {
      const { data, error } = await supabase
        .from('wiki_entities')
        .insert({
          serial_id: serialId,
          name,
          category: type,
          metadata
        })
        .select()
        .single();
      
      if (error) throw error;
      entities = [...entities, data as WikiEntity];
      notifications.success(`${type} created!`);
    } catch (e) {
      console.error(e);
      notifications.error(`Failed to create ${type}`);
    }
  }

  async function updateProgress(entity: WikiEntity, delta: number) {
    let newMetadata = { ...entity.metadata };
    
    if (entity.category === 'clock') {
      newMetadata.filled = Math.max(0, Math.min(newMetadata.segments, (newMetadata.filled || 0) + delta));
    } else if (entity.category === 'track') {
      newMetadata.current = Math.max(0, Math.min(newMetadata.max || 10, (newMetadata.current || 0) + delta));
    }

    // Optimistic update
    const index = entities.findIndex(e => e.id === entity.id);
    if (index !== -1) {
      entities[index] = { ...entity, metadata: newMetadata };
    }

    try {
      const { error } = await supabase
        .from('wiki_entities')
        .update({ metadata: newMetadata })
        .eq('id', entity.id);
        
      if (error) throw error;
    } catch (e) {
      console.error(e);
      notifications.error('Failed to update progress');
      loadMechanics(); // Revert
    }
  }
</script>

<div class="flex flex-col h-full">
  <div class="flex-1 overflow-y-auto px-4 py-6 space-y-4">
    {#if isLoading}
      <div class="p-8 text-center animate-pulse">
        <div class="w-8 h-8 bg-white/10 rounded-full mx-auto mb-4"></div>
      </div>
    {:else if entities.length === 0}
      <div class="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
        <p class="text-[10px] text-stone-600 font-bold uppercase tracking-widest">No mechanics active</p>
      </div>
    {:else}
      {#each entities as entity (entity.id)}
        <div class="p-4 rounded-2xl border border-white/5 bg-white/[0.02] shadow-sm" transition:slide>
          <div class="flex items-center gap-3 mb-3">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              {#if entity.category === 'clock'}
                <Timer size={16} />
              {:else}
                <Activity size={16} />
              {/if}
            </div>
            <div>
              <h4 class="text-sm font-bold text-white leading-tight">{entity.name}</h4>
              <span class="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{entity.category}</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between mt-2 gap-4">
            <button 
              class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 font-bold"
              onclick={() => updateProgress(entity, -1)}
            >
              -
            </button>
            
            <div class="flex-1 text-center font-bold font-mono text-xl text-primary">
              {#if entity.category === 'clock'}
                {entity.metadata.filled || 0} / {entity.metadata.segments}
              {:else}
                {entity.metadata.current || 0} / {entity.metadata.max || 10}
              {/if}
            </div>
            
            <button 
              class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 font-bold"
              onclick={() => updateProgress(entity, 1)}
            >
              +
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <div class="p-4 border-t border-white/5 bg-white/[0.02] space-y-2">
    <button 
      class="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-stone-500 hover:text-white hover:border-white/20 transition-all uppercase tracking-widest"
      onclick={() => createNewMechanic('clock')}
    >
      <Plus size={14} />
      New Clock
    </button>
    <button 
      class="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-stone-500 hover:text-white hover:border-white/20 transition-all uppercase tracking-widest"
      onclick={() => createNewMechanic('track')}
    >
      <Plus size={14} />
      New Track
    </button>
  </div>
</div>
