import { useEffect, useState } from 'react';
import { api } from '../../api';
import type { CalendarEntry, ScheduleClockDetail } from '../../types';
import { DAY_NAMES_TAMIL, clockSlotMeta } from '../../clockSlotTypes';

interface Props {
  entry: CalendarEntry;
  onClose: () => void;
  onDeleted: () => void;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Calendar-cell view: what clicking a calendar cell used to do (see CalendarGrid.tsx)
 * was call onClear() directly — a single click on an assigned cell popped a bare
 * window.confirm() and deleted the assignment right there, with no way to first see
 * what it actually was. This is the fix: click opens this view showing the resolved
 * clock + its minute-by-minute slot layout for the assigned hour(s); delete is an
 * explicit button *inside* here, and even that button requires a second click
 * ("மீண்டும் சொடுக்கவும்" arms it) before anything is actually removed.
 */
export default function CalendarCellModal({ entry, onClose, onDeleted }: Props) {
  const [clock, setClock] = useState<ScheduleClockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmArmed, setConfirmArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.clock(entry.clock_id).then((c) => {
      if (!cancelled) setClock(c);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [entry.clock_id]);

  async function confirmDelete() {
    if (!confirmArmed) {
      setConfirmArmed(true);
      return;
    }
    setDeleting(true);
    try {
      await api.deleteCalendarEntry(entry.id);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  const slots = clock?.slots ?? []; // the clock's full minute-by-minute template

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border p-4 flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
        style={{ borderColor: 'var(--gold)', background: 'var(--bg-mid)' }}
      >
        <div>
          <div className="tamil text-sm font-bold" style={{ color: 'var(--gold)' }}>
            {entry.clock_name_tamil || entry.clock_name}
          </div>
          {entry.clock_name_tamil && <div className="text-[11px] text-white/40">{entry.clock_name}</div>}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--card-border)' }}>
            <div className="tamil text-[10px] text-white/40">நேரம்</div>
            <div className="tabular-nums text-white/85 mt-0.5">
              {pad(entry.hour_start)}:00 – {pad(entry.hour_end)}:00
            </div>
          </div>
          <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--card-border)' }}>
            <div className="tamil text-[10px] text-white/40">வகை</div>
            <div className="tamil text-white/85 mt-0.5">
              {entry.date ? `📌 ${entry.date} (மேலெழுதுதல்)` : `${DAY_NAMES_TAMIL[entry.day_of_week ?? 0]} (தொடர்ச்சி)`}
            </div>
          </div>
          <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--card-border)' }}>
            <div className="tamil text-[10px] text-white/40">முன்னுரிமை</div>
            <div className="tabular-nums text-white/85 mt-0.5">{entry.priority}</div>
          </div>
          <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--card-border)' }}>
            <div className="tamil text-[10px] text-white/40">நிலை</div>
            <div className="mt-0.5" style={{ color: entry.enabled ? '#4ade80' : '#9ca3af' }}>
              {entry.enabled ? 'செயலில்' : 'முடக்கப்பட்டது'}
            </div>
          </div>
        </div>

        <div>
          <div className="tamil text-[11px] text-white/50 mb-1.5">இந்த கடிகாரத்தின் நிமிட அட்டவணை</div>
          {loading ? (
            <div className="text-white/40 text-xs">ஏற்றுகிறது...</div>
          ) : slots.length === 0 ? (
            <div className="text-white/40 text-xs">இடைவெளிகள் இல்லை — இந்த கடிகாரம் காலியாக உள்ளது.</div>
          ) : (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {slots.map((s) => {
                const meta = clockSlotMeta(s.slot_type);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[11px]"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <span className="tabular-nums text-white/40 shrink-0 w-9">:{pad(s.minute_offset)}</span>
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    <span className="tamil truncate text-white/80 flex-1">
                      {s.label_tamil || s.label || meta.label}
                    </span>
                    {(s.playlist_name || s.track_title) && (
                      <span className="tamil truncate text-white/35 text-[10px] max-w-[7rem]">
                        {s.playlist_name || s.track_title}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-1">
          <button
            onClick={confirmDelete}
            disabled={deleting}
            className="tamil flex-1 rounded-lg border py-2 text-xs font-semibold disabled:opacity-50"
            style={{
              borderColor: confirmArmed ? '#ef4444' : '#7f1d1d',
              background: confirmArmed ? 'rgba(239,68,68,0.15)' : 'transparent',
              color: '#f87171',
            }}
          >
            {deleting ? '···' : confirmArmed ? 'உறுதியா? மீண்டும் சொடுக்கவும் — நீக்கும்' : 'ஒதுக்கீட்டை நீக்கு'}
          </button>
          <button
            onClick={onClose}
            className="tamil rounded-lg border px-3 py-2 text-xs text-white/60"
            style={{ borderColor: 'var(--card-border)' }}
          >
            மூடு
          </button>
        </div>
        {confirmArmed && (
          <div className="text-[10px] text-red-400/80 tamil -mt-1">
            "{entry.clock_name_tamil || entry.clock_name}" ஒதுக்கீடு {pad(entry.hour_start)}:00–{pad(entry.hour_end)}:00
            க்கு நிரந்தரமாக நீக்கப்படும்.
          </div>
        )}
      </div>
    </div>
  );
}
