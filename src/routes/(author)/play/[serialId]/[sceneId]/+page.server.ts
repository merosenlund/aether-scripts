import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { serialId, sceneId } = params;

  return {
    scene: {
      id: sceneId,
      serial_id: serialId,
      author_title: 'Chapter 1: The Awakening (Draft)',
      content: '<p>The dark forest loomed ahead...</p><div data-type="gm-note">The goblins are hiding in the bushes, waiting for an ambush. DC 15 Perception.</div><p>As you walk down the path, the hairs on your neck stand up.</p>'
    }
  };
};
