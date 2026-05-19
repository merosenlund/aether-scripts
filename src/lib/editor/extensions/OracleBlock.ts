import { Node, mergeAttributes } from '@tiptap/core';
import { mount, unmount } from 'svelte';
import OracleResultComponent from '../../components/mechanics/OracleResult.svelte';

export const OracleBlock = Node.create({
	name: 'oracleBlock',
	group: 'block',
	atom: true,

	addAttributes() {
		return {
			type: { default: 'fate' },
			question: { default: '' },
			result: { default: '' }
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[data-type="oracleBlock"]'
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'oracleBlock' })];
	},

	addNodeView() {
		return ({ node }) => {
			const dom = document.createElement('div');

			const component = mount(OracleResultComponent, {
				target: dom,
				props: {
					type: node.attrs.type,
					question: node.attrs.question,
					result: node.attrs.result
				}
			});

			return {
				dom,
				update: (updatedNode) => {
					if (updatedNode.type.name !== this.name) return false;
					return false;
				},
				destroy: () => {
					unmount(component);
				}
			};
		};
	}
});
