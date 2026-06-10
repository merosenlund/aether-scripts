<script lang="ts">
	import { Dices, PenTool, HelpCircle, Timer, Activity, Sparkles, BookOpen } from '@lucide/svelte';
	import type { SuggestionItem, HintState } from '../extensions/CommandRegistry';

	let { items = [], command } = $props<{
		items: SuggestionItem[];
		command: (item: SuggestionItem) => void;
	}>();

	let selectedIndex = $state(0);
	let selectedSelectIndex = $state(0);

	// Reset browsing selection when items change
	$effect(() => {
		if (items) {
			selectedIndex = 0;
		}
	});

	// Reset select dropdown highlight when options change
	$effect(() => {
		if (hintState?.selectOptions) {
			selectedSelectIndex = 0;
		}
	});

	// ─── Derived State ──────────────────────────────────────────────

	// Is the first item a hint (command matched with params)?
	const hintState = $derived<HintState | null>(
		items.length === 1 && items[0].hintState ? items[0].hintState : null
	);

	// ─── Select Execution Helper ────────────────────────────────────

	/** Execute the command with a specific select option overriding the active param. */
	function executeWithSelectOption(option: { label: string; value: string }) {
		const item = items[0];
		if (!item?.commandDef || !hintState) return;

		const activeParam = hintState.command.params[hintState.activeParamIndex];
		const params = { ...hintState.resolvedParams, [activeParam.name]: option.value };
		const effectiveParams: Record<string, string | number> = {};
		for (const p of hintState.command.params) {
			if (params[p.name] !== undefined) effectiveParams[p.name] = params[p.name];
			else if (p.default !== undefined) effectiveParams[p.name] = p.default;
		}
		command({
			...item,
			command: ({ editor, range }: any) => {
				item.commandDef!.execute(editor, range, effectiveParams);
			}
		});
	}

	// ─── Icon Helper ────────────────────────────────────────────────

	function getIconComponent(icon: string) {
		switch (icon) {
			case 'dice': return Dices;
			case 'clock': return Timer;
			case 'activity': return Activity;
			case 'help-circle': return HelpCircle;
			case 'sparkles': return Sparkles;
			case 'book': return BookOpen;
			default: return PenTool;
		}
	}

	// ─── Keyboard Handler ───────────────────────────────────────────
	// Only handles browsing navigation and execution.
	// All text input stays in the editor — this component is passive.

	/** Expose the currently selected item so suggestion handler can check it. */
	export function getSelectedItem(): SuggestionItem | null {
		return items[selectedIndex] ?? null;
	}

	export function onKeyDown({ event }: { event: KeyboardEvent }) {
		// Hint mode: arrow navigation for select + Enter to execute
		if (hintState) {
			const hasSelectOptions = hintState.selectOptions.length > 0;

			if (event.key === 'ArrowUp' && hasSelectOptions) {
				selectedSelectIndex =
					(selectedSelectIndex + hintState.selectOptions.length - 1) %
					hintState.selectOptions.length;
				return true;
			}

			if (event.key === 'ArrowDown' && hasSelectOptions) {
				selectedSelectIndex =
					(selectedSelectIndex + 1) % hintState.selectOptions.length;
				return true;
			}

			if (event.key === 'Enter') {
				// If select options are visible, execute with the highlighted one
				if (hasSelectOptions) {
					const option = hintState.selectOptions[selectedSelectIndex];
					if (option) {
						executeWithSelectOption(option);
						return true;
					}
				}
				// No select — execute normally if params are satisfied
				const item = items[0];
				if (item && hintState.canExecute) {
					command(item);
					return true;
				}
				// Can't execute — consume the key to prevent newline
				return true;
			}
			return false;
		}

		// Browsing mode: arrow navigation + Enter to select
		if (event.key === 'ArrowUp') {
			selectedIndex = (selectedIndex + items.length - 1) % items.length;
			return true;
		}

		if (event.key === 'ArrowDown') {
			selectedIndex = (selectedIndex + 1) % items.length;
			return true;
		}

		if (event.key === 'Enter') {
			const item = items[selectedIndex];
			if (item) {
				command(item);
				return true;
			}
		}

		return false;
	}
	function scrollIntoView(node: HTMLElement, condition: boolean) {
		if (condition) {
			node.scrollIntoView({ block: 'nearest' });
		}
		return {
			update(newCondition: boolean) {
				if (newCondition) {
					node.scrollIntoView({ block: 'nearest' });
				}
			}
		};
	}
</script>

<div
	data-component="commands-list"
	class="min-w-[280px] overflow-hidden rounded-xl border border-white/10 bg-stone-900 p-1.5 shadow-2xl backdrop-blur-xl"
>
	{#if hintState}
		{@const HintIcon = getIconComponent(hintState.command.icon)}
		<!-- ─── HINT MODE: Passive parameter display ─── -->
		<div data-component="hint-panel" class="flex flex-col gap-2 p-2">
			<!-- Command Header -->
			<div data-component="hint-header" class="flex items-center gap-3 px-2 py-1">
				<div
					data-component="hint-icon"
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20"
				>
					<HintIcon class="h-4 w-4 text-primary" />
				</div>
				<div data-component="hint-titles" class="flex flex-col">
					<span class="text-xs font-bold tracking-wider text-primary uppercase">
						{hintState.command.title}
					</span>
					<span class="text-[10px] font-medium text-stone-500">
						{hintState.command.description}
					</span>
				</div>
			</div>

			<!-- Parameter Signature Line -->
			<div data-component="hint-signature" class="flex flex-wrap items-center gap-1 rounded-lg bg-white/[0.03] px-3 py-2">
				<span class="text-[10px] font-bold text-stone-600">/{hintState.command.name}</span>
				{#each hintState.command.params as param, idx (param.name)}
					{@const isActive = idx === hintState.activeParamIndex}
					{@const segment = hintState.paramSegments[idx]?.trim() || ''}
					{@const hasValue = segment.length > 0}

					{#if idx > 0}
						<span data-component="param-separator" class="text-[9px] font-bold text-stone-700">⇥</span>
					{/if}

					<span
						data-component="param-slot"
						class="rounded px-1.5 py-0.5 text-[10px] font-bold transition-all {isActive
							? 'bg-primary/15 text-primary ring-1 ring-primary/30'
							: hasValue
								? 'text-stone-300'
								: 'text-stone-600'}"
					>
						{#if hasValue}
							{param.label}: {segment}
						{:else if param.default !== undefined && !isActive}
							{param.label}: {param.default}
						{:else}
							{param.label}{param.placeholder ? `: ${param.placeholder}` : ''}
						{/if}
					</span>
				{/each}
			</div>

			<!-- Select Dropdown (if active param is select type) -->
			{#if hintState.selectOptions.length > 0}
				<div
					data-component="hint-select-options"
					class="max-h-36 overflow-y-auto rounded-lg border border-white/5 bg-stone-950/80"
				>
					{#each hintState.selectOptions as option, idx (option.value)}
						<button
							use:scrollIntoView={idx === selectedSelectIndex}
							data-component="hint-select-option"
							class="flex w-full items-center px-3 py-2 text-left text-xs font-medium transition-all {idx === selectedSelectIndex
								? 'bg-primary/20 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
								: 'text-stone-400 hover:bg-white/5 hover:text-white'}"
							onmouseenter={() => (selectedSelectIndex = idx)}
							onclick={() => executeWithSelectOption(option)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			{:else if hintState.command.params[hintState.activeParamIndex]?.type === 'select'}
				<div data-component="hint-select-empty" class="px-3 py-2 text-[10px] text-stone-600 italic">
					{hintState.command.params[hintState.activeParamIndex]?.options?.().length === 0
						? 'No items available'
						: 'No matches'}
				</div>
			{/if}

			<!-- Dice Validation Feedback -->
			{#if hintState.diceValidation}
				<div
					data-component="hint-dice-validation"
					class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-bold {hintState.diceValidation.valid
						? 'bg-emerald-500/10 text-emerald-400'
						: 'bg-rose-500/10 text-rose-400'}"
				>
					{#if hintState.diceValidation.valid}
						<span>✓</span>
						<span>Valid formula</span>
					{:else}
						<span>✗</span>
						<span>{hintState.diceValidation.error}</span>
					{/if}
				</div>
			{/if}

			<!-- Cannot Execute Warning -->
			{#if !hintState.canExecute}
				<div
					data-component="hint-missing-params"
					class="rounded-lg bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold text-amber-400"
				>
					Required parameters missing
				</div>
			{/if}

			<!-- Keyboard Hints -->
			<div
				data-component="hint-keyboard"
				class="flex items-center justify-center gap-4 border-t border-white/5 px-2 pt-2"
			>
				{#if hintState.command.params.length > 1}
					<span class="text-[9px] font-bold tracking-widest text-stone-600 uppercase">
						<kbd class="rounded bg-white/5 px-1.5 py-0.5 text-stone-400">Tab</kbd> next
					</span>
				{/if}
				<span class="text-[9px] font-bold tracking-widest text-stone-600 uppercase">
					<kbd class="rounded bg-white/5 px-1.5 py-0.5 text-stone-400">Enter</kbd> execute
				</span>
				<span class="text-[9px] font-bold tracking-widest text-stone-600 uppercase">
					<kbd class="rounded bg-white/5 px-1.5 py-0.5 text-stone-400">Esc</kbd> cancel
				</span>
			</div>
		</div>
	{:else if items && items.length}
		<!-- ─── BROWSING MODE: Command list ─── -->
		<div data-component="commands-browse" class="flex flex-col gap-0.5">
			{#each items as item, index}
				{@const ItemIcon = getIconComponent(item.icon)}
				<button
					data-component="command-item"
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all {index ===
					selectedIndex
						? 'bg-primary/20 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
						: 'text-stone-400 hover:bg-white/5 hover:text-white'}"
					onmouseenter={() => (selectedIndex = index)}
					onclick={() => command(item)}
				>
					<div
						data-component="command-icon"
						class="flex h-8 w-8 items-center justify-center rounded-lg {index === selectedIndex
							? 'bg-primary/20'
							: 'bg-white/5'}"
					>
						<ItemIcon class="h-4 w-4" />
					</div>
					<div data-component="command-text" class="flex flex-col">
						<span class="text-xs font-bold tracking-wider uppercase">{item.title}</span>
						{#if item.description}
							<span class="text-[10px] font-medium text-stone-500">{item.description}</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<div data-component="commands-empty" class="px-3 py-2 text-xs text-stone-500 italic">
			No commands found
		</div>
	{/if}
</div>
