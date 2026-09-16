import { useEffect, useState } from 'react';
import { useStatus } from '../StatusContext';
import { api } from '../api';
import type { PlayLogEntry } from '../types';

function formatDuration(sec: number | null): string {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
}

const SOURCE_LABEL: Record<string, string> = {
  schedule: 'நேர விதி',
  playlist: 'பட்டியல்',
  request: 'கோரிக்கை',
};

/**
 * "/" — the persistent Now Playing card (rendered by Layout for every route)
 * already covers the headline info, so this page is a quick-stats + recent-history
 * dashboard. History comes from the real, previously-unused /api/history endpoint
 * (radio_play_log — every track Liquidsoap has actually picked and aired).
 */
export default function Overview() {
  const { status } = useStatus();
  const [history, setHistory] = useState<PlayLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .history(15)
      .then((res) => setHistory(res.history))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="tamil text-lg font-bold mb-4" style={{ color: 'var(--gold)' }}>
        முகப்பு
      </h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border py-3 text-center" style={{ borderColor: 'var(--card-border)' }}>
          <div className="tamil text-[11px] text-white/40">கேட்போர்</div>
          <div className="text-xl font-bold mt-1" style={{ color: 'var(--gold)' }}>
            {status?.listeners?.total ?? '—'}
          </div>
        </div>
        <div className="rounded-xl border py-3 text-center" style={{ borderColor: 'var(--card-border)' }}>
          <div className="tamil text-[11px] text-white/40">நேரப் பகுதி</div>
          <div className="text-sm font-medium mt-1.5 text-white/80">{status?.daypart ?? '—'}</div>
        </div>
        <div className="rounded-xl border py-3 text-center" style={{ borderColor: 'var(--card-border)' }}>
          <div className="tamil text-[11px] text-white/40">நிலை</div>
          <div className="text-sm font-medium mt-1.5" style={{ color: status?.liquidsoap_online ? '#4ade80' : '#f87171' }}>
            {status?.liquidsoap_online ? 'ஆன்-எயர்' : 'ஆஃப்லைன்'}
          </div>
        </div>
      </div>

      <h2 className="tamil text-sm font-bold mb-2.5" style={{ color: 'var(--gold)' }}>
        சமீபத்திய ஒலிபரப்பு
      </h2>
      {loading ? (
        <div className="text-white/40 text-sm">ஏற்றுகிறது...</div>
      ) : history.length === 0 ? (
        <div className="text-white/40 text-sm">வரலாறு இல்லை</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {history.map((h, i) => (
            <div
              key={`${h.track_id}-${h.picked_at}-${i}`}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
            >
              <span className="text-[11px] text-white/35 tabular-nums shrink-0 w-12">{formatTime(h.picked_at)}</span>
              <div className="min-w-0 flex-1">
                <div className="tamil truncate text-xs font-medium text-white/85">{h.title || 'Untitled'}</div>
                <div className="truncate text-[10px] text-white/40">
                  {[h.artist, h.movie_name].filter(Boolean).join(' · ')}
                  {h.duration_sec ? ` · ${formatDuration(h.duration_sec)}` : ''}
                </div>
              </div>
              <span className="tamil shrink-0 text-[10px] text-white/30">{SOURCE_LABEL[h.source] ?? h.source}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
