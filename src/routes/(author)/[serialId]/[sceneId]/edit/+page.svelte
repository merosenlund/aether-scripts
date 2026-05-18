<script lang="ts">
  import Tiptap from '$lib/editor/Tiptap.svelte';
  import WikiSidebar from '$lib/components/WikiSidebar.svelte';
  import EditorTelemetryHUD from '$lib/components/editor/EditorTelemetryHUD.svelte';
  import { Save, BookOpen, FileText, Settings2 } from '@lucide/svelte';
  import { fade } from 'svelte/transition';
  import { supabase } from '$lib/supabaseClient';

  let { data } = $props<{ data: any }>();
  let content = $state(data.scene.content || '');
  let authorTitle = $state(data.scene.author_title || '');
  let displayTitle = $state(data.scene.display_title || '');
  let description = $state(data.scene.description || '');
  let summary = $state(data.scene.summary || '');
  let activeBlockId = $state('');
  let visibleBlockIds = $state<string[]>([]);
  let activeTab = $state('wiki');
  let editorComponent = $state<any>();
  let isSavingSettings = $state(false);
  let saveSuccess = $state(false);

  async function saveMetadata() {
    isSavingSettings = true;
    const { error } = await supabase
      .from('scenes')
      .update({
        author_title: authorTitle,
        display_title: displayTitle,
        description,
        summary
      })
      .eq('id', data.scene.id);
    
    isSavingSettings = false;
    if (!error) {
      saveSuccess = true;
      setTimeout(() => saveSuccess = false, 3000);
      // Reload scene data if needed or let client react
    }
  }
</script>

<div class="absolute inset-0 flex flex-col overflow-hidden bg-stone-950 font-sans text-stone-100">
  <div class="flex-1 flex overflow-hidden min-h-0">
    <!-- Main Editor Area -->
    <div class="flex-1 flex flex-col items-center overflow-hidden px-8 pt-8 relative animate-fade-in">
      <div class="w-full max-w-4xl flex flex-col h-full min-h-0">
        
        <!-- Editor Header / Action Row -->
        <div class="flex justify-end gap-3 mb-6 shrink-0">
          <button 
            onclick={() => editorComponent?.save()}
            disabled={editorComponent?.getIsSaving?.()}
            class="flex items-center px-5 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-lg shadow-primary/20 transition-all text-xs font-bold disabled:opacity-50"
          >
            <Save class="w-3.5 h-3.5 mr-2" />
            {editorComponent?.getIsSaving?.() ? 'Saving...' : 'Create Snapshot'}
          </button>
        </div>

        <!-- Editor Canvas -->
        <div class="flex-1 min-h-0 relative group">
          <Tiptap 
            bind:this={editorComponent}
            bind:content 
            bind:activeBlockId
            sceneId={data.scene.id}
            onUpdate={(html) => content = html}
          />
        </div>
      </div>
    </div>

    <!-- Sidebar: Draft & Revision Tools -->
    <aside class="w-85 border-l border-white/5 bg-stone-900/20 backdrop-blur-3xl overflow-y-auto flex flex-col z-20 shadow-2xl">
      <div class="p-4 border-b border-white/5 bg-white/5 flex gap-2">
        <button 
          onclick={() => activeTab = 'wiki'}
          class="flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all {activeTab === 'wiki' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-stone-500 hover:text-white hover:bg-white/5'}"
        >
          <BookOpen class="w-3.5 h-3.5 mr-2" />
          Wiki
        </button>
        <button 
          onclick={() => activeTab = 'metadata'}
          class="flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all {activeTab === 'metadata' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-stone-500 hover:text-white hover:bg-white/5'}"
        >
          <FileText class="w-3.5 h-3.5 mr-2" />
          Meta
        </button>
      </div>
      
      <div class="flex-1 overflow-hidden">
        {#if activeTab === 'metadata'}
          <div class="p-6 space-y-5 h-full overflow-y-auto" in:fade>
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] flex items-center">
                Scene Metadata
                <div class="ml-2 w-12 h-px bg-white/5"></div>
              </h3>
              {#if saveSuccess}
                <span class="text-[10px] text-emerald-400 font-bold" transition:fade>Saved!</span>
              {/if}
            </div>

            <div class="space-y-4">
              <div class="space-y-1.5">
                <label for="author_title" class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Author Title (Internal)</label>
                <input 
                  id="author_title"
                  type="text" 
                  bind:value={authorTitle} 
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-primary/50 transition-all font-serif"
                  placeholder="e.g. Chapter 1: The Awakening (Draft)"
                />
              </div>

              <div class="space-y-1.5">
                <label for="display_title" class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Display Title (Reader-facing)</label>
                <input 
                  id="display_title"
                  type="text" 
                  bind:value={displayTitle} 
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-primary/50 transition-all font-serif"
                  placeholder="e.g. Chapter I: The Awakening"
                />
              </div>

              <div class="space-y-1.5">
                <label for="description" class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Teaser / Description</label>
                <textarea 
                  id="description"
                  bind:value={description} 
                  rows="3"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-primary/50 transition-all resize-none"
                  placeholder="A short teaser displayed in feeds..."
                ></textarea>
              </div>

              <div class="space-y-1.5">
                <label for="summary" class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Scene Summary</label>
                <textarea 
                  id="summary"
                  bind:value={summary} 
                  rows="4"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-primary/50 transition-all resize-none font-medium"
                  placeholder="A brief summary for reading lists..."
                ></textarea>
              </div>

              <button 
                onclick={saveMetadata}
                disabled={isSavingSettings}
                class="w-full flex items-center justify-center py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all rounded-xl font-bold text-xs gap-2"
              >
                <Settings2 class="w-4 h-4 text-stone-400" />
                {isSavingSettings ? 'Saving...' : 'Save Metadata'}
              </button>
            </div>
          </div>
        {:else}
          <div class="h-full" in:fade>
            <WikiSidebar 
              serialId={data.scene.serial_id} 
              sceneId={data.scene.id} 
              {activeBlockId} 
              {visibleBlockIds}
            />
          </div>
        {/if}
      </div>
    </aside>
  </div>

  <!-- Sticky Telemetry HUD -->
  <EditorTelemetryHUD
    serialId={data.scene.serial_id}
    sceneId={data.scene.id}
    serialTitle={data.scene.serials?.title || ''}
    sessionType="edit"
    initialContent={data.scene.content || ''}
  />
</div>
