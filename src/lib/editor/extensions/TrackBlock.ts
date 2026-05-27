import { Node, mergeAttributes } from '@tiptap/core';
import { mount, unmount } from 'svelte';
import ProgressTrackComponent from '../../components/mechanics/ProgressTrack.svelte';
import { contextEngine } from '$lib/stores/contextEngine.svelte';

export const TrackBlock = Node.create({
	name: 'trackBlock',
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
			max: { default: 10 },
			current: { default: 0 },
			action: { default: 'create' } // 'create' | 'advance'
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[data-type="trackBlock"]'
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'trackBlock' })];
	},

	renderText({ node }) {
		const name = node.attrs.name || 'Unnamed Track';
		const current = node.attrs.current ?? 0;
		const max = node.attrs.max ?? 10;
		const action = node.attrs.action || 'create';
		const actionLabel = action === 'create' ? 'Start' : 'Progress';

		// Fetch anchored event reason/description if available in contextEngine
		const blockEvent = node.attrs.id
			? contextEngine.rawEvents.find((e) => e.block_id === node.attrs.id)
			: null;
		const reason = blockEvent?.payload?.reason || blockEvent?.payload?.description || blockEvent?.payload?.content;
		const reasonText = reason ? ` | "${reason}"` : '';

		return `[TRACK: ${name} - ${actionLabel} (${current}/${max})${reasonText}]`;
	},

	addNodeView() {
		return ({ node }) => {
			const dom = document.createElement('div');
			dom.classList.add(
				'flex',
				'w-full',
				'my-4',
				'p-4',
				'bg-stone-900/50',
				'rounded-xl',
				'border',
				'border-white/10',
				'shadow-inner'
			);

			const entityId = node.attrs.entityId;
			const blockId = node.attrs.id;
			const name = node.attrs.name;
			const max = node.attrs.max || 10;
			const currentVal = node.attrs.current || 0;

			const component = mount(ProgressTrackComponent, {
				target: dom,
				props: {
					entityId,
					blockId,
					max,
					current: currentVal,
					name
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
