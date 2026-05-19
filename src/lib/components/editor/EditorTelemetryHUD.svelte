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
		initialContent?: any;
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
	let sessionWordsDelta = $derived(
		telemetryStore.currentWordCount - telemetryStore.startingWordCount
	);

	onMount(async () => {
		// 1. Get current logged in user ID for presence broadcasting
		const {
			data: { user }
		} = await supabase.auth.getUser();
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
			let text = '';
			if (typeof initialContent === 'string') {
				text = initialContent.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
			} else if (typeof initialContent === 'object') {
				const extractText = (node: any): string => {
					if (!node) return '';
					if (node.type === 'text' && node.text) return node.text + ' ';
					if (node.content && Array.isArray(node.content)) {
						let inner = node.content.map(extractText).join('');
						if (node.type === 'paragraph' || node.type === 'heading') inner += ' ';
						return inner;
					}
					return '';
				};
				text = extractText(initialContent);
			}
			initialWordCount = text.trim()
				? text
						.trim()
						.split(/\s+/)
						.filter((w: string) => w.length > 0).length
				: 0;
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

<div
	class="relative z-30 flex w-full shrink-0 items-center justify-between border-t border-white/5 bg-stone-900/90 px-8 py-3.5 text-xs font-medium text-stone-400 shadow-2xl backdrop-blur-xl"
>
	<!-- Glowing Ambient Line at Top of Footer -->
	<div
		class="via-primary/30 absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent"
	></div>

	<!-- Left: Live Word Counts -->
	<div class="flex items-center gap-6">
		<div class="flex items-center gap-2">
			<Type class="h-3.5 w-3.5 text-stone-500" />
			<span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase">Scene:</span>
			<span class="font-mono text-sm font-bold text-stone-200"
				>{telemetryStore.currentWordCount}</span
			>
			<span class="text-stone-600">words</span>
		</div>

		<div class="h-4 w-px bg-white/10"></div>

		<div class="flex items-center gap-2">
			<BarChart2 class="h-3.5 w-3.5 text-stone-500" />
			<span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase"
				>Series Total:</span
			>
			<span class="font-mono text-sm font-bold text-stone-200">{seriesWordCount}</span>
			<span class="text-stone-600">words</span>
		</div>
	</div>

	<!-- Center: Session Progress Delta -->
	<div
		class="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-4 py-1 shadow-inner"
	>
		{#if sessionWordsDelta >= 0}
			<span class="font-mono text-[11px] font-bold text-emerald-400">+{sessionWordsDelta}</span>
		{:else}
			<span class="font-mono text-[11px] font-bold text-rose-400">{sessionWordsDelta}</span>
		{/if}
		<span class="text-[10px] font-bold tracking-wider text-stone-600 uppercase">this session</span>
	</div>

	<!-- Right: Session Telemetry Stopwatch & Speed -->
	<div class="flex items-center gap-6">
		<!-- Active Duration -->
		<div class="flex items-center gap-2">
			<Clock class="h-3.5 w-3.5 text-stone-500" />
			<span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase">Elapsed:</span>
			<span class="font-mono text-sm font-bold text-stone-200"
				>{formatTime(telemetryStore.durationSeconds)}</span
			>
		</div>

		<div class="h-4 w-px bg-white/10"></div>

		<!-- Rolling WPM -->
		<div class="flex items-center gap-2">
			<Zap class="h-3.5 w-3.5 text-stone-500" />
			<span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase">Speed:</span>
			<span class="font-mono text-sm font-bold text-stone-200">{telemetryStore.wpm}</span>
			<span class="text-[10px] font-bold tracking-wider text-stone-600 uppercase">WPM</span>
		</div>

		<!-- Keystroke effort indicators (hidden on small screen) -->
		<div class="hidden items-center gap-2 sm:flex">
			<div class="mr-4 h-4 w-px bg-white/10"></div>
			<span class="text-[10px] font-bold tracking-wider text-stone-500 uppercase">Keystrokes:</span>
			<span class="font-mono font-bold text-stone-300">{telemetryStore.keystrokes}</span>
		</div>
	</div>
</div>
