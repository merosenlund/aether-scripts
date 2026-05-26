<script lang="ts">
	import { User, Mail, Shield, LogOut } from '@lucide/svelte';
	let { data } = $props();
</script>

<div class="mx-auto max-w-4xl space-y-8 p-8 pb-32">
	<!-- Glowing Header Card -->
	<div class="relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl md:p-12">
		<div class="absolute inset-0 -z-10 bg-gradient-to-r from-violet-600/10 via-indigo-500/10 to-transparent"></div>
		
		<!-- Decorative circles -->
		<div class="absolute top-0 right-0 -z-10 h-72 w-72 translate-x-1/4 -translate-y-1/4 rounded-full bg-indigo-500/10 blur-3xl"></div>

		<div class="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
			<div class="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] border border-white/10 bg-zinc-950/50 shadow-inner">
				<User class="h-12 w-12 text-indigo-400" />
			</div>
			<div class="space-y-4">
				<div class="space-y-1">
					<div class="flex flex-wrap items-center justify-center gap-3 md:justify-start">
						<h1 class="text-3xl font-extrabold tracking-tight text-white md:text-4xl">User Profile</h1>
						{#if data.userRole}
							<span class="rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-bold tracking-widest text-violet-300 uppercase">
								{data.userRole}
							</span>
						{/if}
					</div>
					<p class="text-zinc-400 font-medium">Manage your writer-reader account and settings.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Info Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<!-- Account Details -->
		<div class="rounded-2xl border border-white/5 bg-zinc-900/30 p-6 space-y-6">
			<h2 class="text-lg font-bold text-white flex items-center gap-2">
				<Shield class="h-5 w-5 text-indigo-400" />
				Account Security
			</h2>
			
			<div class="space-y-4">
				<div class="flex items-center justify-between rounded-xl bg-zinc-900/50 p-4 border border-white/5">
					<div class="flex items-center gap-3">
						<Mail class="h-5 w-5 text-zinc-500" />
						<div>
							<p class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Email Address</p>
							<p class="text-sm font-medium text-white">{data.session?.user?.email || 'Not signed in'}</p>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-between rounded-xl bg-zinc-900/50 p-4 border border-white/5">
					<div class="flex items-center gap-3">
						<User class="h-5 w-5 text-zinc-500" />
						<div>
							<p class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">User Identifier</p>
							<p class="text-xs font-mono text-zinc-400 truncate max-w-[200px] md:max-w-xs">{data.session?.user?.id || 'N/A'}</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="rounded-2xl border border-white/5 bg-zinc-900/30 p-6 flex flex-col justify-between space-y-6">
			<div class="space-y-2">
				<h2 class="text-lg font-bold text-white flex items-center gap-2">
					<LogOut class="h-5 w-5 text-rose-400" />
					Session Management
				</h2>
				<p class="text-sm text-zinc-400">Sign out of your active session on this device to clear all local cookies and storage.</p>
			</div>

			<form method="POST" action="?/logout">
				<button type="submit" class="group flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-6 py-3.5 text-sm font-bold text-rose-400 transition-all duration-300 hover:bg-rose-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-rose-500/20 active:scale-[0.98]">
					<LogOut class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
					Sign Out of Account
				</button>
			</form>
		</div>
	</div>
</div>
