import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const ActiveBlockHighlight = Extension.create({
	name: 'activeBlockHighlight',

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey('activeBlockHighlight'),
				props: {
					decorations(state) {
						const { selection } = state;
						
						// Find the parent block of the current selection
						const $pos = selection.$anchor;
						const depth = $pos.depth;
						if (depth === 0) return null;
						
						const node = $pos.node(depth);
						const pos = $pos.before(depth);

						if (!node || !node.isBlock) return null;

						return DecorationSet.create(state.doc, [
							Decoration.node(pos, pos + node.nodeSize, {
								class: 'active-editor-block'
							})
						]);
					}
				}
			})
		];
	}
});
