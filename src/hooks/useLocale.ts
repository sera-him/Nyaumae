import { useEffect, useState } from 'react';
import { getLocale, LOCALE_EVENT, type Locale } from '@/lib/i18n';

/**
 * Reads the active locale and re-renders on change. The site translates most
 * copy at the DOM level, but a few components need locale-aware React output
 * (long-form reader notices, headings that must not be re-translated).
 */
export function useLocale(): Locale {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());

  useEffect(() => {
    const sync = () => setLocaleState(getLocale());
    window.addEventListener(LOCALE_EVENT, sync);
    return () => window.removeEventListener(LOCALE_EVENT, sync);
  }, []);

  return locale;
}
