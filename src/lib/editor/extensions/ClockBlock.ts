import { Node, mergeAttributes } from '@tiptap/core';
import { mount, unmount } from 'svelte';
import ClockComponent from '../../components/mechanics/Clock.svelte';

export const ClockBlock = Node.create({
  name: 'clockBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      entityId: { default: null },
      name: { default: '' },
      segments: { default: 4 },
      filled: { default: 0 },
      action: { default: 'create' }, // 'create' | 'increment' | 'decrement'
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="clockBlock"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'clockBlock' })];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.classList.add('inline-flex', 'justify-center', 'my-4', 'p-4', 'bg-stone-900/50', 'rounded-2xl', 'border', 'border-white/10', 'shadow-inner');

      const baseClocks = (editor as any)?.baseClocks || [];
      const pos = typeof getPos === 'function' ? getPos() : 0;
      const entityId = node.attrs.entityId;
      const name = node.attrs.name;
      const action = node.attrs.action || 'create';

      const baseClock = baseClocks.find((c: any) => c.id === entityId || c.name === name);
      let filled = baseClock ? (baseClock.metadata?.filled || 0) : 0;
      let segments = action === 'create' ? node.attrs.segments : (baseClock?.metadata?.segments || node.attrs.segments || 4);

      if (editor && typeof pos === 'number') {
        editor.state.doc.nodesBetween(0, pos, (childNode, childPos) => {
          if (childPos < pos && childNode.type.name === 'clockBlock') {
            const childEntityId = childNode.attrs.entityId;
            const childName = childNode.attrs.name;

            const isMatch = (entityId && childEntityId === entityId) || 
                            (!entityId && !childEntityId && childName === name);

            if (isMatch) {
              const act = childNode.attrs.action;
              if (act === 'create') {
                segments = childNode.attrs.segments;
                filled = childNode.attrs.filled || 0;
              } else if (act === 'increment') {
                filled = Math.min(segments, filled + 1);
              } else if (act === 'decrement') {
                filled = Math.max(0, filled - 1);
              }
            }
          }
        });
      }

      // Apply current node's action to show final state for this node
      if (action === 'create') {
        filled = node.attrs.filled || 0;
      } else if (action === 'increment') {
        filled = Math.min(segments, filled + 1);
      } else if (action === 'decrement') {
        filled = Math.max(0, filled - 1);
      }

      const component = mount(ClockComponent, {
        target: dom,
        props: {
          segments,
          filled,
          name,
          action,
        },
      });

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) return false;
          return false;
        },
        destroy: () => {
          unmount(component);
        },
      };
    };
  },
});
