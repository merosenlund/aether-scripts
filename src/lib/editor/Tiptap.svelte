<script lang="ts">
	/* eslint-disable @typescript-eslint/no-unused-vars, no-useless-assignment */
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import BubbleMenu from '@tiptap/extension-bubble-menu';
	import { onDestroy, onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { contextEngine } from '$lib/stores/contextEngine.svelte';
	import { updateWikiEventBlock } from '$lib/api/wiki';

	import { GMNote } from './extensions/GMNote';
	import { DiceRoller } from './extensions/DiceRoller';
	import { StatBlock } from './extensions/StatBlock';
	import { OddsCheck } from './extensions/OddsCheck';
	import { Commands } from './extensions/Commands';
	import { BlockMetadata } from './extensions/BlockMetadata';
	import { ClockBlock } from './extensions/ClockBlock';
	import { TrackBlock } from './extensions/TrackBlock';
	import { OracleBlock } from './extensions/OracleBlock';
	import { TelemetryExtension } from './extensions/TelemetryExtension';
	import suggestion from './extensions/suggestion.svelte.ts';

	import Collaboration from '@tiptap/extension-collaboration';
	import * as Y from 'yjs';
	import { SupabaseYjsProvider } from './yjs';
	import { createSnapshot, type SceneStage } from '../api/versions';
	import { notifications } from '$lib/stores/notifications';

	let {
		content = $bindable(''),
		initialContent = null,
		sceneId = '',
		serialId = '',
		_stage = 'Draft' as SceneStage,
		onUpdate = (_html: string) => {},
		placeholder = 'Write your story...',
		activeBlockId = $bindable(''),
		cursorState = $bindable({ clocks: {} }),
		editable = true,
		saveStatus = $bindable('synced')
	} = $props<{
		content?: string | Record<string, unknown> | null;
		initialContent?: string | Record<string, unknown> | null;
		sceneId?: string;
		serialId?: string;
		_stage?: SceneStage;
		onUpdate?: (html: string) => void;
		placeholder?: string;
		activeBlockId?: string;
		cursorState?: {
			clocks?: Record<string, { entityId: string; name: string; segments: number; filled: number }>;
		};
		editable?: boolean;
		saveStatus?: 'synced' | 'saving' | 'error';
	}>();

	let element: HTMLElement;
	let bubbleMenuElement = $state<HTMLElement>();
	let isBubbleMenuVisible = $state(false);
	let editor = $state<Editor | undefined>(undefined);
	let ydoc: Y.Doc;
	let _provider: SupabaseYjsProvider;
	let isSaving = $state(false);
	let staticSaveStatus = $state<'synced' | 'saving' | 'error'>('synced');
	let yjsSaveStatus = $state<'synced' | 'saving' | 'error'>('synced');
	// Gate checkDeletedBlocks until editor content has fully loaded.
	// Without this, the function fires during Yjs sync and permanently
	// nullifies event block_ids that haven't appeared in the DOM yet.
	let isEditorReady = $state(false);

	$effect(() => {
		if (staticSaveStatus === 'error' || yjsSaveStatus === 'error') {
			saveStatus = 'error';
		} else if (staticSaveStatus === 'saving' || yjsSaveStatus === 'saving') {
			saveStatus = 'saving';
		} else {
			saveStatus = 'synced';
		}
	});

	import { supabase } from '$lib/supabaseClient';

	let saveTimeout: ReturnType<typeof setTimeout> | undefined;

	async function saveCurrentContent() {
		if (!editor || !sceneId) return;
		const json = editor.getJSON();
		staticSaveStatus = 'saving';

		const { error } = await supabase
			.from('scenes')
			.update({ content_blocks: json })
			.eq('id', sceneId);

		if (error) {
			console.error('Error autosaving content_blocks:', error);
			staticSaveStatus = 'error';
		} else {
			staticSaveStatus = 'synced';
		}
	}

	function queueAutosave() {
		if (!sceneId || !editable || !editor) return;

		if (saveTimeout) clearTimeout(saveTimeout);

		staticSaveStatus = 'saving';

		saveTimeout = setTimeout(async () => {
			await saveCurrentContent();
		}, 1500);
	}

	function handleUnload() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveCurrentContent();
		}
	}

	async function checkDeletedBlocks(currentEditor: Editor) {
		if (!sceneId || !editable || !isEditorReady) return;

		const currentBlockIds = new SvelteSet<string>();
		currentEditor.state.doc.descendants((node) => {
			if (node.isBlock && node.attrs.id) {
				currentBlockIds.add(node.attrs.id);
			}
		});

		const anchoredEvents = contextEngine.rawEvents.filter((event) => event.block_id !== null);
		let changed = false;
		for (const event of anchoredEvents) {
			if (event.block_id && !currentBlockIds.has(event.block_id)) {
				console.log(
					`[Tiptap] Anchored block ${event.block_id} for event ${event.id} was deleted. Resetting anchor to null.`
				);
				try {
					await updateWikiEventBlock(event.id, null);
					event.block_id = null;
					changed = true;
				} catch (err) {
					console.error(`Failed to reset deleted block anchor for event ${event.id}:`, err);
				}
			}
		}
		if (changed) {
			contextEngine.rawEvents = [...contextEngine.rawEvents];
		}
	}

	import { telemetryStore } from '$lib/stores/telemetry.svelte';

	let yjsLoaded = $state(false);
	let hasYjsData = $state(true);
	let editorReadyTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(async () => {
		if (sceneId) {
			await contextEngine.initScene(sceneId, initialContent || content, serialId);
		}

		ydoc = new Y.Doc();
		if (sceneId && editable) {
			_provider = new SupabaseYjsProvider(
				ydoc,
				sceneId,
				(hasData) => {
					hasYjsData = hasData;
					yjsLoaded = true;
				},
				(status) => {
					yjsSaveStatus = status;
				}
			);
		}

		editor = new Editor({
			element,
			editable,
			extensions: [
				StarterKit.configure({
					// History is handled by Collaboration when editing, but can be enabled for non-collaborative
					history: !editable
				} as Record<string, unknown>),
				BlockMetadata,
				Placeholder.configure({ placeholder }),
				...(editable
					? [
							BubbleMenu.configure({
								element: bubbleMenuElement,
								shouldShow: ({ state, from, to }) => {
									// Only show if there's a selection and it's not empty
									const show = !state.selection.empty && from !== to;
									isBubbleMenuVisible = show;
									return show;
								}
							})
						]
					: []),
				...(editable && sceneId
					? [
							Collaboration.configure({
								document: ydoc
							})
						]
					: []),
				...(editable ? [TelemetryExtension] : []),
				GMNote,
				DiceRoller,
				StatBlock,
				OddsCheck,
				ClockBlock,
				TrackBlock,
				OracleBlock,
				Commands.configure({
					suggestion,
					serialId,
					sceneId
				} as Record<string, unknown>)
			],
			editorProps: {
				attributes: {
					class:
						'prose prose-stone dark:prose-invert max-w-none focus:outline-none text-lg leading-relaxed text-stone-300 pl-24 pr-8 py-8 pb-64 min-h-full cursor-text'
				},
				handleDOMEvents: {
					beforeinput: () => {
						telemetryStore.activateSession();
					},
					keydown: () => {
						telemetryStore.activateSession();
					}
				}
			},
			// When using collaboration, content is loaded from the Y.Doc
			// but we can provide initial content if needed
			content: content || undefined,
			onUpdate: ({ editor: e }) => {
				onUpdate(e.getHTML());
				queueAutosave();
				checkDeletedBlocks(e);
				contextEngine.parseDocBlocks(e.getJSON());
			},
			onTransaction: () => {
				editor = editor;
				if (editor && editable) {
					const { selection } = editor.state;
					const node = selection.$from.parent;
					activeBlockId = node.attrs.id || '';

					if (activeBlockId) {
						contextEngine.markAsRead(activeBlockId);
					}
				}
			}
		});

		(editor as unknown as Record<string, unknown>).serialId = serialId;
		(editor as unknown as Record<string, unknown>).sceneId = sceneId;

		if (typeof window !== 'undefined') {
			window.addEventListener('pagehide', handleUnload);
			window.addEventListener('beforeunload', handleUnload);
		}

		// For non-editable (read-only) views, there is no Yjs sync phase,
		// so the editor is ready immediately after creation.
		if (!editable) {
			isEditorReady = true;
		}
	});

	$effect(() => {
		// Keep cursorState synchronized with contextEngine reducedEntities reactively
		if (editor && editable && contextEngine.reducedEntities) {
			const cursorStateLocal = {
				clocks: {} as Record<
					string,
					{ entityId: string; name: string; segments: number; filled: number }
				>
			};

			for (const [entityId, entity] of contextEngine.reducedEntities.entries()) {
				if (entity.category?.toLowerCase() === 'clock') {
					cursorStateLocal.clocks[entityId] = {
						entityId,
						name: entity.name,
						segments: (entity.metadata?.segments as number) || 4,
						filled: (entity.metadata?.filled as number) || 0
					};
				}
			}

			cursorState = cursorStateLocal;
		}
	});

	$effect(() => {
		// Determine the source of truth for the initial injection
		const sourceContent = initialContent || content;

		if (editor && sourceContent) {
			// If not editable, we always set content.
			// If editable, we only set it if Yjs has finished loading and told us it was empty.
			if (!editable || (yjsLoaded && !hasYjsData)) {
				let parsedContent = sourceContent;
				if (typeof sourceContent === 'string' && sourceContent.trim().startsWith('{')) {
					try {
						parsedContent = JSON.parse(sourceContent);
					} catch (e) {
						console.error('Error parsing content JSON inside Tiptap:', e);
					}
				}

				console.log('[Tiptap] Injecting fallback content into Yjs document:', parsedContent);

				// Extract inner content if it's a full document
				let nodesToInsert = parsedContent;
				if (parsedContent.type === 'doc' && parsedContent.content) {
					nodesToInsert = parsedContent.content;
				}

				// Ensure we only set it once for editable docs
				// Use clearContent and insertContent instead of setContent to avoid replacing the root doc node, which Collaboration hates.
				editor.chain().clearContent().insertContent(nodesToInsert).run();

				if (editable) {
					hasYjsData = true; // Prevent re-triggering
				}
				console.log('[Tiptap] Fallback content injected.');
			}
		}
	});

	// Mark the editor as ready once Yjs has finished loading and the
	// document has had time to fully sync into the editor state.
	// This prevents checkDeletedBlocks from firing during initialization
	// and permanently destroying event block_id anchors.
	$effect(() => {
		if (editable && yjsLoaded && editor) {
			// Clear any previous timer (guards against effect re-firing)
			if (editorReadyTimer) clearTimeout(editorReadyTimer);
			editorReadyTimer = setTimeout(() => {
				isEditorReady = true;
				console.log('[Tiptap] Editor is now ready — checkDeletedBlocks enabled.');
			}, 500);
		}
	});

	export const getIsSaving = () => isSaving;

	export async function save() {
		if (!editor || !sceneId) return;
		isSaving = true;
		try {
			await createSnapshot(sceneId, 'Edit', editor.getJSON());
			notifications.success('Snapshot created! You are now in Editing mode.');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to create snapshot.');
		} finally {
			isSaving = false;
		}
	}

	onDestroy(() => {
		if (editorReadyTimer) {
			clearTimeout(editorReadyTimer);
		}
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveCurrentContent();
		}
		if (typeof window !== 'undefined') {
			window.removeEventListener('pagehide', handleUnload);
			window.removeEventListener('beforeunload', handleUnload);
		}
		if (editor) {
			editor.destroy();
		}
	});
</script>

<div
	class="relative flex h-full flex-col rounded-2xl border border-white/10 bg-stone-900/50 shadow-xl backdrop-blur-md"
>


	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="tiptap-container scroll-container relative flex-1 overflow-y-auto"
		bind:this={element}
		onclick={(e) => {
			if (e.target === element) {
				editor?.commands.focus('end');
			}
		}}
	></div>

	<div
		bind:this={bubbleMenuElement}
		class="absolute z-50 flex items-center gap-1 rounded-xl border border-white/10 bg-stone-900/90 p-1 shadow-2xl backdrop-blur-xl transition-all duration-200 {isBubbleMenuVisible
			? 'scale-100 opacity-100'
			: 'pointer-events-none scale-95 opacity-0'}"
	>
		{#if editor}
			<button
				class="rounded-lg p-2 text-xs font-bold tracking-wider uppercase transition-colors hover:bg-white/10 {editor.isActive(
					'bold'
				)
					? 'bg-primary/20 text-primary'
					: 'text-stone-400'}"
				onclick={() => editor?.chain().focus().toggleBold().run()}
				title="Bold (Cmd+B)"
			>
				B
			</button>
			<button
				class="rounded-lg p-2 text-xs font-bold tracking-wider uppercase transition-colors hover:bg-white/10 {editor.isActive(
					'italic'
				)
					? 'bg-primary/20 text-primary'
					: 'text-stone-400'}"
				onclick={() => editor?.chain().focus().toggleItalic().run()}
				title="Italic (Cmd+I)"
			>
				I
			</button>
			<button
				class="rounded-lg p-2 text-xs font-bold tracking-wider uppercase transition-colors hover:bg-white/10 {editor.isActive(
					'heading',
					{ level: 2 }
				)
					? 'bg-primary/20 text-primary'
					: 'text-stone-400'}"
				onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
				title="Heading 2"
			>
				H2
			</button>
		{/if}
	</div>
</div>

<style>
	:global(.tiptap p.is-editor-empty:first-child::before) {
		color: #adb5bd;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
	:global(.tiptap-container .tiptap:focus) {
		outline: none;
	}
	:global([data-visibility='journal']) {
		background: rgba(120, 113, 108, 0.05);
		border-left: 3px solid rgba(120, 113, 108, 0.3);
		padding: 1rem 1.5rem;
		margin: 1.5rem 0;
		border-radius: 0 0.5rem 0.5rem 0;
		font-style: italic;
		color: rgba(214, 211, 209, 0.8);
		position: relative;
	}

	/* Block Type Tooltips */
	:global([data-type='gm-note'], [data-visibility='journal'], [data-type='stat-block']) {
		position: relative;
	}

	:global(
		[data-type='gm-note']:hover::after,
		[data-visibility='journal']:hover::after,
		[data-type='stat-block']:hover::after
	) {
		position: absolute;
		top: -10px;
		right: 12px;
		padding: 4px 8px;
		background: #1c1917;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-size: 9px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #d6d3d1;
		opacity: 0;
		animation: fadeInLabel 0.2s forwards;
		animation-delay: 1.2s; /* The "moment or two" delay */
		pointer-events: none;
		z-index: 10;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
	}

	:global([data-type='gm-note']:hover::after) {
		content: 'GM Note';
	}
	:global([data-visibility='journal']:hover::after) {
		content: 'Journal Entry';
	}
	:global([data-type='stat-block']:hover::after) {
		content: 'Stat Block';
	}

	@keyframes fadeInLabel {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
