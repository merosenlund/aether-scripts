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
import { mythicTables, lookupResult, rollOnTable, rollMultiple, getTablesByCategory } from './mythicTables';

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
	type: 'text' | 'number' | 'select' | 'dice' | 'results';
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

export const commandRegistry: CommandDef[] = [
	// ─── Fate Check ───
	{
		name: 'fate',
		title: 'Fate Check',
		description: 'Ask a Yes/No question against the odds',
		icon: 'help-circle',
		aliases: ['oracle', 'odds'],
		params: [
			{
				name: 'results',
				label: 'manual d100(s) or xN',
				type: 'results',
				required: false,
				default: '',
				placeholder: '42 or x2'
			},
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
			const resultsRaw = String(params.results || '').trim();
			
			let roll = 0;
			if (resultsRaw && !resultsRaw.startsWith('x')) {
				const parts = resultsRaw.split(' ');
				roll = parseInt(parts[0]) || 0;
			}
			if (roll <= 0 || roll > 100) {
				roll = Math.floor(Math.random() * 100) + 1;
			}

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
					attrs: { type: 'fate', question, result, odds: target, rolls: [roll] }
				})
				.run();

			gameSession.addRoll(`Fate (${target}%)`, roll);
		}
	},

	// ─── Action Oracle ───
	{
		name: 'action',
		title: 'Action Oracle',
		description: 'Roll Action 1 and Action 2',
		icon: 'sparkles',
		aliases: ['theme'],
		params: [
			{
				name: 'results',
				label: 'manual d100(s) or xN',
				type: 'results',
				required: false,
				default: '',
				placeholder: '33 91'
			},
			{
				name: 'question',
				label: 'question',
				type: 'text',
				required: false,
				default: '',
				placeholder: 'What is the villain plotting?'
			}
		],
		execute: async (editor, range, params) => {
			const question = String(params.question || '');
			const resultsRaw = String(params.results || '').trim();
			
			let roll1 = 0, roll2 = 0;
			if (resultsRaw && !resultsRaw.startsWith('x')) {
				const parts = resultsRaw.split(' ');
				roll1 = parseInt(parts[0]) || 0;
				roll2 = parseInt(parts[1]) || 0;
			}
			
			const res1 = roll1 > 0 && roll1 <= 100 ? { roll: roll1, result: lookupResult('action_1', roll1) } : rollOnTable('action_1');
			const res2 = roll2 > 0 && roll2 <= 100 ? { roll: roll2, result: lookupResult('action_2', roll2) } : rollOnTable('action_2');

			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'oracleBlock',
					attrs: { type: 'action', note: question, result: `${res1.result} + ${res2.result}`, rolls: [res1.roll, res2.roll] }
				})
				.run();

			gameSession.addRoll('Action 1', res1.roll);
			gameSession.addRoll('Action 2', res2.roll);
		}
	},

	// ─── Describe Oracle ───
	{
		name: 'describe',
		title: 'Descriptor Oracle',
		description: 'Roll Descriptor 1 and Descriptor 2',
		icon: 'sparkles',
		aliases: [],
		params: [
			{
				name: 'results',
				label: 'manual d100(s) or xN',
				type: 'results',
				required: false,
				default: '',
				placeholder: '42 86'
			},
			{
				name: 'question',
				label: 'question',
				type: 'text',
				required: false,
				default: '',
				placeholder: 'What does the room look like?'
			}
		],
		execute: async (editor, range, params) => {
			const question = String(params.question || '');
			const resultsRaw = String(params.results || '').trim();
			
			let roll1 = 0, roll2 = 0;
			if (resultsRaw && !resultsRaw.startsWith('x')) {
				const parts = resultsRaw.split(' ');
				roll1 = parseInt(parts[0]) || 0;
				roll2 = parseInt(parts[1]) || 0;
			}
			
			const res1 = roll1 > 0 && roll1 <= 100 ? { roll: roll1, result: lookupResult('descriptor_1', roll1) } : rollOnTable('descriptor_1');
			const res2 = roll2 > 0 && roll2 <= 100 ? { roll: roll2, result: lookupResult('descriptor_2', roll2) } : rollOnTable('descriptor_2');

			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'oracleBlock',
					attrs: { type: 'describe', note: question, result: `${res1.result} + ${res2.result}`, rolls: [res1.roll, res2.roll] }
				})
				.run();

			gameSession.addRoll('Descriptor 1', res1.roll);
			gameSession.addRoll('Descriptor 2', res2.roll);
		}
	},

	// ─── Generic Oracle ───
	{
		name: 'oracle',
		title: 'Generic Oracle',
		description: 'Roll on any Mythic table',
		icon: 'table',
		aliases: ['table'],
		params: [
			{
				name: 'results',
				label: 'manual d100(s) or xN',
				type: 'results',
				required: false,
				default: '',
				placeholder: '42 or x3'
			},
			{
				name: 'table',
				label: 'table',
				type: 'select',
				required: true,
				options: () => {
					const opts: ParamOption[] = [];
					const cats = getTablesByCategory();
					for (const tables of cats.values()) {
						for (const t of tables) {
							opts.push({ label: t.name, value: t.id });
						}
					}
					opts.sort((a, b) => a.label.localeCompare(b.label));
					return opts;
				}
			},
			{
				name: 'question',
				label: 'question/note',
				type: 'text',
				required: false,
				default: '',
				placeholder: 'Details...'
			}
		],
		execute: async (editor, range, params) => {
			const tableId = String(params.table);
			const table = mythicTables.get(tableId);
			if (!table) return;

			const question = String(params.question || '');
			const resultsRaw = String(params.results || '').trim();
			
			const rolls: number[] = [];
			const results: string[] = [];

			let count = 1;
			if (tableId === 'names') count = 3;

			if (resultsRaw.startsWith('x')) {
				count = parseInt(resultsRaw.substring(1)) || count;
			} else if (resultsRaw) {
				const parts = resultsRaw.split(' ');
				for (const p of parts) {
					const r = parseInt(p);
					if (r > 0) rolls.push(r);
				}
			}

			if (rolls.length === 0) {
				for (let i = 0; i < count; i++) {
					const res = rollOnTable(tableId);
					rolls.push(res.roll);
					results.push(res.result);
					gameSession.addRoll(table.name, res.roll);
				}
			} else {
				for (const r of rolls) {
					results.push(lookupResult(tableId, r));
					gameSession.addRoll(table.name, r);
				}
			}

			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent({
					type: 'oracleBlock',
					attrs: { type: 'table', tableName: table.name, note: question, result: results.join(' + '), rolls }
				})
				.run();
		}
	},

	// ─── New Workflow ───
	{
		name: 'new',
		title: 'New Entity Workflow',
		description: 'Roll names, insert GM block, open creation modal',
		icon: 'plus-circle',
		aliases: ['create'],
		params: [
			{
				name: 'category',
				label: 'category',
				type: 'select',
				required: true,
				default: 'character',
				options: () => [
					{ label: 'Character', value: 'character' },
					{ label: 'Location', value: 'location' },
					{ label: 'Thread', value: 'thread' }
				]
			}
		],
		execute: async (editor, range, params) => {
			const category = String(params.category || 'character');
			
			let t1Id = 'names';
			let t2Id = 'names';
			let n1Note = 'First Name';
			let n2Note = 'Last Name';
			let count1 = 3;
			let count2 = 3;

			if (category === 'location') {
				t1Id = 'locations';
				t2Id = 'descriptor_1';
				n1Note = 'Location Type';
				n2Note = 'Descriptor';
				count1 = 2;
				count2 = 2;
			} else if (category === 'thread') {
				t1Id = 'action_1';
				t2Id = 'descriptor_1';
				n1Note = 'Action';
				n2Note = 'Descriptor';
				count1 = 2;
				count2 = 2;
			}

			const res1 = rollMultiple(t1Id, count1);
			const res2 = rollMultiple(t2Id, count2);
			const name1 = res1.map(r => r.result).join(' + ');
			const name2 = res2.map(r => r.result).join(' + ');
			const rolls1 = res1.map(r => r.roll);
			const rolls2 = res2.map(r => r.roll);
			const table1 = mythicTables.get(t1Id);
			const table2 = mythicTables.get(t2Id);

			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContent([
					{
						type: 'oracleBlock',
						attrs: { type: 'table', tableName: table1?.name || 'Oracle', result: name1, rolls: rolls1, note: n1Note }
					},
					{
						type: 'oracleBlock',
						attrs: { type: 'table', tableName: table2?.name || 'Oracle', result: name2, rolls: rolls2, note: n2Note }
					},
					{
						type: 'gmNote',
						content: [{ type: 'text', text: 'Interpretation: ' }]
					}
				])
				.run();

			res1.forEach(r => gameSession.addRoll(table1?.name || 'Oracle', r.roll));
			res2.forEach(r => gameSession.addRoll(table2?.name || 'Oracle', r.roll));

			window.dispatchEvent(new CustomEvent('aether:open-wiki-modal', { detail: { category } }));
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
