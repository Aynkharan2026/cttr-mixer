import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useFacets } from '../../FacetsContext';
import { clockSlotMeta } from '../../clockSlotTypes';
import type { ClockSlot, Playlist, ScheduleClockDetail } from '../../types';
import { PlaylistTracksEditor } from '../ScheduleEditor';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * "Create & assign a playlist to this empty slot" — the sanctioned way to give a
 * clock_slots row content: create a real playlists row (existing endpoint) then
 * PATCH the slot's playlist_id onto it (existing /api/schedule/clocks/{id}/slots/
 * {id} endpoint, the same one SlotEditorModal already uses). Deliberately reuses
 * these two existing, already-shipped endpoints rather than any new/ad-hoc write
 * path — this file never issues its own SQL against clock_slots/schedule_clocks.
 */
function AssignPlaylistForm({
  clockId,
  slot,
  onAssigned,
}: {
  clockId: number;
  slot: ClockSlot;
  onAssigned: () => void;
}) {
  const facets = useFacets();
  const [mode, setMode] = useState<'create' | 'existing'>('create');
  const [name, setName] = useState(`${slot.label_tamil || slot.label || clockSlotMeta(slot.slot_type).label} playlist`);
  const [existingPlaylists, setExistingPlaylists] = useState<Playlist[]>([]);
  const [existingId, setExistingId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.playlists().then((r) => setExistingPlaylists(r.results));
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      let playlistId: number;
      if (mode === 'create') {
        if (!name.trim()) {
          setError('பெயர் தேவை');
          setBusy(false);
          return;
        }
        const daypart = facets?.dayparts[0]?.code;
        if (!daypart) {
          setError('daypart தரவு இன்னும் ஏற்றப்படவில்லை');
          setBusy(false);
          return;
        }
        const created = await api.createPlaylist({ name: name.trim(), daypart, slot_type: 'music' });
        playlistId = created.id;
      } else {
        if (!existingId) {
          setError('பட்டியலைத் தேர்ந்தெடுக்கவும்');
          setBusy(false);
          return;
        }
        playlistId = existingId;
      }
      await api.updateSlot(clockId, slot.id, { playlist_id: playlistId, clear_playlist: false });
      onAssigned();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'தோல்வி');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--card-border)' }}>
      <div className="text-white/40 text-xs tamil mb-2">
        இந்த இடைவெளிக்கு இன்னும் பட்டியல் ஒதுக்கப்படவில்லை.
      </div>
      <div className="flex gap-1.5 mb-2">
        <button
          onClick={() => setMode('create')}
          className="tamil flex-1 rounded-lg border py-1 text-[11px]"
          style={{
            borderColor: mode === 'create' ? 'var(--gold)' : 'var(--card-border)',
            color: mode === 'create' ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
          }}
        >
          புதிய பட்டியல்
        </button>
        <button
          onClick={() => setMode('existing')}
          className="tamil flex-1 rounded-lg border py-1 text-[11px]"
          style={{
            borderColor: mode === 'existing' ? 'var(--gold)' : 'var(--card-border)',
            color: mode === 'existing' ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
          }}
        >
          உள்ள பட்டியலைப் பயன்படுத்து
        </button>
      </div>
      {mode === 'create' ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="பட்டியல் பெயர்..."
          className="tamil w-full rounded-lg border bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none"
          style={{ borderColor: 'var(--card-border)' }}
        />
      ) : (
        <select
          value={existingId}
          onChange={(e) => setExistingId(e.target.value ? Number(e.target.value) : '')}
          className="w-full rounded-lg border bg-black/30 px-2 py-1.5 text-xs text-white/80"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <option value="">— தேர்ந்தெடுக்கவும் —</option>
          {existingPlaylists.map((p) => (
            <option key={p.id} value={p.id} style={{ color: 'black' }}>
              {p.name} ({p.track_count})
            </option>
          ))}
        </select>
      )}
      {error && <div className="text-[11px] text-red-400 mt-2">{error}</div>}
      <button
        onClick={submit}
        disabled={busy}
        className="tamil w-full rounded-lg py-1.5 text-xs font-semibold mt-2 disabled:opacity-40"
        style={{ background: 'var(--gold)', color: '#1a0a2e' }}
      >
        {busy ? '···' : 'ஒதுக்கு'}
      </button>
    </div>
  );
}

/**
 * Clicking a "இன்றைய அட்டவணை" segment expands to this: the clock's real
 * minute-by-minute slots (clock_slots — read-only structure here, never
 * altered), and for whichever slot carries a playlist_id, the actual song list
 * for that segment — reusing ScheduleEditor's real PlaylistTracksEditor
 * (drag-reorder / remove / search-add / clear-all), so editing here genuinely
 * changes what pick_next() picks. This edits the PERSISTENT template for the
 * clock (affects this hour and every future occurrence it's scheduled for),
 * never a one-off — scopeNotice below says so explicitly in the UI.
 */
export default function SegmentPlaylistPanel({ clockId, onClose }: { clockId: number; onClose: () => void }) {
  const [clock, setClock] = useState<ScheduleClockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [playlistsById, setPlaylistsById] = useState<Record<number, Playlist>>({});
  const [openSlotId, setOpenSlotId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    Promise.all([api.clock(clockId), api.playlists()])
      .then(([c, pl]) => {
        setClock(c);
        setPlaylistsById(Object.fromEntries(pl.results.map((p) => [p.id, p])));
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [clockId]);

  if (loading || !clock) {
    return <div className="text-white/40 text-xs p-3">ஏற்றுகிறது...</div>;
  }

  return (
    <div
      className="rounded-lg border mt-2 p-3 flex flex-col gap-2.5"
      style={{ borderColor: 'var(--gold)', background: 'rgba(212,175,55,0.04)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="tamil text-sm font-bold" style={{ color: 'var(--gold)' }}>
            {clock.name_tamil || clock.name}
          </div>
          <div className="text-[10px] text-white/35">{clock.name}</div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white/70 text-xs shrink-0">
          ✕ மூடு
        </button>
      </div>

      {clock.slots.length === 0 ? (
        <div className="text-white/40 text-xs tamil">இந்த கடிகாரத்தில் இடைவெளிகள் இல்லை.</div>
      ) : (
        clock.slots.map((slot) => {
          const meta = clockSlotMeta(slot.slot_type);
          const playlist = slot.playlist_id ? playlistsById[slot.playlist_id] : null;
          const isOpen = openSlotId === slot.id;
          return (
            <div key={slot.id} className="rounded-lg border" style={{ borderColor: 'var(--card-border)' }}>
              <button
                onClick={() => setOpenSlotId(isOpen ? null : slot.id)}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
              >
                <span className="tabular-nums text-white/40 text-[10px] shrink-0 w-9">:{pad(slot.minute_offset)}</span>
                <span style={{ color: meta.color }}>{meta.icon}</span>
                <span className="tamil truncate text-xs text-white/85 flex-1">
                  {slot.label_tamil || slot.label || meta.label}
                </span>
                {slot.is_live ? (
                  <span className="tamil text-[10px] text-red-400 shrink-0">நேரடி மைக்</span>
                ) : playlist ? (
                  <span className="tamil text-[10px] text-white/40 shrink-0">
                    {playlist.name} ({playlist.track_count})
                  </span>
                ) : slot.track_id ? (
                  <span className="tamil text-[10px] text-white/40 shrink-0">ஒற்றைப் பாடல்</span>
                ) : (
                  <span className="tamil text-[10px] text-white/25 shrink-0">காலி</span>
                )}
                <span className="text-white/30 text-[10px] shrink-0">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="border-t px-2.5 py-2.5" style={{ borderColor: 'var(--card-border)' }}>
                  {slot.is_live ? (
                    <div className="text-[10px] text-white/35 tamil leading-relaxed">
                      இந்த இடைவெளி இயங்கும்போது cttr.live on தானாக அமைக்கப்படும் — பாடல் பட்டியல் இல்லை.
                    </div>
                  ) : slot.track_id ? (
                    <div className="text-[10px] text-white/35 tamil leading-relaxed">
                      இது ஒரு பட்டியல் அல்ல, ஒற்றைப் பாடல் இடைவெளி ({slot.track_title || slot.track_id}). மாற்ற
                      "மணி நேர கடிகாரம் &amp; காலண்டர்" பக்கத்தில் இந்த இடைவெளியைத் திருத்தவும்.
                    </div>
                  ) : playlist ? (
                    <PlaylistTracksEditor
                      playlist={playlist}
                      onBack={() => setOpenSlotId(null)}
                      scopeNotice="இந்த மாற்றம் இந்த இடைவெளியின் நிரந்தர பட்டியலைத் திருத்தும் — இன்று மட்டுமல்ல, இந்த கடிகாரம் பயன்படுத்தும் ஒவ்வொரு முறையும் இதுவே இயங்கும்."
                    />
                  ) : (
                    <AssignPlaylistForm clockId={clockId} slot={slot} onAssigned={load} />
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
