/**
 * CommandRegistry — Declarative command definitions with typed parameter schemas.
 *
 * Replaces the monolithic getSuggestionItems() with a structured registry
 * that supports passive hint panel, contextEngine-powered dropdowns,
 * and consistent execution logic.
 *
 * Parameter Separation:
 *   - Command name is separated from params by a SPACE
 *   - Individual params are separated by TAB characters
 *   - The hint panel shows which param is active based on tab count
 *   - Cursor stays in the editor at all times (hint panel is passive)
 */

import type { Editor, Range } from '@tiptap/core';
import { supabase } from '$lib/supabaseClient';
import { contextEngine } from '$lib/stores/contextEngine.svelte';
import { gameSession } from '$lib/stores/gameSession.svelte';
import { isEntityAvailableAtBlock } from '$lib/stores/entityHeadIndex.svelte';
import { rollDice, validateDiceFormula, type ValidationResult } from './diceParser';

// ─── Types ──────────────────────────────────────────────────────────

export interface CustomEditor extends Editor {
	serialId?: string;
	sceneId?: string;
	activeBlockId?: string;
}

export interface ParamOption {
	label: string;
	value: string;
}

export interface ParamDef {
	name: string;
	label: string;
	type: 'text' | 'number' | 'select' | 'dice';
	required: boolean;
	default?: string | number;
	placeholder?: string;
	options?: (context: { cursorBlockId?: string; resolvedParams: Record<string, string | number> }) => ParamOption[];
}

export interface CommandDef {
	name: string;
	title: string;
	description: string;
	icon: string;
	aliases: string[];
	params: ParamDef[];
	execute: (
		editor: CustomEditor,
		range: Range,
		params: Record<string, string | number>
	) => Promise<void>;
}

/**
 * State for the passive hint panel — computed from the current query
 * and attached to the SuggestionItem when a command is matched.
 */
export interface HintState {
	command: CommandDef;
	activeParamIndex: number;
	paramSegments: string[];
	resolvedParams: Record<string, string | number>;
	selectOptions: ParamOption[];
	diceValidation: ValidationResult | null;
	canExecute: boolean;
}

export interface SuggestionItem {
	title: string;
	description: string;
	icon: string;
	commandDef?: CommandDef;
	hintState?: HintState;
	command: (args: { editor: CustomEditor; range: Range }) => void;
}

// ─── Context Engine Helpers ─────────────────────────────────────────

/**
 * Get active clocks, optionally filtered by cursor position.
 * When cursorBlockId is provided, only clocks whose chronological head
 * is at or before the cursor position are included.
 */
const getActiveClocks = (context: { cursorBlockId?: string; resolvedParams: Record<string, string | number> }): ParamOption[] => {
	const clocks: ParamOption[] = [];
	for (const [id, entity] of contextEngine.reducedEntities.entries()) {
		if (entity.category?.toLowerCase() === 'clock') {
			// Filter by entity head position if cursor context is provided
			if (context?.cursorBlockId && !isEntityAvailableAtBlock(id, context.cursorBlockId)) {
				continue;
			}
			const filled = (entity.metadata?.filled as number) || 0;
			const segments = (entity.metadata?.segments as number) || 4;
			clocks.push({
				label: `${entity.name} (${filled}/${segments})`,
				value: id
			});
		}
	}
	return clocks;
};

/**
 * Get active tracks, optionally filtered by cursor position.
 * When cursorBlockId is provided, only tracks whose chronological head
 * is at or before the cursor position are included.
 */
const getActiveTracks = (context: { cursorBlockId?: string; resolvedParams: Record<string, string | number> }): ParamOption[] => {
	const tracks: ParamOption[] = [];
	for (const [id, entity] of contextEngine.reducedEntities.entries()) {
		if (entity.category?.toLowerCase() === 'track') {
			// Filter by entity head position if cursor context is provided
			if (context?.cursorBlockId && !isEntityAvailableAtBlock(id, context.cursorBlockId)) {
				continue;
			}
			const current = (entity.metadata?.current as number) || 0;
			const max = (entity.metadata?.max as number) || 10;
			tracks.push({
				label: `${entity.name} (${current}/${max})`,
				value: id
			});
		}
	}
	return tracks;
};

const getActiveEntities = (context: { cursorBlockId?: string; resolvedParams: Record<string, string | number> }): ParamOption[] => {
	const entities: ParamOption[] = [];
	for (const [id, entity] of contextEngine.reducedEntities.entries()) {
		if (context?.cursorBlockId && !isEntityAvailableAtBlock(id, context.cursorBlockId)) {
			continue;
		}
		if (entity.isActive === false) continue;
		entities.push({
			label: entity.name,
			value: id
		});
	}
	return entities;
};

const getUpdateTargets = (context: { cursorBlockId?: string; resolvedParams: Record<string, string | number> }): ParamOption[] => {
	const entityId = context.resolvedParams.entity as string;
	if (!entityId) return [];
	const entity = contextEngine.reducedEntities.get(entityId);
	if (!entity) return [];

	const options: ParamOption[] = [
		{ label: 'Name', value: 'update_name' },
		{ label: 'Description', value: 'update_description' }
	];

	if (entity.facts) {
		for (const fact of entity.facts) {
			options.push({ label: `Fact: ${fact.content.substring(0, 30)}${fact.content.length > 30 ? '...' : ''}`, value: `fact:${fact.id}` });
		}
	}
	return options;
};

const getDeactivateTargets = (context: { cursorBlockId?: string; resolvedParams: Record<string, string | number> }): ParamOption[] => {
	const entityId = context.resolvedParams.entity as string;
	if (!entityId) return [];
	const entity = contextEngine.reducedEntities.get(entityId);
	if (!entity) return [];

	const options: ParamOption[] = [
		{ label: 'Entire Entity', value: 'deactivate_entity' }
	];

	if (entity.facts) {
		for (const fact of entity.facts) {
			options.push({ label: `Fact: ${fact.content.substring(0, 30)}${fact.content.length > 30 ? '...' : ''}`, value: `fact:${fact.id}` });
		}
	}
	return options;
};

// ─── Shared Execution Helpers ───────────────────────────────────────

async function persistClockEvent(
	editor: CustomEditor,
	entityId: string,
	blockId: string,
	eventType: 'increment_clock' | 'decrement_clock',
	reason?: string
) {
	const serialId = editor.serialId;
	const sceneId = editor.sceneId;
	if (serialId && sceneId && entityId) {
		const payload: Record<string, unknown> = { amount: 1 };
		if (reason) payload.reason = reason;
		await supabase.from('wiki_events').insert({
			entity_id: entityId,
			scene_id: sceneId,
			block_id: blockId,
			event_type: eventType,
			payload
		});
		await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
	}
}

async function persistTrackAdvance(
	editor: CustomEditor,
	entityId: string,
	blockId: string,
	amount: number,
	reason?: string
) {
	const serialId = editor.serialId;
	const sceneId = editor.sceneId;
	const entity = contextEngine.reducedEntities.get(entityId);
	if (!entity || !serialId || !sceneId) return;

	const currentVal = (entity.metadata?.current as number) || 0;
	const maxVal = (entity.metadata?.max as number) || 10;
	const newVal = Math.min(maxVal, currentVal + amount);

	const payload: Record<string, unknown> = { max: maxVal, current: newVal };
	if (reason) payload.reason = reason;
	await supabase.from('wiki_events').insert({
		entity_id: entityId,
		scene_id: sceneId,
		block_id: blockId,
		event_type: 'set_track',
		payload
	});
	await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
}

// ─── Command Definitions ────────────────────────────────────────────

const oracleActions = [
	'Seek', 'Oppose', 'Communicate', 'Move', 'Transform',
	'Deceive', 'Reveal', 'Discover', 'Fight', 'Aid'
];

const oracleThemes = [
	'Danger', 'Hope', 'Power', 'Wealth', 'Knowledge',
	'Love', 'Death', 'Nature', 'Magic', 'Technology'
];

export const commandRegistry: CommandDef[] = [
	// ─── Oracle ───
	{
		name: 'oracle',
		title: 'Oracle: Fate Check',
		description: 'Ask a Yes/No question against the odds',
		icon: 'help-circle',
		aliases: ['fate', 'odds'],
		params: [
			{
				name: 'odds',
				label: 'odds',
				type: 'number',
				required: false,
				default: 50,
				placeholder: '50'
			},
			{
				name: 'question',
				label: 'question',
				type: 'text',
				required: false,
				default: '',
				placeholder: 'Is the door locked?'
			}
		],
		execute: async (editor, range, params) => {
			const target = parseInt(String(params.odds)) || 50;
			const question = String(params.question || '');
			const roll = Math.floor(Math.random() * 100) + 1;

			// 20% exceptional rule
			const exceptionalYes = Math.floor(target / 5);
			const exceptionalNo = 100 - Math.floor((100 - target) / 5);

			let result = roll <= target ? 'Yes' : 'No';
			if (roll <= exceptionalYes) result = 'Exceptional Yes';
			else if (roll >= exceptionalNo) result = 'Exceptional No';

			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'oracleBlock',
					attrs: { type: 'fate', question, result, odds: target }
				})
				.run();

			gameSession.addRoll(`Oracle (${target}%)`, roll);
		}
	},

	// ─── Theme ───
	{
		name: 'theme',
		title: 'Oracle: Theme',
		description: 'Roll for a random theme/action',
		icon: 'sparkles',
		aliases: [],
		params: [],
		execute: async (editor, range) => {
			const action = oracleActions[Math.floor(Math.random() * oracleActions.length)];
			const theme = oracleThemes[Math.floor(Math.random() * oracleThemes.length)];
			const result = `${action} ${theme}`;

			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'oracleBlock',
					attrs: { type: 'theme', question: '', result }
				})
				.run();

			gameSession.addRoll('Theme', 0);
		}
	},

	// ─── Roll ───
	{
		name: 'roll',
		title: 'Roll Dice',
		description: 'Roll a custom dice formula (e.g. 2d6+3)',
		icon: 'dice',
		aliases: [],
		params: [
			{
				name: 'formula',
				label: 'formula',
				type: 'dice',
				required: false,
				default: '1d100',
				placeholder: '2d6+3'
			}
		],
		execute: async (editor, range, params) => {
			const formula = String(params.formula || '1d100');
			const validation = validateDiceFormula(formula);
			if (!validation.valid) return; // Don't roll invalid formulas

			const result = rollDice(formula);

			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'diceRoller',
					attrs: { formula, result: result.total }
				})
				.run();

			gameSession.addRoll(formula, result.total);
		}
	},

	// ─── Clock ───
	{
		name: 'clock',
		title: 'Create Clock',
		description: 'Insert a progress clock with custom segments',
		icon: 'clock',
		aliases: [],
		params: [
			{
				name: 'segments',
				label: 'segments',
				type: 'number',
				required: false,
				default: 4,
				placeholder: '4'
			},
			{
				name: 'name',
				label: 'name',
				type: 'text',
				required: true,
				placeholder: 'Clock name'
			}
		],
		execute: async (editor, range, params) => {
			const segments = parseInt(String(params.segments)) || 4;
			const name = String(params.name || 'New Clock');
			const serialId = editor.serialId;
			const sceneId = editor.sceneId;
			const entityId = crypto.randomUUID();
			const blockId = crypto.randomUUID();

			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'clockBlock',
					attrs: { id: blockId, entityId, name, segments, filled: 0, action: 'create' }
				})
				.run();

			if (serialId && sceneId) {
				await supabase.from('wiki_entities').insert({
					id: entityId,
					serial_id: serialId,
					name,
					category: 'Clock',
					metadata: { segments, filled: 0 }
				});
				await supabase.from('wiki_events').insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: 'create',
					payload: { name, category: 'Clock', metadata: { segments, filled: 0 } }
				});
				await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
			}
		}
	},

	// ─── Track ───
	{
		name: 'track',
		title: 'Create Track',
		description: 'Insert a progress track with custom steps',
		icon: 'activity',
		aliases: [],
		params: [
			{
				name: 'max',
				label: 'max steps',
				type: 'number',
				required: false,
				default: 10,
				placeholder: '10'
			},
			{
				name: 'name',
				label: 'name',
				type: 'text',
				required: true,
				placeholder: 'Track name'
			}
		],
		execute: async (editor, range, params) => {
			const max = parseInt(String(params.max)) || 10;
			const name = String(params.name || 'New Track');
			const serialId = editor.serialId;
			const sceneId = editor.sceneId;
			const entityId = crypto.randomUUID();
			const blockId = crypto.randomUUID();

			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'trackBlock',
					attrs: { id: blockId, entityId, name, max, current: 0, action: 'create' }
				})
				.run();

			if (serialId && sceneId) {
				await supabase.from('wiki_entities').insert({
					id: entityId,
					serial_id: serialId,
					name,
					category: 'Track',
					metadata: { max, current: 0 }
				});
				await supabase.from('wiki_events').insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: 'create',
					payload: { name, category: 'Track', metadata: { max, current: 0 } }
				});
				await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
			}
		}
	},

	// ─── Increment Clock ───
	{
		name: 'increment',
		title: 'Increment Clock',
		description: 'Advance an existing clock by 1 segment',
		icon: 'clock',
		aliases: ['inc'],
		params: [
			{
				name: 'clock',
				label: 'clock',
				type: 'select',
				required: true,
				options: getActiveClocks,
				placeholder: 'Select a clock...'
			},
			{
				name: 'reason',
				label: 'reason',
				type: 'text',
				required: false,
				default: '',
				placeholder: 'Why? (optional)'
			}
		],
		execute: async (editor, range, params) => {
			const entityId = String(params.clock);
			const reason = String(params.reason || '').trim() || undefined;
			const entity = contextEngine.reducedEntities.get(entityId);
			if (!entity) return;

			const blockId = crypto.randomUUID();
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'clockBlock',
					attrs: { id: blockId, entityId, name: entity.name, action: 'increment' }
				})
				.run();

			await persistClockEvent(editor, entityId, blockId, 'increment_clock', reason);
		}
	},

	// ─── Decrement Clock ───
	{
		name: 'decrement',
		title: 'Decrement Clock',
		description: 'Remove 1 segment from an existing clock',
		icon: 'clock',
		aliases: ['dec'],
		params: [
			{
				name: 'clock',
				label: 'clock',
				type: 'select',
				required: true,
				options: getActiveClocks,
				placeholder: 'Select a clock...'
			},
			{
				name: 'reason',
				label: 'reason',
				type: 'text',
				required: false,
				default: '',
				placeholder: 'Why? (optional)'
			}
		],
		execute: async (editor, range, params) => {
			const entityId = String(params.clock);
			const reason = String(params.reason || '').trim() || undefined;
			const entity = contextEngine.reducedEntities.get(entityId);
			if (!entity) return;

			const blockId = crypto.randomUUID();
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'clockBlock',
					attrs: { id: blockId, entityId, name: entity.name, action: 'decrement' }
				})
				.run();

			await persistClockEvent(editor, entityId, blockId, 'decrement_clock', reason);
		}
	},

	// ─── Advance Track ───
	{
		name: 'advance',
		title: 'Advance Track',
		description: 'Advance a progress track',
		icon: 'activity',
		aliases: ['adv'],
		params: [
			{
				name: 'track',
				label: 'track',
				type: 'select',
				required: true,
				options: getActiveTracks,
				placeholder: 'Select a track...'
			},
			{
				name: 'amount',
				label: 'amount',
				type: 'number',
				required: false,
				default: 1,
				placeholder: '1'
			},
			{
				name: 'reason',
				label: 'reason',
				type: 'text',
				required: false,
				default: '',
				placeholder: 'Why? (optional)'
			}
		],
		execute: async (editor, range, params) => {
			const entityId = String(params.track);
			const amount = parseInt(String(params.amount)) || 1;
			const reason = String(params.reason || '').trim() || undefined;
			const entity = contextEngine.reducedEntities.get(entityId);
			if (!entity) return;

			const currentVal = (entity.metadata?.current as number) || 0;
			const maxVal = (entity.metadata?.max as number) || 10;
			const newVal = Math.min(maxVal, currentVal + amount);
			const blockId = crypto.randomUUID();

			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'trackBlock',
					attrs: {
						id: blockId,
						entityId,
						name: entity.name,
						max: maxVal,
						current: newVal,
						action: 'advance'
					}
				})
				.run();

			await persistTrackAdvance(editor, entityId, blockId, amount, reason);
		}
	},

	// ─── Update Entity ───
	{
		name: 'update',
		title: 'Update Wiki Entity',
		description: 'Update the name, description, or a fact of an entity',
		icon: 'pencil',
		aliases: ['up'],
		params: [
			{
				name: 'entity',
				label: 'entity',
				type: 'select',
				required: true,
				options: getActiveEntities,
				placeholder: 'Select an entity...'
			},
			{
				name: 'target',
				label: 'target',
				type: 'select',
				required: true,
				options: getUpdateTargets,
				placeholder: 'What to update?'
			},
			{
				name: 'value',
				label: 'new value',
				type: 'text',
				required: true,
				placeholder: 'New value'
			}
		],
		execute: async (editor, range, params) => {
			const entityId = String(params.entity);
			const target = String(params.target);
			const value = String(params.value).trim();
			
			const serialId = editor.serialId;
			const sceneId = editor.sceneId;
			const blockId = crypto.randomUUID();

			if (!serialId || !sceneId || !entityId || !value) return;

			editor.chain().focus().deleteRange(range).run();

			if (target === 'update_name') {
				await supabase.from('wiki_events').insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: 'update_name',
					payload: { name: value }
				});
			} else if (target === 'update_description') {
				await supabase.from('wiki_events').insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: 'update_description',
					payload: { description: value }
				});
			} else if (target.startsWith('fact:')) {
				const factId = target.split(':')[1];
				// Deactivate old fact
				await supabase.from('wiki_events').insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: 'remove_fact',
					payload: { id: factId }
				});
				// Activate new fact
				await supabase.from('wiki_events').insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: 'add_fact',
					payload: { id: crypto.randomUUID(), content: value }
				});
			}
			await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
		}
	},

	// ─── Deactivate Entity ───
	{
		name: 'deactivate',
		title: 'Deactivate Wiki Entity',
		description: 'Deactivate an entity or remove a fact',
		icon: 'archive',
		aliases: ['de'],
		params: [
			{
				name: 'entity',
				label: 'entity',
				type: 'select',
				required: true,
				options: getActiveEntities,
				placeholder: 'Select an entity...'
			},
			{
				name: 'target',
				label: 'target',
				type: 'select',
				required: true,
				options: getDeactivateTargets,
				placeholder: 'What to deactivate?'
			}
		],
		execute: async (editor, range, params) => {
			const entityId = String(params.entity);
			const target = String(params.target);
			
			const serialId = editor.serialId;
			const sceneId = editor.sceneId;
			const blockId = crypto.randomUUID();

			if (!serialId || !sceneId || !entityId) return;

			editor.chain().focus().deleteRange(range).run();

			if (target === 'deactivate_entity') {
				await supabase.from('wiki_events').insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: 'deactivate_entity',
					payload: {}
				});
			} else if (target.startsWith('fact:')) {
				const factId = target.split(':')[1];
				await supabase.from('wiki_events').insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: 'remove_fact',
					payload: { id: factId }
				});
			}
			await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
		}
	},

	// ─── GM Note ───
	{
		name: 'gm',
		title: 'GM Note',
		description: 'Create a private GM note block',
		icon: 'pen',
		aliases: [],
		params: [],
		execute: async (editor, range) => {
			editor.chain().focus().deleteRange(range).toggleNode('gmNote', 'paragraph').run();
		}
	},

	// ─── Journal Entry ───
	{
		name: 'journal',
		title: 'Journal Entry',
		description: 'Mark this block as a private journal entry',
		icon: 'book',
		aliases: [],
		params: [],
		execute: async (editor, range) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.updateAttributes(editor.state.selection.$from.parent.type.name, {
					visibility: 'journal'
				})
				.run();
		}
	},

	// ─── Scene Setup ───
	{
		name: 'setup',
		title: 'Scene Setup',
		description: 'Define scene expectations and goals',
		icon: 'pen',
		aliases: [],
		params: [],
		execute: async (editor, range) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent('<h2>Scene Setup</h2><p>Expectations: </p>')
				.run();
		}
	}
];

// ─── Lookup Helpers ─────────────────────────────────────────────────

const commandsByName = new Map<string, CommandDef>();
const commandsByAlias = new Map<string, CommandDef>();

for (const cmd of commandRegistry) {
	commandsByName.set(cmd.name, cmd);
	for (const alias of cmd.aliases) {
		commandsByAlias.set(alias, cmd);
	}
}

export function findCommand(nameOrAlias: string): CommandDef | undefined {
	const key = nameOrAlias.toLowerCase();
	return commandsByName.get(key) ?? commandsByAlias.get(key);
}

// ─── Suggestion Resolution ──────────────────────────────────────────

/**
 * Resolve the current query into suggestion items for the popup.
 *
 * Two modes:
 *   1. BROWSING: No command matched yet → return filtered command list
 *   2. HINT:     Command matched (space detected) → return single item
 *      with HintState showing param signature, validation, select options
 *
 * The hint panel is PASSIVE — cursor stays in the editor. The query
 * string flows naturally from Tiptap's suggestion plugin.
 */
export function resolveCommandSuggestions(
	query: string,
	_editor: CustomEditor
): SuggestionItem[] {
	// Don't trim until AFTER checking for the space delimiter.
	// The trailing space in "clock " is what triggers hint mode.
	if (!query.trim()) {
		return commandRegistry.map((cmd) => browsingSuggestionItem(cmd));
	}

	// Look for the FIRST SPACE in the raw query — this separates
	// command name from params. "clock " has a space at index 5.
	const firstSpaceIdx = query.indexOf(' ');

	if (firstSpaceIdx === -1) {
		// No space — still browsing/filtering command names
		const queryLower = query.trim().toLowerCase();
		const filtered = commandRegistry.filter(
			(cmd) =>
				cmd.name.includes(queryLower) ||
				cmd.title.toLowerCase().includes(queryLower) ||
				cmd.description.toLowerCase().includes(queryLower) ||
				cmd.aliases.some((a) => a.includes(queryLower))
		);
		return filtered.map((cmd) => browsingSuggestionItem(cmd));
	}

	// Space found — try to match command name
	const commandName = query.slice(0, firstSpaceIdx).trim().toLowerCase();
	const paramString = query.slice(firstSpaceIdx + 1);

	const matched = findCommand(commandName);
	if (!matched) {
		// Command not found after space — show nothing
		return [];
	}

	// ── Build HintState ──

	// Split param string on TAB characters
	const segments = paramString.split('\t');
	const activeParamIndex = Math.min(segments.length - 1, Math.max(0, matched.params.length - 1));

	// Resolve each segment to its param value
	const resolvedParams: Record<string, string | number> = {};
	for (let i = 0; i < Math.min(segments.length, matched.params.length); i++) {
		const param = matched.params[i];
		const text = segments[i].trim();
		if (!text) continue;

		if (param.type === 'select' && param.options) {
			// Fuzzy match typed text to the closest option, with cursor context
			const cursorBlockId = _editor.activeBlockId;
			const options = param.options({ cursorBlockId, resolvedParams });
			const exact = options.find((o) => o.label.toLowerCase() === text.toLowerCase());
			const partial = options.find((o) => o.label.toLowerCase().startsWith(text.toLowerCase()));
			const fuzzy = options.find((o) => o.label.toLowerCase().includes(text.toLowerCase()));
			const match = exact ?? partial ?? fuzzy;
			if (match) {
				resolvedParams[param.name] = match.value;
			}
		} else if (param.type === 'number') {
			const num = parseInt(text);
			if (!isNaN(num)) resolvedParams[param.name] = num;
		} else {
			resolvedParams[param.name] = text;
		}
	}

	// Fill defaults for unfilled params
	const effectiveParams: Record<string, string | number> = {};
	for (const param of matched.params) {
		if (resolvedParams[param.name] !== undefined) {
			effectiveParams[param.name] = resolvedParams[param.name];
		} else if (param.default !== undefined) {
			effectiveParams[param.name] = param.default;
		}
	}

	// Compute select options for the active param
	let selectOptions: ParamOption[] = [];
	const activeParam = matched.params[activeParamIndex];
	if (activeParam?.type === 'select' && activeParam.options) {
		const cursorBlockId = _editor.activeBlockId;
		const allOptions = activeParam.options({ cursorBlockId, resolvedParams });
		const filterText = segments[activeParamIndex]?.trim() || '';
		selectOptions = filterText
			? allOptions.filter((o) => o.label.toLowerCase().includes(filterText.toLowerCase()))
			: allOptions;
	}

	// Compute dice validation for the active param
	let diceValidation: ValidationResult | null = null;
	if (activeParam?.type === 'dice') {
		const diceText = segments[activeParamIndex]?.trim() || '';
		if (diceText) {
			diceValidation = validateDiceFormula(diceText);
		}
	}

	// Check if all required params have values
	const canExecute = matched.params.every(
		(p) => !p.required || effectiveParams[p.name] !== undefined
	);

	const hintState: HintState = {
		command: matched,
		activeParamIndex,
		paramSegments: segments,
		resolvedParams,
		selectOptions,
		diceValidation,
		canExecute
	};

	return [
		{
			title: matched.title,
			description: matched.description,
			icon: matched.icon,
			commandDef: matched,
			hintState,
			command: ({ editor, range }) => {
				if (canExecute) {
					matched.execute(editor, range, effectiveParams);
				}
			}
		}
	];
}

/**
 * Create a browsing-mode suggestion item (no hint state).
 */
function browsingSuggestionItem(cmd: CommandDef): SuggestionItem {
	// For zero-param commands, execute directly. For commands with
	// params, execute with all defaults.
	const effectiveParams: Record<string, string | number> = {};
	for (const param of cmd.params) {
		if (param.default !== undefined) {
			effectiveParams[param.name] = param.default;
		}
	}

	return {
		title: cmd.title,
		description: cmd.description,
		icon: cmd.icon,
		commandDef: cmd,
		command: ({ editor, range }) => {
			cmd.execute(editor, range, effectiveParams);
		}
	};
}
