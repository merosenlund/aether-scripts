<script lang="ts">
	import {
		ArrowLeft,
		Clock,
		Zap,
		BookOpen,
		Flame,
		Edit3,
		Activity,
		GitBranch,
		Timer
	} from '@lucide/svelte';
	import LineChart from '$lib/components/analytics/LineChart.svelte';

	let { data } = $props<{ data: any }>();

	let scene = $derived(data.scene);
	let serialId = $derived(data.serialId);

	let sessions = $derived.by(() =>
		(data.sessions || []).map((s: any) => {
			const mins = (s.active_duration_seconds || 0) / 60;
			const net = (s.ending_word_count || 0) - (s.starting_word_count || 0);
			const wpm = mins > 0 ? Math.round(Math.max(0, net) / mins) : 0;
			const efficiency =
				s.net_characters != null && Math.abs(s.net_characters) > 0 && s.keystrokes > 0
					? Math.round((s.keystrokes / Math.abs(s.net_characters)) * 10) / 10
					: null;
			return { ...s, wpm, netWords: net, efficiency };
		})
	);

	// ── Scene-level metrics ────────────────────────────────────────────────────
	let playSessions = $derived(sessions.filter((s: any) => s.session_type === 'play'));
	let editSessions = $derived(sessions.filter((s: any) => s.session_type === 'edit'));

	let editDepth = $derived(editSessions.length);

	// Revision ratio: first play draft ending word count vs current published word count
	let revisionRatio = $derived.by(() => {
		if (!playSessions.length || !scene.word_count) return null;
		const firstPlayEnd = playSessions[0].ending_word_count || 0;
		if (firstPlayEnd === 0) return null;
		const ratio = scene.word_count / firstPlayEnd;
		return Math.round(ratio * 100) / 100;
	});

	// Scene velocity: first session to published_at
	let sceneVelocity = $derived.by(() => {
		if (!sessions.length || !scene.published_at) return null;
		const first = new Date(sessions[0].start_time);
		const pub = new Date(scene.published_at);
		const days = Math.round((pub.getTime() - first.getTime()) / 86400000);
		if (days < 1) return '< 1 day';
		if (days === 1) return '1 day';
		if (days < 7) return `${days} days`;
		const weeks = Math.round(days / 7);
		return `${weeks} week${weeks !== 1 ? 's' : ''}`;
	});

	// Most recent session with readability data
	let latestReadability = $derived.by(() => {
		for (let i = sessions.length - 1; i >= 0; i--) {
			const s = sessions[i];
			if (s.flesch_reading_ease != null) return s;
		}
		return null;
	});

	// Readability trend for this scene over sessions
	let readabilityTrend = $derived(
		sessions
			.filter((s: any) => s.flesch_reading_ease != null)
			.map((s: any) => ({
				date: new Date(s.start_time).toLocaleDateString('en-CA'),
				value: s.flesch_reading_ease
			}))
	);

	// Play vs edit aggregates
	let playAggregate = $derived({
		duration: playSessions.reduce((a: number, s: any) => a + (s.active_duration_seconds || 0), 0),
		netWords: playSessions.reduce((a: number, s: any) => a + Math.max(0, s.netWords), 0),
		count: playSessions.length
	});
	let editAggregate = $derived({
		duration: editSessions.reduce((a: number, s: any) => a + (s.active_duration_seconds || 0), 0),
		netWords: editSessions.reduce((a: number, s: any) => a + s.netWords, 0),
		count: editSessions.length
	});

	// WPM over sessions (for trend)
	let wpmTrend = $derived(
		sessions
			.filter((s: any) => s.wpm > 0)
			.map((s: any) => ({
				date: new Date(s.start_time).toLocaleDateString('en-CA'),
				value: s.wpm
			}))
	);

	// ── Helpers ────────────────────────────────────────────────────────────────
	function formatHours(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.round((seconds % 3600) / 60);
		if (h > 0) return `${h}h ${m}m`;
		return `${m}m`;
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
	function fleschLabel(score: number): string {
		if (score >= 90) return 'Very Easy';
		if (score >= 70) return 'Easy';
		if (score >= 60) return 'Standard';
		if (score >= 50) return 'Fairly Difficult';
		if (score >= 30) return 'Difficult';
		return 'Very Difficult';
	}

	let sceneName = $derived(scene.display_title || scene.author_title || `Scene ${scene.order_index}`);
</script>

<div class="min-h-screen bg-stone-950 pb-16 font-sans text-stone-100">
	<!-- Header -->
	<div
		class="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-stone-900/50 via-stone-950 to-stone-950 px-8 py-10"
	>
		<div class="relative z-10 mx-auto max-w-6xl">
			<a
				href="/analytics/serials/{serialId}"
				class="mb-4 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-stone-500 uppercase transition-colors hover:text-stone-300"
			>
				<ArrowLeft class="h-3.5 w-3.5" />
				Back to Serial Analytics
			</a>
			<h1
				class="bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text font-serif text-2xl font-bold tracking-tight text-transparent"
			>
				{sceneName}
			</h1>
			<p class="mt-1 text-sm text-stone-500">
				Scene analytics — {sessions.length} session{sessions.length !== 1 ? 's' : ''} logged
			</p>
		</div>
	</div>

	<div class="mx-auto mt-8 max-w-6xl space-y-8 px-8">
		<!-- ── Improvement metrics row ─────────────────────────────────────────── -->
		<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<!-- Edit Depth -->
			<div
				class="relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 transition-all hover:border-white/10"
			>
				<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
					>Edit Depth</span
				>
				<span class="mt-1.5 block font-serif text-2xl font-bold text-white">{editDepth}</span>
				<div class="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">
					<Edit3 class="h-3.5 w-3.5 text-emerald-400" />
					edit sessions before publish
				</div>
			</div>

			<!-- Scene Velocity -->
			<div
				class="relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 transition-all hover:border-white/10"
			>
				<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
					>Scene Velocity</span
				>
				<span class="mt-1.5 block font-serif text-2xl font-bold text-white">
					{sceneVelocity ?? '—'}
				</span>
				<div class="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">
					<Timer class="h-3.5 w-3.5 text-cyan-400" />
					first draft → published
				</div>
			</div>

			<!-- Revision Ratio -->
			<div
				class="relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 transition-all hover:border-white/10"
			>
				<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
					>Revision Ratio</span
				>
				<span class="mt-1.5 block font-serif text-2xl font-bold text-white">
					{revisionRatio != null ? `${revisionRatio}×` : '—'}
				</span>
				<div class="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">
					<GitBranch class="h-3.5 w-3.5 text-indigo-400" />
					published ÷ first draft words
				</div>
			</div>

			<!-- Current Word Count -->
			<div
				class="relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/20 p-5 transition-all hover:border-white/10"
			>
				<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
					>Current Words</span
				>
				<span class="mt-1.5 block font-serif text-2xl font-bold text-white">
					{(scene.word_count || 0).toLocaleString()}
				</span>
				<div class="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">
					<BookOpen class="h-3.5 w-3.5 text-rose-400" />
					scene word count
				</div>
			</div>
		</div>

		<!-- ── Play vs Edit breakdown ──────────────────────────────────────────── -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
				<h2 class="mb-5 flex items-center gap-2 font-serif text-base font-bold text-white">
					<Flame class="text-primary h-4 w-4" />
					Play Sessions
				</h2>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Count</span
						>
						<span class="mt-1 block font-serif text-xl font-bold text-white"
							>{playAggregate.count}</span
						>
					</div>
					<div>
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Time</span
						>
						<span class="mt-1 block font-serif text-xl font-bold text-white"
							>{formatHours(playAggregate.duration)}</span
						>
					</div>
					<div>
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Words</span
						>
						<span class="mt-1 block font-serif text-xl font-bold text-emerald-400"
							>+{playAggregate.netWords.toLocaleString()}</span
						>
					</div>
				</div>
			</div>

			<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
				<h2 class="mb-5 flex items-center gap-2 font-serif text-base font-bold text-white">
					<Edit3 class="h-4 w-4 text-emerald-400" />
					Edit Sessions
				</h2>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Count</span
						>
						<span class="mt-1 block font-serif text-xl font-bold text-white"
							>{editAggregate.count}</span
						>
					</div>
					<div>
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Time</span
						>
						<span class="mt-1 block font-serif text-xl font-bold text-white"
							>{formatHours(editAggregate.duration)}</span
						>
					</div>
					<div>
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Net Words</span
						>
						{#if editAggregate.netWords >= 0}
							<span class="mt-1 block font-serif text-xl font-bold text-emerald-400"
								>+{editAggregate.netWords.toLocaleString()}</span
							>
						{:else}
							<span class="mt-1 block font-serif text-xl font-bold text-rose-400"
								>{editAggregate.netWords.toLocaleString()}</span
							>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- ── Readability summary ─────────────────────────────────────────────── -->
		{#if latestReadability}
			<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
				<h2 class="mb-5 flex items-center gap-2 font-serif text-base font-bold text-white">
					<Activity class="h-4 w-4 text-indigo-400" />
					Prose Metrics
					<span class="ml-auto text-[10px] font-normal tracking-wider text-stone-600 uppercase">
						from most recent session
					</span>
				</h2>
				<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Reading Ease</span
						>
						<span class="mt-1.5 block font-serif text-xl font-bold text-white"
							>{latestReadability.flesch_reading_ease?.toFixed(1)}</span
						>
						<span class="text-[10px] text-stone-500"
							>{fleschLabel(latestReadability.flesch_reading_ease)}</span
						>
					</div>
					<div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Avg Sentence</span
						>
						<span class="mt-1.5 block font-serif text-xl font-bold text-white"
							>{latestReadability.avg_sentence_length?.toFixed(1)}</span
						>
						<span class="text-[10px] text-stone-500">words per sentence</span>
					</div>
					<div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Avg Word Length</span
						>
						<span class="mt-1.5 block font-serif text-xl font-bold text-white"
							>{latestReadability.avg_word_length?.toFixed(1)}</span
						>
						<span class="text-[10px] text-stone-500">chars per word</span>
					</div>
					<div class="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
						<span class="block text-[10px] font-bold tracking-wider text-stone-500 uppercase"
							>Vocabulary</span
						>
						<span class="mt-1.5 block font-serif text-xl font-bold text-white"
							>{latestReadability.type_token_ratio != null
								? (latestReadability.type_token_ratio * 100).toFixed(1) + '%'
								: '—'}</span
						>
						<span class="text-[10px] text-stone-500">lexical diversity (500w)</span>
					</div>
				</div>

				<!-- Readability trend -->
				{#if readabilityTrend.length >= 2}
					<div class="mt-6">
						<h3
							class="mb-3 text-[10px] font-bold tracking-wider text-stone-500 uppercase"
						>
							Reading Ease Over Sessions
						</h3>
						<LineChart
							data={readabilityTrend}
							color="indigo"
							height={100}
							label="Flesch reading ease per session"
							formatValue={(v) => v.toFixed(0)}
						/>
					</div>
				{/if}
			</div>
		{/if}

		<!-- ── WPM trend ───────────────────────────────────────────────────────── -->
		{#if wpmTrend.length >= 2}
			<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
				<h2 class="mb-4 flex items-center gap-2 font-serif text-base font-bold text-white">
					<Zap class="h-4 w-4 text-emerald-400" />
					Writing Speed Per Session
				</h2>
				<LineChart
					data={wpmTrend}
					color="emerald"
					height={110}
					label="WPM per session for this scene"
				/>
			</div>
		{/if}

		<!-- ── Full session timeline ───────────────────────────────────────────── -->
		<div class="rounded-3xl border border-white/5 bg-stone-900/10 p-6">
			<h2 class="mb-6 flex items-center gap-2 font-serif text-base font-bold text-white">
				<Clock class="text-primary h-4 w-4" />
				Session Timeline
			</h2>
			{#if sessions.length === 0}
				<p class="text-center text-sm text-stone-600 italic">No sessions yet for this scene.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-xs">
						<thead>
							<tr
								class="border-b border-white/5 text-[10px] font-bold tracking-widest text-stone-500 uppercase"
							>
								<th class="pb-3.5 font-bold">#</th>
								<th class="pb-3.5 font-bold">Date</th>
								<th class="pb-3.5 font-bold">Mode</th>
								<th class="pb-3.5 font-bold">Duration</th>
								<th class="pb-3.5 font-bold">Start Words</th>
								<th class="pb-3.5 font-bold">Net Words</th>
								<th class="pb-3.5 font-bold">WPM</th>
								<th class="pb-3.5 font-bold">Efficiency</th>
								<th class="pb-3.5 font-bold">Flesch</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-white/5">
							{#each sessions as s, i (s.id)}
								<tr class="transition-all hover:bg-white/[0.01]">
									<td class="py-3.5 font-mono text-stone-600">{i + 1}</td>
									<td class="py-3.5 text-stone-300">
										<span class="block">{formatDate(s.start_time)}</span>
										<span class="mt-0.5 block text-[10px] text-stone-500"
											>{formatTime(s.start_time)}</span
										>
									</td>
									<td class="py-3.5">
										{#if s.session_type === 'play'}
											<span
												class="bg-primary/10 border-primary/20 text-primary rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase">Play</span>
										{:else}
											<span
												class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">Edit</span>
										{/if}
									</td>
									<td class="py-3.5 font-mono text-stone-400"
										>{formatHours(s.active_duration_seconds)}</td
									>
									<td class="py-3.5 font-mono text-stone-500">{s.starting_word_count}</td>
									<td class="py-3.5 font-mono">
										{#if s.netWords >= 0}
											<span class="font-bold text-emerald-400">+{s.netWords}</span>
										{:else}
											<span class="font-bold text-rose-400">{s.netWords}</span>
										{/if}
									</td>
									<td class="py-3.5 font-mono text-stone-300">{s.wpm > 0 ? s.wpm : '—'}</td>
									<td class="py-3.5 font-mono text-stone-400"
										>{s.efficiency != null ? s.efficiency : '—'}</td
									>
									<td class="py-3.5 font-mono text-stone-400">
										{s.flesch_reading_ease != null ? s.flesch_reading_ease.toFixed(1) : '—'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
