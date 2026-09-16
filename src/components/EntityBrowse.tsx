import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EntitySummary } from '../types';

interface Props {
  title: string;
  basePath: string; // e.g. "/movies"
  fetcher: (params: { q?: string; sort?: string; order?: string; limit?: number; offset?: number }) => Promise<{
    results: EntitySummary[];
  }>;
  showYear?: boolean;
}

const PAGE_SIZE = 60;

export default function EntityBrowse({ title, basePath, fetcher, showYear }: Props) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'name' | 'track_count'>('name');
  const [items, setItems] = useState<EntitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setOffset(0);
    let cancelled = false;
    setLoading(true);
    fetcher({ q: q || undefined, sort, order: sort === 'track_count' ? 'desc' : 'asc', limit: PAGE_SIZE, offset: 0 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.results);
        setHasMore(res.results.length === PAGE_SIZE);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort]);

  async function loadMore() {
    const nextOffset = offset + PAGE_SIZE;
    const res = await fetcher({
      q: q || undefined,
      sort,
      order: sort === 'track_count' ? 'desc' : 'asc',
      limit: PAGE_SIZE,
      offset: nextOffset,
    });
    setItems((prev) => [...prev, ...res.results]);
    setHasMore(res.results.length === PAGE_SIZE);
    setOffset(nextOffset);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="tamil text-lg font-bold" style={{ color: 'var(--gold)' }}>
          {title}
        </h1>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'name' | 'track_count')}
          className="tamil rounded-lg border bg-black/30 px-2 py-1.5 text-xs text-white/70"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <option value="name">பெயர் வரிசை</option>
          <option value="track_count">பாடல் எண்ணிக்கை</option>
        </select>
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="தேடு..."
        className="tamil w-full rounded-lg border bg-black/30 px-3 py-2 text-sm text-white outline-none mb-4"
        style={{ borderColor: 'var(--card-border)' }}
      />
      {loading && items.length === 0 ? (
        <div className="text-white/40 text-sm">ஏற்றுகிறது...</div>
      ) : items.length === 0 ? (
        <div className="text-white/40 text-sm">முடிவுகள் இல்லை</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`${basePath}/${item.id}`}
              className="rounded-xl border px-3 py-2.5 hover:border-white/30 transition"
              style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="truncate text-sm font-medium text-white/90">{item.name}</div>
              <div className="text-xs text-white/40 mt-0.5">
                {showYear && item.year ? `${item.year} · ` : ''}
                {item.track_count} பாடல்கள்
              </div>
            </Link>
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
