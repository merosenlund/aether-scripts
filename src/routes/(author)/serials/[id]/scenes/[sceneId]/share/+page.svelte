<script lang="ts">
	import { supabase } from '$lib/supabaseClient';
	import { notifications } from '$lib/stores/notifications';
	import {
		Eye,
		Calendar,
		Award,
		GitBranch,
		Save,
		Info,
		AlertTriangle,
		ShieldCheck
	} from '@lucide/svelte';
	import { fade, slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props<{ data: any }>();

	// Scene publishing settings
	let activeStatus = $state(data.scene.status || 'Playing');
	let semanticVersion = $state(data.scene.semantic_version || '1.0.0');
	let isScheduled = $state(!!data.scene.scheduled_status_at);
	let scheduledDate = $state(
		data.scene.scheduled_status_at ? data.scene.scheduled_status_at.split('T')[0] : ''
	);
	let scheduledTime = $state(
		data.scene.scheduled_status_at
			? data.scene.scheduled_status_at.split('T')[1]?.substring(0, 5)
			: '08:00'
	);

	// Serial-level teaser settings
	let teaserPercent = $state(data.scene.serials?.next_scene_completion_percentage || 0);
	let teaserNote = $state(data.scene.serials?.next_scene_update_note || '');

	let isSavingScene = $state(false);
	let isSavingTeaser = $state(false);

	// Derived dirty state check for publish settings
	let isDirty = $derived(
		activeStatus !== (data.scene.status || 'Playing') ||
			semanticVersion !== (data.scene.semantic_version || '1.0.0') ||
			isScheduled !== !!data.scene.scheduled_status_at ||
			(isScheduled &&
				scheduledDate !==
					(data.scene.scheduled_status_at ? data.scene.scheduled_status_at.split('T')[0] : '')) ||
			(isScheduled &&
				scheduledTime !==
					(data.scene.scheduled_status_at
						? data.scene.scheduled_status_at.split('T')[1]?.substring(0, 5)
						: '08:00'))
	);

	// Status explanations
	const statusLevels = [
		{
			name: 'Playing',
			desc: 'Currently in active play/journaling mode. Hidden from readers.',
			color: 'text-stone-500 bg-stone-500/10'
		},
		{
			name: 'Editing',
			desc: 'Drafting finished, currently polishing narrative text. Hidden from readers.',
			color: 'text-amber-500 bg-amber-500/10'
		},
		{
			name: 'Beta',
			desc: 'Available only to beta readers or special premium tiers.',
			color: 'text-blue-500 bg-blue-500/10'
		},
		{
			name: 'Published',
			desc: 'Fully released and readable by all subscribers.',
			color: 'text-emerald-500 bg-emerald-500/10'
		},
		{
			name: 'Hidden',
			desc: 'Archived or temporarily hidden from feeds.',
			color: 'text-rose-500 bg-rose-500/10'
		}
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
				published_at:
					activeStatus === 'Published' ? new Date().toISOString() : data.scene.published_at
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
		const percentToSave =
			activeStatus === 'Playing'
				? Math.min(100, Math.round(((data.scene.word_count || 0) / 1000) * 100))
				: teaserPercent;

		const { error } = await supabase
			.from('serials')
			.update({
				next_scene_completion_percentage: percentToSave,
				next_scene_update_note: teaserNote,
				teaser_target_scene_id: data.scene.id
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
	<div class="mx-auto max-w-4xl space-y-8 pb-32">
		<!-- Header -->
		<div class="space-y-2">
			<h2 class="font-serif text-3xl font-bold text-white/95">Publishing & Sharing Workspace</h2>
			<p class="max-w-2xl text-sm leading-relaxed text-stone-500">
				Manage scene visibility, queue scheduled status transitions, tag semantic versions, and
				construct upcoming teaser metrics for your reader base.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			<!-- Left / Mid Columns: Scene Publishing & Versioning -->
			<div class="space-y-6 md:col-span-2">
				<!-- Access Control Card -->
				<div
					class="space-y-5 rounded-3xl border border-white/5 bg-stone-900/40 p-6 backdrop-blur-md"
				>
					<h3
						class="flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold tracking-widest text-stone-400 uppercase"
					>
						<Eye class="text-primary h-4 w-4" />
						Access-Based Status Hierarchy
					</h3>

					<div class="grid grid-cols-1 gap-2.5">
						{#each statusLevels as level}
							<button
								onclick={() => (activeStatus = level.name)}
								class="flex items-start gap-4 rounded-2xl border p-4 text-left transition-all {activeStatus ===
								level.name
									? 'border-primary bg-white/[0.03] shadow-[0_0_12px_rgba(var(--primary),0.03)]'
									: 'border-white/5 bg-transparent hover:border-white/10'}"
							>
								<div
									class="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border {activeStatus ===
									level.name
										? 'border-primary'
										: 'border-stone-600'}"
								>
									{#if activeStatus === level.name}
										<div class="bg-primary h-2.5 w-2.5 animate-pulse rounded-full"></div>
									{/if}
								</div>
								<div class="space-y-1">
									<div class="flex items-center gap-2">
										<span class="text-sm font-bold text-white/90">{level.name}</span>
										<span
											class="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase {level.color}"
										>
											Hierarchy Level
										</span>
									</div>
									<p class="text-xs leading-relaxed font-medium text-stone-500">{level.desc}</p>
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Scheduled Publishing Card -->
				<div
					class="space-y-5 rounded-3xl border border-white/5 bg-stone-900/40 p-6 backdrop-blur-md"
				>
					<div class="flex items-center justify-between border-b border-white/5 pb-3">
						<h3
							class="flex items-center gap-2 text-sm font-bold tracking-widest text-stone-400 uppercase"
						>
							<Calendar class="text-primary h-4 w-4" />
							Scheduled Status Transitions
						</h3>
						<button
							onclick={() => (isScheduled = !isScheduled)}
							class="rounded-xl border px-3.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all {isScheduled
								? 'bg-primary/20 border-primary text-primary'
								: 'border-white/10 bg-white/5 text-stone-500 hover:text-white'}"
						>
							{isScheduled ? 'Enabled' : 'Disabled'}
						</button>
					</div>

					{#if isScheduled}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2" transition:slide>
							<div class="space-y-1.5">
								<label
									for="sched_date"
									class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
									>Release Date</label
								>
								<input
									id="sched_date"
									type="date"
									bind:value={scheduledDate}
									class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-stone-100 transition-all focus:outline-none"
								/>
							</div>
							<div class="space-y-1.5">
								<label
									for="sched_time"
									class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
									>Release Time</label
								>
								<input
									id="sched_time"
									type="time"
									bind:value={scheduledTime}
									class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-stone-100 transition-all focus:outline-none"
								/>
							</div>
						</div>
						<div
							class="flex items-start gap-2.5 rounded-2xl border border-white/5 bg-white/[0.01] p-4"
							transition:fade
						>
							<Info class="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
							<p class="text-[10px] leading-relaxed font-medium text-stone-500">
								Decoupled Query-Time execution model: Readers' notification schedules in Phase 6
								will actively check this timestamp. A background cron job is not required to publish
								it.
							</p>
						</div>
					{:else}
						<p class="text-xs text-stone-500 italic">
							This scene will switch state immediately upon saving.
						</p>
					{/if}
				</div>
			</div>

			<!-- Right Column: Versioning & Progress Teasers -->
			<div class="space-y-6">
				<!-- Semantic Versioning Card -->
				<div
					class="space-y-5 rounded-3xl border border-white/5 bg-stone-900/40 p-6 backdrop-blur-md"
				>
					<h3
						class="flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold tracking-widest text-stone-400 uppercase"
					>
						<GitBranch class="text-primary h-4 w-4" />
						Semantic Versioning
					</h3>

					<div class="space-y-4">
						<div class="space-y-1.5">
							<label
								for="sem_ver"
								class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
								>Reader-facing Version</label
							>
							<input
								id="sem_ver"
								type="text"
								bind:value={semanticVersion}
								class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center font-mono text-sm tracking-widest text-stone-100 transition-all focus:outline-none"
								placeholder="e.g. 1.0.0"
							/>
						</div>

						<div class="grid grid-cols-3 gap-2">
							<button
								onclick={() => bumpVersion('major')}
								class="rounded-xl border border-white/5 bg-white/[0.02] py-2 text-[10px] font-bold tracking-wider uppercase transition-all hover:border-white/10 hover:bg-white/5"
							>
								+ Major
							</button>
							<button
								onclick={() => bumpVersion('minor')}
								class="rounded-xl border border-white/5 bg-white/[0.02] py-2 text-[10px] font-bold tracking-wider uppercase transition-all hover:border-white/10 hover:bg-white/5"
							>
								+ Minor
							</button>
							<button
								onclick={() => bumpVersion('patch')}
								class="rounded-xl border border-white/5 bg-white/[0.02] py-2 text-[10px] font-bold tracking-wider uppercase transition-all hover:border-white/10 hover:bg-white/5"
							>
								+ Patch
							</button>
						</div>

						<p class="text-[9px] leading-relaxed font-medium text-stone-500">
							Use Major for full rewrites, Minor for polish/additions, and Patch for small typo
							fixes.
						</p>
					</div>
				</div>

				<!-- Serial Progress Teaser Card -->
				<div
					class="space-y-5 rounded-3xl border border-white/5 bg-stone-900/40 p-6 backdrop-blur-md"
				>
					<h3
						class="flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold tracking-widest text-stone-400 uppercase"
					>
						<Award class="text-primary h-4 w-4" />
						Upcoming Teaser
					</h3>

					<div class="space-y-4">
						<div class="space-y-2">
							<div
								class="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase"
							>
								<label for="teaser_percent" class="text-stone-400">Completion</label>
								<span class="text-primary font-mono">
									{activeStatus === 'Playing'
										? Math.min(100, Math.round(((data.scene.word_count || 0) / 1000) * 100))
										: teaserPercent}%
								</span>
							</div>

							{#if activeStatus === 'Playing'}
								<div
									class="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 text-[10px] leading-relaxed font-medium text-stone-500"
									transition:fade
								>
									ℹ️ Live word count automatic teaser: calculated based on your 1000 words
									rule-of-thumb while in <span class="text-primary font-bold">Playing</span> status.
									Current scene word count:
									<span class="font-bold text-white">{data.scene.word_count || 0} / 1000</span> words.
								</div>
							{:else}
								<div transition:slide>
									<input
										id="teaser_percent"
										type="range"
										min="0"
										max="100"
										bind:value={teaserPercent}
										class="accent-primary h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10"
									/>
									<p class="mt-1.5 text-[9px] leading-relaxed font-medium text-stone-500">
										Adjust this slider manually to represent your editing progress for readers.
									</p>
								</div>
							{/if}
						</div>

						<div class="space-y-1.5">
							<label
								for="teaser_note"
								class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
								>Update Teaser Note</label
							>
							<textarea
								id="teaser_note"
								bind:value={teaserNote}
								rows="3"
								class="focus:border-primary/50 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs leading-relaxed text-stone-200 transition-all focus:outline-none"
								placeholder="Tease your readers with what's next..."
							></textarea>
						</div>

						<button
							onclick={saveSerialTeaser}
							disabled={isSavingTeaser}
							class="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold transition-all hover:border-white/20 hover:bg-white/10"
						>
							<Save class="h-4 w-4 text-stone-400" />
							{isSavingTeaser ? 'Saving Teaser...' : 'Save Teaser'}
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Sticky Bottom Bar -->
		{#if isDirty}
			<div
				transition:fade={{ duration: 150 }}
				class="fixed bottom-6 left-1/2 z-40 w-full max-w-4xl -translate-x-1/2 px-8"
			>
				<div
					class="flex items-center justify-between rounded-2xl border border-white/10 bg-stone-900/90 p-4 shadow-2xl backdrop-blur-xl"
				>
					<div class="flex items-center gap-2">
						<ShieldCheck class="h-5 w-5 text-emerald-400" />
						<span class="text-xs font-bold text-stone-300"
							>Unsaved scene configuration settings.</span
						>
					</div>
					<button
						onclick={saveScenePublishSettings}
						disabled={isSavingScene}
						class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-xl px-6 py-2.5 text-xs font-bold shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
					>
						<Save class="mr-2 h-4 w-4" />
						{isSavingScene ? 'Saving Settings...' : 'Save Configuration'}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
