import { E as Extension, P as Plugin, c as PluginKey, d as getChangedRanges, e as combineTransactionSteps } from './index-8b3ef059.js';

//#region src/lib/editor/extensions/BlockMetadata.ts
var BlockMetadata = Extension.create({
	name: "blockMetadata",
	addOptions() {
		return { types: [
			"paragraph",
			"heading",
			"blockquote",
			"diceRoller",
			"oddsCheck",
			"gmNote",
			"statBlock",
			"clockBlock",
			"trackBlock"
		] };
	},
	addKeyboardShortcuts() {
		return {
			Enter: () => {
				const { state } = this.editor;
				const { selection } = state;
				const { $from } = selection;
				if ($from.parent.attrs.visibility === "journal") return this.editor.chain().splitBlock().updateAttributes($from.parent.type.name, { visibility: "public" }).run();
				return false;
			},
			"Mod-Enter": () => this.editor.commands.setHardBreak()
		};
	},
	addGlobalAttributes() {
		return [{
			types: this.options.types,
			attributes: {
				id: {
					default: null,
					parseHTML: (element) => element.getAttribute("data-id"),
					renderHTML: (attributes) => {
						if (!attributes.id) return {};
						return { "data-id": attributes.id };
					}
				},
				visibility: {
					default: "public",
					parseHTML: (element) => element.getAttribute("data-visibility"),
					renderHTML: (attributes) => {
						return { "data-visibility": attributes.visibility || "public" };
					}
				}
			}
		}];
	},
	addProseMirrorPlugins() {
		return [new Plugin({
			key: new PluginKey("blockMetadata"),
			appendTransaction: (transactions, oldState, newState) => {
				if (!(transactions.some((transaction) => transaction.docChanged) && !transactions.some((transaction) => transaction.getMeta("blockMetadata")))) return;
				const { tr } = newState;
				const changedRanges = getChangedRanges(combineTransactionSteps(oldState.doc, [...transactions]));
				for (const { newRange } of changedRanges) newState.doc.nodesBetween(newRange.from, newRange.to, (node, pos) => {
					if (node.isBlock && this.options.types.includes(node.type.name)) {
						if (!node.attrs.id) tr.setNodeMarkup(pos, void 0, {
							...node.attrs,
							id: crypto.randomUUID()
						});
					}
				});
				if (!tr.steps.length) return;
				return tr.setMeta("blockMetadata", true);
			}
		})];
	}
});

export { BlockMetadata as B };
//# sourceMappingURL=BlockMetadata-4e11220d.js.map
