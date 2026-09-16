import { useMemo } from 'react';
import type { CalendarEntry } from '../../types';
import { DAY_NAMES_SHORT } from '../../clockSlotTypes';

interface Props {
  weekStart: Date; // a Sunday
  entries: CalendarEntry[];
  selectedClockId: number | null;
  overrideMode: boolean;
  onWeekChange: (delta: number) => void;
  onAssign: (dayIndex: number, hour: number, dateIso: string) => void;
  onClear: (entry: CalendarEntry) => void;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Deterministic color per clock id so the same clock always reads as the same
// color across the grid without needing an explicit palette assignment step.
function clockColor(clockId: number): string {
  const hue = (clockId * 47) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

/**
 * Calendar view: which clock plays when. Columns = the 7 days of the visible
 * week (actual dates), rows = hours 0-23. Recurring (day_of_week) assignments
 * render as a solid-border cell repeating every week; a date-specific override
 * for that exact date+hour renders with a dashed gold ring and a 📌 pin so it
 * reads as distinct from the recurring pattern it's overriding, per the spec.
 */
export default function CalendarGrid({
  weekStart, entries, selectedClockId, overrideMode, onWeekChange, onAssign, onClear,
}: Props) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    }),
    [weekStart],
  );

  // cellKey "dayIndex-hour" -> { entry, isOverride }
  const cellMap = useMemo(() => {
    const map = new Map<string, { entry: CalendarEntry; isOverride: boolean }>();
    for (const dayIndex of [0, 1, 2, 3, 4, 5, 6]) {
      const iso = dateStr(days[dayIndex]);
      for (const entry of entries) {
        if (!entry.enabled) continue;
        const matchesRecurring = entry.date === null && entry.day_of_week === dayIndex;
        const matchesOverride = entry.date === iso;
        if (!matchesRecurring && !matchesOverride) continue;
        for (let hour = entry.hour_start; hour < entry.hour_end; hour++) {
          const key = `${dayIndex}-${hour}`;
          const existing = map.get(key);
          // Override always wins display over recurring for the same cell.
          if (!existing || (matchesOverride && !existing.isOverride)) {
            map.set(key, { entry, isOverride: matchesOverride });
          }
        }
      }
    }
    return map;
  }, [entries, days]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onWeekChange(-7)}
          className="tamil rounded-lg border px-2 py-1 text-xs text-white/60 hover:text-white/90"
          style={{ borderColor: 'var(--card-border)' }}
        >
          ‹ முந்தைய வாரம்
        </button>
        <div className="text-xs text-white/50 tabular-nums">
          {dateStr(days[0])} – {dateStr(days[6])}
        </div>
        <button
          onClick={() => onWeekChange(7)}
          className="tamil rounded-lg border px-2 py-1 text-xs text-white/60 hover:text-white/90"
          style={{ borderColor: 'var(--card-border)' }}
        >
          அடுத்த வாரம் ›
        </button>
      </div>

      <div className="text-[10px] text-white/35 mb-2 tamil">
        {selectedClockId
          ? overrideMode
            ? '📌 தேர்ந்தெடுக்கப்பட்ட கடிகாரத்தை ஒரு குறிப்பிட்ட தேதியில் மட்டும் ஒதுக்க கட்டத்தைச் சொடுக்கவும் (மேலெழுதுதல்).'
            : 'தேர்ந்தெடுக்கப்பட்ட கடிகாரத்தை தொடர்ச்சியான வாராந்திர நேரமாக ஒதுக்க கட்டத்தைச் சொடுக்கவும்.'
          : 'கட்டத்தை ஒதுக்க முதலில் ஒரு கடிகாரத்தைத் தேர்ந்தெடுக்கவும் (கீழே பட்டியலில் இருந்து).'}
      </div>

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--card-border)' }}>
        <div className="grid" style={{ gridTemplateColumns: '44px repeat(7, minmax(84px, 1fr))', minWidth: 680 }}>
          <div className="sticky top-0 z-10" style={{ background: 'var(--bg-mid)' }} />
          {days.map((d, i) => (
            <div
              key={i}
              className="tamil sticky top-0 z-10 text-center text-[11px] font-semibold py-1.5 border-l"
              style={{ borderColor: 'var(--card-border)', background: 'var(--bg-mid)', color: 'var(--gold)' }}
            >
              {DAY_NAMES_SHORT[i]}
              <div className="text-[9px] text-white/35 font-normal tabular-nums">{dateStr(d).slice(5)}</div>
            </div>
          ))}

          {Array.from({ length: 24 }, (_, hour) => (
            <div key={`row-${hour}`} className="contents">
              <div
                className="text-[9px] text-white/30 text-right pr-1.5 py-1.5 border-t tabular-nums"
                style={{ borderColor: 'var(--card-border)' }}
              >
                {String(hour).padStart(2, '0')}
              </div>
              {days.map((d, dayIndex) => {
                const cell = cellMap.get(`${dayIndex}-${hour}`);
                return (
                  <button
                    key={dayIndex}
                    onClick={() => (cell ? onClear(cell.entry) : onAssign(dayIndex, hour, dateStr(d)))}
                    className="border-t border-l h-7 text-[9px] tamil truncate px-1 text-left transition-colors"
                    style={{
                      borderColor: 'var(--card-border)',
                      background: cell ? `${clockColor(cell.entry.clock_id)}30` : 'transparent',
                      outline: cell?.isOverride ? '2px dashed var(--gold)' : 'none',
                      outlineOffset: -2,
                    }}
                    title={
                      cell
                        ? `${cell.entry.clock_name_tamil || cell.entry.clock_name}${cell.isOverride ? ' (இந்த தேதிக்கு மட்டும்)' : ' (தொடர்ச்சி)'} — சொடுக்கி நீக்கவும்`
                        : 'காலியாக உள்ளது — சொடுக்கி ஒதுக்கவும்'
                    }
                  >
                    {cell && (
                      <span style={{ color: clockColor(cell.entry.clock_id) }}>
                        {cell.isOverride && '📌'}
                        {cell.entry.clock_name_tamil || cell.entry.clock_name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
