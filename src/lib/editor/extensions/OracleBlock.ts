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
			result: { default: '' },
			odds: { default: 50 },
			rolls: { default: [] },
			tableName: { default: '' },
			note: { default: '' }
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

	renderText({ node }) {
		const type = node.attrs.type || 'fate';
		const tableName = node.attrs.tableName;
		const question = node.attrs.question || node.attrs.note || '';
		const result = node.attrs.result || '?';
		const rolls = node.attrs.rolls && node.attrs.rolls.length > 0 ? ` (${node.attrs.rolls.join(', ')})` : '';
		
		const title = tableName ? tableName : type.toUpperCase();
		const qText = question ? ` Q: ${question} ->` : '';
		
		return `🔮 [Oracle: ${title}]${rolls}${qText} A: ${result}`;
	},

	addNodeView() {
		return ({ node }) => {
			const dom = document.createElement('div');

			const component = mount(OracleResultComponent, {
				target: dom,
				props: {
					type: node.attrs.type,
					question: node.attrs.question,
					result: node.attrs.result,
					rolls: node.attrs.rolls,
					tableName: node.attrs.tableName,
					note: node.attrs.note
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
