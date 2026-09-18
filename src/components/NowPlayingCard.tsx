import { useStatus } from '../StatusContext';
import { useMoodLabel } from '../FacetsContext';
import { bilingualTitle } from '../lib/titles';

function formatElapsed(sec: number | null): string {
  if (sec === null) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Persistent "தற்போது ஒலிபரப்பு" card — rendered once by Layout, above the routed
 * <Outlet/>, so it stays visible no matter which left-panel category is open.
 * Progress bar is an honest estimate: elapsed_sec / duration_sec from the picked
 * track's known length, not a real playhead from Liquidsoap (it doesn't expose one).
 */
export default function NowPlayingCard() {
  const { status } = useStatus();
  const moodLabel = useMoodLabel();

  const details = status?.now_playing?.details;
  // Catalog tracks (details resolved): genuine bilingual pair. Ad-hoc audio
  // (station ID/jingle/time announcement — no tracks.id, so details is null)
  // only ever has the single raw title Liquidsoap echoes back; there is no
  // second language field to pair it with, so it renders as-is rather than
  // forcing a fabricated "/" split.
  const title = details
    ? bilingualTitle(details.title_tamil, details.title, status?.now_playing?.title)
    : status?.now_playing?.title || 'ஒலிபரப்பு இல்லை';
  const paused = status?.paused;
  const live = status?.live;
  const isLive = live?.enabled && live?.connected;
  const elapsed = status?.now_playing?.elapsed_sec ?? null;
  const duration = details?.duration_sec ?? null;
  const progressPct = !isLive && elapsed != null && duration ? Math.min(100, (elapsed / duration) * 100) : null;

  return (
    <div
      className="rounded-2xl border p-4 md:p-5 mb-4 relative overflow-hidden"
      style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-center gap-4">
        {/* Album-art placeholder — no artwork source exists in the catalog */}
        <div
          className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid var(--card-border)' }}
          title="ஆல்பம் அட்டை இல்லை"
        >
          🎵
        </div>

        <div className="min-w-0 flex-1">
          <div className="tamil text-[11px] font-semibold mb-1" style={{ color: 'var(--gold)' }}>
            தற்போது ஒலிபரப்பு
            {isLive && (
              <span className="tamil ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)' }}>
                ● நேரடி
              </span>
            )}
          </div>
          <div className="tamil truncate text-base md:text-lg font-bold text-white/95">{title}</div>
          <div className="truncate text-xs text-white/50 mt-0.5">
            {[details?.artist, details?.movie_name].filter(Boolean).join(' · ') || '—'}
          </div>

          {details?.moods && details.moods.length > 0 && (
            <div className="tamil flex flex-wrap gap-1 mt-1.5">
              {details.moods.slice(0, 4).map((m) => (
                <span key={m} className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)' }}>
                  {moodLabel(m)}
                </span>
              ))}
            </div>
          )}
        </div>

        {!paused && !isLive && (
          <div className="hidden sm:flex items-end gap-1 h-6 shrink-0">
            {[8, 18, 12, 22, 10].map((h, i) => (
              <div key={i} className="eq-bar w-1 rounded-sm" style={{ height: h, background: 'var(--gold)', animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        )}
      </div>

      {!isLive && (
        <div className="mt-3">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPct ?? 0}%`, background: 'var(--gold)' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/35 mt-1 tabular-nums">
            <span>{formatElapsed(elapsed)}</span>
            <span>{duration ? formatElapsed(duration) : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}
