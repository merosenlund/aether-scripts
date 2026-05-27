<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Clock,
		Zap,
		Target,
		BookOpen,
		Flame,
		ArrowUpRight,
		BarChart3,
		Edit3,
		Calendar,
		TrendingUp,
		Award,
		Activity
	} from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import ActivityHeatmap from '$lib/components/analytics/ActivityHeatmap.svelte';
	import LineChart from '$lib/components/analytics/LineChart.svelte';

	let { data, form } = $props<{ data: any; form: any }>();

	let goals = $derived(data.goals);
	let streakData = $derived(data.streakData);

	let sessions = $derived.by(() => {
		return (data.sessions || []).map((s: any) => {
			const duration = s.active_duration_seconds || 0;
			const minutes = duration / 60;
			const netWords = Math.max(0, (s.ending_word_count || 0) - (s.starting_word_count || 0));
			const wpm = minutes > 0 ? Math.round(netWords / minutes) : 0;
			return { ...s, wpm };
		});
	});

	// ── Aggregate stats ────────────────────────────────────────────────────────
	let totalDuration = $derived(
		sessions.reduce((sum: number, s: any) => sum + (s.active_duration_seconds || 0), 0)
	);
	let totalKeystrokes = $derived(
		sessions.reduce((sum: number, s: any) => sum + (s.keystrokes || 0), 0)
	);
	let averageWpm = $derived.by(() => {
		const active = sessions.filter((s: any) => s.wpm > 0);
		if (!active.length) return 0;
		return Math.round(active.reduce((sum: number, s: any) => sum + s.wpm, 0) / active.length);
	});

	let playStats = $derived.by(() => {
		const ps = sessions.filter((s: any) => s.session_type === 'play');
		return {
			duration: ps.reduce((sum: number, s: any) => sum + (s.active_duration_seconds || 0), 0),
			words: ps.reduce(
				(sum: number, s: any) => sum + ((s.ending_word_count || 0) - (s.starting_word_count || 0)),
				0
			),
			count: ps.length
		};
	});
	let editStats = $derived.by(() => {
		const es = sessions.filter((s: any) => s.session_type === 'edit');
		return {
			duration: es.reduce((sum: number, s: any) => sum + (s.active_duration_seconds || 0), 0),
			words: es.reduce(
				(sum: number, s: any) => sum + ((s.ending_word_count || 0) - (s.starting_word_count || 0)),
				0
			),
			count: es.length
		};
	});

	// ── Goal progress ──────────────────────────────────────────────────────────
	let progressStats = $derived.by(() => {
		const now = new Date();
		const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
		const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
		const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
		let todayWords = 0,
			weekWords = 0,
			monthWords = 0;
		for (const s of sessions) {
			const t = new Date(s.start_time).getTime();
			const net = Math.max(0, (s.ending_word_count || 0) - (s.starting_word_count || 0));
			if (t >= startOfToday) todayWords += net;
			if (t >= sevenDaysAgo) weekWords += net;
			if (t >= thirtyDaysAgo) monthWords += net;
		}
		return { todayWords, weekWords, monthWords };
	});

	// ── Improvement trend data ─────────────────────────────────────────────────
	function isoWeekKey(date: Date): string {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		d.setDate(d.getDate() + 4 - (d.getDay() || 7));
		const yearStart = new Date(d.getFullYear(), 0, 1);
		const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
		return `${d.getFullYear()}-${String(week).padStart(2, '0')}`;
	}

	function isoWeekToDate(key: string): string {
		const [yr, wk] = key.split('-').map(Number);
		// ISO week 1 contains Jan 4
		const jan4 = new Date(yr, 0, 4);
		const weekStart = new Date(jan4);
		weekStart.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (wk - 1) * 7);
		return weekStart.toLocaleDateString('en-CA');
	}

	let trendData = $derived.by(() => {
		const chrono = [...sessions].reverse();
		const weeks = new Map<
			string,
			{ wpms: number[]; flesch: number[]; efficiency: number[] }
		>();

		for (const s of chrono) {
			const wk = isoWeekKey(new Date(s.start_time));
			if (!weeks.has(wk)) weeks.set(wk, { wpms: [], flesch: [], efficiency: [] });
			const b = weeks.get(wk)!;
			if (s.wpm > 0) b.wpms.push(s.wpm);
			if (s.flesch_reading_ease != null) b.flesch.push(s.flesch_reading_ease);
			const nc = s.net_characters;
			if (nc != null && Math.abs(nc) > 0 && s.keystrokes > 0) {
				b.efficiency.push(s.keystrokes / Math.abs(nc));
			}
		}

		const sorted = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b));
		const avg = (arr: number[]) =>
			arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

		return {
			wpm: sorted
				.map(([wk, b]) => ({ date: isoWeekToDate(wk), value: Math.round(avg(b.wpms) ?? 0) }))
				.filter((d) => d.value > 0),
			flesch: sorted
				.map(([wk, b]) => {
					const v = avg(b.flesch);
					return { date: isoWeekToDate(wk), value: v != null ? Math.round(v * 10) / 10 : 0 };
				})
				.filter((d) => d.value > 0),
			efficiency: sorted
				.map(([wk, b]) => {
					const v = avg(b.efficiency);
					return { date: isoWeekToDate(wk), value: v != null ? Math.round(v * 10) / 10 : 0 };
				})
				.filter((d) => d.value > 0)
		};
	});

	// ── Helpers ────────────────────────────────────────────────────────────────
	function formatHours(seconds: number): string {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.round((seconds % 3600) / 60);
		if (hrs > 0) return `${hrs}h ${mins}m`;
		return `${mins}m`;
	}
	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	}

	let isEditingGoals = $state(false);
</script>

<div class="min-h-screen bg-stone-950 pb-16 font-sans text-stone-100">
	<!-- Header -->
	<div
		class="relative shrink-0 overflow-hidden border-b border-white/5 bg-gradient-to-b from-stone-900/50 via-stone-950 to-stone-950 px-8 py-12"
	>
		<div class="bg-primary/10 absolute -top-40 left-1/4 h-96 w-96 rounded-full blur-3xl"></div>
		<div class="absolute -top-30 right-1/4 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl"></div>
		<div
			class="relative z-10 mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center"
		>
			<div>
				<h1
					class="bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text font-serif text-3xl font-bold tracking-tight text-transparent"
				>
					Author Analytics Dashboard
				</h1>
				<p class="mt-1.5 text-sm font-medium text-stone-400">
					Visualize your active writing duration, speed, goals, and effort metrics.
				</p>
			</div>
			<button
				onclick={() => (isEditingGoals = !isEditingGoals)}
				class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-stone-200 shadow-lg shadow-black/30 transition-all hover:border-white/20 hover:bg-white/10"
			>
				<Target class="text-primary h-4 w-4" />
				{isEditingGoals ? 'View Dashboard' : 'Customize Goals'}
			</button>
		</div>
	</div>

	<div class="mx-auto mt-8 max-w-6xl px-8">
		{#if isEditingGoals}
			<!-- Goal Editing Sub-View -->
			<div
				in:fade
				class="relative mx-auto max-w-xl rounded-3xl border border-white/5 bg-stone-900/40 p-8 shadow-2xl backdrop-blur-2xl"
			>
				<div
					class="via-primary/30 absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent"
				></div>
				<h2 class="mb-1 flex items-center gap-2 font-serif text-lg font-bold text-white">
					<Target class="text-primary h-5 w-5" />
					Define Your Writing Goals
				</h2>
				<p class="mb-6 text-xs text-stone-400">
					Set target milestone counts to measure your productivity over time.
				</p>
				<form
					method="POST"
					action="?/updateGoals"
					use:enhance={() => {
						return ({ result }) => {
							if (result.type === 'success') isEditingGoals = false;
						};
					}}
					class="space-y-6"
				>
					{#each [{ id: 'daily_word_goal', label: 'Daily Word Target', value: goals.daily_word_goal, placeholder: 'e.g. 500' }, { id: 'weekly_word_goal', label: 'Weekly Word Target', value: goals.weekly_word_goal, placeholder: 'e.g. 3500' }, { id: 'monthly_word_goal', label: 'Monthly Word Target', value: goals.monthly_word_goal, placeholder: 'e.g. 15000' }] as g}
						<div class="space-y-2">
							<label
								for={g.id}
								class="flex justify-between text-xs font-bold tracking-wider text-stone-400 uppercase"
							>
								<span>{g.label}</span>
								<span class="text-primary font-mono">{g.value} words</span>
							</label>
							<input
								id={g.id}
								name={g.id}
								type="number"
								defaultValue={g.value}
								class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-stone-100 transition-all focus:outline-none"
								placeholder={g.placeholder}
							/>
						</div>
					{/each}
					<button
						type="submit"
						class="bg-primary text-primary-foreground shadow-primary/20 w-full rounded-xl py-3.5 text-xs font-bold shadow-lg transition-all hover:opacity-90"
					>
						Save Goal Configuration
					</button>
				</form>
			</div>
		{:else}
			<div class="space-y-8">
				<!-- ── Streak & Consistency ──────────────────────────────────────── -->
				<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
					<h2 class="mb-5 flex items-center gap-2 font-serif text-base font-bold text-white">
						<Flame class="text-primary h-4 w-4" />
						Writing Streak & Consistency
					</h2>
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
						<!-- Current Streak -->
						<div
							class="col-span-2 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 sm:col-span-1"
						>
							<div class="bg-primary/10 flex-shrink-0 rounded-xl p-3">
								<Flame class="text-primary h-6 w-6" />
							</div>
							<div>
								<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
									>Current Streak</span
								>
								<span class="mt-0.5 block font-serif text-2xl font-bold text-white"
									>{streakData.currentStreak}</span
								>
								<span class="text-[10px] font-medium text-stone-500">days</span>
							</div>
						</div>

						<!-- Longest Streak -->
						<div class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
							<Award class="h-5 w-5 flex-shrink-0 text-amber-400" />
							<div>
								<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
									>Longest</span
								>
								<span class="font-serif text-xl font-bold text-white"
									>{streakData.longestStreak}</span
								>
								<span class="ml-1 text-[10px] text-stone-500">days</span>
							</div>
						</div>

						<!-- This Week -->
						<div class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
							<Calendar class="h-5 w-5 flex-shrink-0 text-cyan-400" />
							<div>
								<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
									>This Week</span
								>
								<span class="font-serif text-xl font-bold text-white">{streakData.daysThisWeek}</span
								>
								<span class="ml-1 text-[10px] text-stone-500">days</span>
							</div>
						</div>

						<!-- This Month -->
						<div class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
							<Calendar class="h-5 w-5 flex-shrink-0 text-emerald-400" />
							<div>
								<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
									>This Month</span
								>
								<span class="font-serif text-xl font-bold text-white"
									>{streakData.daysThisMonth}</span
								>
								<span class="ml-1 text-[10px] text-stone-500">days</span>
							</div>
						</div>

						<!-- This Year -->
						<div class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
							<Activity class="h-5 w-5 flex-shrink-0 text-indigo-400" />
							<div>
								<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
									>This Year</span
								>
								<span class="font-serif text-xl font-bold text-white">{streakData.daysThisYear}</span
								>
								<span class="ml-1 text-[10px] text-stone-500">days</span>
							</div>
						</div>

						<!-- Consistency -->
						<div class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
							<TrendingUp class="h-5 w-5 flex-shrink-0 text-rose-400" />
							<div>
								<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
									>Consistency</span
								>
								<span class="font-serif text-xl font-bold text-white"
									>{streakData.consistencyScore}%</span
								>
								<span class="block text-[10px] text-stone-500">last 30 days</span>
							</div>
						</div>
					</div>
				</div>

				<!-- ── Activity Heatmap ───────────────────────────────────────────── -->
				<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
					<h2 class="mb-5 flex items-center gap-2 font-serif text-base font-bold text-white">
						<Calendar class="h-4 w-4 text-emerald-400" />
						Writing Activity — Past Year
					</h2>
					<ActivityHeatmap days={streakData.heatmapDays} />
					<div class="mt-3 flex items-center gap-3 text-[10px] text-stone-600">
						<span>Less</span>
						{#each ['#1c1917', '#14532d', '#166534', '#15803d', '#4ade80'] as col}
							<span
								class="inline-block h-3 w-3 rounded-sm"
								style="background-color: {col}"
							></span>
						{/each}
						<span>More</span>
					</div>
				</div>

				<!-- ── Core Metrics Cards ─────────────────────────────────────────── -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div
						class="group relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 shadow-sm transition-all hover:border-white/10"
					>
						<div
							class="bg-primary/5 group-hover:bg-primary/15 absolute -right-4 -bottom-4 h-20 w-20 rounded-full blur-2xl transition-all"
						></div>
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Total Duration</span
						>
						<span class="mt-2 block font-serif text-2xl font-bold text-white"
							>{formatHours(totalDuration)}</span
						>
						<div class="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-stone-400">
							<Clock class="text-primary h-3.5 w-3.5" />
							<span>Time spent in editor</span>
						</div>
					</div>

					<div
						class="group relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 shadow-sm transition-all hover:border-white/10"
					>
						<div
							class="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/15"
						></div>
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Keystroke Effort</span
						>
						<span class="mt-2 block font-serif text-2xl font-bold text-white"
							>{totalKeystrokes.toLocaleString()}</span
						>
						<div class="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-stone-400">
							<Flame class="h-3.5 w-3.5 text-emerald-400" />
							<span>Physical keyboard actions</span>
						</div>
					</div>

					<div
						class="group relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 shadow-sm transition-all hover:border-white/10"
					>
						<div
							class="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-cyan-500/5 blur-2xl transition-all group-hover:bg-cyan-500/15"
						></div>
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Average Speed</span
						>
						<span class="mt-2 block font-serif text-2xl font-bold text-white"
							>{averageWpm} <span class="text-xs font-bold text-stone-500">WPM</span></span
						>
						<div class="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-stone-400">
							<Zap class="h-3.5 w-3.5 text-cyan-400" />
							<span>Rolling typing velocity</span>
						</div>
					</div>

					<div
						class="group relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 shadow-sm transition-all hover:border-white/10"
					>
						<div
							class="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-indigo-500/5 blur-2xl transition-all group-hover:bg-indigo-500/15"
						></div>
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Total Written</span
						>
						<span class="mt-2 block font-serif text-2xl font-bold text-white">
							{sessions
								.reduce(
									(sum: number, s: any) =>
										sum + Math.max(0, (s.ending_word_count || 0) - (s.starting_word_count || 0)),
									0
								)
								.toLocaleString()}
							<span class="text-xs font-bold text-stone-500">words</span>
						</span>
						<div class="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-stone-400">
							<ArrowUpRight class="h-3.5 w-3.5 text-indigo-400" />
							<span>Net words added</span>
						</div>
					</div>
				</div>

				<!-- ── Goals + Mode Division ──────────────────────────────────────── -->
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<div class="relative rounded-3xl border border-white/5 bg-stone-900/10 p-6 lg:col-span-2">
						<h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">
							<Target class="text-primary h-4 w-4" />
							Word Milestone Goal Progress
						</h2>
						<div class="space-y-6">
							{#each [{ label: 'Daily Progress', words: progressStats.todayWords, goal: goals.daily_word_goal, gradient: 'from-primary to-rose-500' }, { label: 'Weekly Progress', words: progressStats.weekWords, goal: goals.weekly_word_goal, gradient: 'from-primary via-emerald-500 to-emerald-400' }, { label: 'Monthly Progress', words: progressStats.monthWords, goal: goals.monthly_word_goal, gradient: 'from-primary via-purple-600 to-indigo-500' }] as g}
								<div>
									<div class="mb-2 flex items-center justify-between text-xs font-semibold">
										<span class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
											>{g.label}</span
										>
										<span class="font-mono text-stone-300">{g.words} / {g.goal || 0} words</span>
									</div>
									<div
										class="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-[2px]"
									>
										<div
											class="h-full rounded-full bg-gradient-to-r shadow-lg transition-all duration-1000 {g.gradient}"
											style="width: {g.goal > 0 ? Math.min(100, (g.words / g.goal) * 100) : 0}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
						<h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">
							<BarChart3 class="h-4 w-4 text-emerald-400" />
							Workflows Comparison
						</h2>
						<div class="space-y-6">
							<div
								class="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
							>
								<div class="bg-primary/10 rounded-xl p-3">
									<Flame class="text-primary h-5 w-5" />
								</div>
								<div class="min-w-0 flex-1">
									<span
										class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
										>Play mode</span
									>
									<span class="mt-0.5 block font-serif text-lg font-bold text-white"
										>{formatHours(playStats.duration)}</span
									>
									<span class="mt-1 block text-[10px] font-medium text-stone-500"
										>{playStats.count} writing sessions</span
									>
								</div>
							</div>
							<div
								class="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
							>
								<div class="rounded-xl bg-emerald-500/10 p-3">
									<Edit3 class="h-5 w-5 text-emerald-400" />
								</div>
								<div class="min-w-0 flex-1">
									<span
										class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
										>Edit mode</span
									>
									<span class="mt-0.5 block font-serif text-lg font-bold text-white"
										>{formatHours(editStats.duration)}</span
									>
									<span class="mt-1 block text-[10px] font-medium text-stone-500"
										>{editStats.count} revisions</span
									>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- ── Improvement Over Time ──────────────────────────────────────── -->
				<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
					<h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">
						<TrendingUp class="h-4 w-4 text-indigo-400" />
						Improvement Over Time
					</h2>
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<!-- WPM Trend -->
						<div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
							<h3
								class="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-stone-400 uppercase"
							>
								<Zap class="h-3.5 w-3.5 text-emerald-400" />
								Writing Speed (WPM)
							</h3>
							<LineChart
								data={trendData.wpm}
								color="emerald"
								height={110}
								label="Weekly average WPM over time"
							/>
						</div>

						<!-- Reading Ease Trend -->
						<div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
							<h3
								class="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-stone-400 uppercase"
							>
								<BookOpen class="h-3.5 w-3.5 text-indigo-400" />
								Reading Ease (Flesch)
							</h3>
							<LineChart
								data={trendData.flesch}
								color="indigo"
								height={110}
								label="Weekly average Flesch reading ease over time"
								formatValue={(v) => v.toFixed(0)}
							/>
						</div>

						<!-- Keystroke Efficiency -->
						<div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
							<h3
								class="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-stone-400 uppercase"
							>
								<Activity class="h-3.5 w-3.5 text-cyan-400" />
								Keystroke Efficiency
							</h3>
							<LineChart
								data={trendData.efficiency}
								color="cyan"
								height={110}
								label="Weekly average keystrokes per character (lower = more efficient)"
								formatValue={(v) => v.toFixed(1)}
							/>
							<p class="mt-2 text-[9px] text-stone-600">
								Keystrokes ÷ |net chars| — lower means fewer corrections
							</p>
						</div>
					</div>
				</div>

				<!-- ── Session History ────────────────────────────────────────────── -->
				<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="flex items-center gap-2 font-serif text-base font-bold text-white">
							<BookOpen class="text-primary h-4 w-4" />
							Writing Sessions History
						</h2>
						<span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>{sessions.length} sessions logged</span
						>
					</div>

					{#if sessions.length === 0}
						<div
							class="rounded-2xl border border-dashed border-white/5 bg-white/[0.02] p-12 text-center"
						>
							<p class="mb-2 text-[10px] font-bold tracking-widest text-stone-600 uppercase">
								No historical sessions
							</p>
							<p class="text-xs text-stone-700 italic">
								Start typing in /play or /edit editor routes to log telemetry data.
							</p>
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full border-collapse text-left text-xs font-medium">
								<thead>
									<tr
										class="border-b border-white/5 text-[10px] font-bold tracking-widest text-stone-500 uppercase"
									>
										<th class="pb-3.5 font-bold">Date & Time</th>
										<th class="pb-3.5 font-bold">Mode</th>
										<th class="pb-3.5 font-bold">Serial & Scene</th>
										<th class="pb-3.5 font-bold">Duration</th>
										<th class="pb-3.5 font-bold">Net Words</th>
										<th class="pb-3.5 font-bold">Keystrokes</th>
										<th class="pb-3.5 font-bold">Speed</th>
										<th class="pb-3.5 font-bold">Reading Ease</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-white/5">
									{#each sessions as session (session.id)}
										<tr class="group transition-all hover:bg-white/[0.01]">
											<td class="py-4 text-stone-300">
												<span class="block">{formatDate(session.start_time)}</span>
												<span class="mt-0.5 block text-[10px] font-normal text-stone-500"
													>{formatTime(session.start_time)}</span
												>
											</td>
											<td class="py-4">
												{#if session.session_type === 'play'}
													<span
														class="bg-primary/10 border-primary/20 text-primary rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase"
														>Play</span
													>
												{:else}
													<span
														class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-emerald-400 uppercase"
														>Edit</span
													>
												{/if}
											</td>
											<td class="max-w-xs truncate py-4">
												{#if session.serials?.id}
													<a
														href="/analytics/serials/{session.serials.id}"
														class="block truncate font-bold text-stone-200 hover:text-white hover:underline"
														>{session.serials?.title || 'Unknown Serial'}</a
													>
												{:else}
													<span class="block truncate font-bold text-stone-200"
														>{session.serials?.title || 'Unknown Serial'}</span
													>
												{/if}
												<span class="mt-0.5 block truncate text-[10px] font-normal text-stone-400">
													{session.scenes?.display_title ||
														session.scenes?.author_title ||
														'—'}
												</span>
											</td>
											<td class="py-4 font-mono text-stone-300">
												{formatHours(session.active_duration_seconds)}
											</td>
											<td class="py-4">
												{#if (session.ending_word_count || 0) >= (session.starting_word_count || 0)}
													<span class="font-mono font-bold text-emerald-400"
														>+{(session.ending_word_count || 0) -
															(session.starting_word_count || 0)}</span
													>
												{:else}
													<span class="font-mono font-bold text-rose-400"
														>{(session.ending_word_count || 0) -
															(session.starting_word_count || 0)}</span
													>
												{/if}
											</td>
											<td class="py-4 font-mono font-semibold text-stone-400">
												{session.keystrokes?.toLocaleString() || 0}
											</td>
											<td class="py-4 font-mono text-stone-200">
												{session.wpm || 0}
												<span class="text-[9px] font-bold tracking-widest text-stone-500 uppercase"
													>WPM</span
												>
											</td>
											<td class="py-4 font-mono text-stone-400">
												{session.flesch_reading_ease != null
													? session.flesch_reading_ease.toFixed(1)
													: '—'}
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
