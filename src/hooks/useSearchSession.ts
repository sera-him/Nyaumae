import { useContext } from 'react';
import { SearchSessionContext, type SearchSessionContextValue } from '@/contexts/searchSessionStore';

export function useSearchSession(): SearchSessionContextValue {
  const value = useContext(SearchSessionContext);
  if (!value) throw new Error('useSearchSession must be used inside SearchSessionProvider');
  return value;
}
