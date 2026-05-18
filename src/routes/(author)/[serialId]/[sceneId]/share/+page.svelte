<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { notifications } from '$lib/stores/notifications';
  import { Eye, Calendar, Award, GitBranch, Save, Info, AlertTriangle, ShieldCheck } from '@lucide/svelte';
  import { fade, slide } from 'svelte/transition';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props<{ data: any }>();

  // Scene publishing settings
  let activeStatus = $state(data.scene.status || 'Playing');
  let semanticVersion = $state(data.scene.semantic_version || '1.0.0');
  let isScheduled = $state(!!data.scene.scheduled_status_at);
  let scheduledDate = $state(data.scene.scheduled_status_at ? data.scene.scheduled_status_at.split('T')[0] : '');
  let scheduledTime = $state(data.scene.scheduled_status_at ? data.scene.scheduled_status_at.split('T')[1]?.substring(0, 5) : '08:00');
  
  // Serial-level teaser settings
  let teaserPercent = $state(data.scene.serials?.next_scene_completion_percentage || 0);
  let teaserNote = $state(data.scene.serials?.next_scene_update_note || '');

  let isSavingScene = $state(false);
  let isSavingTeaser = $state(false);

  // Derived dirty state check for publish settings
  let isDirty = $derived(
    activeStatus !== (data.scene.status || 'Playing') ||
    semanticVersion !== (data.scene.semantic_version || '1.0.0') ||
    isScheduled !== (!!data.scene.scheduled_status_at) ||
    (isScheduled && scheduledDate !== (data.scene.scheduled_status_at ? data.scene.scheduled_status_at.split('T')[0] : '')) ||
    (isScheduled && scheduledTime !== (data.scene.scheduled_status_at ? data.scene.scheduled_status_at.split('T')[1]?.substring(0, 5) : '08:00'))
  );

  // Status explanations
  const statusLevels = [
    { name: 'Playing', desc: 'Currently in active play/journaling mode. Hidden from readers.', color: 'text-stone-500 bg-stone-500/10' },
    { name: 'Editing', desc: 'Drafting finished, currently polishing narrative text. Hidden from readers.', color: 'text-amber-500 bg-amber-500/10' },
    { name: 'Beta', desc: 'Available only to beta readers or special premium tiers.', color: 'text-blue-500 bg-blue-500/10' },
    { name: 'Published', desc: 'Fully released and readable by all subscribers.', color: 'text-emerald-500 bg-emerald-500/10' },
    { name: 'Hidden', desc: 'Archived or temporarily hidden from feeds.', color: 'text-rose-500 bg-rose-500/10' }
  ];

  // Bumping version helper
  function bumpVersion(type: 'major' | 'minor' | 'patch') {
    const parts = semanticVersion.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return;

    if (type === 'major') {
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
    } else if (type === 'minor') {
      parts[1] += 1;
      parts[2] = 0;
    } else if (type === 'patch') {
      parts[2] += 1;
    }
    semanticVersion = parts.join('.');
  }

  async function saveScenePublishSettings() {
    isSavingScene = true;
    
    let scheduledTimestamp: string | null = null;
    if (isScheduled && scheduledDate) {
      scheduledTimestamp = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
    }

    const { error } = await supabase
      .from('scenes')
      .update({
        status: activeStatus,
        semantic_version: semanticVersion,
        scheduled_status: isScheduled ? 'Published' : null,
        scheduled_status_at: scheduledTimestamp,
        published_at: activeStatus === 'Published' ? new Date().toISOString() : data.scene.published_at
      })
      .eq('id', data.scene.id);

    isSavingScene = false;
    
    if (error) {
      console.error(error);
      notifications.error('Failed to update scene settings.');
    } else {
      await invalidateAll();
      notifications.success('Scene settings updated successfully!');
    }
  }

  async function saveSerialTeaser() {
    isSavingTeaser = true;
    const { error } = await supabase
      .from('serials')
      .update({
        next_scene_completion_percentage: teaserPercent,
        next_scene_update_note: teaserNote
      })
      .eq('id', data.scene.serial_id);
    
    isSavingTeaser = false;
    if (error) {
      console.error(error);
      notifications.error('Failed to update progress teaser.');
    } else {
      await invalidateAll();
      notifications.success('Progress teaser updated successfully!');
    }
  }
</script>

<div class="absolute inset-0 overflow-y-auto bg-stone-950 p-8 font-sans text-stone-100">
  <div class="max-w-4xl mx-auto space-y-8 pb-32">
    
    <!-- Header -->
    <div class="space-y-2">
      <h2 class="text-3xl font-bold font-serif text-white/95">Publishing & Sharing Workspace</h2>
      <p class="text-sm text-stone-500 leading-relaxed max-w-2xl">
        Manage scene visibility, queue scheduled status transitions, tag semantic versions, and construct upcoming teaser metrics for your reader base.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      <!-- Left / Mid Columns: Scene Publishing & Versioning -->
      <div class="md:col-span-2 space-y-6">
        
        <!-- Access Control Card -->
        <div class="bg-stone-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-5">
          <h3 class="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 border-b border-white/5 pb-3">
            <Eye class="w-4 h-4 text-primary" />
            Access-Based Status Hierarchy
          </h3>

          <div class="grid grid-cols-1 gap-2.5">
            {#each statusLevels as level}
              <button
                onclick={() => activeStatus = level.name}
                class="flex items-start text-left p-4 border rounded-2xl transition-all gap-4 {activeStatus === level.name ? 'bg-white/[0.03] border-primary shadow-[0_0_12px_rgba(var(--primary),0.03)]' : 'bg-transparent border-white/5 hover:border-white/10'}"
              >
                <div class="w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 {activeStatus === level.name ? 'border-primary' : 'border-stone-600'}">
                  {#if activeStatus === level.name}
                    <div class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                  {/if}
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-white/90">{level.name}</span>
                    <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full {level.color}">
                      Hierarchy Level
                    </span>
                  </div>
                  <p class="text-xs text-stone-500 font-medium leading-relaxed">{level.desc}</p>
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Scheduled Publishing Card -->
        <div class="bg-stone-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-5">
          <div class="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 class="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
              <Calendar class="w-4 h-4 text-primary" />
              Scheduled Status Transitions
            </h3>
            <button
              onclick={() => isScheduled = !isScheduled}
              class="px-3.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all {isScheduled ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-stone-500 hover:text-white'}"
            >
              {isScheduled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {#if isScheduled}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" transition:slide>
              <div class="space-y-1.5">
                <label for="sched_date" class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Release Date</label>
                <input 
                  id="sched_date"
                  type="date" 
                  bind:value={scheduledDate}
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div class="space-y-1.5">
                <label for="sched_time" class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Release Time</label>
                <input 
                  id="sched_time"
                  type="time" 
                  bind:value={scheduledTime}
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div class="flex items-start gap-2.5 p-4 rounded-2xl bg-white/[0.01] border border-white/5" transition:fade>
              <Info class="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <p class="text-[10px] text-stone-500 font-medium leading-relaxed">
                Decoupled Query-Time execution model: Readers' notification schedules in Phase 6 will actively check this timestamp. A background cron job is not required to publish it.
              </p>
            </div>
          {:else}
            <p class="text-xs text-stone-500 italic">This scene will switch state immediately upon saving.</p>
          {/if}
        </div>

      </div>

      <!-- Right Column: Versioning & Progress Teasers -->
      <div class="space-y-6">
        
        <!-- Semantic Versioning Card -->
        <div class="bg-stone-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-5">
          <h3 class="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 border-b border-white/5 pb-3">
            <GitBranch class="w-4 h-4 text-primary" />
            Semantic Versioning
          </h3>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label for="sem_ver" class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Reader-facing Version</label>
              <input 
                id="sem_ver"
                type="text" 
                bind:value={semanticVersion}
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-center tracking-widest text-stone-100 focus:outline-none focus:border-primary/50 transition-all"
                placeholder="e.g. 1.0.0"
              />
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button 
                onclick={() => bumpVersion('major')}
                class="py-2 border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                + Major
              </button>
              <button 
                onclick={() => bumpVersion('minor')}
                class="py-2 border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                + Minor
              </button>
              <button 
                onclick={() => bumpVersion('patch')}
                class="py-2 border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                + Patch
              </button>
            </div>
            
            <p class="text-[9px] text-stone-500 font-medium leading-relaxed">
              Use Major for full rewrites, Minor for polish/additions, and Patch for small typo fixes.
            </p>
          </div>
        </div>

        <!-- Serial Progress Teaser Card -->
        <div class="bg-stone-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-5">
          <h3 class="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 border-b border-white/5 pb-3">
            <Award class="w-4 h-4 text-primary" />
            Upcoming Teaser
          </h3>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                <label for="teaser_percent" class="text-stone-400">Completion</label>
                <span class="text-primary font-mono">{teaserPercent}%</span>
              </div>
              <input 
                id="teaser_percent"
                type="range" 
                min="0" 
                max="100" 
                bind:value={teaserPercent}
                class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div class="space-y-1.5">
              <label for="teaser_note" class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Update Teaser Note</label>
              <textarea 
                id="teaser_note"
                bind:value={teaserNote}
                rows="3"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-stone-200 focus:outline-none focus:border-primary/50 transition-all resize-none leading-relaxed"
                placeholder="Tease your readers with what's next..."
              ></textarea>
            </div>

            <button 
              onclick={saveSerialTeaser}
              disabled={isSavingTeaser}
              class="w-full flex items-center justify-center py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all rounded-xl font-bold text-xs gap-2"
            >
              <Save class="w-4 h-4 text-stone-400" />
              {isSavingTeaser ? 'Saving Teaser...' : 'Save Teaser'}
            </button>
          </div>
        </div>

      </div>

    </div>

    <!-- Sticky Bottom Bar -->
    {#if isDirty}
      <div transition:fade={{ duration: 150 }} class="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 z-40">
        <div class="bg-stone-900/90 border border-white/10 shadow-2xl rounded-2xl p-4 backdrop-blur-xl flex justify-between items-center">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-5 h-5 text-emerald-400" />
            <span class="text-xs text-stone-300 font-bold">Unsaved scene configuration settings.</span>
          </div>
          <button
            onclick={saveScenePublishSettings}
            disabled={isSavingScene}
            class="flex items-center px-6 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-lg shadow-primary/20 transition-all text-xs font-bold disabled:opacity-50"
          >
            <Save class="w-4 h-4 mr-2" />
            {isSavingScene ? 'Saving Settings...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    {/if}

  </div>
</div>
