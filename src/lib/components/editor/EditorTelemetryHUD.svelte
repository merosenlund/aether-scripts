<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { telemetryStore } from '$lib/stores/telemetry.svelte';
  import { authorPresence } from '$lib/stores/authorPresence.svelte';
  import { supabase } from '$lib/supabaseClient';
  import { Clock, Type, BarChart2, Zap } from '@lucide/svelte';

  let {
    serialId = '',
    sceneId = '',
    serialTitle = '',
    sessionType = 'play' as 'play' | 'edit',
    initialContent = ''
  } = $props<{
    serialId: string;
    sceneId: string;
    serialTitle: string;
    sessionType: 'play' | 'edit';
    initialContent?: string;
  }>();

  let otherScenesWordCount = $state(0);
  let userId = $state('');

  // Format seconds to HH:MM:SS or MM:SS
  function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Calculate live series word count
  let seriesWordCount = $derived(otherScenesWordCount + telemetryStore.currentWordCount);
  
  // Calculate session word delta
  let sessionWordsDelta = $derived(telemetryStore.currentWordCount - telemetryStore.startingWordCount);

  onMount(async () => {
    // 1. Get current logged in user ID for presence broadcasting
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      
      // Start broadcasting that author is online
      authorPresence.startBroadcasting(userId, {
        isTyping: false,
        currentSerialId: serialId,
        currentSerialTitle: serialTitle,
        currentSceneId: sceneId
      });
    }

    // 2. Fetch all other scenes' word counts in the serial to compute series total
    const { data: scenes } = await supabase
      .from('scenes')
      .select('word_count')
      .eq('serial_id', serialId)
      .neq('id', sceneId);
      
    if (scenes) {
      otherScenesWordCount = scenes.reduce((sum, s) => sum + (s.word_count || 0), 0);
    }

    // 3. Initialize/Start the telemetry session
    // We calculate the starting word count directly from the initial content HTML passed in
    let initialWordCount = 0;
    if (initialContent) {
      const text = initialContent.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
      initialWordCount = text.trim() ? text.trim().split(/\s+/).filter((w: string) => w.length > 0).length : 0;
    }
    
    telemetryStore.startSession(sceneId, serialId, sessionType, initialWordCount);

    // 4. Handle window closing/reloading to save session
    window.addEventListener('beforeunload', handleUnload);
  });

  onDestroy(() => {
    handleUnload();
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleUnload);
    }
  });

  function handleUnload() {
    if (userId) {
      authorPresence.cleanup();
    }
    
    // Save scene word count back to the database before leaving
    if (telemetryStore.isActive) {
      const finalCount = telemetryStore.currentWordCount;
      // We fire-and-forget this because on window unload we need it to go out fast
      supabase.from('scenes').update({ word_count: finalCount }).eq('id', sceneId).then();
      
      telemetryStore.endSession();
    }
  }

  // Svelte 5 effect for typing presence broadcast
  $effect(() => {
    if (!userId || !telemetryStore.isActive) return;

    // Depend on keystrokes trigger
    const _keystrokes = telemetryStore.keystrokes;
    if (_keystrokes === 0) return;

    // User is typing!
    authorPresence.updateBroadcast({
      isTyping: true,
      currentSerialId: serialId,
      currentSerialTitle: serialTitle,
      currentSceneId: sceneId
    });

    // Reset typing state after 2.5 seconds of inactivity
    const timer = setTimeout(() => {
      authorPresence.updateBroadcast({
        isTyping: false,
        currentSerialId: serialId,
        currentSerialTitle: serialTitle,
        currentSceneId: sceneId
      });
    }, 2500);

    return () => clearTimeout(timer);
  });
</script>

<div class="w-full bg-stone-900/90 border-t border-white/5 backdrop-blur-xl shrink-0 px-8 py-3.5 flex items-center justify-between text-stone-400 text-xs font-medium z-30 shadow-2xl relative">
  <!-- Glowing Ambient Line at Top of Footer -->
  <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

  <!-- Left: Live Word Counts -->
  <div class="flex items-center gap-6">
    <div class="flex items-center gap-2">
      <Type class="w-3.5 h-3.5 text-stone-500" />
      <span class="text-stone-500 uppercase tracking-wider font-bold text-[10px]">Scene:</span>
      <span class="text-stone-200 font-mono font-bold text-sm">{telemetryStore.currentWordCount}</span>
      <span class="text-stone-600">words</span>
    </div>

    <div class="h-4 w-px bg-white/10"></div>

    <div class="flex items-center gap-2">
      <BarChart2 class="w-3.5 h-3.5 text-stone-500" />
      <span class="text-stone-500 uppercase tracking-wider font-bold text-[10px]">Series Total:</span>
      <span class="text-stone-200 font-mono font-bold text-sm">{seriesWordCount}</span>
      <span class="text-stone-600">words</span>
    </div>
  </div>

  <!-- Center: Session Progress Delta -->
  <div class="flex items-center gap-2 px-4 py-1 rounded-full bg-white/[0.03] border border-white/5 shadow-inner">
    {#if sessionWordsDelta >= 0}
      <span class="text-emerald-400 font-bold font-mono text-[11px]">+{sessionWordsDelta}</span>
    {:else}
      <span class="text-rose-400 font-bold font-mono text-[11px]">{sessionWordsDelta}</span>
    {/if}
    <span class="text-[10px] text-stone-600 uppercase tracking-wider font-bold">this session</span>
  </div>

  <!-- Right: Session Telemetry Stopwatch & Speed -->
  <div class="flex items-center gap-6">
    <!-- Active Duration -->
    <div class="flex items-center gap-2">
      <Clock class="w-3.5 h-3.5 text-stone-500" />
      <span class="text-stone-500 uppercase tracking-wider font-bold text-[10px]">Elapsed:</span>
      <span class="text-stone-200 font-mono font-bold text-sm">{formatTime(telemetryStore.durationSeconds)}</span>
    </div>

    <div class="h-4 w-px bg-white/10"></div>

    <!-- Rolling WPM -->
    <div class="flex items-center gap-2">
      <Zap class="w-3.5 h-3.5 text-stone-500" />
      <span class="text-stone-500 uppercase tracking-wider font-bold text-[10px]">Speed:</span>
      <span class="text-stone-200 font-mono font-bold text-sm">{telemetryStore.wpm}</span>
      <span class="text-stone-600 font-bold text-[10px] uppercase tracking-wider">WPM</span>
    </div>

    <!-- Keystroke effort indicators (hidden on small screen) -->
    <div class="hidden sm:flex items-center gap-2">
      <div class="h-4 w-px bg-white/10 mr-4"></div>
      <span class="text-stone-500 uppercase tracking-wider font-bold text-[10px]">Keystrokes:</span>
      <span class="text-stone-300 font-mono font-bold">{telemetryStore.keystrokes}</span>
    </div>
  </div>
</div>
