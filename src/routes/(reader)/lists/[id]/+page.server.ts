import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { GMNote } from '$lib/editor/extensions/GMNote';
import { DiceRoller } from '$lib/editor/extensions/DiceRoller';
import { StatBlock } from '$lib/editor/extensions/StatBlock';
import { OddsCheck } from '$lib/editor/extensions/OddsCheck';
import { ClockBlock } from '$lib/editor/extensions/ClockBlock';
import { TrackBlock } from '$lib/editor/extensions/TrackBlock';
import { OracleBlock } from '$lib/editor/extensions/OracleBlock';
import { BlockMetadata } from '$lib/editor/extensions/BlockMetadata';

export const load: PageServerLoad = async ({ params, locals: { supabase, getSession } }) => {
  const session = await getSession();

  // 1. Fetch reading list
  const { data: list, error: listError } = await supabase
    .from('reading_lists')
    .select(`
      *,
      serial:serials (
        id,
        title,
        color_theme,
        status,
        author_id
      )
    `)
    .eq('id', params.id)
    .single();

  if (listError || !list) {
    console.error('Error fetching reading list:', listError);
    throw error(404, 'Reading list not found');
  }

  // Authorize check if private
  if (!list.is_public && (!session || list.user_id !== session.user.id)) {
    throw error(403, 'This reading list is private');
  }

  // 2. Fetch list arcs
  const { data: arcs } = await supabase
    .from('reading_list_arcs')
    .select('*')
    .eq('list_id', list.id)
    .order('order_index', { ascending: true });

  // 3. Fetch list items joined with their scenes and active version content
  const { data: items, error: itemsError } = await supabase
    .from('reading_list_items')
    .select(`
      *,
      scene:scenes (
        id,
        display_title,
        author_title,
        order_index,
        published_at,
        summary,
        description,
        content_blocks,
        scene_versions(content)
      )
    `)
    .eq('list_id', list.id)
    .eq('scene.scene_versions.is_active', true)
    .order('order_index', { ascending: true });

  if (itemsError) {
    console.error('Error loading list items:', itemsError);
    throw error(500, 'Failed to load curation list items');
  }

  // 4. Compile content from JSON to HTML for prose reading mode
  const compiledItems = (items || []).map((item: any) => {
    const scene = item.scene;
    let contentHtml = '';
    
    if (scene) {
      const activeVersion = scene.scene_versions?.[0];
      const jsonContent = (activeVersion && activeVersion.content) || scene.content_blocks;

      if (jsonContent) {
        try {
          contentHtml = generateHTML(jsonContent, [
            StarterKit,
            GMNote,
            DiceRoller,
            StatBlock,
            OddsCheck,
            ClockBlock,
            TrackBlock,
            OracleBlock,
            BlockMetadata
          ]);
        } catch (err) {
          console.error(`Error generating HTML for scene ${scene.id}:`, err);
        }
      }
    }

    return {
      id: item.id,
      list_id: item.list_id,
      list_arc_id: item.list_arc_id,
      order_index: item.order_index,
      reading_mode: item.reading_mode,
      scene: scene ? {
        id: scene.id,
        display_title: scene.display_title,
        author_title: scene.author_title,
        order_index: scene.order_index,
        published_at: scene.published_at,
        summary: scene.summary,
        description: scene.description,
        content: contentHtml
      } : null
    };
  });

  return {
    list,
    arcs: arcs || [],
    items: compiledItems
  };
};
