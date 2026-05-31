<script lang="ts">
	import { navigating } from '$app/state';
</script>

{#if navigating.to}
	<div
		class="fixed top-0 left-0 right-0 z-50 h-1 overflow-hidden bg-primary/20"
	>
		<div class="h-full bg-primary animate-progress-indeterminate"></div>
	</div>
{/if}

<style>
	@keyframes progress-indeterminate {
		0% {
			width: 0%;
			transform: translateX(-100%);
		}
		50% {
			width: 50%;
			transform: translateX(50%);
		}
		100% {
			width: 100%;
			transform: translateX(100%);
		}
	}
	.animate-progress-indeterminate {
		animation: progress-indeterminate 1.5s infinite linear;
	}
</style>
