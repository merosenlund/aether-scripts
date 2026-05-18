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

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  const { id: serialId } = params;

  // 1. Fetch the Serial details
  const { data: serial, error: serialError } = await supabase
    .from('serials')
    .select(`
      id,
      title,
      color_theme,
      status,
      next_scene_completion_percentage,
      next_scene_update_note,
      teaser_target_scene_id,
      author_id
    `)
    .eq('id', serialId)
    .single();

  if (serialError || !serial) {
    console.error('Error fetching serial for reader:', serialError);
    throw error(404, 'Serial not found');
  }

  // 2. Fetch all scenes for this Serial along with their active versions
  const { data: scenes, error: scenesError } = await supabase
    .from('scenes')
    .select(`
      id, 
      display_title, 
      author_title, 
      published_at, 
      order_index, 
      status, 
      scheduled_status, 
      scheduled_status_at,
      content_blocks,
      scene_versions(content)
    `)
    .eq('serial_id', serialId)
    .eq('scene_versions.is_active', true)
    .order('order_index', { ascending: true });

  if (scenesError) {
    console.error('Error fetching scenes:', scenesError);
    throw error(500, 'Could not load story scenes');
  }

  // 3. Apply the Query-Time Publication Check and convert version content JSON to HTML
  const now = new Date();
  const visibleScenes = (scenes || []).filter(scene => {
    if (scene.status === 'Published') return true;
    if (scene.scheduled_status === 'Published' && scene.scheduled_status_at) {
      return new Date(scene.scheduled_status_at) <= now;
    }
    return false;
  }).map(scene => {
    let contentHtml = '';
    const activeVersion = (scene.scene_versions as any)?.[0];
    
    // Fallback logic: check for snapshot version first, then fall back to live content_blocks
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

    return {
      id: scene.id,
      display_title: scene.display_title,
      author_title: scene.author_title,
      published_at: scene.published_at,
      order_index: scene.order_index,
      status: scene.status,
      scheduled_status: scene.scheduled_status,
      scheduled_status_at: scene.scheduled_status_at,
      content: contentHtml
    };
  });

  return {
    serial,
    scenes: visibleScenes
  };
};
