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
      author_id,
      teaser_target_scene:scenes!serials_teaser_target_scene_id_fkey (
        status,
        word_count
      )
    `)
    .eq('id', serialId)
    .single();

  if (serialError || !serial) {
    console.error('Error fetching serial for reader:', serialError);
    throw error(404, 'Serial not found');
  }

  // Calculate dynamic teaser percentage for 'Playing' scenes targeting 1000 words
  const targetScene = (serial as any).teaser_target_scene;
  const autoPlayPercent = targetScene
    ? Math.min(100, Math.round(((targetScene.word_count || 0) / 1000) * 100))
    : 0;
  const manualEditPercent = serial.next_scene_completion_percentage || 0;

  // Aggregate writing session metrics for teaser scene
  let teaserMetrics = {
    playTimeSeconds: 0,
    editTimeSeconds: 0,
    playKeystrokes: 0,
    editKeystrokes: 0,
    playNetWords: 0,
    editNetWords: 0,
  };

  if (serial && serial.teaser_target_scene_id) {
    const { data: sessions } = await supabase
      .from('writing_sessions')
      .select('session_type, active_duration_seconds, keystrokes, starting_word_count, ending_word_count')
      .eq('scene_id', serial.teaser_target_scene_id);

    if (sessions) {
      sessions.forEach(s => {
        const net = Math.max(0, (s.ending_word_count || 0) - (s.starting_word_count || 0));
        if (s.session_type === 'play') {
          teaserMetrics.playTimeSeconds += s.active_duration_seconds || 0;
          teaserMetrics.playKeystrokes += s.keystrokes || 0;
          teaserMetrics.playNetWords += net;
        } else if (s.session_type === 'edit') {
          teaserMetrics.editTimeSeconds += s.active_duration_seconds || 0;
          teaserMetrics.editKeystrokes += s.keystrokes || 0;
          teaserMetrics.editNetWords += net;
        }
      });
    }
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
    scenes: visibleScenes,
    teaserMetrics,
    autoPlayPercent,
    manualEditPercent
  };
};
