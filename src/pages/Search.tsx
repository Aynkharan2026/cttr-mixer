import { useEffect, useState } from 'react';
import { api } from '../api';
import { useFacets } from '../FacetsContext';
import TrackRow from '../components/TrackRow';
import type { Track } from '../types';

const PAGE_SIZE = 50;

export default function Search() {
  const facets = useFacets();
  const [q, setQ] = useState('');
  const [mood, setMood] = useState('');
  const [daypart, setDaypart] = useState('');
  const [contentType, setContentType] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searched, setSearched] = useState(false);

  const activeFilters = { q: q || undefined, mood: mood || undefined, daypart: daypart || undefined, content_type: contentType || undefined };
  const hasAnyFilter = q || mood || daypart || contentType;

  useEffect(() => {
    if (!hasAnyFilter) {
      setTracks([]);
      setSearched(false);
      return;
    }
    setSearched(true);
    setLoading(true);
    const id = setTimeout(() => {
      api
        .search({ ...activeFilters, limit: PAGE_SIZE, offset: 0 })
        .then((res) => {
          setTracks(res.results);
          setHasMore(res.results.length === PAGE_SIZE);
          setOffset(0);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, mood, daypart, contentType]);

  async function loadMore() {
    const nextOffset = offset + PAGE_SIZE;
    const res = await api.search({ ...activeFilters, limit: PAGE_SIZE, offset: nextOffset });
    setTracks((prev) => [...prev, ...res.results]);
    setHasMore(res.results.length === PAGE_SIZE);
    setOffset(nextOffset);
  }

  return (
    <div>
      <h1 className="tamil text-lg font-bold mb-4" style={{ color: 'var(--gold)' }}>
        பாடல் தேடல்
      </h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="தலைப்பு, பாடகர், திரைப்படம்..."
        className="tamil w-full rounded-lg border bg-black/30 px-3 py-2.5 text-sm text-white outline-none mb-3"
        style={{ borderColor: 'var(--card-border)' }}
      />
      <div className="grid grid-cols-3 gap-2 mb-5">
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="tamil rounded-lg border bg-black/30 px-2 py-2 text-xs text-white/70"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <option value="">உணர்வு</option>
          {facets?.moods.map((m) => (
            <option key={m.code} value={m.code}>
              {m.label_tamil || m.label}
            </option>
          ))}
        </select>
        <select
          value={daypart}
          onChange={(e) => setDaypart(e.target.value)}
          className="tamil rounded-lg border bg-black/30 px-2 py-2 text-xs text-white/70"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <option value="">நேரம்</option>
          {facets?.dayparts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.label_tamil || d.label}
            </option>
          ))}
        </select>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="tamil rounded-lg border bg-black/30 px-2 py-2 text-xs text-white/70"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <option value="">வகை</option>
          {facets?.content_types.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label_tamil || c.label}
            </option>
          ))}
        </select>
      </div>

      {!searched ? (
        <div className="text-white/40 text-sm">தேடத் தொடங்குங்கள் அல்லது வடிகட்டியைத் தேர்ந்தெடுக்கவும்</div>
      ) : loading && tracks.length === 0 ? (
        <div className="text-white/40 text-sm">தேடுகிறது...</div>
      ) : tracks.length === 0 ? (
        <div className="text-white/40 text-sm">முடிவுகள் இல்லை</div>
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
