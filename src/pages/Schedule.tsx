import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { CalendarEntry, ClockSlot, ScheduleClock, ScheduleClockDetail, ScheduleStatus } from '../types';
import { clockSlotMeta } from '../clockSlotTypes';
import HourTimeline from '../components/schedule/HourTimeline';
import CalendarGrid from '../components/schedule/CalendarGrid';
import InsertsPanel from '../components/schedule/InsertsPanel';
import SlotEditorModal from '../components/schedule/SlotEditorModal';
import CalendarCellModal from '../components/schedule/CalendarCellModal';

function sundayOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

/**
 * Hour-clock + calendar scheduling engine — the real editor for
 * schedule_clocks / clock_slots / schedule_calendar / schedule_inserts.
 * Promoted from a read-only calendar preview (the old Schedule.tsx) into the
 * full-width home for this feature: a 60-minute timeline and a 7x24 calendar
 * grid need real room, which the narrow fixed RightConsole sidebar can't give.
 * The simple playlist quick-editor (create/rename a playlist, drag-reorder its
 * tracks) stays exactly where it was, in RightConsole's "Schedule Editor"
 * section — this page assigns *when* + *what type* of content plays minute by
 * minute; that section still manages *which tracks* are inside a playlist.
 */
export default function Schedule() {
  const [clocks, setClocks] = useState<ScheduleClock[]>([]);
  const [selectedClockId, setSelectedClockId] = useState<number | null>(null);
  const [clockDetail, setClockDetail] = useState<ScheduleClockDetail | null>(null);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [status, setStatus] = useState<ScheduleStatus | null>(null);
  const [weekStart, setWeekStart] = useState(() => sundayOfWeek(new Date()));
  const [overrideMode, setOverrideMode] = useState(false);
  const [editing, setEditing] = useState<{ slot: ClockSlot | null; minuteOffset: number } | null>(null);
  const [viewingEntry, setViewingEntry] = useState<CalendarEntry | null>(null);
  const [newClockName, setNewClockName] = useState('');
  const [applyWeekHourStart, setApplyWeekHourStart] = useState(0);
  const [applyWeekHourEnd, setApplyWeekHourEnd] = useState(1);

  const loadClocks = useCallback(async () => {
    const res = await api.clocks();
    setClocks(res.results);
    if (!selectedClockId && res.results.length > 0) setSelectedClockId(res.results[0].id);
  }, [selectedClockId]);

  const loadCalendar = useCallback(async () => {
    const res = await api.calendar();
    setCalendarEntries(res.results);
  }, []);

  const loadStatus = useCallback(async () => {
    setStatus(await api.scheduleStatus());
  }, []);

  useEffect(() => {
    loadClocks();
    loadCalendar();
    loadStatus();
    const iv = setInterval(loadStatus, 30_000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClockId) api.clock(selectedClockId).then(setClockDetail);
    else setClockDetail(null);
  }, [selectedClockId]);

  async function refreshClockDetail() {
    if (selectedClockId) setClockDetail(await api.clock(selectedClockId));
    loadClocks();
  }

  async function createClock() {
    const name = newClockName.trim();
    if (!name) return;
    const res = await api.createClock({ name });
    setNewClockName('');
    await loadClocks();
    setSelectedClockId(res.id);
  }

  async function deleteClock(id: number) {
    if (!confirm('இந்த கடிகாரத்தையும் அதன் அனைத்து இடைவெளிகளையும் நீக்கவா? (காலண்டரில் இருந்தும் அகற்றப்படும்)')) return;
    await api.deleteClock(id);
    if (selectedClockId === id) setSelectedClockId(null);
    await loadClocks();
    await loadCalendar();
  }

  async function copyThisHour() {
    if (!clockDetail) return;
    const name = window.prompt('புதிய கடிகாரத்தின் பெயர்:', `${clockDetail.name} (நகல்)`);
    if (!name) return;
    const res = await api.duplicateClock(clockDetail.id, { name });
    await loadClocks();
    setSelectedClockId(res.id);
    alert('நகலெடுக்கப்பட்டது. இப்போது கீழே உள்ள காலண்டரில் இதை ஒரு நேரத்தில் ஒதுக்கவும்.');
  }

  async function applyToWeek() {
    if (!selectedClockId) return;
    if (applyWeekHourStart >= applyWeekHourEnd) {
      alert('தொடக்க மணி முடிவு மணிக்கு முன் இருக்க வேண்டும்.');
      return;
    }
    await api.applyWeek({ clock_id: selectedClockId, hour_start: applyWeekHourStart, hour_end: applyWeekHourEnd });
    await loadCalendar();
  }

  async function onSlotResize(slot: ClockSlot, newDuration: number) {
    if (!selectedClockId) return;
    await api.updateSlot(selectedClockId, slot.id, { duration_minutes: newDuration });
    refreshClockDetail();
  }

  async function onCalendarAssign(dayIndex: number, hour: number, dateIso: string) {
    if (!selectedClockId) return;
    await api.createCalendarEntry({
      clock_id: selectedClockId,
      hour_start: hour,
      hour_end: hour + 1,
      ...(overrideMode ? { date: dateIso } : { day_of_week: dayIndex }),
    });
    await loadCalendar();
  }

  async function onCalendarEntryDeleted() {
    setViewingEntry(null);
    await loadCalendar();
  }

  const dormant = calendarEntries.length === 0;

  return (
    <div className="flex flex-col gap-4 pb-8" data-cttr-feature="hour-clock-calendar-v1">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="tamil text-lg font-bold" style={{ color: 'var(--gold)' }}>
            நேர அட்டவணை — மணி நேர கடிகாரம் &amp; காலண்டர்
          </h1>
          <div className="text-xs text-white/40 mt-0.5">
            பாடல் பட்டியல்களை நிர்வகிக்க வலது கட்டுப்பாட்டு பலகையைப் (🎚) பயன்படுத்தவும்.
          </div>
        </div>
        <div
          className="tamil rounded-full px-3 py-1.5 text-[11px] font-semibold"
          style={{
            background: dormant ? 'rgba(156,163,175,0.15)' : 'rgba(74,222,128,0.15)',
            color: dormant ? '#9ca3af' : '#4ade80',
          }}
          title={dormant ? 'எந்த கடிகாரமும் காலண்டரில் ஒதுக்கப்படவில்லை — daypart விதிகள் மட்டும் இயங்குகின்றன' : undefined}
        >
          {dormant ? '○ செயலற்றது (dormant)' : '● செயலில்'}
        </div>
      </div>

      {status && (
        <div className="text-[11px] text-white/40 tamil">
          நிலைய நேரம்: <span className="tabular-nums">{new Date(status.station_time).toLocaleString('en-CA')}</span>
          {' · '}
          தற்போது: {status.active_clock ? (
            <span style={{ color: 'var(--gold)' }}>
              {status.active_clock.name_tamil || status.active_clock.name}
              {status.active_slot && ` — ${clockSlotMeta(status.active_slot.slot_type).icon} ${status.active_slot.label || clockSlotMeta(status.active_slot.slot_type).label}`}
            </span>
          ) : (
            'எதுவும் ஒதுக்கப்படவில்லை (daypart விதி)'
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4">
        {/* Clock list */}
        <div className="rounded-xl border p-3 flex flex-col gap-2 h-fit" style={{ borderColor: 'var(--card-border)' }}>
          <div className="tamil text-xs font-semibold text-white/70">கடிகாரங்கள்</div>
          {clocks.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClockId(c.id)}
              className="tamil flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs text-left"
              style={{
                borderColor: selectedClockId === c.id ? 'var(--gold)' : 'var(--card-border)',
                background: selectedClockId === c.id ? 'rgba(212,175,55,0.08)' : 'transparent',
              }}
            >
              <span className="truncate">
                <div className="text-white/85">{c.name_tamil || c.name}</div>
                {c.name_tamil && <div className="text-[10px] text-white/35">{c.name}</div>}
              </span>
              <span className="text-[10px] text-white/30 shrink-0 ml-1">{c.slot_count ?? 0}</span>
            </button>
          ))}
          <div className="flex gap-1.5 mt-1">
            <input
              placeholder="புதிய கடிகாரம் பெயர்"
              value={newClockName}
              onChange={(e) => setNewClockName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createClock()}
              className="tamil flex-1 min-w-0 rounded border bg-transparent px-2 py-1 text-xs"
              style={{ borderColor: 'var(--card-border)' }}
            />
            <button
              onClick={createClock}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-black"
              style={{ background: 'var(--gold)' }}
            >
              +
            </button>
          </div>
        </div>

        {/* Timeline + quick actions */}
        <div className="flex flex-col gap-4">
          {clockDetail ? (
            <div className="rounded-xl border p-3" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="tamil text-sm font-semibold text-white/85">
                  {clockDetail.name_tamil || clockDetail.name}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={copyThisHour}
                    className="tamil rounded-lg border px-2.5 py-1 text-[11px] text-white/60 hover:text-white/90"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    இந்த மணி நேரத்தை நகலெடு
                  </button>
                  <button
                    onClick={() => deleteClock(clockDetail.id)}
                    className="rounded-lg border px-2.5 py-1 text-[11px] text-red-400"
                    style={{ borderColor: '#7f1d1d' }}
                  >
                    நீக்கு
                  </button>
                </div>
              </div>

              <HourTimeline
                slots={clockDetail.slots}
                onSlotClick={(slot) => setEditing({ slot, minuteOffset: slot.minute_offset })}
                onCreateAt={(minute) => setEditing({ slot: null, minuteOffset: minute })}
                onResize={onSlotResize}
              />

              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
                <span className="tamil text-[11px] text-white/50">வாரம் முழுவதும் பயன்படுத்து:</span>
                <input
                  type="number" min={0} max={23} value={applyWeekHourStart}
                  onChange={(e) => setApplyWeekHourStart(Number(e.target.value))}
                  className="w-12 rounded border bg-transparent px-1 py-0.5 text-[11px] tabular-nums"
                  style={{ borderColor: 'var(--card-border)' }}
                />
                <span className="text-white/30 text-[11px]">–</span>
                <input
                  type="number" min={1} max={24} value={applyWeekHourEnd}
                  onChange={(e) => setApplyWeekHourEnd(Number(e.target.value))}
                  className="w-12 rounded border bg-transparent px-1 py-0.5 text-[11px] tabular-nums"
                  style={{ borderColor: 'var(--card-border)' }}
                />
                <span className="text-[10px] text-white/30">மணி (24h)</span>
                <button
                  onClick={applyToWeek}
                  className="tamil ml-auto rounded-lg px-3 py-1 text-[11px] font-semibold text-black"
                  style={{ background: 'var(--gold)' }}
                >
                  வாரம் முழுவதும்
                </button>
              </div>
            </div>
          ) : (
            <div className="tamil text-xs text-white/35 rounded-xl border p-4" style={{ borderColor: 'var(--card-border)' }}>
              இடதுபுறத்தில் ஒரு கடிகாரத்தைத் தேர்ந்தெடுக்கவும் அல்லது புதிதாக உருவாக்கவும்.
            </div>
          )}

          {/* Calendar */}
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="tamil text-sm font-semibold text-white/85">காலண்டர்</div>
              <label className="tamil flex items-center gap-1.5 text-[11px] text-white/50">
                <input type="checkbox" checked={overrideMode} onChange={(e) => setOverrideMode(e.target.checked)} />
                📌 குறிப்பிட்ட தேதி மேலெழுதுதலாக ஒதுக்கு
              </label>
            </div>
            <CalendarGrid
              weekStart={weekStart}
              entries={calendarEntries}
              selectedClockId={selectedClockId}
              overrideMode={overrideMode}
              onWeekChange={(delta) => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + delta); return n; })}
              onAssign={onCalendarAssign}
              onCellClick={setViewingEntry}
            />
          </div>

          {/* Auto-inserts */}
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--card-border)' }}>
            <div className="tamil text-sm font-semibold text-white/85 mb-2">தானியங்கி செருகல்கள் — Auto-Insert</div>
            {status && <InsertsPanel inserts={status.inserts} ttsAvailable={status.tts_available} onChange={loadStatus} />}
          </div>
        </div>
      </div>

      {editing && selectedClockId && (
        <SlotEditorModal
          clockId={selectedClockId}
          slot={editing.slot}
          defaultMinuteOffset={editing.minuteOffset}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refreshClockDetail();
          }}
        />
      )}

      {viewingEntry && (
        <CalendarCellModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onDeleted={onCalendarEntryDeleted}
        />
      )}
    </div>
  );
}
