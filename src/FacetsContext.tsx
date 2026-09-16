import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import type { Facets } from './types';

const FacetsContext = createContext<Facets | null>(null);

export function FacetsProvider({ children }: { children: ReactNode }) {
  const [facets, setFacets] = useState<Facets | null>(null);

  useEffect(() => {
    api.facets().then(setFacets).catch(() => setFacets(null));
  }, []);

  return <FacetsContext.Provider value={facets}>{children}</FacetsContext.Provider>;
}

export function useFacets(): Facets | null {
  return useContext(FacetsContext);
}

export function useMoodLabel() {
  const facets = useFacets();
  return (code: string) => facets?.moods.find((m) => m.code === code)?.label_tamil || code;
}

export function useDaypartLabel() {
  const facets = useFacets();
  return (code: string) => facets?.dayparts.find((d) => d.code === code)?.label_tamil || code;
}

export function useContentTypeLabel() {
  const facets = useFacets();
  return (code: string) => facets?.content_types.find((c) => c.code === code)?.label_tamil || code;
}
