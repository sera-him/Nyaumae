import { useState } from 'react';
import { readReadingPreferences, saveReadingPreferences, type ReadingPreferences } from '@/lib/readingState';

export function useReadingPreferences() {
  const [preferences, setPreferences] = useState<ReadingPreferences>(readReadingPreferences);

  const updatePreferences = (next: ReadingPreferences) => {
    setPreferences(next);
    saveReadingPreferences(next);
  };

  return { preferences, updatePreferences };
}
