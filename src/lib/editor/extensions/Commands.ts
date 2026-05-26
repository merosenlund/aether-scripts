import { Extension, type Editor, type Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { openPrompt } from '$lib/stores/prompt.svelte';
import { supabase } from '$lib/supabaseClient';
import { contextEngine } from '$lib/stores/contextEngine.svelte';

export interface CustomEditor extends Editor {
	serialId?: string;
	sceneId?: string;
}

export interface CommandArgs {
	editor: CustomEditor;
	range: Range;
}

export const Commands = Extension.create({
	name: 'slashCommands',

	addOptions() {
		return {
			suggestion: {
				char: '/',
				allowSpaces: true,
				command: ({ editor, range, props }: { editor: CustomEditor; range: Range; props: { command: (args: CommandArgs) => void } }) => {
					props.command({ editor, range });
				}
			}
		};
	},

	addProseMirrorPlugins() {
		return [
			Suggestion({
				editor: this.editor,
				...this.options.suggestion
			})
		];
	}
});

export const getSuggestionItems = ({ query }: { query: string; editor: CustomEditor }) => {
	const items = [
		{
			title: 'Roll Dice',
			description: 'Roll a custom dice formula (e.g. /roll 1d100)',
			icon: 'dice',
			command: ({ editor, range }: CommandArgs) => {
				const formula = query.match(/^\d*d\d+$/i) ? query : '1d100';
				editor
					.chain()
					.focus()
					.deleteRange(range)
					.insertContent({
						type: 'diceRoller',
						attrs: {
							formula,
							result: Math.floor(Math.random() * 100) + 1
						}
					})
					.run();
			}
		},
		{
			title: 'Mythic Odds',
			description: 'Roll against odds (e.g. /odds 50)',
			icon: 'dice',
			command: ({ editor, range }: CommandArgs) => {
				const target = parseInt(query) || 50;
				editor
					.chain()
					.focus()
					.deleteRange(range)
					.insertContent({
						type: 'oddsCheck',
						attrs: {
							target,
							roll: Math.floor(Math.random() * 100) + 1
						}
					})
					.run();
			}
		},
		{
			title: 'GM Note',
			description: 'Create a private GM note block',
			icon: 'pen',
			command: ({ editor, range }: CommandArgs) => {
				editor.chain().focus().deleteRange(range).toggleNode('gmNote', 'paragraph').run();
			}
		},
		{
			title: 'Journal Entry',
			description: 'Mark this block as a private journal entry',
			icon: 'book',
			command: ({ editor, range }: CommandArgs) => {
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
		{
			title: 'Scene Setup',
			description: 'Define scene expectations and goals',
			icon: 'pen',
			command: ({ editor, range }: CommandArgs) => {
				editor
					.chain()
					.focus()
					.deleteRange(range)
					.insertContent('<h2>Scene Setup</h2><p>Expectations: </p>')
					.run();
			}
		},
		{
			title: 'Clock (Custom)',
			description: 'Insert a progress clock with custom segments and name',
			icon: 'clock',
			command: async ({ editor, range }: CommandArgs) => {
				editor.chain().focus().deleteRange(range).run();

				const name = (await openPrompt('Create Clock', 'Enter a name for the clock:')) || '';
				if (!name) return;

				const segmentsStr =
					(await openPrompt('Create Clock', 'Enter number of segments (4, 6, 8, etc.):')) || '4';
				const segments = parseInt(segmentsStr) || 4;

				const serialId = editor.serialId;
				const sceneId = editor.sceneId;
				const entityId = crypto.randomUUID();
				const blockId = crypto.randomUUID();

				editor
					.chain()
					.focus()
					.insertContent({
						type: 'clockBlock',
						attrs: {
							id: blockId,
							entityId,
							name,
							segments,
							filled: 0,
							action: 'create'
						}
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
					await contextEngine.initScene(sceneId, editor.getJSON(), serialId);
				}
			}
		},
		{
			title: 'Increment Clock',
			description: 'Increment an existing clock',
			icon: 'clock',
			command: async ({ editor, range }: CommandArgs) => {
				editor.chain().focus().deleteRange(range).run();

				const name = (await openPrompt('Increment Clock', 'Enter clock name to increment:')) || '';
				if (!name) return;

				const serialId = editor.serialId;
				const sceneId = editor.sceneId;
				let entityId = '';

				if (serialId) {
					const { data } = await supabase
						.from('wiki_entities')
						.select('id')
						.eq('serial_id', serialId)
						.ilike('name', name)
						.eq('category', 'Clock')
						.maybeSingle();
					if (data) entityId = data.id;
				}

				const blockId = crypto.randomUUID();
				editor
					.chain()
					.focus()
					.insertContent({
						type: 'clockBlock',
						attrs: {
							id: blockId,
							entityId,
							name,
							action: 'increment'
						}
					})
					.run();

				if (serialId && sceneId && entityId) {
					await supabase.from('wiki_events').insert({
						entity_id: entityId,
						scene_id: sceneId,
						block_id: blockId,
						event_type: 'increment_clock',
						payload: { amount: 1 }
					});
					await contextEngine.initScene(sceneId, editor.getJSON(), serialId);
				}
			}
		},
		{
			title: 'Track',
			description: 'Insert a progress track with custom max steps and name',
			icon: 'activity',
			command: async ({ editor, range }: CommandArgs) => {
				editor.chain().focus().deleteRange(range).run();

				const name = (await openPrompt('Create Track', 'Enter a name for the track:')) || '';
				if (!name) return;

				const maxStr =
					(await openPrompt('Create Track', 'Enter max steps (typically 10):')) || '10';
				const max = parseInt(maxStr) || 10;

				const serialId = editor.serialId;
				const sceneId = editor.sceneId;
				const entityId = crypto.randomUUID();
				const blockId = crypto.randomUUID();

				editor
					.chain()
					.focus()
					.insertContent({
						type: 'trackBlock',
						attrs: {
							id: blockId,
							entityId,
							name,
							max,
							current: 0
						}
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
					await contextEngine.initScene(sceneId, editor.getJSON(), serialId);
				}
			}
		},
		{
			title: 'Oracle: Fate Check',
			description: 'Ask a Yes/No question',
			icon: 'help-circle',
			command: async ({ editor, range }: CommandArgs) => {
				const question =
					(await openPrompt('Oracle: Fate Check', 'What is your Fate question?')) || '';
				const rand = Math.random() * 100;
				let result = 'Yes';
				if (rand < 10) result = 'Exceptional Yes';
				else if (rand > 90) result = 'Exceptional No';
				else if (rand > 50) result = 'No';

				editor
					.chain()
					.focus()
					.deleteRange(range)
					.insertContent({ type: 'oracleBlock', attrs: { type: 'fate', question, result } })
					.run();
			}
		},
		{
			title: 'Oracle: Theme',
			description: 'Roll for a random theme/action',
			icon: 'sparkles',
			command: ({ editor, range }: CommandArgs) => {
				const actions = [
					'Seek',
					'Oppose',
					'Communicate',
					'Move',
					'Transform',
					'Deceive',
					'Reveal',
					'Discover',
					'Fight',
					'Aid'
				];
				const themes = [
					'Danger',
					'Hope',
					'Power',
					'Wealth',
					'Knowledge',
					'Love',
					'Death',
					'Nature',
					'Magic',
					'Technology'
				];
				const result = `${actions[Math.floor(Math.random() * actions.length)]} ${themes[Math.floor(Math.random() * themes.length)]}`;

				editor
					.chain()
					.focus()
					.deleteRange(range)
					.insertContent({ type: 'oracleBlock', attrs: { type: 'theme', question: '', result } })
					.run();
			}
		}
	];

	const queryLower = query.toLowerCase().trim();

	// 1. Dynamic /increment or /inc
	if (queryLower.startsWith('increment ') || queryLower.startsWith('inc ')) {
		const name = query.slice(queryLower.startsWith('increment ') ? 10 : 4).trim();
		if (name) {
			return [
				{
					title: `Increment Clock: "${name}"`,
					description: `Tally up 1 segment on the "${name}" clock`,
					icon: 'clock',
					command: async ({ editor, range }: CommandArgs) => {
						const serialId = editor.serialId;
						const sceneId = editor.sceneId;
						let entityId = '';

						if (serialId) {
							const { data } = await supabase
								.from('wiki_entities')
								.select('id')
								.eq('serial_id', serialId)
								.ilike('name', name)
								.eq('category', 'Clock')
								.maybeSingle();
							if (data) entityId = data.id;
						}

						const blockId = crypto.randomUUID();
						editor
							.chain()
							.focus()
							.deleteRange(range)
							.insertContent({
								type: 'clockBlock',
								attrs: {
									id: blockId,
									entityId,
									name,
									action: 'increment'
								}
							})
							.run();

						if (serialId && sceneId && entityId) {
							await supabase.from('wiki_events').insert({
								entity_id: entityId,
								scene_id: sceneId,
								block_id: blockId,
								event_type: 'increment_clock',
								payload: { amount: 1 }
							});
							await contextEngine.initScene(sceneId, editor.getJSON(), serialId);
						}
					}
				}
			];
		}
	}

	// 2. Dynamic /decrement or /dec
	if (queryLower.startsWith('decrement ') || queryLower.startsWith('dec ')) {
		const name = query.slice(queryLower.startsWith('decrement ') ? 10 : 4).trim();
		if (name) {
			return [
				{
					title: `Decrement Clock: "${name}"`,
					description: `Remove 1 segment from the "${name}" clock`,
					icon: 'clock',
					command: async ({ editor, range }: CommandArgs) => {
						const serialId = editor.serialId;
						const sceneId = editor.sceneId;
						let entityId = '';

						if (serialId) {
							const { data } = await supabase
								.from('wiki_entities')
								.select('id')
								.eq('serial_id', serialId)
								.ilike('name', name)
								.eq('category', 'Clock')
								.maybeSingle();
							if (data) entityId = data.id;
						}

						const blockId = crypto.randomUUID();
						editor
							.chain()
							.focus()
							.deleteRange(range)
							.insertContent({
								type: 'clockBlock',
								attrs: {
									id: blockId,
									entityId,
									name,
									action: 'decrement'
								}
							})
							.run();

						if (serialId && sceneId && entityId) {
							await supabase.from('wiki_events').insert({
								entity_id: entityId,
								scene_id: sceneId,
								block_id: blockId,
								event_type: 'decrement_clock',
								payload: { amount: 1 }
							});
							await contextEngine.initScene(sceneId, editor.getJSON(), serialId);
						}
					}
				}
			];
		}
	}

	// 3. Dynamic /roll
	if (queryLower.startsWith('roll ')) {
		const formula = query.slice(5).trim();
		if (formula) {
			return [
				{
					title: `Roll Dice: "${formula}"`,
					description: `Roll a custom dice formula (e.g. ${formula})`,
					icon: 'dice',
					command: ({ editor, range }: CommandArgs) => {
						const match = formula.match(/^(\d*)d(\d+)$/i);
						let result = 0;
						if (match) {
							const count = parseInt(match[1]) || 1;
							const sides = parseInt(match[2]) || 6;
							for (let i = 0; i < count; i++) {
								result += Math.floor(Math.random() * sides) + 1;
							}
						} else {
							result = Math.floor(Math.random() * 100) + 1;
						}

						editor
							.chain()
							.focus()
							.deleteRange(range)
							.insertContent({
								type: 'diceRoller',
								attrs: {
									formula,
									result
								}
							})
							.run();
					}
				}
			];
		}
	}

	// 4. Dynamic /odds
	if (queryLower.startsWith('odds ')) {
		const targetStr = query.slice(5).trim();
		const target = parseInt(targetStr) || 50;
		return [
			{
				title: `Roll vs ${target}%`,
				description: `Check odds with target ${target}`,
				icon: 'dice',
				command: ({ editor, range }: CommandArgs) => {
					editor
						.chain()
						.focus()
						.deleteRange(range)
						.insertContent({
							type: 'oddsCheck',
							attrs: {
								target,
								roll: Math.floor(Math.random() * 100) + 1
							}
						})
						.run();
				}
			}
		];
	}

	// 5. Check for dynamic /clock <segments> <name> or /clock inc/dec <name>
	if (queryLower.startsWith('clock ')) {
		const argsStr = query.slice(6).trim();

		// Match /clock inc <name> or /clock + <name>
		const incMatch = argsStr.match(/^(?:inc|increment|\+)\s+(.+)$/i);
		if (incMatch) {
			const name = incMatch[1];
			return [
				{
					title: `Increment Clock: "${name}"`,
					description: `Tally up 1 segment on the "${name}" clock`,
					icon: 'clock',
					command: async ({ editor, range }: CommandArgs) => {
						const serialId = editor.serialId;
						const sceneId = editor.sceneId;
						let entityId = '';

						if (serialId) {
							const { data } = await supabase
								.from('wiki_entities')
								.select('id')
								.eq('serial_id', serialId)
								.ilike('name', name)
								.eq('category', 'Clock')
								.maybeSingle();
							if (data) entityId = data.id;
						}

						const blockId = crypto.randomUUID();
						editor
							.chain()
							.focus()
							.deleteRange(range)
							.insertContent({
								type: 'clockBlock',
								attrs: {
									id: blockId,
									entityId,
									name,
									action: 'increment'
								}
							})
							.run();

						if (serialId && sceneId && entityId) {
							await supabase.from('wiki_events').insert({
								entity_id: entityId,
								scene_id: sceneId,
								block_id: blockId,
								event_type: 'increment_clock',
								payload: { amount: 1 }
							});
							await contextEngine.initScene(sceneId, editor.getJSON(), serialId);
						}
					}
				}
			];
		}

		// Match /clock dec <name> or /clock - <name>
		const decMatch = argsStr.match(/^(?:dec|decrement|-)\s+(.+)$/i);
		if (decMatch) {
			const name = decMatch[1];
			return [
				{
					title: `Decrement Clock: "${name}"`,
					description: `Remove 1 segment from the "${name}" clock`,
					icon: 'clock',
					command: async ({ editor, range }: CommandArgs) => {
						const serialId = editor.serialId;
						const sceneId = editor.sceneId;
						let entityId = '';

						if (serialId) {
							const { data } = await supabase
								.from('wiki_entities')
								.select('id')
								.eq('serial_id', serialId)
								.ilike('name', name)
								.eq('category', 'Clock')
								.maybeSingle();
							if (data) entityId = data.id;
						}

						const blockId = crypto.randomUUID();
						editor
							.chain()
							.focus()
							.deleteRange(range)
							.insertContent({
								type: 'clockBlock',
								attrs: {
									id: blockId,
									entityId,
									name,
									action: 'decrement'
								}
							})
							.run();

						if (serialId && sceneId && entityId) {
							await supabase.from('wiki_events').insert({
								entity_id: entityId,
								scene_id: sceneId,
								block_id: blockId,
								event_type: 'decrement_clock',
								payload: { amount: 1 }
							});
							await contextEngine.initScene(sceneId, editor.getJSON(), serialId);
						}
					}
				}
			];
		}

		// Match /clock <segments> <name>
		const createMatch = argsStr.match(/^(\d+)?\s*(.*)$/);
		if (createMatch) {
			const segments = parseInt(createMatch[1]) || 4;
			const name = createMatch[2].trim() || 'New Clock';
			return [
				{
					title: `Create ${segments}-Segment Clock: "${name}"`,
					description: `Insert a new ${segments}-segment progress clock`,
					icon: 'clock',
					command: async ({ editor, range }: CommandArgs) => {
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
								attrs: {
									id: blockId,
									entityId,
									name,
									segments,
									filled: 0,
									action: 'create'
								}
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
							await contextEngine.initScene(sceneId, editor.getJSON(), serialId);
						}
					}
				}
			];
		}
	}

	// If query is a pure number, prioritize the odds check
	if (/^\d+$/.test(query)) {
		const target = parseInt(query);
		return [
			{
				title: `Roll vs ${target}%`,
				description: `Check odds with target ${target}`,
				icon: 'dice',
				command: ({ editor, range }: CommandArgs) => {
					editor
						.chain()
						.focus()
						.deleteRange(range)
						.insertContent({
							type: 'oddsCheck',
							attrs: {
								target,
								roll: Math.floor(Math.random() * 100) + 1
							}
						})
						.run();
				}
			},
			...items
		];
	}

	return items.filter(
		(item) =>
			item.title.toLowerCase().includes(query.toLowerCase()) ||
			item.description.toLowerCase().includes(query.toLowerCase())
	);
};
