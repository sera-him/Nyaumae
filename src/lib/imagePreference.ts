import { readJsonStorage, writeJsonStorage } from '@/lib/browserStorage';

/**
 * Site-wide image display preference.
 *
 * When `showOriginalImages` is on, ResponsiveImage renders the original
 * un-optimized file instead of the auto-generated AVIF/WebP variants, so
 * readers can see the full-detail source (slower, heavier). The preference is
 * stored in the same browser-storage layer as other site prefs, and exposed
 * through a tiny module store so every image component can subscribe to
 * changes with `useSyncExternalStore` and update immediately.
 */
export const IMAGE_PREFERENCE_KEY = 'neural-connection:image-preference:v1';

export interface ImagePreference {
  showOriginalImages: boolean;
}

function readPreference(): ImagePreference {
  const parsed = readJsonStorage<Partial<ImagePreference> | null>(IMAGE_PREFERENCE_KEY, null).value;
  return {
    showOriginalImages: parsed?.showOriginalImages === true,
  };
}

let current: ImagePreference = readPreference();
const listeners = new Set<() => void>();

export function getShowOriginalImages(): boolean {
  return current.showOriginalImages;
}

export function setShowOriginalImages(value: boolean): void {
  if (current.showOriginalImages === value) return;
  current = { ...current, showOriginalImages: value };
  writeJsonStorage(IMAGE_PREFERENCE_KEY, current);
  listeners.forEach((listener) => listener());
}

export function subscribeShowOriginalImages(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
