import { useCallback, useMemo, useState } from 'react';
import { SearchSessionContext, type SearchSessionState } from '@/contexts/searchSessionStore';

export function SearchSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SearchSessionState>({
    query: '',
    status: 'idle',
    resultCount: null,
  });

  const setQuery = useCallback((query: string) => {
    setState((current) => ({
      ...current,
      query,
      status: query.trim() ? 'loading' : 'idle',
      resultCount: query.trim() ? current.resultCount : null,
    }));
  }, []);

  const setSearchState = useCallback((next: Pick<SearchSessionState, 'status' | 'resultCount'>) => {
    setState((current) => ({ ...current, ...next }));
  }, []);

  const value = useMemo(() => ({ ...state, setQuery, setSearchState }), [setQuery, setSearchState, state]);

  return <SearchSessionContext.Provider value={value}>{children}</SearchSessionContext.Provider>;
}
