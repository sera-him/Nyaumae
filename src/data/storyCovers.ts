/**
 * Single source of truth for story cover images, shared by the stories page
 * (grid covers) and RouteMetadata (per-story og:image) so the two can never
 * drift apart.
 */
const STORY_COVERS: Record<string, string[]> = {
  'mia-world': ['/story-mia-world-1.jpg'],
  'fox-penguin': ['/story-fox-penguin.jpg'],
  'agi-land': ['/story-agi-land.jpg'],
  'zhenhai-refining': ['/story-zhenhai-refining.png'],
  'little-girl-in-giant-country': ['/story-miia-dream-generated.png'],
  'star-child': ['/star-pavilion.jpg'],
};

export function getStoryCovers(storyId: string): string[] {
  return STORY_COVERS[storyId] ?? [`/story-${storyId}.jpg`];
}

export function getStoryCover(storyId: string): string | undefined {
  return STORY_COVERS[storyId]?.[0];
}
