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
	import { ActiveBlockHighlight } from './extensions/ActiveBlockHighlight';
	import suggestion from './extensions/suggestion.svelte.ts';
	import SnapshotModal from '../components/SnapshotModal.svelte';
	import { editorSettings } from '$lib/stores/settings.svelte';
	import { Settings } from '@lucide/svelte';
	import { TypewriterScroll } from './extensions/TypewriterScroll';

	import Collaboration from '@tiptap/extension-collaboration';
	import * as Y from 'yjs';
	import { SupabaseYjsProvider } from './yjs';
	import { createSnapshot, type SceneStage } from '../api/versions';
	import { notifications } from '$lib/stores/notifications';
	import { invalidateAll } from '$app/navigation';

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
		// 'author' — wiki sidebar shows all entities immediately (edit mode).
		// 'play'   — wiki sidebar uses progressive disclosure keyed to cursor position (play mode).
		wikiFilterMode = 'play' as 'author' | 'play',
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
		wikiFilterMode?: 'author' | 'play';
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
	let showSettings = $state(false);

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
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	let saveTimeout: ReturnType<typeof setTimeout> | undefined;
	let cachedAccessToken: string | null = null;
	let authSubscription: { unsubscribe(): void } | null = null;

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
		if (!sceneId || !editable || !editor || !isEditorReady) return;

		if (saveTimeout) clearTimeout(saveTimeout);

		staticSaveStatus = 'saving';

		saveTimeout = setTimeout(async () => {
			await saveCurrentContent();
		}, 1500);
	}

	function flushPendingSaveSync() {
		// Only flush if there's a pending debounced save and we have what we need.
		if (!saveTimeout || !editor || !sceneId || !cachedAccessToken) return;
		clearTimeout(saveTimeout);
		saveTimeout = undefined;

		const json = editor.getJSON();
		// keepalive guarantees delivery even when the page is being torn down.
		fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/scenes?id=eq.${sceneId}`, {
			method: 'PATCH',
			keepalive: true,
			headers: {
				'Content-Type': 'application/json',
				apikey: PUBLIC_SUPABASE_ANON_KEY,
				Authorization: `Bearer ${cachedAccessToken}`,
				Prefer: 'return=minimal'
			},
			body: JSON.stringify({ content_blocks: json })
		});
	}

	function handleUnload() {
		flushPendingSaveSync();
	}

	async function checkDeletedBlocks(currentEditor: Editor) {
		if (!sceneId || !editable || !isEditorReady) return;

		const currentBlockIds = new SvelteSet<string>();
		currentEditor.state.doc.descendants((node) => {
			if (node.isBlock && node.attrs.id) {
				currentBlockIds.add(node.attrs.id);
			}
		});

		// Collect stale events without mutating yet.
		const staleEventIds = new Set(
			contextEngine.rawEvents
				.filter((ev) => ev.block_id && !currentBlockIds.has(ev.block_id))
				.map((ev) => ev.id)
		);

		if (staleEventIds.size === 0) return;

		// Run all DB updates concurrently, then apply results atomically.
		const results = await Promise.allSettled(
			[...staleEventIds].map((id) => updateWikiEventBlock(id, null))
		);

		const succeededIds = new Set(
			[...staleEventIds].filter((_, i) => results[i].status === 'fulfilled')
		);

		results
			.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
			.forEach((r) => console.error('Failed to reset deleted block anchor:', r.reason));

		if (succeededIds.size > 0) {
			contextEngine.rawEvents = contextEngine.rawEvents.map((ev) =>
				succeededIds.has(ev.id) ? { ...ev, block_id: null } : ev
			);
		}
	}

	import { telemetryStore } from '$lib/stores/telemetry.svelte';

	let yjsLoaded = $state(false);
	let hasYjsData = $state(true);


	// Synchronous mini-reducer for clipboard serialization (avoids async import)
	function reduceClockStateAtBlock(entityId: string, blockId: string | null): { filled: number; segments: number } {
		const fallback = { filled: 0, segments: 4 };
		if (!entityId) return fallback;

		let slicedEvents = contextEngine.rawEvents;
		if (blockId) {
			const index = contextEngine.rawEvents.findIndex((e) => e.block_id === blockId);
			if (index !== -1) {
				slicedEvents = contextEngine.rawEvents.slice(0, index + 1);
			} else {
				const blockIndex = contextEngine.orderedBlockIds.indexOf(blockId);
				if (blockIndex !== -1) {
					const visibleBlocks = new Set(contextEngine.orderedBlockIds.slice(0, blockIndex + 1));
					slicedEvents = contextEngine.rawEvents.filter(
						(e) => !e.block_id || visibleBlocks.has(e.block_id)
					);
				}
			}
		}

		let segments = 4;
		let filled = 0;
		for (const ev of slicedEvents) {
			if (ev.entity_id !== entityId) continue;
			switch (ev.event_type) {
				case 'set_clock':
					segments = (ev.payload.segments as number) ?? segments;
					filled = (ev.payload.filled as number) ?? filled;
					break;
				case 'increment_clock':
					filled = Math.min(segments, filled + ((ev.payload.amount as number) ?? 1));
					break;
				case 'decrement_clock':
					filled = Math.max(0, filled - ((ev.payload.amount as number) ?? 1));
					break;
			}
		}
		return { filled, segments };
	}

	function reduceTrackStateAtBlock(entityId: string, blockId: string | null): { current: number; max: number } {
		const fallback = { current: 0, max: 10 };
		if (!entityId) return fallback;

		let slicedEvents = contextEngine.rawEvents;
		if (blockId) {
			const index = contextEngine.rawEvents.findIndex((e) => e.block_id === blockId);
			if (index !== -1) {
				slicedEvents = contextEngine.rawEvents.slice(0, index + 1);
			} else {
				const blockIndex = contextEngine.orderedBlockIds.indexOf(blockId);
				if (blockIndex !== -1) {
					const visibleBlocks = new Set(contextEngine.orderedBlockIds.slice(0, blockIndex + 1));
					slicedEvents = contextEngine.rawEvents.filter(
						(e) => !e.block_id || visibleBlocks.has(e.block_id)
					);
				}
			}
		}

		let max = 10;
		let current = 0;
		for (const ev of slicedEvents) {
			if (ev.entity_id !== entityId) continue;
			if (ev.event_type === 'set_track') {
				max = (ev.payload.max as number) ?? max;
				current = (ev.payload.current as number) ?? current;
			}
		}
		return { current, max };
	}

	// Serialize a ProseMirror Slice to plain text, including atom nodes
	function serializeSliceToPlainText(slice: import('@tiptap/pm/model').Slice): string {
		const serializeNode = (node: import('@tiptap/pm/model').Node): string => {
			// Atom nodes: serialize from their attributes
			if (node.type.spec.atom) {
				switch (node.type.name) {
					case 'clockBlock': {
						const name = node.attrs.name || 'Unnamed Clock';
						const action = node.attrs.action || 'create';
						const actionLabel = action === 'create' ? 'Start' : action === 'increment' ? 'Incremented' : action === 'decrement' ? 'Decremented' : action;
						const { filled, segments } = reduceClockStateAtBlock(node.attrs.entityId, node.attrs.id);
						const blockEvent = node.attrs.id ? contextEngine.rawEvents.find((e) => e.block_id === node.attrs.id) : null;
						const reason = blockEvent?.payload?.reason || blockEvent?.payload?.description || blockEvent?.payload?.content;
						const reasonText = reason ? ` | "${reason}"` : '';
						return `[CLOCK: ${name} - ${actionLabel} (${filled}/${segments})${reasonText}]`;
					}
					case 'trackBlock': {
						const tName = node.attrs.name || 'Unnamed Track';
						const tAction = node.attrs.action || 'create';
						const tLabel = tAction === 'create' ? 'Start' : 'Progress';
						const { current, max } = reduceTrackStateAtBlock(node.attrs.entityId, node.attrs.id);
						const tBlockEvent = node.attrs.id ? contextEngine.rawEvents.find((e) => e.block_id === node.attrs.id) : null;
						const tReason = tBlockEvent?.payload?.reason || tBlockEvent?.payload?.description || tBlockEvent?.payload?.content;
						const tReasonText = tReason ? ` | "${tReason}"` : '';
						return `[TRACK: ${tName} - ${tLabel} (${current}/${max})${tReasonText}]`;
					}
					case 'oracleBlock': {
						const type = node.attrs.type || 'fate';
						const tableName = node.attrs.tableName;
						const question = node.attrs.question || node.attrs.note || '';
						const result = node.attrs.result || '?';
						const rolls = node.attrs.rolls && node.attrs.rolls.length > 0 ? ` (${node.attrs.rolls.join(', ')})` : '';
						const title = tableName ? tableName : type.toUpperCase();
						const qText = question ? ` Q: ${question} ->` : '';
						return `🔮 [Oracle: ${title}]${rolls}${qText} A: ${result}`;
					}
					case 'diceRoller': {
						const formula = node.attrs.formula || '1d20';
						const result = node.attrs.result != null ? node.attrs.result : '?';
						return `🎲 ${formula} = ${result}`;
					}
					case 'oddsCheck': {
						const target = node.attrs.target || 50;
						const roll = node.attrs.roll != null ? node.attrs.roll : '?';
						const isSuccess = roll !== '?' && Number(roll) <= Number(target);
						let label = isSuccess ? 'YES' : 'NO';
						if (roll !== '?') {
							if (Number(roll) <= Math.floor(target / 5)) label = 'EXCEPTIONAL YES';
							else if (Number(roll) >= 100 - Math.floor((100 - target) / 5)) label = 'EXCEPTIONAL NO';
						}
						return `🎲 ${roll} vs ${target} [${label}]`;
					}
					default:
						return '';
				}
			}

			// Text leaf nodes
			if (node.isText) return node.text || '';

			// Container nodes: recurse into children
			let text = '';
			node.forEach((child) => {
				text += serializeNode(child);
			});

			// Add newline after block-level nodes
			if (node.isBlock && text.length > 0) {
				text += '\n';
			}
			return text;
		};

		let result = '';
		slice.content.forEach((node) => {
			result += serializeNode(node);
		});
		return result.replace(/\n{3,}/g, '\n\n').trim();
	}

	// Serialize a ProseMirror Slice to HTML, including atom nodes as visible text
	function serializeSliceToHtml(slice: import('@tiptap/pm/model').Slice): string {
		const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

		const serializeNode = (node: import('@tiptap/pm/model').Node): string => {
			// Atom nodes: render as a styled paragraph with visible text
			if (node.type.spec.atom) {
				let text = '';
				switch (node.type.name) {
					case 'clockBlock': {
						const name = node.attrs.name || 'Unnamed Clock';
						const action = node.attrs.action || 'create';
						const actionLabel = action === 'create' ? 'Start' : action === 'increment' ? 'Incremented' : action === 'decrement' ? 'Decremented' : action;
						const { filled, segments } = reduceClockStateAtBlock(node.attrs.entityId, node.attrs.id);
						const blockEvent = node.attrs.id ? contextEngine.rawEvents.find((e) => e.block_id === node.attrs.id) : null;
						const reason = blockEvent?.payload?.reason || blockEvent?.payload?.description || blockEvent?.payload?.content;
						const reasonText = reason ? ` | "${reason}"` : '';
						text = `[CLOCK: ${name} - ${actionLabel} (${filled}/${segments})${reasonText}]`;
						break;
					}
					case 'trackBlock': {
						const tName = node.attrs.name || 'Unnamed Track';
						const tAction = node.attrs.action || 'create';
						const tLabel = tAction === 'create' ? 'Start' : 'Progress';
						const { current, max } = reduceTrackStateAtBlock(node.attrs.entityId, node.attrs.id);
						const tBlockEvent = node.attrs.id ? contextEngine.rawEvents.find((e) => e.block_id === node.attrs.id) : null;
						const tReason = tBlockEvent?.payload?.reason || tBlockEvent?.payload?.description || tBlockEvent?.payload?.content;
						const tReasonText = tReason ? ` | "${tReason}"` : '';
						text = `[TRACK: ${tName} - ${tLabel} (${current}/${max})${tReasonText}]`;
						break;
					}
					case 'oracleBlock': {
						const type = node.attrs.type || 'fate';
						const tableName = node.attrs.tableName;
						const question = node.attrs.question || node.attrs.note || '';
						const result = node.attrs.result || '?';
						const rolls = node.attrs.rolls && node.attrs.rolls.length > 0 ? ` (${node.attrs.rolls.join(', ')})` : '';
						const title = tableName ? tableName : type.toUpperCase();
						const qText = question ? ` Q: ${question} ->` : '';
						text = `🔮 [Oracle: ${title}]${rolls}${qText} A: ${result}`;
						break;
					}
					case 'diceRoller': {
						const formula = node.attrs.formula || '1d20';
						const result = node.attrs.result != null ? node.attrs.result : '?';
						return `<span style="font-family:monospace;background:#1c1917;color:#a8a29e;padding:2px 6px;border-radius:4px;">🎲 ${escHtml(formula)} = ${escHtml(String(result))}</span>`;
					}
					case 'oddsCheck': {
						const target = node.attrs.target || 50;
						const roll = node.attrs.roll != null ? node.attrs.roll : '?';
						const isSuccess = roll !== '?' && Number(roll) <= Number(target);
						let label = isSuccess ? 'YES' : 'NO';
						if (roll !== '?') {
							if (Number(roll) <= Math.floor(target / 5)) label = 'EXCEPTIONAL YES';
							else if (Number(roll) >= 100 - Math.floor((100 - target) / 5)) label = 'EXCEPTIONAL NO';
						}
						return `<span style="font-family:monospace;background:#1c1917;color:#a8a29e;padding:2px 6px;border-radius:4px;">🎲 ${escHtml(String(roll))} vs ${escHtml(String(target))} [${escHtml(label)}]</span>`;
					}
					default:
						return '';
				}
				return `<p style="font-family:monospace;background:#1c1917;color:#a8a29e;padding:6px 12px;border-radius:6px;border-left:3px solid #d97706;margin:8px 0;">${escHtml(text)}</p>`;
			}

			// Text leaf nodes with marks
			if (node.isText) {
				let html = escHtml(node.text || '');
				if (node.marks) {
					for (const mark of node.marks) {
						switch (mark.type.name) {
							case 'bold': html = `<strong>${html}</strong>`; break;
							case 'italic': html = `<em>${html}</em>`; break;
							case 'code': html = `<code>${html}</code>`; break;
							case 'strike': html = `<s>${html}</s>`; break;
						}
					}
				}
				return html;
			}

			// Hard break
			if (node.type.name === 'hardBreak') return '<br>';

			// Container nodes: recurse into children
			let inner = '';
			node.forEach((child) => {
				inner += serializeNode(child);
			});

			// Wrap in appropriate HTML tags
			switch (node.type.name) {
				case 'paragraph': return `<p>${inner || '<br>'}</p>`;
				case 'heading': {
					const level = node.attrs.level || 2;
					return `<h${level}>${inner}</h${level}>`;
				}
				case 'blockquote': return `<blockquote>${inner}</blockquote>`;
				case 'gmNote': return `<blockquote style="border-left:3px solid #eab308;background:#422006;padding:8px 12px;font-style:italic;color:#fef08a;">${inner}</blockquote>`;
				case 'statBlock': return `<div style="border:1px solid #57534e;padding:12px;border-radius:6px;font-family:serif;">${inner}</div>`;
				default:
					return inner;
			}
		};

		let html = '';
		slice.content.forEach((node) => {
			html += serializeNode(node);
		});
		return html;
	}

	onMount(async () => {
		if (sceneId) {
			await contextEngine.initScene(sceneId, initialContent || content, serialId, wikiFilterMode === 'author');
		}

		ydoc = new Y.Doc();
		if (sceneId && editable) {
			_provider = new SupabaseYjsProvider(
				ydoc,
				sceneId,
				(hasData) => {
					hasYjsData = hasData;
					yjsLoaded = true;
					// Y.transact('load') completes synchronously before onLoaded fires,
					// so a microtask boundary is sufficient to let ProseMirror flush any
					// pending transactions before checkDeletedBlocks can run.
					queueMicrotask(() => {
						isEditorReady = true;
					});
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
				...(editable ? [ActiveBlockHighlight] : []),
				TypewriterScroll,
				Commands.configure({
					suggestion,
					serialId,
					sceneId
				} as Record<string, unknown>)
			],
			editorProps: {
				attributes: {
					spellcheck: editorSettings.spellcheck ? "true" : "false",
					class:
						'prose prose-stone dark:prose-invert max-w-none focus:outline-none text-lg leading-relaxed text-stone-300 px-6 md:px-16 py-6 md:py-8 pb-64 min-h-full cursor-text'
				},
				handleDOMEvents: {
					beforeinput: () => {
						telemetryStore.activateSession();
					},
					keydown: () => {
						telemetryStore.activateSession();
					},
					copy: (view, event) => {
						const { state } = view;
						const { selection } = state;
						if (selection.empty) return false;

						const slice = selection.content();
						const plainText = serializeSliceToPlainText(slice);
						const html = serializeSliceToHtml(slice);

						event.preventDefault();
						event.clipboardData?.setData('text/plain', plainText);
						event.clipboardData?.setData('text/html', html);
						return true;
					},
					cut: (view, event) => {
						const { state } = view;
						const { selection } = state;
						if (selection.empty) return false;

						const slice = selection.content();
						const plainText = serializeSliceToPlainText(slice);
						const html = serializeSliceToHtml(slice);

						event.preventDefault();
						event.clipboardData?.setData('text/plain', plainText);
						event.clipboardData?.setData('text/html', html);

						// Delete the selected content for cut
						const tr = state.tr.deleteSelection();
						view.dispatch(tr);
						return true;
					}
				}
			},
			// When using collaboration, content is loaded from the Y.Doc.
			// Passing content here when editable + sceneId are true causes a CRDT timeline merge conflict
			// when the historical Yjs updates load.
			content: (editable && sceneId) ? undefined : (content || undefined),
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

					// Sync activeBlockId onto the editor instance so CommandRegistry can read it
					(editor as unknown as Record<string, unknown>).activeBlockId = activeBlockId;

					if (activeBlockId) {
						contextEngine.markAsRead(activeBlockId);
					}
				}
			}
		});

		(editor as unknown as Record<string, unknown>).serialId = serialId;
		(editor as unknown as Record<string, unknown>).sceneId = sceneId;
		(editor as unknown as Record<string, unknown>).activeBlockId = '';

		if (typeof window !== 'undefined') {
			window.addEventListener('pagehide', handleUnload);
			window.addEventListener('beforeunload', handleUnload);
		}

		// Cache the access token so handleUnload can use it synchronously via keepalive fetch.
		if (editable && sceneId) {
			const { data: { session } } = await supabase.auth.getSession();
			cachedAccessToken = session?.access_token ?? null;

			const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
				cachedAccessToken = newSession?.access_token ?? null;
			});
			authSubscription = subscription;
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
		// Update spellcheck dynamically
		if (editor?.view?.dom) {
			editor.view.dom.setAttribute('spellcheck', editorSettings.spellcheck ? "true" : "false");
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
				return;
			}

			// Case 3: Yjs loaded data but produced empty document — corruption detected
			if (editable && isEditorReady && hasYjsData) {
				const docJson = editor.getJSON();
				const docIsEmpty = !docJson.content || docJson.content.length === 0 ||
					(docJson.content.length === 1 &&
					 docJson.content[0].type === 'paragraph' &&
					 (!docJson.content[0].content || docJson.content[0].content.length === 0));

				let sourceHasContent = false;
				if (typeof sourceContent === 'object') {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const anyContent = sourceContent as any;
					if (anyContent.type === 'doc' && anyContent.content) {
						sourceHasContent = anyContent.content.length > 0;
					} else if (Array.isArray(anyContent)) {
						sourceHasContent = anyContent.length > 0;
					}
				} else if (typeof sourceContent === 'string') {
					sourceHasContent = sourceContent.trim().length > 0;
				}

				if (docIsEmpty && sourceHasContent) {
					console.warn('[Tiptap] Yjs produced empty doc but content_blocks has data. Recovering...');
					// Wipe corrupt Yjs updates from DB
					if (sceneId) {
						supabase.from('scene_updates').delete().eq('scene_id', sceneId).then(({ error }) => {
							if (error) console.error('Failed to clear corrupt Yjs updates:', error);
						});
					}
					
					// Inject content_blocks
					let parsedContent = sourceContent;
					if (typeof sourceContent === 'string' && sourceContent.trim().startsWith('{')) {
						try {
							parsedContent = JSON.parse(sourceContent);
						} catch (e) {
							console.error('Error parsing content JSON inside Tiptap:', e);
						}
					}
					
					let nodesToInsert = parsedContent;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const anyParsed = parsedContent as any;
					if (anyParsed.type === 'doc' && anyParsed.content) {
						nodesToInsert = anyParsed.content;
					}
					
					editor.chain().clearContent().insertContent(nodesToInsert).run();
					hasYjsData = true; // Prevent re-triggering
				}
			}
		}
	});


	export const getIsSaving = () => isSaving;

	let isSnapshotModalOpen = $state(false);
	let previousSemanticVersion = $state('0.0.0');

	export async function save() {
		if (!editor || !sceneId) return;

		isSaving = true;
		try {
			const { data: previousVersion } = await supabase
				.from('scene_versions')
				.select('semantic_version')
				.eq('scene_id', sceneId)
				.order('version_number', { ascending: false })
				.limit(1)
				.maybeSingle();

			if (previousVersion && previousVersion.semantic_version) {
				previousSemanticVersion = previousVersion.semantic_version;
			} else {
				previousSemanticVersion = '0.0.0';
			}

			isSnapshotModalOpen = true;
		} catch (e) {
			console.error('Failed to prepare snapshot modal:', e);
			notifications.error('Failed to prepare snapshot.');
		} finally {
			isSaving = false;
		}
	}

	async function handleSnapshotConfirm(name: string, semanticVersion: string) {
		if (!editor || !sceneId) return;

		isSaving = true;
		try {
			await createSnapshot(sceneId, 'Edit', editor.getJSON(), name, semanticVersion);
			notifications.success('Snapshot created! You are now in Editing mode.');
			await invalidateAll();
			isSnapshotModalOpen = false;
		} catch (e) {
			console.error(e);
			notifications.error('Failed to create snapshot.');
		} finally {
			isSaving = false;
		}
	}

	// ─── Sidebar-Initiated Anchor Highlighting ──────────────────────

	let highlightedBlockId = $state<string | null>(null);

	/**
	 * Apply or remove a transient highlight on a block in the editor.
	 * Called by the sidebar on hover enter (blockId) and hover leave (null).
	 */
	export function highlightBlock(blockId: string | null) {
		// Remove previous highlight
		if (highlightedBlockId) {
			const prev = element?.querySelector(`[data-id="${highlightedBlockId}"]`);
			if (prev) prev.removeAttribute('data-highlighted');
		}

		highlightedBlockId = blockId;

		// Apply new highlight
		if (blockId) {
			const target = element?.querySelector(`[data-id="${blockId}"]`);
			if (target) target.setAttribute('data-highlighted', 'true');
		}
	}

	/**
	 * Scroll the editor to a specific block and flash-highlight it.
	 * Called by the sidebar on click.
	 */
	export function scrollToBlock(blockId: string) {
		const target = element?.querySelector(`[data-id="${blockId}"]`) as HTMLElement | null;
		if (!target) return;

		target.scrollIntoView({ behavior: 'smooth', block: 'center' });

		// Flash highlight animation
		target.setAttribute('data-flash-highlight', 'true');
		setTimeout(() => {
			target.removeAttribute('data-flash-highlight');
		}, 1500);
	}

	onDestroy(() => {
		flushPendingSaveSync();
		authSubscription?.unsubscribe();
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
	{#if editable}
		<div class="absolute top-4 right-4 z-10 flex flex-col items-end">
			<button
				onclick={() => showSettings = !showSettings}
				class="p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
				title="Editor Settings"
			>
				<Settings size={18} />
			</button>
			
			{#if showSettings}
				<div class="mt-2 w-48 rounded-xl border border-white/10 bg-stone-900 p-4 shadow-xl backdrop-blur-xl">
					<h4 class="mb-4 text-[10px] font-bold tracking-widest text-stone-500 uppercase">Editor Preferences</h4>
					<div class="flex flex-col gap-4">
						<label class="flex cursor-pointer items-center justify-between text-xs font-medium text-stone-300">
							<span>Typewriter Scroll</span>
							<input 
								type="checkbox" 
								checked={editorSettings.typewriterMode}
								onchange={(e) => editorSettings.setTypewriterMode(e.currentTarget.checked)}
								class="accent-primary cursor-pointer h-4 w-4 rounded border-white/10 bg-stone-900"
							/>
						</label>
						<label class="flex cursor-pointer items-center justify-between text-xs font-medium text-stone-300">
							<span>Spellcheck</span>
							<input 
								type="checkbox" 
								checked={editorSettings.spellcheck}
								onchange={(e) => editorSettings.setSpellcheck(e.currentTarget.checked)}
								class="accent-primary cursor-pointer h-4 w-4 rounded border-white/10 bg-stone-900"
							/>
						</label>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<SnapshotModal 
		isOpen={isSnapshotModalOpen} 
		isSaving={isSaving}
		initialSemanticVersion={previousSemanticVersion}
		onConfirm={handleSnapshotConfirm}
		onCancel={() => isSnapshotModalOpen = false} 
	/>

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

	/* Sidebar-initiated anchor block highlighting */
	:global([data-highlighted='true']) {
		border-left: 2px solid var(--color-primary, #f59e0b);
		background: rgba(245, 158, 11, 0.03);
		transition: all 0.2s ease;
	}

	@keyframes flashHighlight {
		0% {
			background: rgba(245, 158, 11, 0.08);
			border-left-color: var(--color-primary, #f59e0b);
		}
		100% {
			background: transparent;
			border-left-color: transparent;
		}
	}

	:global([data-flash-highlight]) {
		animation: flashHighlight 1.2s ease-out forwards;
		border-left: 2px solid var(--color-primary, #f59e0b);
	}

	/* Keep active block visibly indicated when editor loses focus */
	:global(.tiptap-container:not(:focus-within) .active-editor-block) {
		background-color: rgba(245, 158, 11, 0.05);
		border-radius: 4px;
		box-shadow: inset 2px 0 0 0 rgba(245, 158, 11, 0.8);
		transition: all 0.2s ease;
	}
</style>
