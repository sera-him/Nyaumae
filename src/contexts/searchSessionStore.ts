import { createContext } from 'react';

export type SearchSessionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface SearchSessionState {
  query: string;
  status: SearchSessionStatus;
  resultCount: number | null;
}

export interface SearchSessionContextValue extends SearchSessionState {
  setQuery: (query: string) => void;
  setSearchState: (state: Pick<SearchSessionState, 'status' | 'resultCount'>) => void;
}

export const SearchSessionContext = createContext<SearchSessionContextValue | null>(null);
