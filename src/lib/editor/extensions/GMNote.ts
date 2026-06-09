import { Node, mergeAttributes } from '@tiptap/core';

export const GMNote = Node.create({
	name: 'gmNote',
	group: 'block',
	content: 'inline*',
	parseHTML() {
		return [{ tag: 'div[data-type="gm-note"]' }];
	},

	addKeyboardShortcuts() {
		return {
			Enter: ({ editor }) => {
				const { state } = editor;
				const { selection } = state;
				const { $from, empty } = selection;

				if (!empty) return false;

				if ($from.parent.type.name !== this.name) return false;

				// Empty GM block: break out to a normal paragraph
				if ($from.parent.textContent.trim().length === 0) {
					return editor.commands.setNode('paragraph');
				}

				// Non-empty: split the block, then convert the new (paragraph) block back to gmNote
				return editor.chain().splitBlock().setNode(this.name).run();
			}
		};
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'div',
			mergeAttributes(HTMLAttributes, {
				'data-type': 'gm-note',
				class:
					'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500/80 p-4 my-4 rounded shadow-sm text-sm font-mono text-yellow-900 dark:text-yellow-100/80'
			}),
			0
		];
	}
});
