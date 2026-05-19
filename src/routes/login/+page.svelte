<script lang="ts">
	let { data, form } = $props();
	let isSignUp = $state(false);
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

		<form method="POST" action={isSignUp ? '?/register' : '?/login'} class="space-y-4">
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
			<button type="submit" class="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700">
				{isSignUp ? 'Sign Up' : 'Sign In'}
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
