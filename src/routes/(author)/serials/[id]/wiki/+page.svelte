<script lang="ts">
	import { BookOpen } from '@lucide/svelte';

	let { data } = $props<{ data: any }>();

	const totalEntities = $derived(data.entities?.length || 0);
	const totalEvents = $derived(data.events?.length || 0);
</script>

<!-- Welcome state when no entity is selected -->
<div
	data-component="wiki-welcome"
	class="flex flex-1 flex-col items-center justify-center gap-6 p-12"
>
	<div
		data-component="welcome-icon"
		class="bg-primary/10 text-primary rounded-3xl border border-white/5 p-6"
	>
		<BookOpen size={32} />
	</div>

	<div data-component="welcome-text" class="space-y-2 text-center">
		<h2 data-component="welcome-title" class="text-xl font-bold tracking-tight text-white">
			World Lore Ledger
		</h2>
		<p data-component="welcome-desc" class="max-w-md text-sm leading-relaxed text-stone-500">
			Select an entity from the sidebar to view its details and timeline, or create a new one to
			begin building your world.
		</p>
	</div>

	<!-- Overview grid -->
	<div data-component="overview-grid" class="mt-4 flex gap-6">
		<div
			data-component="stat-card-entities"
			class="flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.02] px-8 py-5"
		>
			<span
				data-component="stat-value"
				class="text-primary text-3xl font-black tabular-nums tracking-tight">{totalEntities}</span
			>
			<span
				data-component="stat-label"
				class="mt-1 text-[10px] font-bold tracking-widest text-stone-600 uppercase">Entities</span
			>
		</div>
		<div
			data-component="stat-card-events"
			class="flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.02] px-8 py-5"
		>
			<span
				data-component="stat-value"
				class="text-primary text-3xl font-black tabular-nums tracking-tight">{totalEvents}</span
			>
			<span
				data-component="stat-label"
				class="mt-1 text-[10px] font-bold tracking-widest text-stone-600 uppercase"
				>Events Logged</span
			>
		</div>
	</div>
</div>
