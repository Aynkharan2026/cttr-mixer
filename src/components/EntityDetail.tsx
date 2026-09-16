import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TrackRow from './TrackRow';
import type { Track } from '../types';

interface Props {
  backPath: string;
  backLabel: string;
  headerName: string | null;
  headerSub?: string;
  fetcher: (params: { limit?: number; offset?: number }) => Promise<{ results: Track[] }>;
}

const PAGE_SIZE = 50;

export default function EntityDetail({ backPath, backLabel, headerName, headerSub, fetcher }: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetcher({ limit: PAGE_SIZE, offset: 0 })
      .then((res) => {
        setTracks(res.results);
        setHasMore(res.results.length === PAGE_SIZE);
        setOffset(0);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    const nextOffset = offset + PAGE_SIZE;
    const res = await fetcher({ limit: PAGE_SIZE, offset: nextOffset });
    setTracks((prev) => [...prev, ...res.results]);
    setHasMore(res.results.length === PAGE_SIZE);
    setOffset(nextOffset);
  }

  return (
    <div>
      <Link to={backPath} className="tamil text-xs text-white/40 hover:text-white/70">
        ← {backLabel}
      </Link>
      <h1 className="tamil text-lg font-bold mt-2 mb-1" style={{ color: 'var(--gold)' }}>
        {headerName ?? '...'}
      </h1>
      {headerSub && <div className="text-xs text-white/40 mb-4">{headerSub}</div>}
      {!headerSub && <div className="mb-4" />}
      {loading && tracks.length === 0 ? (
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
