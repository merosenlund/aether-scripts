import { supabase } from '../supabaseClient';

export interface WikiEntity {
  id: string;
  serial_id: string;
  name: string;
  category: 'character' | 'thread' | 'clock' | 'location' | 'other' | 'track';
  description: string;
  metadata: any;
  created_at: string;
}

export interface WikiAnchor {
  id: string;
  scene_id: string;
  entity_id: string;
  block_id: string;
  reveal_type: 'scroll' | 'manual';
  created_at: string;
}

export async function getWikiEntities(serialId: string) {
  const { data, error } = await supabase
    .from('wiki_entities')
    .select('*')
    .eq('serial_id', serialId)
    .order('name');

  if (error) throw error;
  return data as WikiEntity[];
}

export async function getWikiAnchors(sceneId: string) {
  const { data, error } = await supabase
    .from('wiki_anchors')
    .select('*, wiki_entities(*)')
    .eq('scene_id', sceneId);

  if (error) throw error;
  return data;
}

export async function createWikiAnchor(sceneId: string, entityId: string, blockId: string) {
  const { data, error } = await supabase
    .from('wiki_anchors')
    .insert({
      scene_id: sceneId,
      entity_id: entityId,
      block_id: blockId,
      reveal_type: 'scroll'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
