<script lang="ts">
  import Tiptap from '$lib/editor/Tiptap.svelte';
  import { History, Eye, ArrowRight, Calendar, AlertCircle } from '@lucide/svelte';
  import { fade, slide } from 'svelte/transition';
  import { supabase } from '$lib/supabaseClient';

  let { data } = $props<{ data: any }>();
  
  let currentSceneContent = $state(data.scene.content || '');
  let selectedVersionId = $state<string | null>(null);
  let selectedVersionNumber = $state<number | null>(null);
  let selectedVersionContent = $state<any>('');
  let isLoadingVersion = $state(false);

  async function selectVersion(versionId: string, versionNumber: number) {
    if (selectedVersionId === versionId) return;
    selectedVersionId = versionId;
    selectedVersionNumber = versionNumber;
    isLoadingVersion = true;
    
    // Fetch the version content from Supabase
    const { data: verData, error } = await supabase
      .from('scene_versions')
      .select('content')
      .eq('id', versionId)
      .single();
    
    isLoadingVersion = false;
    if (!error && verData) {
      // In production/Tiptap, content is stored as JSON or HTML. We'll stringify JSON to HTML or use it.
      // If it's a JSON object, convert to HTML using a parser, or if stored as HTML, use directly.
      if (typeof verData.content === 'object' && verData.content !== null) {
        selectedVersionContent = verData.content;
      } else {
        selectedVersionContent = verData.content || '';
      }
    }
  }

  // Format helper for dates
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="absolute inset-0 flex bg-stone-950 font-sans text-stone-100 overflow-hidden">
  
  <!-- Left Sidebar: Snapshots List -->
  <aside class="w-80 border-r border-white/5 bg-stone-900/10 flex flex-col shrink-0">
    <div class="p-6 border-b border-white/5 bg-white/[0.02]">
      <h3 class="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
        <History class="w-4 h-4 text-primary" />
        Snapshot History
      </h3>
      <p class="text-[10px] text-stone-600 font-medium mt-1 leading-relaxed">
        Select a read-only snapshot from the past to compare against your active track.
      </p>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
      {#if data.versions.length === 0}
        <div class="p-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
          <p class="text-[10px] text-stone-600 font-bold uppercase tracking-widest mb-1">No Snapshots</p>
          <p class="text-xs text-stone-700 italic">Save a snapshot in the Editor to start version tracking.</p>
        </div>
      {:else}
        {#each data.versions as ver}
          <button
            onclick={() => selectVersion(ver.id, ver.version_number)}
            class="w-full text-left p-4 border rounded-2xl transition-all flex flex-col gap-2 group {selectedVersionId === ver.id ? 'bg-primary/10 border-primary shadow-[0_0_12px_rgba(var(--primary),0.05)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'}"
          >
            <div class="flex justify-between items-center w-full">
              <span class="text-xs font-bold uppercase tracking-wider {selectedVersionId === ver.id ? 'text-primary' : 'text-stone-300'}">
                Snapshot v{ver.version_number}
              </span>
              <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-stone-500">
                {ver.stage}
              </span>
            </div>
            
            <div class="flex items-center text-[10px] text-stone-500 font-medium gap-1.5">
              <Calendar class="w-3 h-3 text-stone-600" />
              <span>{formatDate(ver.created_at)}</span>
            </div>
          </button>
        {/each}
      {/if}
    </div>
  </aside>

  <!-- Split View Compare / Diff Canvas -->
  <div class="flex-1 flex overflow-hidden relative">
    {#if !selectedVersionId}
      <!-- Empty State -->
      <div class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center" in:fade>
        <div class="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
          <History class="w-8 h-8 text-stone-600" />
        </div>
        <h3 class="text-lg font-serif font-bold text-white/90 mb-2">Compare Historical Snapshots</h3>
        <p class="text-sm text-stone-500 max-w-md leading-relaxed">
          Select any past version from the left panel to open the side-by-side comparison screen. You'll be able to review history and cherry-pick elements back into your current timeline.
        </p>
      </div>
    {:else}
      <!-- Active Split Screen -->
      <div class="flex-1 grid grid-cols-2 gap-4 p-6 overflow-hidden h-full min-h-0" in:fade>
        
        <!-- Left: Past Version (Read-Only) -->
        <div class="flex flex-col h-full min-h-0">
          <div class="flex justify-between items-center px-4 py-2 bg-stone-900/40 border border-white/5 border-b-0 rounded-t-2xl shrink-0">
            <span class="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
              <Eye class="w-3.5 h-3.5 text-stone-600" />
              Snapshot v{selectedVersionNumber} (Read-Only)
            </span>
          </div>
          <div class="flex-1 min-h-0 bg-stone-950 border border-white/5 rounded-b-2xl overflow-hidden relative">
            {#if isLoadingVersion}
              <div class="absolute inset-0 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm z-30">
                <span class="text-xs font-bold text-stone-500 tracking-wider">Loading snapshot...</span>
              </div>
            {/if}
            <Tiptap 
              content={selectedVersionContent}
              editable={false}
              sceneId={data.scene.id}
            />
          </div>
        </div>

        <!-- Right: Active Version (Editable) -->
        <div class="flex flex-col h-full min-h-0 relative">
          <div class="flex justify-between items-center px-4 py-2 bg-stone-900/40 border border-white/5 border-b-0 rounded-t-2xl shrink-0">
            <span class="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              Active Track (Editable)
            </span>
            <div class="flex items-center text-[10px] text-stone-600 font-bold gap-1">
              <AlertCircle class="w-3 h-3" />
              <span>Copy-paste block contents to cherry-pick</span>
            </div>
          </div>
          <div class="flex-1 min-h-0 bg-stone-950 border border-white/5 rounded-b-2xl overflow-hidden">
            <Tiptap 
              bind:content={currentSceneContent}
              sceneId={data.scene.id}
            />
          </div>
        </div>

      </div>
    {/if}
  </div>

</div>
