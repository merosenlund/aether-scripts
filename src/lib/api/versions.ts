import { supabase } from '$lib/supabaseClient';

export type SceneStage = 'Draft' | 'Edit' | 'Published';

export async function createSnapshot(sceneId: string, stage: SceneStage, content: any) {
  // Get current max version number
  const { data: currentVersions } = await supabase
    .from('scene_versions')
    .select('version_number')
    .eq('scene_id', sceneId)
    .order('version_number', { ascending: false })
    .limit(1);

  const nextVersion = currentVersions && currentVersions.length > 0 
    ? currentVersions[0].version_number + 1 
    : 1;

  // Deactivate existing versions if this one is intended to be the active one
  // (Usually snapshots are active when created)
  await supabase
    .from('scene_versions')
    .update({ is_active: false })
    .eq('scene_id', sceneId);

  const { data, error } = await supabase
    .from('scene_versions')
    .insert({
      scene_id: sceneId,
      version_number: nextVersion,
      content,
      stage,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase Snapshot Error:', error);
    throw error;
  }
  return data;
}

export async function getActiveVersion(sceneId: string) {
  const { data, error } = await supabase
    .from('scene_versions')
    .select('*')
    .eq('scene_id', sceneId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function transitionStage(versionId: string, newStage: SceneStage) {
  const { data, error } = await supabase
    .from('scene_versions')
    .update({ stage: newStage })
    .eq('id', versionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
