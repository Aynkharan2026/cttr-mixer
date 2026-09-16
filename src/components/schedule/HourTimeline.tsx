import { useRef, useState } from 'react';
import type { ClockSlot } from '../../types';
import { clockSlotMeta } from '../../clockSlotTypes';

interface Props {
  slots: ClockSlot[];
  onSlotClick: (slot: ClockSlot) => void;
  onCreateAt: (minuteOffset: number) => void;
  onResize: (slot: ClockSlot, newDurationMinutes: number) => void;
}

const TRACK_MINUTES = 60;

/**
 * Visual hour-clock: a 60-minute-wide timeline, slot blocks positioned/sized by
 * minute_offset/duration_minutes, colored by slot_type (see clockSlotTypes.ts).
 * Drag the block's right edge to resize; click a block to edit its content;
 * click empty track space to create a new slot starting there.
 */
export default function HourTimeline({ slots, onSlotClick, onCreateAt, onResize }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ slot: ClockSlot; startX: number; startDuration: number } | null>(null);
  const [liveDuration, setLiveDuration] = useState<number | null>(null);

  const sorted = [...slots].sort((a, b) => a.minute_offset - b.minute_offset);

  function minuteFromClientX(clientX: number): number {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(frac * TRACK_MINUTES);
  }

  function handleTrackClick(e: React.MouseEvent) {
    if (e.target !== trackRef.current) return; // only empty-space clicks, not bubbled from a block
    onCreateAt(minuteFromClientX(e.clientX));
  }

  function startDrag(e: React.PointerEvent, slot: ClockSlot) {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging({ slot, startX: e.clientX, startDuration: slot.duration_minutes });
    setLiveDuration(slot.duration_minutes);
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragging) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const deltaMinutes = ((e.clientX - dragging.startX) / rect.width) * TRACK_MINUTES;
    const maxDuration = TRACK_MINUTES - dragging.slot.minute_offset;
    const next = Math.min(maxDuration, Math.max(1, Math.round(dragging.startDuration + deltaMinutes)));
    setLiveDuration(next);
  }

  function endDrag() {
    if (dragging && liveDuration && liveDuration !== dragging.slot.duration_minutes) {
      onResize(dragging.slot, liveDuration);
    }
    setDragging(null);
    setLiveDuration(null);
  }

  return (
    <div>
      <div className="flex justify-between text-[10px] text-white/30 mb-1 px-0.5 tabular-nums">
        {Array.from({ length: 7 }, (_, i) => i * 10).map((m) => (
          <span key={m}>:{String(m).padStart(2, '0')}</span>
        ))}
      </div>
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        className="relative w-full rounded-lg border cursor-cell select-none"
        style={{ height: 64, borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
        title="காலியிடத்தை சொடுக்கி புதிய இடைவெளியைச் சேர்க்கவும்"
      >
        {/* 5-minute gridlines */}
        {Array.from({ length: 11 }, (_, i) => (i + 1) * 5).map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: `${(m / TRACK_MINUTES) * 100}%`, width: 1, background: 'rgba(255,255,255,0.05)' }}
          />
        ))}

        {sorted.map((slot) => {
          const meta = clockSlotMeta(slot.slot_type);
          const duration = dragging?.slot.id === slot.id ? liveDuration ?? slot.duration_minutes : slot.duration_minutes;
          const left = (slot.minute_offset / TRACK_MINUTES) * 100;
          const width = (duration / TRACK_MINUTES) * 100;
          return (
            <div
              key={slot.id}
              onClick={(e) => {
                e.stopPropagation();
                onSlotClick(slot);
              }}
              className="tamil absolute top-1 bottom-1 rounded-md border-2 px-1.5 py-1 overflow-hidden cursor-pointer hover:brightness-125 transition-[filter]"
              style={{
                left: `${left}%`,
                width: `calc(${width}% - 2px)`,
                background: `${meta.color}26`,
                borderColor: meta.color,
              }}
              title={`${meta.icon} ${slot.label || meta.label} — :${String(slot.minute_offset).padStart(2, '0')} (${duration} நிமிடம்)`}
            >
              <div className="text-[10px] font-semibold truncate" style={{ color: meta.color }}>
                {meta.icon} {slot.label || meta.label}
              </div>
              <div className="text-[9px] text-white/40 tabular-nums">
                :{String(slot.minute_offset).padStart(2, '0')} · {duration}நி
              </div>
              {/* Resize handle */}
              <div
                onPointerDown={(e) => startDrag(e, slot)}
                className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize hover:bg-white/20"
                title="இழுத்து கால அளவை மாற்றவும்"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
