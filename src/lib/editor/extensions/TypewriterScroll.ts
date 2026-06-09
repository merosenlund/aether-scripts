import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { editorSettings } from '$lib/stores/settings.svelte';

export const TypewriterScroll = Extension.create({
	name: 'typewriterScroll',

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey('typewriterScroll'),
				view: () => {
					let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

					const getScrollContainer = (element: HTMLElement | null): HTMLElement | Window => {
						if (!element) return window;
						let parent = element.parentElement;
						while (parent) {
							const style = window.getComputedStyle(parent);
							if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
								return parent;
							}
							parent = parent.parentElement;
						}
						return window;
					};

					return {
						update: (view, prevState) => {
							if (!editorSettings.typewriterMode) return;

							const state = view.state;
							
							// Only trigger on document changes (typing/editing), not just selection/cursor changes
							if (!state.doc.eq(prevState.doc)) {
								// Debounce slightly to prevent jerky scrolling if typing very fast
								if (scrollTimeout) clearTimeout(scrollTimeout);
								
								scrollTimeout = setTimeout(() => {
									requestAnimationFrame(() => {
										const { head } = state.selection;
										// Ensure coords are calculable
										if (head === null || head === undefined) return;
										
										let coords;
										try {
											coords = view.coordsAtPos(head);
										} catch (e) {
											return;
										}
										
										const container = getScrollContainer(view.dom);
										
										if (container instanceof HTMLElement) {
											const containerRect = container.getBoundingClientRect();
											const cursorTopRelativeToContainer = coords.top - containerRect.top;
											const targetScrollTop = container.scrollTop + cursorTopRelativeToContainer - (container.clientHeight / 2);
											
											container.scrollTo({
												top: targetScrollTop,
												behavior: 'smooth'
											});
										} else {
											const targetY = coords.top + window.scrollY - (window.innerHeight / 2);
											window.scrollTo({
												top: targetY,
												behavior: 'smooth'
											});
										}
									});
								}, 50);
							}
						},
						destroy: () => {
							if (scrollTimeout) clearTimeout(scrollTimeout);
						}
					};
				}
			})
		];
	}
});
