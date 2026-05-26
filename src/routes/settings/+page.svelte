<script lang="ts">
	import { User, Eye, ShieldAlert, Sparkles } from '@lucide/svelte';
	let { data } = $props<{ data: any }>();

	let activeTab = $state('reading'); // Default to reading preferences

	let readingFontSize = $state('medium');
	let commentMode = $state('proximity');
	let showScrollTeasers = $state(true);
	let optInAnalytics = $state(true);
	let shareOnlineStatus = $state(true);
	let displayName = $state('');

	// Safely react to changes in user session data
	$effect(() => {
		if (data.session?.user?.email) {
			displayName = data.session.user.email.split('@')[0] || 'Reader';
		}
	});

	let successMessage = $state('');

	function handleSave(e: Event) {
		e.preventDefault();
		successMessage = 'Preferences saved successfully!';
		setTimeout(() => {
			successMessage = '';
		}, 3000);
	}
</script>

<div data-component="settings-page-container" class="mx-auto w-full max-w-4xl px-8 py-12 text-zinc-100">
	<div data-component="settings-header" class="mb-8 space-y-2">
		<h1 data-component="settings-title" class="font-sans text-4xl font-bold tracking-tight text-white">
			Account Settings
		</h1>
		<p data-component="settings-subtitle" class="text-sm text-zinc-500">
			Manage your reading preferences, profile details, and privacy settings.
		</p>
	</div>

	{#if successMessage}
		<div data-component="success-banner" class="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
			<Sparkles data-component="success-icon" class="h-5 w-5 shrink-0" />
			<span data-component="success-text">{successMessage}</span>
		</div>
	{/if}

	<div data-component="settings-layout" class="grid grid-cols-1 gap-8 md:grid-cols-4">
		<!-- Sidebar Tabs -->
		<div data-component="settings-tabs-sidebar" class="flex flex-col space-y-1 md:col-span-1">
			<button
				data-component="tab-button-reading"
				onclick={() => (activeTab = 'reading')}
				class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {activeTab === 'reading' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}"
			>
				<Eye data-component="tab-icon-reading" class="h-4 w-4" />
				Reading
			</button>
			<button
				data-component="tab-button-profile"
				onclick={() => (activeTab = 'profile')}
				class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {activeTab === 'profile' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}"
			>
				<User data-component="tab-button-profile-icon" class="h-4 w-4" />
				Profile
			</button>
			<button
				data-component="tab-button-privacy"
				onclick={() => (activeTab = 'privacy')}
				class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {activeTab === 'privacy' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}"
			>
				<ShieldAlert data-component="tab-icon-privacy" class="h-4 w-4" />
				Privacy
			</button>
		</div>

		<!-- Tab Panels -->
		<div data-component="settings-tab-panel-container" class="rounded-3xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-xl md:col-span-3">
			<form data-component="settings-form" onsubmit={handleSave} class="space-y-6">
				{#if activeTab === 'reading'}
					<!-- Reading Tab -->
					<div data-component="reading-section" class="space-y-6">
						<div data-component="reading-section-header" class="border-b border-white/5 pb-4">
							<h3 data-component="reading-section-title" class="font-sans text-xl font-semibold text-white">Reading Preferences</h3>
							<p data-component="reading-section-desc" class="text-xs text-zinc-500">Fine-tune your reading experience across the narrative multiverse.</p>
						</div>

						<!-- Font Size -->
						<div data-component="font-size-group" class="space-y-2">
							<span data-component="font-size-label" class="block text-sm font-medium text-zinc-300">Prose Font Size</span>
							<div data-component="font-size-options" class="flex gap-4">
								{#each ['small', 'medium', 'large'] as size}
									<button
										data-component="font-size-option-{size}"
										type="button"
										onclick={() => (readingFontSize = size)}
										class="flex-1 rounded-xl border border-white/5 py-3 text-center text-sm font-medium transition-all capitalize {readingFontSize === size ? 'bg-white text-zinc-950 font-bold border-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}"
									>
										{size}
									</button>
								{/each}
							</div>
						</div>

						<!-- Comment Mode -->
						<div data-component="comment-mode-group" class="space-y-2">
							<span data-component="comment-mode-label" class="block text-sm font-medium text-zinc-300">Immersion commenting (Phase 6)</span>
							<div data-component="comment-mode-container" class="space-y-2">
								<button
									data-component="comment-mode-option-proximity"
									type="button"
									onclick={() => (commentMode = 'proximity')}
									class="flex w-full items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:bg-white/10 {commentMode === 'proximity' ? 'border-primary/50 bg-primary/5' : ''}"
								>
									<div data-component="comment-mode-proximity-radio" class="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border {commentMode === 'proximity' ? 'border-primary bg-primary' : 'border-zinc-600'}">
										{#if commentMode === 'proximity'}
											<div data-component="comment-mode-proximity-dot" class="h-1.5 w-1.5 rounded-full bg-white"></div>
										{/if}
									</div>
									<div data-component="comment-mode-proximity-text" class="space-y-1">
										<span data-component="comment-mode-proximity-title" class="block text-sm font-semibold text-white">Proximity Reveal (Recommended)</span>
										<span data-component="comment-mode-proximity-desc" class="block text-xs text-zinc-500">Inline comments default to hidden. Writing a comment or tapping reveals other comments for that block to preserve immersion.</span>
									</div>
								</button>

								<button
									data-component="comment-mode-option-always"
									type="button"
									onclick={() => (commentMode = 'always')}
									class="flex w-full items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:bg-white/10 {commentMode === 'always' ? 'border-primary/50 bg-primary/5' : ''}"
								>
									<div data-component="comment-mode-always-radio" class="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border {commentMode === 'always' ? 'border-primary bg-primary' : 'border-zinc-600'}">
										{#if commentMode === 'always'}
											<div data-component="comment-mode-always-dot" class="h-1.5 w-1.5 rounded-full bg-white"></div>
										{/if}
									</div>
									<div data-component="comment-mode-always-text" class="space-y-1">
										<span data-component="comment-mode-always-title" class="block text-sm font-semibold text-white">Always Show</span>
										<span data-component="comment-mode-always-desc" class="block text-xs text-zinc-500">Show all inline comment indicators instantly across the entire scene for deep exploration.</span>
									</div>
								</button>

								<button
									data-component="comment-mode-option-hide"
									type="button"
									onclick={() => (commentMode = 'hide')}
									class="flex w-full items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:bg-white/10 {commentMode === 'hide' ? 'border-primary/50 bg-primary/5' : ''}"
								>
									<div data-component="comment-mode-hide-radio" class="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border {commentMode === 'hide' ? 'border-primary bg-primary' : 'border-zinc-600'}">
										{#if commentMode === 'hide'}
											<div data-component="comment-mode-hide-dot" class="h-1.5 w-1.5 rounded-full bg-white"></div>
										{/if}
									</div>
									<div data-component="comment-mode-hide-text" class="space-y-1">
										<span data-component="comment-mode-hide-title" class="block text-sm font-semibold text-white">Hide All Comments</span>
										<span data-component="comment-mode-hide-desc" class="block text-xs text-zinc-500">No inline comment elements are displayed. Read in perfect isolation.</span>
									</div>
								</button>
							</div>
						</div>

						<!-- Scroll Teasers Toggle -->
						<div data-component="scroll-teaser-group" class="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
							<div data-component="scroll-teaser-text" class="space-y-1">
								<span data-component="scroll-teaser-title" class="block text-sm font-semibold text-white">Progress Teasers</span>
								<span data-component="scroll-teaser-desc" class="block text-xs text-zinc-500">Display author typing stats, WPM telemetry, and upcoming content indicators at end-of-scroll.</span>
							</div>
							<button
								aria-label="Toggle progress teasers"
								data-component="scroll-teaser-toggle"
								type="button"
								onclick={() => (showScrollTeasers = !showScrollTeasers)}
								class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {showScrollTeasers ? 'bg-emerald-500' : 'bg-zinc-700'}"
							>
								<span data-component="scroll-teaser-slider" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out {showScrollTeasers ? 'translate-x-5' : 'translate-x-0'}"></span>
							</button>
						</div>
					</div>
				{:else if activeTab === 'profile'}
					<!-- Profile Tab -->
					<div data-component="profile-section" class="space-y-6">
						<div data-component="profile-section-header" class="border-b border-white/5 pb-4">
							<h3 data-component="profile-section-title" class="font-sans text-xl font-semibold text-white">Profile Information</h3>
							<p data-component="profile-section-desc" class="text-xs text-zinc-500">Manage your credentials and user presence details.</p>
						</div>

						<!-- Email Display -->
						<div data-component="profile-email-group" class="space-y-2">
							<span data-component="profile-email-label" class="block text-sm font-medium text-zinc-400">Account Email</span>
							<div data-component="profile-email-input" class="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-zinc-500 select-none">
								{data.session?.user.email}
							</div>
						</div>

						<!-- Display Name -->
						<div data-component="profile-name-group" class="space-y-2">
							<label for="display-name-input" data-component="profile-name-label" class="text-sm font-medium text-zinc-300">Display Name</label>
							<input
								id="display-name-input"
								data-component="profile-name-input"
								type="text"
								bind:value={displayName}
								class="w-full rounded-xl border border-white/10 bg-stone-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-white focus:outline-none"
								placeholder="Enter display name"
							/>
						</div>

						<!-- Role -->
						<div data-component="profile-role-group" class="space-y-2">
							<span data-component="profile-role-label" class="block text-sm font-medium text-zinc-400">System Role</span>
							<div data-component="profile-role-input" class="inline-flex rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold tracking-widest text-emerald-400 uppercase">
								{data.userRole || 'Reader'}
							</div>
						</div>
					</div>
				{:else if activeTab === 'privacy'}
					<!-- Privacy Tab -->
					<div data-component="privacy-section" class="space-y-6">
						<div data-component="privacy-section-header" class="border-b border-white/5 pb-4">
							<h3 data-component="privacy-section-title" class="font-sans text-xl font-semibold text-white">Privacy & Telemetry</h3>
							<p data-component="privacy-section-desc" class="text-xs text-zinc-500">Configure what data is shared with authors for a transparent actual play experience.</p>
						</div>

						<!-- Transparent CRM -->
						<div data-component="opt-in-crm-group" class="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
							<div data-component="opt-in-crm-text" class="space-y-1">
								<span data-component="opt-in-crm-title" class="block text-sm font-semibold text-white">Opt-In CRM Engagement (Phase 8)</span>
								<span data-component="opt-in-crm-desc" class="block text-xs text-zinc-500">Allow authors to view your milestones (e.g. reading duration, support frequency) in their CRM for dedications.</span>
							</div>
							<button
								aria-label="Toggle CRM engagement"
								data-component="opt-in-crm-toggle"
								type="button"
								onclick={() => (optInAnalytics = !optInAnalytics)}
								class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {optInAnalytics ? 'bg-emerald-500' : 'bg-zinc-700'}"
							>
								<span data-component="opt-in-crm-slider" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out {optInAnalytics ? 'translate-x-5' : 'translate-x-0'}"></span>
							</button>
						</div>

						<!-- Share Live Presence -->
						<div data-component="live-presence-group" class="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
							<div data-component="live-presence-text" class="space-y-1">
								<span data-component="live-presence-title" class="block text-sm font-semibold text-white">Share Reader Presence</span>
								<span data-component="live-presence-desc" class="block text-xs text-zinc-500">Contribute anonymously to stream analytics and live reactions (Phase 9) when reading online.</span>
							</div>
							<button
								aria-label="Toggle live presence sharing"
								data-component="live-presence-toggle"
								type="button"
								onclick={() => (shareOnlineStatus = !shareOnlineStatus)}
								class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {shareOnlineStatus ? 'bg-emerald-500' : 'bg-zinc-700'}"
							>
								<span data-component="live-presence-slider" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out {shareOnlineStatus ? 'translate-x-5' : 'translate-x-0'}"></span>
							</button>
						</div>
					</div>
				{/if}

				<!-- Save Button -->
				<div data-component="settings-save-actions" class="flex justify-end border-t border-white/5 pt-6">
					<button
						data-component="settings-save-button"
						type="submit"
						class="bg-primary text-primary-foreground shadow-primary/20 rounded-xl px-6 py-3 font-semibold shadow-lg transition-opacity hover:opacity-90"
					>
						Save Changes
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
