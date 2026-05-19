import { Node, mergeAttributes } from '@tiptap/core';

export const StatBlock = Node.create({
	name: 'statBlock',
	group: 'block',
	content: 'block*',

	parseHTML() {
		return [{ tag: 'div[data-type="stat-block"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'div',
			mergeAttributes(HTMLAttributes, {
				'data-type': 'stat-block',
				class:
					'bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 p-4 my-4 rounded-lg shadow-sm font-serif'
			}),
			0
		];
	}
});
