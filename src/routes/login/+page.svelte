<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { data, form } = $props();
	let isSignUp = $state(false);
	let submitting = $state(false);

	const handleSubmit: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			update();
		};
	};
</script>

<div class="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
	<div class="w-full max-w-md space-y-6 rounded bg-white p-8 shadow-md dark:bg-zinc-900">
		<h1 class="text-center text-2xl font-bold">Aether Scripts</h1>
		<h2 class="text-center text-lg text-zinc-500">
			{isSignUp ? 'Create an Account' : 'Welcome Back'}
		</h2>

		{#if form?.error}
			<div class="rounded-lg bg-red-100 p-4 text-sm text-red-800 dark:bg-red-900 dark:text-red-300">
				{form.error}
			</div>
		{/if}

		<form method="POST" action={isSignUp ? '?/register' : '?/login'} class="space-y-4" use:enhance={handleSubmit}>
			<div>
				<label for="email" class="block text-sm font-medium">Email</label>
				<input
					type="email"
					name="email"
					id="email"
					required
					class="mt-1 w-full rounded border bg-zinc-50 p-2 dark:bg-zinc-800"
				/>
			</div>
			<div>
				<label for="password" class="block text-sm font-medium">Password</label>
				<input
					type="password"
					name="password"
					id="password"
					required
					class="mt-1 w-full rounded border bg-zinc-50 p-2 dark:bg-zinc-800"
				/>
			</div>
			<button type="submit" disabled={submitting} class="flex w-full items-center justify-center rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
				{#if submitting}
					<svg class="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Please wait...
				{:else}
					{isSignUp ? 'Sign Up' : 'Sign In'}
				{/if}
			</button>
		</form>

		<div class="mt-4 text-center text-sm text-zinc-500">
			{#if isSignUp}
				Already have an account?
				<button class="text-blue-600 hover:underline" onclick={() => (isSignUp = false)}
					>Sign in</button
				>
			{:else}
				Don't have an account?
				<button class="text-blue-600 hover:underline" onclick={() => (isSignUp = true)}
					>Sign up</button
				>
			{/if}
		</div>
	</div>
</div>
