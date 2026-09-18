import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../api';
import type { CalendarEntry } from '../../types';
import SegmentPlaylistPanel from './SegmentPlaylistPanel';

interface Segment {
  hourStart: number;
  hourEnd: number;
  clockId: number; // -1 = no clock assigned this hour (daypart rule engine fallback)
  clockName: string;
  clockNameTamil: string | null;
  isOverride: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Resolve, hour by hour, which schedule_calendar entry wins "today" — same
 * precedence the backend's RESOLVE_CALENDAR_SQL uses (see control_api.py's
 * _resolve_active_slot): a specific-date override always outranks a recurring
 * day_of_week row for the same hour; priority only breaks ties within the same
 * tier. Read-only — this only reads /api/schedule/calendar, never writes. */
function resolveTodaySegments(entries: CalendarEntry[], todayIso: string, dow: number): Segment[] {
  const winners: (CalendarEntry | null)[] = [];
  for (let hour = 0; hour < 24; hour++) {
    let best: CalendarEntry | null = null;
    for (const e of entries) {
      if (!e.enabled) continue;
      if (hour < e.hour_start || hour >= e.hour_end) continue;
      const isOverrideMatch = e.date === todayIso;
      const isRecurringMatch = e.date === null && e.day_of_week === dow;
      if (!isOverrideMatch && !isRecurringMatch) continue;
      if (!best) {
        best = e;
        continue;
      }
      const bestIsOverride = best.date === todayIso;
      if (isOverrideMatch && !bestIsOverride) {
        best = e;
      } else if (isOverrideMatch === bestIsOverride && e.priority > best.priority) {
        best = e;
      }
    }
    winners.push(best);
  }

  const segments: Segment[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const e = winners[hour];
    const clockId = e ? e.clock_id : -1;
    const isOverride = e ? e.date === todayIso : false;
    const last = segments[segments.length - 1];
    if (last && last.clockId === clockId && last.isOverride === isOverride && last.hourEnd === hour) {
      last.hourEnd = hour + 1;
      continue;
    }
    segments.push({
      hourStart: hour,
      hourEnd: hour + 1,
      clockId,
      clockName: e?.clock_name ?? '',
      clockNameTamil: e?.clock_name_tamil ?? null,
      isOverride,
    });
  }
  return segments;
}

/**
 * Vertical, scrollable "today's full schedule" strip for the home page — every
 * schedule_calendar segment assigned to today (America/Toronto), with the
 * currently-active one highlighted. Station time comes from /api/schedule/status
 * (already computes America/Toronto server-side via _station_now()) rather than
 * the browser's local clock/timezone, so this reads correctly no matter where
 * the RJ's device thinks it is. Read-only: only GETs /api/schedule/calendar and
 * /api/schedule/status, never writes schedule_calendar/clock_slots/etc.
 */
export default function TodayTimeline() {
  const [entries, setEntries] = useState<CalendarEntry[] | null>(null);
  const [stationTime, setStationTime] = useState<string | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [cal, status] = await Promise.all([api.calendar(), api.scheduleStatus()]);
      if (cancelled) return;
      setEntries(cal.results);
      setStationTime(status.station_time);
    }
    load();
    const iv = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  const parsed = useMemo(() => {
    if (!stationTime) return null;
    // station_time is an ISO string already expressed in America/Toronto wall-clock
    // (see control_api.py's _station_now().isoformat()) — read the parts straight
    // off the string rather than re-converting through the browser's own timezone.
    const m = stationTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return null;
    const [, y, mo, d, h, mi] = m;
    const dow = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d))).getUTCDay();
    return { iso: `${y}-${mo}-${d}`, hour: Number(h), minute: Number(mi), dow };
  }, [stationTime]);

  const segments = useMemo(() => {
    if (!entries || !parsed) return null;
    return resolveTodaySegments(entries, parsed.iso, parsed.dow);
  }, [entries, parsed]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center' });
  }, [segments === null]);

  if (!segments || !parsed) {
    return <div className="text-white/40 text-xs">ஏற்றுகிறது...</div>;
  }

  return (
    <div className="max-h-[32rem] overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--card-border)' }}>
      {segments.map((seg, i) => {
        const active = parsed.hour >= seg.hourStart && parsed.hour < seg.hourEnd;
        const dormant = seg.clockId === -1;
        const expanded = expandedIdx === i;
        return (
          <div key={i} className="border-t first:border-t-0 px-2" style={{ borderColor: 'var(--card-border)' }}>
            <button
              ref={active ? activeRef : undefined}
              onClick={() => !dormant && setExpandedIdx(expanded ? null : i)}
              disabled={dormant}
              className="flex w-full items-center gap-2.5 px-1 py-2 text-left disabled:cursor-default"
              style={{ background: active ? 'rgba(212,175,55,0.14)' : 'transparent' }}
              title={dormant ? undefined : 'விரிவாக்கி பாடல் பட்டியலைப் பார்க்க'}
            >
              <span className="text-[10px] text-white/40 tabular-nums shrink-0 w-[74px]">
                {pad(seg.hourStart)}:00–{pad(seg.hourEnd % 24)}:00
              </span>
              <span
                className={`tamil truncate text-xs flex-1 ${dormant ? 'text-white/30 italic' : 'text-white/85'}`}
              >
                {dormant
                  ? 'திட்டமிடப்படாதது (daypart விதி)'
                  : `${seg.isOverride ? '📌 ' : ''}${seg.clockNameTamil || seg.clockName}`}
              </span>
              {active && (
                <span
                  className="tamil shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                  style={{ background: 'var(--gold)', color: '#1a0a2e' }}
                >
                  இப்போது
                </span>
              )}
              {!dormant && <span className="text-white/25 text-[10px] shrink-0">{expanded ? '▲' : '▼'}</span>}
            </button>
            {expanded && !dormant && (
              <div className="pb-2.5">
                <SegmentPlaylistPanel clockId={seg.clockId} onClose={() => setExpandedIdx(null)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
