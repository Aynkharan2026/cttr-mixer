import { useEffect, useState } from 'react';
import { api } from '../api';
import { useFacets } from '../FacetsContext';
import TrackRow from './TrackRow';
import type { Facet, Track } from '../types';

type FacetKind = 'mood' | 'daypart' | 'content_type';

const PAGE_SIZE = 50;

export default function FacetBrowse({ kind, title }: { kind: FacetKind; title: string }) {
  const facets = useFacets();
  const [selected, setSelected] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const chips: Facet[] = facets
    ? kind === 'mood'
      ? facets.moods
      : kind === 'daypart'
        ? facets.dayparts
        : facets.content_types
    : [];

  useEffect(() => {
    if (!selected) {
      setTracks([]);
      return;
    }
    setLoading(true);
    api
      .search({ [kind]: selected, limit: PAGE_SIZE, offset: 0 } as Parameters<typeof api.search>[0])
      .then((res) => {
        setTracks(res.results);
        setHasMore(res.results.length === PAGE_SIZE);
        setOffset(0);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  async function loadMore() {
    if (!selected) return;
    const nextOffset = offset + PAGE_SIZE;
    const res = await api.search({ [kind]: selected, limit: PAGE_SIZE, offset: nextOffset } as Parameters<
      typeof api.search
    >[0]);
    setTracks((prev) => [...prev, ...res.results]);
    setHasMore(res.results.length === PAGE_SIZE);
    setOffset(nextOffset);
  }

  return (
    <div>
      <h1 className="tamil text-lg font-bold mb-4" style={{ color: 'var(--gold)' }}>
        {title}
      </h1>
      <div className="tamil flex flex-wrap gap-2 mb-5">
        {chips.map((c) => {
          const active = selected === c.code;
          return (
            <button
              key={c.code}
              onClick={() => setSelected(active ? null : c.code)}
              className="rounded-full px-3.5 py-1.5 text-sm border transition"
              style={
                active
                  ? { background: 'var(--gold)', color: '#1a0a2e', borderColor: 'var(--gold)' }
                  : { borderColor: 'var(--card-border)', color: 'rgba(255,255,255,0.7)' }
              }
            >
              {c.label_tamil || c.label}
            </button>
          );
        })}
        {chips.length === 0 && <div className="text-white/30 text-sm">ஏற்றுகிறது...</div>}
      </div>

      {!selected ? (
        <div className="text-white/40 text-sm">தேர்வு செய்யவும் — ஒரு குறிச்சொல்லைத் தட்டவும்</div>
      ) : loading && tracks.length === 0 ? (
        <div className="text-white/40 text-sm">ஏற்றுகிறது...</div>
      ) : tracks.length === 0 ? (
        <div className="text-white/40 text-sm">பாடல்கள் இல்லை</div>
      ) : (
        <div className="flex flex-col gap-2">
          {tracks.map((t) => (
            <TrackRow key={t.id} track={t} />
          ))}
        </div>
      )}
      {hasMore && (
        <button
          onClick={loadMore}
          className="tamil mt-4 w-full rounded-lg border py-2 text-sm text-white/60 hover:text-white/90"
          style={{ borderColor: 'var(--card-border)' }}
        >
          மேலும் ஏற்று
        </button>
      )}
    </div>
  );
}
