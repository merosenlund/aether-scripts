<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { CheckCircle2, AlertCircle, Info, X } from '@lucide/svelte';
</script>

<div class="pointer-events-none fixed right-6 bottom-6 z-[100] flex w-full max-w-sm flex-col gap-3">
	{#each $notifications as notification (notification.id)}
		<div
			animate:flip={{ duration: 300 }}
			transition:fly={{ x: 50, duration: 300 }}
			class="group pointer-events-auto relative flex items-start gap-4 rounded-2xl border border-white/10 bg-stone-900/80 p-4 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl"
		>
			<div class="mt-0.5 flex-shrink-0">
				{#if notification.type === 'success'}
					<CheckCircle2 class="h-5 w-5 text-emerald-400" />
				{:else if notification.type === 'error'}
					<AlertCircle class="h-5 w-5 text-rose-400" />
				{:else}
					<Info class="h-5 w-5 text-blue-400" />
				{/if}
			</div>

			<div class="flex-1 text-sm font-medium text-stone-200">
				{notification.message}
			</div>

			<button
				onclick={() => notifications.remove(notification.id)}
				class="flex-shrink-0 text-stone-500 transition-colors hover:text-white"
			>
				<X class="h-4 w-4" />
			</button>

			<!-- Progress bar -->
			{#if notification.duration && notification.duration > 0}
				<div class="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-full bg-white/5">
					<div
						class="h-full {notification.type === 'success'
							? 'bg-emerald-500'
							: notification.type === 'error'
								? 'bg-rose-500'
								: 'bg-blue-500'}"
						style="animation: progress {notification.duration}ms linear forwards"
					></div>
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	@keyframes progress {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
