import JSZip from 'jszip';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getWikiEvents, getWikiEntities } from '$lib/api/wiki';
import { reduceWikiEvents } from '$lib/stores/contextEngine.svelte.ts';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import { Markdown } from 'tiptap-markdown';
import * as Y from 'yjs';

// Import custom extensions to parse them from the Yjs doc
import { GMNote } from '$lib/editor/extensions/GMNote';
import { DiceRoller } from '$lib/editor/extensions/DiceRoller';
import { StatBlock } from '$lib/editor/extensions/StatBlock';
import { OddsCheck } from '$lib/editor/extensions/OddsCheck';
import { ClockBlock } from '$lib/editor/extensions/ClockBlock';
import { TrackBlock } from '$lib/editor/extensions/TrackBlock';
import { OracleBlock } from '$lib/editor/extensions/OracleBlock';

// Type definitions based on what we expect from the DB
interface Scene {
	id: string;
	serial_id: string;
	arc_id: string | null;
	order_index: number;
	display_title: string | null;
	author_title: string | null;
}

interface SceneUpdate {
	update_data: unknown;
}

/**
 * Recursively converts custom Tiptap nodes into standard paragraphs or text nodes
 * so that they can be exported as readable Markdown text.
 */
function convertCustomNodesToText(json: any): any {
	if (!json) return json;
	if (Array.isArray(json)) return json.map(convertCustomNodesToText);

	if (typeof json === 'object') {
		const newObj: any = { ...json };

		if (newObj.content) {
			newObj.content = convertCustomNodesToText(newObj.content);
		}

		switch (newObj.type) {
			case 'oracleBlock': {
				const type = newObj.attrs?.type || 'fate';
				const question = newObj.attrs?.question || '';
				const result = newObj.attrs?.result || '?';
				return {
					type: 'paragraph',
					content: [{ type: 'text', text: `🔮 [Oracle: ${type.toUpperCase()}] Q: ${question} -> A: ${result}` }]
				};
			}
			case 'clockBlock': {
				const name = newObj.attrs?.name || 'Unnamed Clock';
				const filled = newObj.attrs?.filled ?? 0;
				const segments = newObj.attrs?.segments ?? 4;
				const action = newObj.attrs?.action || 'create';
				const actionText = action === 'increment' ? '(Ticked up)' : action === 'decrement' ? '(Ticked down)' : '(Created)';
				return {
					type: 'paragraph',
					content: [{ type: 'text', text: `⏱️ [Clock: ${name}] ${filled}/${segments} ${actionText}` }]
				};
			}
			case 'trackBlock': {
				const name = newObj.attrs?.name || 'Unnamed Track';
				const current = newObj.attrs?.current ?? 0;
				const max = newObj.attrs?.max ?? 10;
				const action = newObj.attrs?.action || 'create';
				const actionText = action === 'advance' ? '(Advanced)' : '(Created)';
				return {
					type: 'paragraph',
					content: [{ type: 'text', text: `📈 [Track: ${name}] ${current}/${max} ${actionText}` }]
				};
			}
			case 'diceRoller': {
				const formula = newObj.attrs?.formula || '1d20';
				const result = newObj.attrs?.result !== null && newObj.attrs?.result !== undefined ? newObj.attrs.result : '?';
				return {
					type: 'text',
					text: `🎲 ${formula} = ${result}`
				};
			}
			case 'oddsCheck': {
				const target = newObj.attrs?.target || 50;
				const roll = newObj.attrs?.roll !== null && newObj.attrs?.roll !== undefined ? newObj.attrs.roll : '?';
				const isSuccess = roll !== '?' && Number(roll) <= Number(target);
				const resultText = isSuccess ? 'YES' : 'NO';
				return {
					type: 'text',
					text: `🎲 [Odds: ${target}%] Roll: ${roll} -> ${resultText}`
				};
			}
			case 'gmNote': {
				const content = newObj.attrs?.content || '';
				return {
					type: 'paragraph',
					content: [{ type: 'text', text: `📝 GM Note: ${content}` }]
				};
			}
			case 'statBlock': {
				return {
					type: 'paragraph',
					content: [{ type: 'text', text: `📊 Stat Block: ${newObj.attrs?.name || 'Unknown'}` }]
				};
			}
		}

		return newObj;
	}
	return json;
}

/**
 * Main export function
 */
export async function generateSerialBackup(serialId: string, serialTitle: string, supabase: SupabaseClient) {
	const zip = new JSZip();
	const proseFolder = zip.folder('Prose');
	const wikiFolder = zip.folder('Wiki');

	if (!proseFolder || !wikiFolder) {
		throw new Error('Failed to create zip folders');
	}

	// 1. Fetch Scenes
	const { data: scenesData, error: scenesError } = await supabase
		.from('scenes')
		.select('id, serial_id, arc_id, order_index, display_title, author_title')
		.eq('serial_id', serialId)
		.order('order_index', { ascending: true });

	if (scenesError || !scenesData) {
		console.error('Error fetching scenes:', scenesError);
		throw new Error('Failed to fetch scenes');
	}

	// 2. Process Scenes
	for (const scene of scenesData) {
		const doc = new Y.Doc();

		// Fetch all updates for the scene
		const { data: updatesData, error: updatesError } = await supabase
			.from('scene_updates')
			.select('update_data')
			.eq('scene_id', scene.id)
			.order('created_at', { ascending: true });

		if (updatesError) {
			console.error(`Error fetching updates for scene ${scene.id}:`, updatesError);
			continue; // Skip this scene on error
		}

		if (updatesData && updatesData.length > 0) {
			Y.transact(
				doc,
				() => {
					updatesData.forEach((row: SceneUpdate) => {
						try {
							let update: Uint8Array;
							if (typeof row.update_data === 'string') {
								if (row.update_data.startsWith('\\x')) {
									const hex = row.update_data.slice(2);
									const bytes = [];
									for (let i = 0; i < hex.length; i += 2) {
										bytes.push(parseInt(hex.slice(i, i + 2), 16));
									}
									update = new Uint8Array(bytes);
								} else {
									const binaryString = atob(row.update_data);
									update = new Uint8Array(binaryString.length);
									for (let i = 0; i < binaryString.length; i++) {
										update[i] = binaryString.charCodeAt(i);
									}
								}
							} else {
								update = new Uint8Array(row.update_data as ArrayLike<number>);
							}

							if (update.length > 0) {
								Y.applyUpdate(doc, update);
							}
						} catch (e) {
							console.error('Failed to apply Yjs update in export:', e);
						}
					});
				},
				'load'
			);
		}

		// Use Tiptap to parse the Yjs document, registering custom extensions so they aren't stripped
		const editor = new Editor({
			extensions: [
				StarterKit,
				Collaboration.configure({ document: doc }),
				GMNote,
				DiceRoller,
				StatBlock,
				OddsCheck,
				ClockBlock,
				TrackBlock,
				OracleBlock
			]
		});

		// Small delay to ensure the collaboration extension syncs the content
		await new Promise(resolve => setTimeout(resolve, 50));

		// Extract JSON and convert custom nodes to standard text blocks
		const json = editor.getJSON();
		const convertedJson = convertCustomNodesToText(json);
		
		// Clean up the initial editor instance
		editor.destroy();
		doc.destroy();

		// Create a second editor with just Markdown and standard nodes to serialize
		const markdownEditor = new Editor({
			extensions: [StarterKit, Markdown],
			content: convertedJson
		});

		const markdownContent = markdownEditor.storage.markdown.getMarkdown();
		markdownEditor.destroy();

		// Format filename: 01_Scene_Name.md
		const indexStr = scene.order_index.toString().padStart(2, '0');
		const displayTitle = scene.author_title || scene.display_title || `Scene ${scene.order_index}`;
		const safeTitle = displayTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		const filename = `${indexStr}_${safeTitle}.md`;
		
		proseFolder.file(filename, markdownContent || '');
	}

	// 3. Fetch Wiki Events and Entities
	const baseEntities = await getWikiEntities(serialId);
	
	// We need all wiki events for the entire serial to rebuild the state.
	// Since wiki_events doesn't have a serial_id column, we filter by entity_id
	const entityIds = baseEntities.map(e => e.id);
	
	let allEventsData: any[] = [];
	if (entityIds.length > 0) {
		const { data: eventsData, error: eventsError } = await supabase
			.from('wiki_events')
			.select('*')
			.in('entity_id', entityIds)
			.order('created_at', { ascending: true });

		if (eventsError || !eventsData) {
			console.error('Error fetching wiki events:', eventsError);
			throw new Error('Failed to fetch wiki events');
		}
		allEventsData = eventsData;
	}

	// Reduce events to get the current state of all entities (pass null for activeBlockIdsSet to reveal all)
	const reducedEntitiesMap = reduceWikiEvents(allEventsData, null, baseEntities);

	// 4. Process Wiki Entities into Markdown files grouped by category
	for (const [entityId, entity] of reducedEntitiesMap.entries()) {
		if (!entity.isActive) continue; // Skip deleted/archived entities if they shouldn't be backed up

		const safeCategory = entity.category.replace(/[^a-z0-9]/gi, '_');
		const categoryFolder = wikiFolder.folder(safeCategory) || wikiFolder;

		const safeName = entity.name.replace(/[^a-z0-9]/gi, '_') || entityId;
		const filename = `${safeName}.md`;

		let md = `# ${entity.name}\n\n`;
		md += `**Category:** ${entity.category}\n\n`;
		
		if (entity.description) {
			md += `## Description\n\n${entity.description}\n\n`;
		}

		if (entity.facts && entity.facts.length > 0) {
			md += `## Facts\n\n`;
			entity.facts.forEach(fact => {
				md += `- ${fact.content}\n`;
			});
			md += `\n`;
		}

		// Include clocks/tracks if they exist in metadata
		if (entity.metadata) {
			const mdKeys = Object.keys(entity.metadata);
			if (mdKeys.length > 0) {
				md += `## Metadata\n\n`;
				if (entity.metadata.segments !== undefined) {
					md += `- **Clock:** ${entity.metadata.filled} / ${entity.metadata.segments}\n`;
				}
				if (entity.metadata.max !== undefined) {
					md += `- **Track:** ${entity.metadata.current} / ${entity.metadata.max}\n`;
				}
				mdKeys.forEach(k => {
					if (k !== 'segments' && k !== 'filled' && k !== 'max' && k !== 'current') {
						md += `- **${k}:** ${JSON.stringify(entity.metadata[k])}\n`;
					}
				});
			}
		}

		categoryFolder.file(filename, md);
	}

	// 5. Generate zip and trigger download
	const zipBlob = await zip.generateAsync({ type: 'blob' });
	
	const safeSerialTitle = serialTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
	const downloadUrl = URL.createObjectURL(zipBlob);
	
	const a = document.createElement('a');
	a.href = downloadUrl;
	a.download = `${safeSerialTitle}_backup.zip`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(downloadUrl);
}
