import { Node, mergeAttributes } from '@tiptap/core';

export const DiceRoller = Node.create({
	name: 'diceRoller',
	group: 'inline',
	inline: true,
	atom: true,

	addAttributes() {
		return {
			formula: { default: '1d20' },
			result: { default: null }
		};
	},

	parseHTML() {
		return [{ tag: 'span[data-type="dice-roller"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		const formula = HTMLAttributes.formula || '1d20';
		const result = HTMLAttributes.result !== null ? HTMLAttributes.result : '?';
		const text = `🎲 ${formula} = ${result}`;

		return [
			'span',
			mergeAttributes(HTMLAttributes, {
				'data-type': 'dice-roller',
				class:
					'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 cursor-pointer select-none mx-1'
			}),
			text
		];
	},

	renderText({ node }) {
		const formula = node.attrs.formula || '1d20';
		const result = node.attrs.result !== null && node.attrs.result !== undefined ? node.attrs.result : '?';
		return `🎲 ${formula} = ${result}`;
	}
});
