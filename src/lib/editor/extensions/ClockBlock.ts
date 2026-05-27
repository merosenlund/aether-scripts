import { Node, mergeAttributes } from '@tiptap/core';
import { mount, unmount } from 'svelte';
import ClockComponent from '../../components/mechanics/Clock.svelte';
import { contextEngine } from '$lib/stores/contextEngine.svelte';

export const ClockBlock = Node.create({
	name: 'clockBlock',
	group: 'block',
	atom: true,

	addAttributes() {
		return {
			id: {
				default: null,
				parseHTML: (element) => element.getAttribute('data-id') || element.getAttribute('id'),
				renderHTML: (attributes) => {
					if (!attributes.id) return {};
					return { 'data-id': attributes.id, id: attributes.id };
				}
			},
			entityId: { default: null },
			name: { default: '' },
			segments: { default: 4 },
			filled: { default: 0 },
			action: { default: 'create' } // 'create' | 'increment' | 'decrement'
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[data-type="clockBlock"]'
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'clockBlock' })];
	},

	renderText({ node }) {
		const name = node.attrs.name || 'Unnamed Clock';
		const filled = node.attrs.filled ?? 0;
		const segments = node.attrs.segments ?? 4;
		const action = node.attrs.action || 'create';
		const actionLabel = action === 'create' ? 'Start' : action === 'increment' ? 'Incremented' : action === 'decrement' ? 'Decremented' : action;

		// Fetch anchored event reason/description if available in contextEngine
		const blockEvent = node.attrs.id
			? contextEngine.rawEvents.find((e) => e.block_id === node.attrs.id)
			: null;
		const reason = blockEvent?.payload?.reason || blockEvent?.payload?.description || blockEvent?.payload?.content;
		const reasonText = reason ? ` | "${reason}"` : '';

		return `[CLOCK: ${name} - ${actionLabel} (${filled}/${segments})${reasonText}]`;
	},

	addNodeView() {
		return ({ node, editor, getPos }) => {
			const dom = document.createElement('div');
			dom.classList.add(
				'inline-flex',
				'justify-center',
				'my-4',
				'p-4',
				'bg-stone-900/50',
				'rounded-2xl',
				'border',
				'border-white/10',
				'shadow-inner'
			);

			const entityId = node.attrs.entityId;
			const blockId = node.attrs.id;
			const name = node.attrs.name;
			const action = node.attrs.action || 'create';
			const segments = node.attrs.segments || 4;
			const filled = node.attrs.filled || 0;

			const component = mount(ClockComponent, {
				target: dom,
				props: {
					entityId,
					blockId,
					segments,
					filled,
					name,
					action
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
