<script lang="ts">
  import { enhance } from '$app/forms';
  import { Clock, Zap, Target, BookOpen, PenTool, Flame, ArrowUpRight, BarChart3, Edit3 } from '@lucide/svelte';
  import { fade } from 'svelte/transition';

  let { data, form } = $props<{ data: any; form: any }>();

  // Extract from loaded data
  let goals = $derived(data.goals);
  let sessions = $derived.by(() => {
    return (data.sessions || []).map((s: any) => {
      const duration = s.active_duration_seconds || 0;
      const minutes = duration / 60;
      const netWords = Math.max(0, (s.ending_word_count || 0) - (s.starting_word_count || 0));
      const wpm = minutes > 0 ? Math.round(netWords / minutes) : 0;
      return {
        ...s,
        wpm
      };
    });
  });

  // Aggregated stats
  let totalDuration = $derived(sessions.reduce((sum: number, s: any) => sum + (s.active_duration_seconds || 0), 0));
  let totalKeystrokes = $derived(sessions.reduce((sum: number, s: any) => sum + (s.keystrokes || 0), 0));
  
  // Calculate average WPM across sessions with WPM > 0
  let averageWpm = $derived.by(() => {
    const activeSessions = sessions.filter((s: any) => s.wpm > 0);
    if (activeSessions.length === 0) return 0;
    return Math.round(activeSessions.reduce((sum: number, s: any) => sum + s.wpm, 0) / activeSessions.length);
  });

  // Mode division (Play vs Edit)
  let playStats = $derived.by(() => {
    const playSessions = sessions.filter((s: any) => s.session_type === 'play');
    const duration = playSessions.reduce((sum: number, s: any) => sum + (s.active_duration_seconds || 0), 0);
    const words = playSessions.reduce((sum: number, s: any) => sum + ((s.ending_word_count || 0) - (s.starting_word_count || 0)), 0);
    return { duration, words, count: playSessions.length };
  });

  let editStats = $derived.by(() => {
    const editSessions = sessions.filter((s: any) => s.session_type === 'edit');
    const duration = editSessions.reduce((sum: number, s: any) => sum + (s.active_duration_seconds || 0), 0);
    const words = editSessions.reduce((sum: number, s: any) => sum + ((s.ending_word_count || 0) - (s.starting_word_count || 0)), 0);
    return { duration, words, count: editSessions.length };
  });

  // Calculate actual progress towards goals
  let progressStats = $derived.by(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // 7 days ago
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    
    // 30 days ago
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    let todayWords = 0;
    let weekWords = 0;
    let monthWords = 0;

    for (const session of sessions) {
      const startTime = new Date(session.start_time).getTime();
      const netWords = Math.max(0, (session.ending_word_count || 0) - (session.starting_word_count || 0));

      if (startTime >= startOfToday) {
        todayWords += netWords;
      }
      if (startTime >= sevenDaysAgo) {
        weekWords += netWords;
      }
      if (startTime >= thirtyDaysAgo) {
        monthWords += netWords;
      }
    }

    return { todayWords, weekWords, monthWords };
  });

  // Formatter helpers
  function formatHours(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }

  function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  let isEditingGoals = $state(false);
</script>

<div class="min-h-screen bg-stone-950 text-stone-100 font-sans pb-16">
  <!-- Dynamic Glowing Header Banner -->
  <div class="relative py-12 px-8 border-b border-white/5 bg-gradient-to-b from-stone-900/50 via-stone-950 to-stone-950 overflow-hidden shrink-0">
    <div class="absolute -top-40 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
    <div class="absolute -top-30 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>
    
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
      <div>
        <h1 class="text-3xl font-serif font-bold tracking-tight bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent">
          Author Analytics Dashboard
        </h1>
        <p class="text-stone-400 text-sm mt-1.5 font-medium">
          Visualize your active writing duration, speed, goals, and effort metrics.
        </p>
      </div>

      <!-- Action Button -->
      <button 
        onclick={() => isEditingGoals = !isEditingGoals}
        class="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all rounded-xl text-xs font-bold text-stone-200 shadow-lg shadow-black/30"
      >
        <Target class="w-4 h-4 text-primary" />
        {isEditingGoals ? 'View Dashboard' : 'Customize Goals'}
      </button>
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-8 mt-8">
    {#if isEditingGoals}
      <!-- Goal Editing Sub-View -->
      <div in:fade class="max-w-xl mx-auto bg-stone-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative">
        <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        <h2 class="text-lg font-serif font-bold text-white mb-1 flex items-center gap-2">
          <Target class="w-5 h-5 text-primary" />
          Define Your Writing Goals
        </h2>
        <p class="text-xs text-stone-400 mb-6">Set target milestone counts to measure your productivity over time.</p>

        <form method="POST" action="?/updateGoals" use:enhance={() => {
          return ({ result }) => {
            if (result.type === 'success') {
              isEditingGoals = false;
            }
          }
        }} class="space-y-6">
          <div class="space-y-2">
            <label for="daily_word_goal" class="text-xs font-bold uppercase tracking-wider text-stone-400 flex justify-between">
              <span>Daily Word Target</span>
              <span class="text-primary font-mono">{goals.daily_word_goal} words</span>
            </label>
            <input 
              id="daily_word_goal"
              name="daily_word_goal"
              type="number"
              defaultValue={goals.daily_word_goal}
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-primary/50 transition-all font-mono"
              placeholder="e.g. 500"
            />
          </div>

          <div class="space-y-2">
            <label for="weekly_word_goal" class="text-xs font-bold uppercase tracking-wider text-stone-400 flex justify-between">
              <span>Weekly Word Target</span>
              <span class="text-primary font-mono">{goals.weekly_word_goal} words</span>
            </label>
            <input 
              id="weekly_word_goal"
              name="weekly_word_goal"
              type="number"
              defaultValue={goals.weekly_word_goal}
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-primary/50 transition-all font-mono"
              placeholder="e.g. 3500"
            />
          </div>

          <div class="space-y-2">
            <label for="monthly_word_goal" class="text-xs font-bold uppercase tracking-wider text-stone-400 flex justify-between">
              <span>Monthly Word Target</span>
              <span class="text-primary font-mono">{goals.monthly_word_goal} words</span>
            </label>
            <input 
              id="monthly_word_goal"
              name="monthly_word_goal"
              type="number"
              defaultValue={goals.monthly_word_goal}
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-primary/50 transition-all font-mono"
              placeholder="e.g. 15000"
            />
          </div>

          <button 
            type="submit"
            class="w-full py-3.5 bg-primary text-primary-foreground font-bold hover:opacity-90 rounded-xl shadow-lg shadow-primary/20 transition-all text-xs"
          >
            Save Goal Configuration
          </button>
        </form>
      </div>
    {:else}
      <!-- Main Dashboard Grid -->
      <div class="space-y-8">
        
        <!-- Premium Core Metrics Overview -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Active Duration Card -->
          <div class="bg-stone-900/20 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all shadow-sm relative group overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/15 transition-all"></div>
            <span class="text-stone-500 font-bold uppercase tracking-wider text-[10px] block">Total Duration</span>
            <span class="text-2xl font-serif font-bold text-white block mt-2">{formatHours(totalDuration)}</span>
            <div class="flex items-center text-[10px] text-stone-400 mt-3 font-medium gap-1.5">
              <Clock class="w-3.5 h-3.5 text-primary" />
              <span>Time spent in editor</span>
            </div>
          </div>

          <!-- Total Keystrokes effort metric -->
          <div class="bg-stone-900/20 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all shadow-sm relative group overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all"></div>
            <span class="text-stone-500 font-bold uppercase tracking-wider text-[10px] block">Keystroke Effort</span>
            <span class="text-2xl font-serif font-bold text-white block mt-2">{totalKeystrokes.toLocaleString()}</span>
            <div class="flex items-center text-[10px] text-stone-400 mt-3 font-medium gap-1.5">
              <Flame class="w-3.5 h-3.5 text-emerald-400" />
              <span>Physical keyboard actions</span>
            </div>
          </div>

          <!-- Rolling Average WPM -->
          <div class="bg-stone-900/20 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all shadow-sm relative group overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all"></div>
            <span class="text-stone-500 font-bold uppercase tracking-wider text-[10px] block">Average Speed</span>
            <span class="text-2xl font-serif font-bold text-white block mt-2">{averageWpm} <span class="text-xs text-stone-500 font-bold">WPM</span></span>
            <div class="flex items-center text-[10px] text-stone-400 mt-3 font-medium gap-1.5">
              <Zap class="w-3.5 h-3.5 text-cyan-400" />
              <span>Rolling typing velocity</span>
            </div>
          </div>

          <!-- Net words written -->
          <div class="bg-stone-900/20 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all shadow-sm relative group overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all"></div>
            <span class="text-stone-500 font-bold uppercase tracking-wider text-[10px] block">Total Written</span>
            <span class="text-2xl font-serif font-bold text-white block mt-2">
              {sessions.reduce((sum: number, s: any) => sum + Math.max(0, (s.ending_word_count || 0) - (s.starting_word_count || 0)), 0).toLocaleString()}
              <span class="text-xs text-stone-500 font-bold">words</span>
            </span>
            <div class="flex items-center text-[10px] text-stone-400 mt-3 font-medium gap-1.5">
              <ArrowUpRight class="w-3.5 h-3.5 text-indigo-400" />
              <span>Net words added</span>
            </div>
          </div>
        </div>

        <!-- Middle Row: Goal Tracking progress & Mode Division -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Goals Section -->
          <div class="lg:col-span-2 bg-stone-900/10 border border-white/5 rounded-3xl p-6 relative">
            <h2 class="text-base font-serif font-bold text-white mb-6 flex items-center gap-2">
              <Target class="w-4 h-4 text-primary" />
              Word Milestone Goal Progress
            </h2>

            <div class="space-y-6">
              <!-- Daily Progress -->
              <div>
                <div class="flex justify-between items-center text-xs font-semibold mb-2">
                  <span class="text-stone-400 uppercase tracking-wider font-bold text-[10px]">Daily Progress</span>
                  <span class="text-stone-300 font-mono">{progressStats.todayWords} / {goals.daily_word_goal || 0} words</span>
                </div>
                <div class="h-3 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden p-[2px]">
                  <div 
                    class="h-full bg-gradient-to-r from-primary to-rose-500 rounded-full shadow-lg transition-all duration-1000"
                    style="width: {goals.daily_word_goal > 0 ? Math.min(100, (progressStats.todayWords / goals.daily_word_goal) * 100) : 0}%"
                  ></div>
                </div>
              </div>

              <!-- Weekly Progress -->
              <div>
                <div class="flex justify-between items-center text-xs font-semibold mb-2">
                  <span class="text-stone-400 uppercase tracking-wider font-bold text-[10px]">Weekly Progress</span>
                  <span class="text-stone-300 font-mono">{progressStats.weekWords} / {goals.weekly_word_goal || 0} words</span>
                </div>
                <div class="h-3 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden p-[2px]">
                  <div 
                    class="h-full bg-gradient-to-r from-primary via-emerald-500 to-emerald-400 rounded-full shadow-lg transition-all duration-1000"
                    style="width: {goals.weekly_word_goal > 0 ? Math.min(100, (progressStats.weekWords / goals.weekly_word_goal) * 100) : 0}%"
                  ></div>
                </div>
              </div>

              <!-- Monthly Progress -->
              <div>
                <div class="flex justify-between items-center text-xs font-semibold mb-2">
                  <span class="text-stone-400 uppercase tracking-wider font-bold text-[10px]">Monthly Progress</span>
                  <span class="text-stone-300 font-mono">{progressStats.monthWords} / {goals.monthly_word_goal || 0} words</span>
                </div>
                <div class="h-3 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden p-[2px]">
                  <div 
                    class="h-full bg-gradient-to-r from-primary via-purple-600 to-indigo-500 rounded-full shadow-lg transition-all duration-1000"
                    style="width: {goals.monthly_word_goal > 0 ? Math.min(100, (progressStats.monthWords / goals.monthly_word_goal) * 100) : 0}%"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mode breakdown Play vs Edit -->
          <div class="bg-stone-900/10 border border-white/5 rounded-3xl p-6">
            <h2 class="text-base font-serif font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 class="w-4 h-4 text-emerald-400" />
              Workflows Comparison
            </h2>

            <div class="space-y-6">
              <!-- Play Phase -->
              <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <div class="p-3 bg-primary/10 rounded-xl">
                  <Flame class="w-5 h-5 text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <span class="block text-xs font-bold uppercase tracking-wider text-stone-500 text-[10px]">Play mode</span>
                  <span class="block text-lg font-serif font-bold text-white mt-0.5">{formatHours(playStats.duration)}</span>
                  <span class="block text-[10px] text-stone-500 mt-1 font-medium">{playStats.count} writing sessions completed</span>
                </div>
              </div>

              <!-- Edit Phase -->
              <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <div class="p-3 bg-emerald-500/10 rounded-xl">
                  <Edit3 class="w-5 h-5 text-emerald-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <span class="block text-xs font-bold uppercase tracking-wider text-stone-500 text-[10px]">Edit mode</span>
                  <span class="block text-lg font-serif font-bold text-white mt-0.5">{formatHours(editStats.duration)}</span>
                  <span class="block text-[10px] text-stone-500 mt-1 font-medium">{editStats.count} revisions completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 3: Session History List -->
        <div class="bg-stone-900/10 border border-white/5 rounded-3xl p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-base font-serif font-bold text-white flex items-center gap-2">
              <BookOpen class="w-4 h-4 text-primary" />
              Writing Sessions History
            </h2>
            <span class="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{sessions.length} sessions logged</span>
          </div>

          {#if sessions.length === 0}
            <div class="p-12 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
              <p class="text-[10px] text-stone-600 font-bold uppercase tracking-widest mb-2">No historical sessions</p>
              <p class="text-xs text-stone-700 italic">Start typing in /play or /edit editor routes to log telemetry data.</p>
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-left text-xs font-medium">
                <thead>
                  <tr class="border-b border-white/5 text-[10px] text-stone-500 uppercase tracking-widest font-bold">
                    <th class="pb-3.5 font-bold">Date & Time</th>
                    <th class="pb-3.5 font-bold">Session Mode</th>
                    <th class="pb-3.5 font-bold">Serial & Scene</th>
                    <th class="pb-3.5 font-bold">Duration</th>
                    <th class="pb-3.5 font-bold">Net Words</th>
                    <th class="pb-3.5 font-bold">Keystrokes</th>
                    <th class="pb-3.5 font-bold">Speed</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  {#each sessions as session (session.id)}
                    <tr class="hover:bg-white/[0.01] transition-all group">
                      <td class="py-4 text-stone-300">
                        <span class="block">{formatDate(session.start_time)}</span>
                        <span class="block text-[10px] text-stone-500 font-normal mt-0.5">{formatTime(session.start_time)}</span>
                      </td>
                      <td class="py-4">
                        {#if session.session_type === 'play'}
                          <span class="px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest rounded-full">Play</span>
                        {:else}
                          <span class="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-widest rounded-full">Edit</span>
                        {/if}
                      </td>
                      <td class="py-4 max-w-xs truncate">
                        <span class="block text-stone-200 font-bold truncate">{session.serials?.title || 'Unknown Serial'}</span>
                        <span class="block text-[10px] text-stone-400 font-normal truncate mt-0.5">
                          {session.scenes?.display_title || session.scenes?.author_title || `Scene ${session.scenes?.order_index || ''}`}
                        </span>
                      </td>
                      <td class="py-4 text-stone-300 font-mono">
                        {formatHours(session.active_duration_seconds)}
                      </td>
                      <td class="py-4">
                        {#if (session.ending_word_count || 0) >= (session.starting_word_count || 0)}
                          <span class="text-emerald-400 font-mono font-bold">+{(session.ending_word_count || 0) - (session.starting_word_count || 0)}</span>
                        {:else}
                          <span class="text-rose-400 font-mono font-bold">{(session.ending_word_count || 0) - (session.starting_word_count || 0)}</span>
                        {/if}
                      </td>
                      <td class="py-4 text-stone-400 font-mono font-semibold">
                        {session.keystrokes?.toLocaleString() || 0}
                      </td>
                      <td class="py-4 text-stone-200 font-mono">
                        {session.wpm || 0} <span class="text-[9px] text-stone-500 uppercase tracking-widest font-bold">WPM</span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
