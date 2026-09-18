import { useState } from 'react';
import { api, ApiError } from '../api';
import { useMoodLabel } from '../FacetsContext';
import { bilingualTitle } from '../lib/titles';
import type { Track } from '../types';

function formatDuration(sec: number | null): string {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

type BusyKind = 'now' | 'next' | 'queue' | null;
type DoneKind = 'now' | 'next' | 'queue' | null;

/**
 * Shared song card — used by Search, EntityDetail (movies/singers/music-directors
 * /songwriters/years), and FacetBrowse. Three real playback actions plus archive:
 *
 *   ▶ இப்போது இயக்கு (play now)  -> POST /api/tracks/{id}/play-now
 *       Pushes the track then confirmed-skips the on-air track. This is a true
 *       "plays immediately" ONLY when nothing else was already queued
 *       (ahead_count === 0 in the response) — Liquidsoap's request queue is a
 *       plain FIFO with no insert-at-front primitive (confirmed against
 *       cttr.liq's server.register list: status/push/skip/pause/resume/live
 *       only), so if other requests are already pending this one still plays
 *       after them. The inline note after clicking says which case happened.
 *
 *   அடுத்து (play next) -> POST /api/tracks/{id}/play-next
 *       Pushes onto the same FIFO without skipping. Same honesty rule: only a
 *       guaranteed "next" when ahead_count === 0.
 *
 *   வரிசையில் சேர் (add to queue) -> POST /api/queue (api.queueTrack) — appends,
 *       plays after everything already pending. No behavioural change from
 *       before; relabelled to sit consistently alongside the other two.
 *
 *   🗑️ archive — double-confirmation (first click arms it, second click within
 *       the same row actually archives), matching the pattern already used for
 *       calendar-entry delete (CalendarCellModal). Soft-delete only (archived_at
 *       column); the file on disk is never touched. If this track is currently
 *       on air, the backend skips it first. onArchived lets the parent page drop
 *       it from its own list immediately rather than waiting for a full refetch.
 */
export default function TrackRow({ track, onArchived }: { track: Track; onArchived?: (id: string) => void }) {
  const moodLabel = useMoodLabel();
  const [busy, setBusy] = useState<BusyKind>(null);
  const [done, setDone] = useState<DoneKind>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveArmed, setArchiveArmed] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archived, setArchived] = useState(false);

  const displayTitle = bilingualTitle(track.title_tamil, track.title, track.filename);

  function showNote(aheadCount: number, whenNextLabel: string) {
    setNote(
      aheadCount === 0
        ? whenNextLabel
        : `வரிசையில் ${aheadCount} பாடல்(கள்) முன் உள்ளன — அவற்றுக்குப் பின் இயங்கும்`,
    );
    setTimeout(() => setNote(null), 4000);
  }

  async function handlePlayNow() {
    setBusy('now');
    setError(null);
    try {
      const res = await api.playNow(track.id);
      setDone('now');
      showNote(res.ahead_count, 'இப்போதே இயங்குகிறது');
      setTimeout(() => setDone(null), 1800);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  async function handlePlayNext() {
    setBusy('next');
    setError(null);
    try {
      const res = await api.playNext(track.id);
      setDone('next');
      showNote(res.ahead_count, 'அடுத்ததாக இயங்கும்');
      setTimeout(() => setDone(null), 1800);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleQueue() {
    setBusy('queue');
    setError(null);
    try {
      const res = await api.queueTrack(track.id);
      setDone('queue');
      showNote(res.ahead_count + 1, 'வரிசையில் சேர்க்கப்பட்டது');
      setTimeout(() => setDone(null), 1800);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleArchive() {
    if (!archiveArmed) {
      setArchiveArmed(true);
      return;
    }
    setArchiving(true);
    setError(null);
    try {
      await api.archiveTrack(track.id);
      setArchived(true);
      onArchived?.(track.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed');
      setArchiveArmed(false);
    } finally {
      setArchiving(false);
    }
  }

  if (archived) {
    return (
      <div
        className="tamil flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs text-white/40"
        style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
      >
        🗑️ காப்பகப்படுத்தப்பட்டது — {displayTitle}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border px-3 py-2.5"
      style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-center gap-3">
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
        </div>
        <button
          onClick={handleArchive}
          disabled={archiving}
          title="காப்பகப்படுத்து — பட்டியலில் இருந்து மறையும், கோப்பு நீக்கப்படாது"
          className="shrink-0 rounded-lg border px-2 py-1.5 text-xs disabled:opacity-40"
          style={{
            borderColor: archiveArmed ? '#ef4444' : 'var(--card-border)',
            color: archiveArmed ? '#f87171' : 'rgba(255,255,255,0.35)',
            background: archiveArmed ? 'rgba(239,68,68,0.1)' : 'transparent',
          }}
        >
          🗑️
        </button>
      </div>

      {archiveArmed && (
        <div
          className="tamil flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-[11px]"
          style={{ borderColor: '#7f1d1d', background: 'rgba(239,68,68,0.08)', color: '#fca5a5' }}
        >
          <span>இந்தப் பாடலை காப்பகப்படுத்தவா? (கோப்பு அழிக்கப்படாது, பின்னர் மீட்கலாம்)</span>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="rounded-md px-2 py-1 font-semibold"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              {archiving ? '···' : 'உறுதி'}
            </button>
            <button
              onClick={() => setArchiveArmed(false)}
              disabled={archiving}
              className="rounded-md border px-2 py-1"
              style={{ borderColor: 'var(--card-border)', color: 'rgba(255,255,255,0.6)' }}
            >
              ரத்து
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-[11px] text-red-400">{error}</div>}
      {note && <div className="tamil text-[11px] text-white/45">{note}</div>}

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={handlePlayNow}
          disabled={busy !== null}
          title="இப்போதே இயக்கு — தற்போதையதைத் தவிர்த்து இதை உடனே இயக்கும் (வேறு எதுவும் வரிசையில் இல்லையென்றால் உடனடியாக)"
          className="tamil rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          style={{ background: 'var(--gold)', color: '#1a0a2e' }}
        >
          {busy === 'now' ? '···' : done === 'now' ? '✓' : '▶ இப்போது இயக்கு'}
        </button>
        <button
          onClick={handlePlayNext}
          disabled={busy !== null}
          title="அடுத்து — வரிசையில் சேர்க்கப்படும் (skip இல்லை); வரிசை காலியாக இருந்தால் உடனடியாக அடுத்ததாக இயங்கும்"
          className="tamil rounded-lg border px-3 py-1.5 text-xs font-semibold text-white/80 disabled:opacity-40"
          style={{ borderColor: 'var(--card-border)' }}
        >
          {busy === 'next' ? '···' : done === 'next' ? '✓' : 'அடுத்து'}
        </button>
        <button
          onClick={handleQueue}
          disabled={busy !== null}
          title="வரிசையின் இறுதியில் சேர்க்கும்"
          className="tamil rounded-lg border px-3 py-1.5 text-xs font-semibold text-white/60 disabled:opacity-40"
          style={{ borderColor: 'var(--card-border)' }}
        >
          {busy === 'queue' ? '···' : done === 'queue' ? '✓' : 'வரிசையில் சேர்'}
        </button>
      </div>
    </div>
  );
}
