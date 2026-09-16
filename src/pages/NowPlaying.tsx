import { useState } from 'react';
import { useStatus } from '../StatusContext';
import { useMoodLabel } from '../FacetsContext';
import { api } from '../api';

function formatElapsed(sec: number | null): string {
  if (sec === null) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function NowPlaying() {
  const { status, refresh } = useStatus();
  const moodLabel = useMoodLabel();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(name: string, fn: () => Promise<unknown>) {
    setBusy(name);
    try {
      await fn();
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  const details = status?.now_playing?.details;
  const title = details?.title_tamil || details?.title || status?.now_playing?.title || 'ஒலிபரப்பு இல்லை';
  const paused = status?.paused;
  const live = status?.live;
  const isLive = live?.enabled && live?.connected;

  return (
    <div>
      <h1 className="tamil text-lg font-bold mb-4" style={{ color: 'var(--gold)' }}>
        தற்போது ஒலிபரப்பு
      </h1>

      <div
        className="rounded-2xl border p-5 mb-5 text-center relative overflow-hidden"
        style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
      >
        {isLive && (
          <div className="tamil inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold mb-3" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)' }}>
            ● நேரடி ஒலிபரப்பு
          </div>
        )}
        <div className="tamil text-xl font-bold text-white/95">{title}</div>
        <div className="text-sm text-white/50 mt-1">
          {[details?.artist, details?.movie_name].filter(Boolean).join(' · ')}
        </div>
        {!isLive && status?.now_playing?.elapsed_sec != null && (
          <div className="text-xs text-white/35 mt-2">{formatElapsed(status.now_playing.elapsed_sec)}</div>
        )}

        {details?.moods && details.moods.length > 0 && (
          <div className="tamil flex flex-wrap justify-center gap-1.5 mt-3">
            {details.moods.map((m) => (
              <span
                key={m}
                className="rounded-full px-2.5 py-0.5 text-xs"
                style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)' }}
              >
                {moodLabel(m)}
              </span>
            ))}
          </div>
        )}

        {!paused && !isLive && (
          <div className="flex items-end justify-center gap-1 h-5 mt-4">
            {[8, 16, 12, 20, 10].map((h, i) => (
              <div
                key={i}
                className="eq-bar w-1 rounded-sm"
                style={{ height: h, background: 'var(--gold)', animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => run('pause', () => (paused ? api.resume() : api.pause()))}
          disabled={busy !== null}
          className="tamil rounded-xl border py-3 text-sm font-medium disabled:opacity-40"
          style={{ borderColor: 'var(--card-border)' }}
        >
          {paused ? '▶ தொடர்' : '⏸ நிறுத்து'}
        </button>
        <button
          onClick={() => run('skip', () => api.skip())}
          disabled={busy !== null}
          className="tamil rounded-xl border py-3 text-sm font-medium disabled:opacity-40"
          style={{ borderColor: 'var(--card-border)' }}
        >
          ⏭ அடுத்த பாடல்
        </button>
        <button
          onClick={() => run('live', () => api.setLive(!live?.enabled))}
          disabled={busy !== null}
          className="tamil rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
          style={{
            background: live?.enabled ? 'var(--gold)' : 'transparent',
            color: live?.enabled ? '#1a0a2e' : 'rgba(255,255,255,0.7)',
            border: `1px solid ${live?.enabled ? 'var(--gold)' : 'var(--card-border)'}`,
          }}
        >
          ● நேரடி
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border py-3" style={{ borderColor: 'var(--card-border)' }}>
          <div className="tamil text-xs text-white/40">கேட்போர் எண்ணிக்கை</div>
          <div className="text-xl font-bold mt-1" style={{ color: 'var(--gold)' }}>
            {status?.listeners?.total ?? '—'}
          </div>
        </div>
        <div className="rounded-xl border py-3" style={{ borderColor: 'var(--card-border)' }}>
          <div className="tamil text-xs text-white/40">நேரப் பகுதி</div>
          <div className="text-sm font-medium mt-1.5 text-white/80">{status?.daypart ?? '—'}</div>
        </div>
      </div>
    </div>
  );
}
