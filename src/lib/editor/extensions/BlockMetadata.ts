import { Extension, combineTransactionSteps, getChangedRanges } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface BlockMetadataOptions {
	types: string[];
}

export const BlockMetadata = Extension.create<BlockMetadataOptions>({
	name: 'blockMetadata',

	addOptions() {
		return {
			types: [
				'paragraph',
				'heading',
				'blockquote',
				'diceRoller',
				'oddsCheck',
				'gmNote',
				'statBlock',
				'clockBlock',
				'trackBlock'
			]
		};
	},

	addKeyboardShortcuts() {
		return {
			Enter: () => {
				const { state } = this.editor;
				const { selection } = state;
				const { $from } = selection;
				const node = $from.parent;

				if (node.attrs.visibility === 'journal') {
					// If we're in a journal block, Enter splits it and makes the NEW block public
					return this.editor
						.chain()
						.splitBlock()
						.updateAttributes($from.parent.type.name, { visibility: 'public' })
						.run();
				}
				return false;
			},
			'Mod-Enter': () => this.editor.commands.setHardBreak()
		};
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					id: {
						default: null,
						parseHTML: (element) => element.getAttribute('data-id'),
						renderHTML: (attributes) => {
							if (!attributes.id) return {};
							return { 'data-id': attributes.id };
						}
					},
					visibility: {
						default: 'public',
						parseHTML: (element) => element.getAttribute('data-visibility'),
						renderHTML: (attributes) => {
							return { 'data-visibility': attributes.visibility || 'public' };
						}
					}
				}
			}
		];
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey('blockMetadata'),
				appendTransaction: (transactions, oldState, newState) => {
					const docChanges =
						transactions.some((transaction) => transaction.docChanged) &&
						!transactions.some((transaction) => transaction.getMeta('blockMetadata'));

					if (!docChanges) return;

					const { tr } = newState;

					newState.doc.descendants((node, pos) => {
						if (node.isBlock && this.options.types.includes(node.type.name)) {
							if (!node.attrs.id) {
								tr.setNodeMarkup(pos, undefined, {
									...node.attrs,
									id: crypto.randomUUID()
								});
							}
						}
					});

					if (!tr.steps.length) return;

					return tr.setMeta('blockMetadata', true);
				}
			})
		];
	}
});
