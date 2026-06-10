<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Sparkles, Mail, Lock, CheckCircle, ArrowRight, BookOpen } from '@lucide/svelte';
	import Logo from '$lib/components/Logo.svelte';

	let { form } = $props<{ form: any }>();
	let isWaitlist = $state(false);
	let submitting = $state(false);

	const handleSubmit: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			update();
		};
	};
</script>

<div
	class="relative flex min-h-screen flex-col overflow-hidden bg-stone-950 font-sans text-stone-100 md:flex-row"
>
	<!-- Ambient Background Glows -->
	<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
		<div
			class="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]"
		></div>
		<div
			class="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]"
		></div>
	</div>

	<!-- Left Branding Panel (Atmospheric & Creative) -->
	<div
		class="relative flex flex-col justify-between border-b border-white/5 bg-stone-900/20 p-8 pt-16 md:w-[45%] md:border-r md:border-b-0 md:p-12 lg:p-16"
	>
		<div class="flex items-center gap-3">
			<div
				class="bg-primary shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
			>
				<Logo class="text-primary-foreground h-6 w-6" />
			</div>
			<span class="text-xl font-bold tracking-tight text-white">Aether Scripts</span>
		</div>

		<div class="my-auto space-y-6 py-12 md:py-0">
			<div
				class="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-xs font-bold text-violet-400"
			>
				<Sparkles class="h-3.5 w-3.5" />
				Early Development
			</div>
			<h1
				class="font-serif text-4xl leading-tight font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
			>
				The future of <span
					class="bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent"
					>Actual Play</span
				> journaling.
			</h1>
			<p class="max-w-md text-base leading-relaxed text-stone-400 md:text-lg">
				Aether Scripts is a curated, digital-first actual play fiction platform for reading my work.
			</p>
		</div>

		<div class="text-xs text-stone-500">
			&copy; {new Date().getFullYear()} Aether Scripts. All rights reserved.
		</div>
	</div>

	<!-- Right Form Panel -->
	<div class="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 md:px-16 lg:px-24">
		<div class="mx-auto w-full max-w-md space-y-8">
			<!-- Form Header -->
			<div class="space-y-2 text-center md:text-left">
				<h2 class="font-serif text-3xl font-bold tracking-tight text-white">
					{isWaitlist ? 'Request Invitation' : 'Welcome Back'}
				</h2>
				<p class="text-sm text-stone-400">
					{isWaitlist
						? "We're hand-selecting our first readers. Enter your details to get on the waitlist."
						: 'Access your workspace and serial journals.'}
				</p>
			</div>

			<!-- Success States -->
			{#if form?.waitlistSuccess}
				<div
					class="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center shadow-lg shadow-emerald-500/5"
				>
					<div
						class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"
					>
						<CheckCircle class="h-6 w-6" />
					</div>
					<div class="space-y-1">
						<h3 class="text-base font-bold text-white">You're on the list!</h3>
						<p class="text-xs leading-relaxed text-stone-400">
							Thank you for your interest. We'll reach out to you as soon as early access slots open
							up.
						</p>
					</div>
					<button
						type="button"
						onclick={() => {
							isWaitlist = false;
							if (form) form.waitlistSuccess = false;
						}}
						class="text-primary text-xs font-bold hover:underline"
					>
						Go back to sign in
					</button>
				</div>
			{:else}
				<!-- Errors -->
				{#if form?.error}
					<div
						class="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-semibold text-red-400"
					>
						{form.error}
					</div>
				{/if}
				{#if form?.waitlistError}
					<div
						class="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-semibold text-red-400"
					>
						{form.waitlistError}
					</div>
				{/if}

				<!-- Interactive Forms -->
				{#if isWaitlist}
					<!-- Waitlist Invitation Form -->
					<form method="POST" action="?/joinWaitlist" class="space-y-5" use:enhance={handleSubmit}>
						<div class="space-y-1.5">
							<label
								for="waitlist-email"
								class="text-xs font-bold tracking-wider text-stone-400 uppercase"
								>Email Address</label
							>
							<div class="relative">
								<div
									class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-500"
								>
									<Mail class="h-4.5 w-4.5" />
								</div>
								<input
									type="email"
									name="email"
									id="waitlist-email"
									required
									placeholder="you@example.com"
									class="focus:border-primary/50 focus:ring-primary/20 w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-11 text-sm text-white placeholder-stone-500 transition-all focus:ring-1 focus:outline-none"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<label
								for="interest-note"
								class="text-xs font-bold tracking-wider text-stone-400 uppercase"
								>What excites you about Aether Scripts?</label
							>
							<textarea
								name="interestNote"
								id="interest-note"
								rows="3"
								placeholder="Are you a solo TTRPG player, writer, or reader? Let us know!"
								class="focus:border-primary/50 focus:ring-primary/20 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-stone-500 transition-all focus:ring-1 focus:outline-none"
							></textarea>
						</div>

						<button
							type="submit"
							disabled={submitting}
							class="bg-primary text-primary-foreground shadow-primary/20 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold shadow-lg transition-all hover:opacity-95 disabled:opacity-50"
						>
							{#if submitting}
								<div
									class="border-primary-foreground mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
								></div>
								Submitting...
							{:else}
								Join the Waitlist
								<ArrowRight class="ml-2 h-4 w-4" />
							{/if}
						</button>
					</form>
				{:else}
					<!-- Login Form -->
					<form method="POST" action="?/login" class="space-y-5" use:enhance={handleSubmit}>
						<div class="space-y-1.5">
							<label
								for="login-email"
								class="text-xs font-bold tracking-wider text-stone-400 uppercase"
								>Email Address</label
							>
							<div class="relative">
								<div
									class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-500"
								>
									<Mail class="h-4.5 w-4.5" />
								</div>
								<input
									type="email"
									name="email"
									id="login-email"
									required
									placeholder="you@example.com"
									class="focus:border-primary/50 focus:ring-primary/20 w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-11 text-sm text-white placeholder-stone-500 transition-all focus:ring-1 focus:outline-none"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<label
								for="login-password"
								class="text-xs font-bold tracking-wider text-stone-400 uppercase">Password</label
							>
							<div class="relative">
								<div
									class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-500"
								>
									<Lock class="h-4.5 w-4.5" />
								</div>
								<input
									type="password"
									name="password"
									id="login-password"
									required
									placeholder="••••••••"
									class="focus:border-primary/50 focus:ring-primary/20 w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-11 text-sm text-white placeholder-stone-500 transition-all focus:ring-1 focus:outline-none"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={submitting}
							class="bg-primary text-primary-foreground shadow-primary/20 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold shadow-lg transition-all hover:opacity-95 disabled:opacity-50"
						>
							{#if submitting}
								<div
									class="border-primary-foreground mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
								></div>
								Signing in...
							{:else}
								Sign In
								<ArrowRight class="ml-2 h-4 w-4" />
							{/if}
						</button>
					</form>
				{/if}

				<!-- Toggle Footer Link -->
				<div class="text-center text-sm text-stone-400">
					{#if isWaitlist}
						Have an invite?
						<button
							type="button"
							class="text-primary font-bold hover:underline"
							onclick={() => {
								isWaitlist = false;
								if (form) {
									form.waitlistError = null;
									form.error = null;
								}
							}}
						>
							Log In
						</button>
					{:else}
						Don't have an account?
						<button
							type="button"
							class="text-primary font-bold hover:underline"
							onclick={() => {
								isWaitlist = true;
								if (form) {
									form.waitlistError = null;
									form.error = null;
								}
							}}
						>
							Request Invitation
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
