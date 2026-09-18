import { useEffect, useState } from 'react';
import { api } from '../../api';
import type { ClockSlot, ClockSlotType, Playlist, Track } from '../../types';
import { CLOCK_SLOT_TYPES } from '../../clockSlotTypes';
import { bilingualTitle } from '../../lib/titles';

interface Props {
  clockId: number;
  slot: ClockSlot | null; // null = creating a new slot
  defaultMinuteOffset: number;
  onClose: () => void;
  onSaved: () => void;
}

type ContentMode = 'none' | 'playlist' | 'track' | 'live';

function contentModeOf(slot: ClockSlot | null): ContentMode {
  if (!slot) return 'none';
  if (slot.is_live) return 'live';
  if (slot.playlist_id) return 'playlist';
  if (slot.track_id) return 'track';
  return 'none';
}

/** Click-a-slot editor: type, timing, and content (playlist / single track / live
 * mic sentinel — reuses the existing cttr.live harbor gate, no new mechanism). */
export default function SlotEditorModal({ clockId, slot, defaultMinuteOffset, onClose, onSaved }: Props) {
  const [slotType, setSlotType] = useState<ClockSlotType>(slot?.slot_type || 'music');
  const [minuteOffset, setMinuteOffset] = useState(slot?.minute_offset ?? defaultMinuteOffset);
  const [duration, setDuration] = useState(slot?.duration_minutes ?? 10);
  const [label, setLabel] = useState(slot?.label || '');
  const [labelTamil, setLabelTamil] = useState(slot?.label_tamil || '');
  const [contentMode, setContentMode] = useState<ContentMode>(contentModeOf(slot));
  const [playlistId, setPlaylistId] = useState<number | null>(slot?.playlist_id ?? null);
  const [trackId, setTrackId] = useState<string | null>(slot?.track_id ?? null);
  const [trackLabel, setTrackLabel] = useState(slot?.track_title || '');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState<Track[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.playlists().then((r) => setPlaylists(r.results));
  }, []);

  useEffect(() => {
    if (contentMode !== 'track' || !trackQuery.trim()) {
      setTrackResults([]);
      return;
    }
    const handle = setTimeout(() => {
      api.search({ q: trackQuery, limit: 8 }).then((r) => setTrackResults(r.results));
    }, 250);
    return () => clearTimeout(handle);
  }, [trackQuery, contentMode]);

  async function save() {
    setSaving(true);
    setError(null);
    const body = {
      minute_offset: minuteOffset,
      duration_minutes: duration,
      slot_type: slotType,
      label: label || null,
      label_tamil: labelTamil || null,
      is_live: contentMode === 'live',
      playlist_id: contentMode === 'playlist' ? playlistId : null,
      track_id: contentMode === 'track' ? trackId : null,
      clear_playlist: contentMode !== 'playlist',
      clear_track: contentMode !== 'track',
    };
    try {
      if (slot) {
        await api.updateSlot(clockId, slot.id, body);
      } else {
        await api.createSlot(clockId, body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'சேமிக்க முடியவில்லை');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!slot) return;
    if (!confirm('இந்த இடைவெளியை நீக்கவா?')) return;
    setSaving(true);
    try {
      await api.deleteSlot(clockId, slot.id);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border p-4 flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
        style={{ borderColor: 'var(--gold)', background: 'var(--bg-mid)' }}
      >
        <div className="tamil text-sm font-bold" style={{ color: 'var(--gold)' }}>
          {slot ? 'இடைவெளியைத் திருத்து' : 'புதிய இடைவெளி'}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-white/40 tamil">
            தொடக்க நிமிடம் (:00–:59)
            <input
              type="number"
              min={0}
              max={59}
              value={minuteOffset}
              onChange={(e) => setMinuteOffset(Number(e.target.value))}
              className="mt-1 w-full rounded border bg-transparent px-2 py-1 text-xs tabular-nums"
              style={{ borderColor: 'var(--card-border)' }}
            />
          </label>
          <label className="text-[10px] text-white/40 tamil">
            கால அளவு (நிமிடம்)
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1 w-full rounded border bg-transparent px-2 py-1 text-xs tabular-nums"
              style={{ borderColor: 'var(--card-border)' }}
            />
          </label>
        </div>

        <div>
          <div className="text-[10px] text-white/40 tamil mb-1">வகை</div>
          <div className="grid grid-cols-4 gap-1.5">
            {CLOCK_SLOT_TYPES.map((t) => (
              <button
                key={t.code}
                onClick={() => setSlotType(t.code)}
                className="tamil flex flex-col items-center gap-0.5 rounded-lg border py-1.5 text-[9px]"
                style={{
                  borderColor: slotType === t.code ? t.color : 'var(--card-border)',
                  background: slotType === t.code ? `${t.color}26` : 'transparent',
                  color: slotType === t.code ? t.color : 'rgba(255,255,255,0.5)',
                }}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="லேபிள் (English)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded border bg-transparent px-2 py-1 text-xs"
            style={{ borderColor: 'var(--card-border)' }}
          />
          <input
            placeholder="லேபிள் (தமிழ்)"
            value={labelTamil}
            onChange={(e) => setLabelTamil(e.target.value)}
            className="tamil rounded border bg-transparent px-2 py-1 text-xs"
            style={{ borderColor: 'var(--card-border)' }}
          />
        </div>

        <div>
          <div className="text-[10px] text-white/40 tamil mb-1">உள்ளடக்கம்</div>
          <div className="flex gap-1.5 mb-2">
            {(['playlist', 'track', 'live', 'none'] as ContentMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setContentMode(mode)}
                className="tamil flex-1 rounded-lg border py-1 text-[10px]"
                style={{
                  borderColor: contentMode === mode ? 'var(--gold)' : 'var(--card-border)',
                  color: contentMode === mode ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
                }}
              >
                {mode === 'playlist' && 'பட்டியல்'}
                {mode === 'track' && 'பாடல்'}
                {mode === 'live' && 'நேரடி மைக்'}
                {mode === 'none' && 'விதி மட்டும்'}
              </button>
            ))}
          </div>

          {contentMode === 'playlist' && (
            <select
              value={playlistId ?? ''}
              onChange={(e) => setPlaylistId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded border bg-transparent px-2 py-1.5 text-xs"
              style={{ borderColor: 'var(--card-border)' }}
            >
              <option value="">— தேர்ந்தெடுக்கவும் —</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id} style={{ color: 'black' }}>
                  {p.name} ({p.track_count})
                </option>
              ))}
            </select>
          )}

          {contentMode === 'track' && (
            <div>
              {trackId && (
                <div className="tamil flex items-center justify-between rounded border px-2 py-1 text-xs mb-1" style={{ borderColor: 'var(--gold)' }}>
                  <span className="truncate">{trackLabel}</span>
                  <button onClick={() => { setTrackId(null); setTrackLabel(''); }} className="text-white/40 ml-2">✕</button>
                </div>
              )}
              <input
                placeholder="பாடல் தேடு..."
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                className="w-full rounded border bg-transparent px-2 py-1 text-xs"
                style={{ borderColor: 'var(--card-border)' }}
              />
              {trackResults.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded border" style={{ borderColor: 'var(--card-border)' }}>
                  {trackResults.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTrackId(t.id);
                        setTrackLabel(bilingualTitle(t.title_tamil, t.title, t.filename || t.id));
                        setTrackQuery('');
                        setTrackResults([]);
                      }}
                      className="tamil block w-full truncate px-2 py-1 text-left text-[11px] text-white/70 hover:bg-white/10"
                    >
                      {bilingualTitle(t.title_tamil, t.title, t.filename)} {t.artist ? `— ${t.artist}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {contentMode === 'live' && (
            <div className="text-[10px] text-white/35 tamil leading-relaxed">
              இந்த இடைவெளி இயங்கும்போது cttr.live on தானாக அமைக்கப்படும் (DJ இணைக்கப்பட்டிருந்தால் நேரடி ஒலிபரப்பு; இல்லையெனில் இசை தொடரும்). இடைவெளி முடிந்ததும் cttr.live off ஆகும்.
            </div>
          )}

          {contentMode === 'none' && (
            <div className="text-[10px] text-white/35 tamil">
              பொருள் ஏதும் இல்லை — daypart விதி இயந்திரம் இயல்பாக பாடல் தேர்ந்தெடுக்கும்.
            </div>
          )}
        </div>

        {error && <div className="text-[11px] text-red-400">{error}</div>}

        <div className="flex gap-2 mt-1">
          <button
            onClick={save}
            disabled={saving}
            className="tamil flex-1 rounded-lg py-2 text-xs font-semibold text-black disabled:opacity-50"
            style={{ background: 'var(--gold)' }}
          >
            சேமி
          </button>
          {slot && (
            <button
              onClick={remove}
              disabled={saving}
              className="tamil rounded-lg border px-3 py-2 text-xs text-red-400"
              style={{ borderColor: '#7f1d1d' }}
            >
              நீக்கு
            </button>
          )}
          <button
            onClick={onClose}
            className="tamil rounded-lg border px-3 py-2 text-xs text-white/60"
            style={{ borderColor: 'var(--card-border)' }}
          >
            ரத்து
          </button>
        </div>
      </div>
    </div>
  );
}
