<script lang="ts">
  import { onMount } from 'svelte';
  import { getWikiEntities, createWikiAnchor, getWikiAnchors, type WikiEntity, type WikiAnchor } from '$lib/api/wiki';
  import { Sparkles, Pin, User, MapPin, Flag, Timer, Plus } from '@lucide/svelte';
  import { notifications } from '$lib/stores/notifications';
  import { fade, slide } from 'svelte/transition';

  let { serialId, sceneId, activeBlockId, visibleBlockIds = [] } = $props<{
    serialId: string;
    sceneId: string;
    activeBlockId: string;
    visibleBlockIds?: string[];
  }>();

  let entities = $state<WikiEntity[]>([]);
  let anchors = $state<any[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state('');

  onMount(async () => {
    try {
      const [eData, aData] = await Promise.all([
        getWikiEntities(serialId),
        getWikiAnchors(sceneId)
      ]);
      entities = eData;
      anchors = aData;
    } catch (e) {
      console.error(e);
      notifications.error('Failed to load wiki.');
    } finally {
      isLoading = false;
    }
  });

  // An entity is "revealed" if it has an anchor to a currently visible block
  // OR if we are in editor mode (where everything is visible)
  const revealedEntityIds = $derived.by(() => {
    if (visibleBlockIds.length === 0) return new Set(entities.map(e => e.id));
    
    const ids = new Set<string>();
    anchors.forEach(a => {
      if (visibleBlockIds.includes(a.block_id)) {
        ids.add(a.entity_id);
      }
    });
    return ids;
  });

  async function handleAnchor(entityId: string) {
    if (!activeBlockId) {
      notifications.error('Click in the editor to select a block first.');
      return;
    }

    try {
      await createWikiAnchor(sceneId, entityId, activeBlockId);
      notifications.success('Linked to block!');
    } catch (e) {
      console.error(e);
      notifications.error('Failed to link entity.');
    }
  }

  const filteredEntities = $derived(
    entities.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  function getIcon(category: string) {
    switch (category) {
      case 'character': return User;
      case 'location': return MapPin;
      case 'thread': return Flag;
      case 'clock': return Timer;
      default: return Sparkles;
    }
  }
</script>

<div class="flex flex-col h-full">
  <div class="px-6 py-4 space-y-4">
    <div class="relative">
      <input 
        type="text" 
        bind:value={searchQuery}
        placeholder="Search the world..."
        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
      />
    </div>
  </div>

  <div class="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
    {#if isLoading}
      <div class="p-8 text-center animate-pulse">
        <div class="w-8 h-8 bg-white/10 rounded-full mx-auto mb-4"></div>
        <div class="h-2 w-24 bg-white/10 rounded mx-auto"></div>
      </div>
    {:else if filteredEntities.length === 0}
      <div class="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
        <p class="text-[10px] text-stone-600 font-bold uppercase tracking-widest">No entries found</p>
      </div>
    {:else}
      {#each filteredEntities as entity (entity.id)}
        {@const isRevealed = revealedEntityIds.has(entity.id)}
        {@const Icon = getIcon(entity.category)}
        <div 
          class="group p-4 rounded-2xl border transition-all shadow-sm {isRevealed ? 'bg-white/5 border-white/5 opacity-100' : 'bg-white/[0.01] border-transparent opacity-20'}"
          transition:slide
        >
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg {isRevealed ? 'bg-primary/10 text-primary' : 'bg-stone-800 text-stone-600'}">
                <Icon size={16} />
              </div>
              <div>
                <h4 class="text-sm font-bold {isRevealed ? 'text-white' : 'text-stone-600'} leading-tight">{entity.name}</h4>
                <span class="text-[10px] {isRevealed ? 'text-stone-500' : 'text-stone-700'} font-bold uppercase tracking-widest">{entity.category}</span>
              </div>
            </div>
            
            {#if !visibleBlockIds.length}
              <button 
                onclick={() => handleAnchor(entity.id)}
                class="p-2 text-stone-500 hover:text-primary transition-colors rounded-lg hover:bg-primary/10 opacity-0 group-hover:opacity-100"
                title="Anchor to current block"
              >
                <Pin size={14} />
              </button>
            {/if}
          </div>
          
          {#if entity.description && isRevealed}
            <p class="text-xs text-stone-400 line-clamp-2 leading-relaxed" transition:fade>
              {entity.description}
            </p>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <div class="p-4 border-t border-white/5 bg-white/[0.02]">
    <button class="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-stone-500 hover:text-white hover:border-white/20 transition-all uppercase tracking-widest">
      <Plus size={14} />
      New Wiki Entry
    </button>
  </div>
</div>
