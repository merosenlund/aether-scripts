import { supabase } from '$lib/supabaseClient';

/**
 * Fetch a single scene's Tiptap JSON content for the ProseViewer.
 */
export async function fetchSceneContent(sceneId: string) {
	const { data, error } = await supabase
		.from('scenes')
		.select('id, content_blocks')
		.eq('id', sceneId)
		.single();

	if (error) {
		console.error('Failed to fetch scene content:', error);
		return null;
	}

	return data;
}

/**
 * Extract top-level block previews from a Tiptap document JSON.
 * Returns an array of { blockId, textSnippet, nodeType } for lightweight rendering.
 */
export function extractBlockPreviews(
	contentBlocks: { type: string; content?: Array<{ type: string; attrs?: Record<string, unknown>; content?: Array<{ text?: string }> }> } | null
): { blockId: string; textSnippet: string; nodeType: string }[] {
	if (!contentBlocks?.content) return [];

	return contentBlocks.content
		.filter((node) => node.attrs?.id)
		.map((node) => {
			const blockId = node.attrs!.id as string;
			const textSnippet = (node.content || [])
				.map((child) => child.text || '')
				.join('')
				.slice(0, 120);
			return {
				blockId,
				textSnippet,
				nodeType: node.type
			};
		});
}
