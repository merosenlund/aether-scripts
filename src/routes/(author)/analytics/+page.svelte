<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Clock,
		Zap,
		Target,
		BookOpen,
		PenTool,
		Flame,
		ArrowUpRight,
		BarChart3,
		Edit3
	} from '@lucide/svelte';
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
	let totalDuration = $derived(
		sessions.reduce((sum: number, s: any) => sum + (s.active_duration_seconds || 0), 0)
	);
	let totalKeystrokes = $derived(
		sessions.reduce((sum: number, s: any) => sum + (s.keystrokes || 0), 0)
	);

	// Calculate average WPM across sessions with WPM > 0
	let averageWpm = $derived.by(() => {
		const activeSessions = sessions.filter((s: any) => s.wpm > 0);
		if (activeSessions.length === 0) return 0;
		return Math.round(
			activeSessions.reduce((sum: number, s: any) => sum + s.wpm, 0) / activeSessions.length
		);
	});

	// Mode division (Play vs Edit)
	let playStats = $derived.by(() => {
		const playSessions = sessions.filter((s: any) => s.session_type === 'play');
		const duration = playSessions.reduce(
			(sum: number, s: any) => sum + (s.active_duration_seconds || 0),
			0
		);
		const words = playSessions.reduce(
			(sum: number, s: any) => sum + ((s.ending_word_count || 0) - (s.starting_word_count || 0)),
			0
		);
		return { duration, words, count: playSessions.length };
	});

	let editStats = $derived.by(() => {
		const editSessions = sessions.filter((s: any) => s.session_type === 'edit');
		const duration = editSessions.reduce(
			(sum: number, s: any) => sum + (s.active_duration_seconds || 0),
			0
		);
		const words = editSessions.reduce(
			(sum: number, s: any) => sum + ((s.ending_word_count || 0) - (s.starting_word_count || 0)),
			0
		);
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
			const netWords = Math.max(
				0,
				(session.ending_word_count || 0) - (session.starting_word_count || 0)
			);

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

<div class="min-h-screen bg-stone-950 pb-16 font-sans text-stone-100">
	<!-- Dynamic Glowing Header Banner -->
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

			<!-- Action Button -->
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
							if (result.type === 'success') {
								isEditingGoals = false;
							}
						};
					}}
					class="space-y-6"
				>
					<div class="space-y-2">
						<label
							for="daily_word_goal"
							class="flex justify-between text-xs font-bold tracking-wider text-stone-400 uppercase"
						>
							<span>Daily Word Target</span>
							<span class="text-primary font-mono">{goals.daily_word_goal} words</span>
						</label>
						<input
							id="daily_word_goal"
							name="daily_word_goal"
							type="number"
							defaultValue={goals.daily_word_goal}
							class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-stone-100 transition-all focus:outline-none"
							placeholder="e.g. 500"
						/>
					</div>

					<div class="space-y-2">
						<label
							for="weekly_word_goal"
							class="flex justify-between text-xs font-bold tracking-wider text-stone-400 uppercase"
						>
							<span>Weekly Word Target</span>
							<span class="text-primary font-mono">{goals.weekly_word_goal} words</span>
						</label>
						<input
							id="weekly_word_goal"
							name="weekly_word_goal"
							type="number"
							defaultValue={goals.weekly_word_goal}
							class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-stone-100 transition-all focus:outline-none"
							placeholder="e.g. 3500"
						/>
					</div>

					<div class="space-y-2">
						<label
							for="monthly_word_goal"
							class="flex justify-between text-xs font-bold tracking-wider text-stone-400 uppercase"
						>
							<span>Monthly Word Target</span>
							<span class="text-primary font-mono">{goals.monthly_word_goal} words</span>
						</label>
						<input
							id="monthly_word_goal"
							name="monthly_word_goal"
							type="number"
							defaultValue={goals.monthly_word_goal}
							class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-stone-100 transition-all focus:outline-none"
							placeholder="e.g. 15000"
						/>
					</div>

					<button
						type="submit"
						class="bg-primary text-primary-foreground shadow-primary/20 w-full rounded-xl py-3.5 text-xs font-bold shadow-lg transition-all hover:opacity-90"
					>
						Save Goal Configuration
					</button>
				</form>
			</div>
		{:else}
			<!-- Main Dashboard Grid -->
			<div class="space-y-8">
				<!-- Premium Core Metrics Overview -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<!-- Active Duration Card -->
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

					<!-- Total Keystrokes effort metric -->
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

					<!-- Rolling Average WPM -->
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

					<!-- Net words written -->
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

				<!-- Middle Row: Goal Tracking progress & Mode Division -->
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<!-- Goals Section -->
					<div class="relative rounded-3xl border border-white/5 bg-stone-900/10 p-6 lg:col-span-2">
						<h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">
							<Target class="text-primary h-4 w-4" />
							Word Milestone Goal Progress
						</h2>

						<div class="space-y-6">
							<!-- Daily Progress -->
							<div>
								<div class="mb-2 flex items-center justify-between text-xs font-semibold">
									<span class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
										>Daily Progress</span
									>
									<span class="font-mono text-stone-300"
										>{progressStats.todayWords} / {goals.daily_word_goal || 0} words</span
									>
								</div>
								<div
									class="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-[2px]"
								>
									<div
										class="from-primary h-full rounded-full bg-gradient-to-r to-rose-500 shadow-lg transition-all duration-1000"
										style="width: {goals.daily_word_goal > 0
											? Math.min(100, (progressStats.todayWords / goals.daily_word_goal) * 100)
											: 0}%"
									></div>
								</div>
							</div>

							<!-- Weekly Progress -->
							<div>
								<div class="mb-2 flex items-center justify-between text-xs font-semibold">
									<span class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
										>Weekly Progress</span
									>
									<span class="font-mono text-stone-300"
										>{progressStats.weekWords} / {goals.weekly_word_goal || 0} words</span
									>
								</div>
								<div
									class="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-[2px]"
								>
									<div
										class="from-primary h-full rounded-full bg-gradient-to-r via-emerald-500 to-emerald-400 shadow-lg transition-all duration-1000"
										style="width: {goals.weekly_word_goal > 0
											? Math.min(100, (progressStats.weekWords / goals.weekly_word_goal) * 100)
											: 0}%"
									></div>
								</div>
							</div>

							<!-- Monthly Progress -->
							<div>
								<div class="mb-2 flex items-center justify-between text-xs font-semibold">
									<span class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
										>Monthly Progress</span
									>
									<span class="font-mono text-stone-300"
										>{progressStats.monthWords} / {goals.monthly_word_goal || 0} words</span
									>
								</div>
								<div
									class="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-[2px]"
								>
									<div
										class="from-primary h-full rounded-full bg-gradient-to-r via-purple-600 to-indigo-500 shadow-lg transition-all duration-1000"
										style="width: {goals.monthly_word_goal > 0
											? Math.min(100, (progressStats.monthWords / goals.monthly_word_goal) * 100)
											: 0}%"
									></div>
								</div>
							</div>
						</div>
					</div>

					<!-- Mode breakdown Play vs Edit -->
					<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
						<h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">
							<BarChart3 class="h-4 w-4 text-emerald-400" />
							Workflows Comparison
						</h2>

						<div class="space-y-6">
							<!-- Play Phase -->
							<div
								class="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
							>
								<div class="bg-primary/10 rounded-xl p-3">
									<Flame class="text-primary h-5 w-5" />
								</div>
								<div class="min-w-0 flex-1">
									<span
										class="block text-xs text-[10px] font-bold tracking-wider text-stone-500 uppercase"
										>Play mode</span
									>
									<span class="mt-0.5 block font-serif text-lg font-bold text-white"
										>{formatHours(playStats.duration)}</span
									>
									<span class="mt-1 block text-[10px] font-medium text-stone-500"
										>{playStats.count} writing sessions completed</span
									>
								</div>
							</div>

							<!-- Edit Phase -->
							<div
								class="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
							>
								<div class="rounded-xl bg-emerald-500/10 p-3">
									<Edit3 class="h-5 w-5 text-emerald-400" />
								</div>
								<div class="min-w-0 flex-1">
									<span
										class="block text-xs text-[10px] font-bold tracking-wider text-stone-500 uppercase"
										>Edit mode</span
									>
									<span class="mt-0.5 block font-serif text-lg font-bold text-white"
										>{formatHours(editStats.duration)}</span
									>
									<span class="mt-1 block text-[10px] font-medium text-stone-500"
										>{editStats.count} revisions completed</span
									>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Row 3: Session History List -->
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
												<span class="block truncate font-bold text-stone-200"
													>{session.serials?.title || 'Unknown Serial'}</span
												>
												<span class="mt-0.5 block truncate text-[10px] font-normal text-stone-400">
													{session.scenes?.display_title ||
														session.scenes?.author_title ||
														`Scene ${session.scenes?.order_index || ''}`}
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
