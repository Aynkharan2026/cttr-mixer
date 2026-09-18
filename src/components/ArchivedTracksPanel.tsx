import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { bilingualTitle } from '../lib/titles';
import type { ArchivedTrack } from '../types';

/** Minimal archived-tracks view + restore — item 4's "at least a minimal way to
 * view archived tracks and restore one". Lives in RightConsole since it's a
 * small, occasional RJ action, not a full page. */
export default function ArchivedTracksPanel() {
  const [tracks, setTracks] = useState<ArchivedTrack[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  function load() {
    api
      .archivedTracks({ limit: 20 })
      .then((res) => setTracks(res.results))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed'));
  }

  useEffect(load, []);

  async function restore(id: string) {
    setRestoring(id);
    try {
      await api.restoreTrack(id);
      setTracks((prev) => prev?.filter((t) => t.id !== id) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setRestoring(null);
    }
  }

  if (error) return <div className="text-[11px] text-red-400">{error}</div>;
  if (tracks === null) return <div className="text-white/40 text-xs">ஏற்றுகிறது...</div>;
  if (tracks.length === 0) return <div className="text-white/40 text-xs tamil">காப்பகப்படுத்தப்பட்ட பாடல்கள் இல்லை</div>;

  return (
    <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
      {tracks.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[11px]"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <span className="tamil truncate flex-1 text-white/70">{bilingualTitle(t.title_tamil, t.title, t.filename)}</span>
          <button
            onClick={() => restore(t.id)}
            disabled={restoring === t.id}
            className="shrink-0 rounded-md border px-2 py-0.5 text-[10px] text-white/60 hover:text-white/90 disabled:opacity-40"
            style={{ borderColor: 'var(--card-border)' }}
          >
            {restoring === t.id ? '···' : 'மீட்டு'}
          </button>
        </div>
      ))}
    </div>
  );
}
