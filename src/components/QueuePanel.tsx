import { useStatus } from '../StatusContext';
import { bilingualTitle } from '../lib/titles';

/**
 * Real data from /api/status's `queue` field (Liquidsoap's request queue). Reorder
 * and remove are NOT available: control_api.py's cttr.liq only registers
 * cttr.push / cttr.skip over telnet, nothing to reorder or drop a specific queued
 * item, so this stays read-only until that's added server-side (documented gap
 * carried over from the previous mixer-ui build).
 */
export default function QueuePanel({ compact = false }: { compact?: boolean }) {
  const { status } = useStatus();
  const queue = status?.queue ?? [];

  return (
    <div>
      {!compact && (
        <div className="text-[11px] text-white/40 mb-2.5">
          வரிசைப்படுத்த/நீக்க முடியாது — சேவையக API இதை இன்னும் ஆதரிக்கவில்லை (read-only).
        </div>
      )}
      {queue.length === 0 ? (
        <div className="text-white/40 text-xs">வரிசை காலியாக உள்ளது</div>
      ) : (
        <div className={`flex flex-col gap-1.5 ${compact ? 'max-h-52 overflow-y-auto' : ''}`}>
          {queue.map((t, i) => (
            <div
              key={`${t.id}-${i}`}
              className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
              style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div
                className="tamil flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)' }}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="tamil truncate text-xs font-medium text-white/90">{bilingualTitle(t.title_tamil, t.title)}</div>
                <div className="truncate text-[10px] text-white/45">{[t.artist, t.movie_name].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
