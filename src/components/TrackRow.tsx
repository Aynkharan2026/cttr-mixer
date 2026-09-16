import { useState } from 'react';
import { api, ApiError } from '../api';
import { useMoodLabel } from '../FacetsContext';
import type { Track } from '../types';

function formatDuration(sec: number | null): string {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TrackRow({ track }: { track: Track }) {
  const moodLabel = useMoodLabel();
  const [busy, setBusy] = useState<'play' | 'queue' | null>(null);
  const [done, setDone] = useState<'play' | 'queue' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayTitle = track.title_tamil || track.title || track.filename || 'Untitled';

  async function handleQueue() {
    setBusy('queue');
    setError(null);
    try {
      await api.queueTrack(track.id);
      setDone('queue');
      setTimeout(() => setDone(null), 1800);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  async function handlePlay() {
    // No "play now" endpoint exists server-side: this queues the track, then
    // calls skip so it becomes the next thing on air. If other requests are
    // already ahead of it in the queue, this one still waits behind them —
    // "play" here means "jump the schedule", not "guaranteed play instantly".
    setBusy('play');
    setError(null);
    try {
      await api.queueTrack(track.id);
      await api.skip();
      setDone('play');
      setTimeout(() => setDone(null), 1800);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
      style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="min-w-0 flex-1">
        <div className="tamil truncate text-sm font-medium text-white/95">{displayTitle}</div>
        <div className="truncate text-xs text-white/50 mt-0.5">
          {[track.artist, track.movie_name].filter(Boolean).join(' · ')}
          {track.duration_sec ? ` · ${formatDuration(track.duration_sec)}` : ''}
        </div>
        {track.moods.length > 0 && (
          <div className="tamil flex flex-wrap gap-1 mt-1.5">
            {track.moods.slice(0, 3).map((m) => (
              <span
                key={m}
                className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)' }}
              >
                {moodLabel(m)}
              </span>
            ))}
          </div>
        )}
        {error && <div className="text-[11px] text-red-400 mt-1">{error}</div>}
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          onClick={handlePlay}
          disabled={busy !== null}
          title="Play — queues and skips to this track"
          className="tamil rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          style={{ background: 'var(--gold)', color: '#1a0a2e' }}
        >
          {busy === 'play' ? '···' : done === 'play' ? '✓' : '▶ இயக்கு'}
        </button>
        <button
          onClick={handleQueue}
          disabled={busy !== null}
          title="Add to queue"
          className="tamil rounded-lg border px-3 py-1.5 text-xs font-semibold text-white/80 disabled:opacity-40"
          style={{ borderColor: 'var(--card-border)' }}
        >
          {busy === 'queue' ? '···' : done === 'queue' ? '✓' : '+ வரிசை'}
        </button>
      </div>
    </div>
  );
}
