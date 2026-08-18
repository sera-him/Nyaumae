import { readJsonStorage, writeJsonStorage } from '@/lib/browserStorage';

export interface ReadingPreferences {
  fontSize: number;
  lineHeight: number;
}

export interface ReadingProgressEntry {
  storyId: string;
  storyTitle: string;
  chapterTitle: string;
  href: string;
  updatedAt: string;
}

const READING_PREFERENCES_KEY = 'neural-connection:reading-preferences:v1';
const READING_PROGRESS_KEY = 'neural-connection:reading-progress:v1';
const DEFAULT_PREFERENCES: ReadingPreferences = { fontSize: 16, lineHeight: 1.9 };

export function readReadingPreferences(): ReadingPreferences {
  const parsed = readJsonStorage<Partial<ReadingPreferences> | null>(READING_PREFERENCES_KEY, null).value;
  return {
    fontSize: typeof parsed?.fontSize === 'number' ? Math.min(22, Math.max(14, parsed.fontSize)) : DEFAULT_PREFERENCES.fontSize,
    lineHeight: typeof parsed?.lineHeight === 'number' ? Math.min(2.3, Math.max(1.55, parsed.lineHeight)) : DEFAULT_PREFERENCES.lineHeight,
  };
}

export function saveReadingPreferences(preferences: ReadingPreferences): void {
  writeJsonStorage(READING_PREFERENCES_KEY, preferences);
}

function readProgressMap(): Record<string, ReadingProgressEntry> {
  return readJsonStorage<Record<string, ReadingProgressEntry>>(READING_PROGRESS_KEY, {}).value;
}

export function recordReadingProgress(entry: Omit<ReadingProgressEntry, 'updatedAt'>): void {
  const all = readProgressMap();
  all[entry.storyId] = { ...entry, updatedAt: new Date().toISOString() };
  writeJsonStorage(READING_PROGRESS_KEY, all);
}

export function getLatestReadingProgress(): ReadingProgressEntry | null {
  return Object.values(readProgressMap()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ?? null;
}
