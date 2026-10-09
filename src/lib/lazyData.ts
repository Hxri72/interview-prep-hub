/** Hooks that load the bigger data files only when a page needs them. */
import { useEffect, useState } from 'react';
import type { Card, SearchDoc } from '../types/content';

function useLazy<T>(loader: () => Promise<{ default: T }>): T | undefined {
  const [data, setData] = useState<T>();
  useEffect(() => {
    let alive = true;
    loader().then((m) => alive && setData(m.default));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return data;
}

export const useCards = () => useLazy<Card[]>(() => import('virtual:cards'));
export const useSummaries = () => useLazy<Record<string, string[]>>(() => import('virtual:revise'));
export const loadSearchDocs = () => import('virtual:search').then((m) => m.default as SearchDoc[]);
