import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import type { BroadcastLogEntry } from '../types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatAt(iso: string): string {
  return new Date(iso).toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const EVENT_LABEL: Record<string, { tamil: string; icon: string; color: string }> = {
  played: { tamil: 'ஒலிபரப்பப்பட்டது', icon: '🎵', color: 'rgba(255,255,255,0.7)' },
  live_on: { tamil: 'நேரடி மைக் — ON', icon: '🎙️', color: '#f87171' },
  live_off: { tamil: 'நேரடி மைக் — OFF', icon: '🎙️', color: 'rgba(255,255,255,0.5)' },
  skip: { tamil: 'தவிர்க்கப்பட்டது (Skip)', icon: '⏭', color: '#fbbf24' },
  queue_add: { tamil: 'வரிசையில் சேர்க்கப்பட்டது', icon: '➕', color: '#60a5fa' },
  play_now: { tamil: 'இப்போது இயக்கப்பட்டது', icon: '▶', color: 'var(--gold)' },
  play_next: { tamil: 'அடுத்ததாக வைக்கப்பட்டது', icon: '⏩', color: '#60a5fa' },
  track_archived: { tamil: 'காப்பகப்படுத்தப்பட்டது', icon: '🗑️', color: '#f87171' },
  track_restored: { tamil: 'மீட்கப்பட்டது', icon: '♻️', color: '#4ade80' },
};

function eventMeta(type: string) {
  return EVENT_LABEL[type] || { tamil: type, icon: '•', color: 'rgba(255,255,255,0.5)' };
}

/**
 * ஒலிபரப்பு பதிவு — Broadcast Log. Every track played (radio_play_log) merged
 * with every manual/scheduler action (station_events: live on/off transitions,
 * skip, queue-add, play-now, play-next, archive, restore) into one
 * date-filterable timeline. See GET /api/broadcast-log.
 */
export default function BroadcastLog() {
  const [start, setStart] = useState(daysAgoIso(1));
  const [end, setEnd] = useState(todayIso());
  const [entries, setEntries] = useState<BroadcastLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    api
      .broadcastLog({ start, end, limit: 500 })
      .then((res) => setEntries(res.results))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [start, end]);

  return (
    <div>
      <h1 className="tamil text-lg font-bold mb-1" style={{ color: 'var(--gold)' }}>
        ஒலிபரப்பு பதிவு
      </h1>
      <div className="text-xs text-white/40 mb-4">Broadcast Log — every play, live toggle, and RJ action</div>

      <div className="flex items-center gap-2 mb-4">
        <label className="text-[11px] text-white/40 tamil flex items-center gap-1.5">
          தொடக்கம்
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg border bg-black/30 px-2 py-1.5 text-xs text-white/80"
            style={{ borderColor: 'var(--card-border)' }}
          />
        </label>
        <label className="text-[11px] text-white/40 tamil flex items-center gap-1.5">
          முடிவு
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-lg border bg-black/30 px-2 py-1.5 text-xs text-white/80"
            style={{ borderColor: 'var(--card-border)' }}
          />
        </label>
        <button
          onClick={load}
          className="tamil rounded-lg border px-3 py-1.5 text-xs text-white/70 hover:text-white/95 ml-auto"
          style={{ borderColor: 'var(--card-border)' }}
        >
          புதுப்பி
        </button>
      </div>

      {error && <div className="text-[11px] text-red-400 mb-3">{error}</div>}
      {loading ? (
        <div className="text-white/40 text-sm">ஏற்றுகிறது...</div>
      ) : entries.length === 0 ? (
        <div className="text-white/40 text-sm">இந்த காலப்பகுதியில் பதிவுகள் இல்லை</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((e, i) => {
            const meta = eventMeta(e.type);
            return (
              <div
                key={`${e.type}-${e.at}-${i}`}
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
                style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
              >
                <span className="text-[11px] text-white/35 tabular-nums shrink-0 w-32">{formatAt(e.at)}</span>
                <span aria-hidden>{meta.icon}</span>
                <div className="min-w-0 flex-1">
                  {e.type === 'played' ? (
                    <>
                      <div className="tamil truncate text-xs font-medium text-white/85">{e.title || 'Untitled'}</div>
                      <div className="truncate text-[10px] text-white/40">
                        {[e.artist, e.movie_name].filter(Boolean).join(' · ')}
                      </div>
                    </>
                  ) : (
                    <div className="tamil truncate text-xs" style={{ color: meta.color }}>
                      {meta.tamil}
                      {e.details && Object.keys(e.details).length > 0 && (
                        <span className="text-white/30 text-[10px] ml-2">
                          {Object.entries(e.details)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(' · ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="tamil shrink-0 text-[10px] text-white/25">
                  {e.type === 'played' ? e.source : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
