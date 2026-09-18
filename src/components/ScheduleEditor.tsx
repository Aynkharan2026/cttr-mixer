import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api';
import { useFacets } from '../FacetsContext';
import { SLOT_TYPES, slotTypeLabel } from '../slotTypes';
import type { Playlist, PlaylistTrack, Track } from '../types';

/**
 * Real schedule editor: CRUD against control_api.py's /api/schedule/playlists*,
 * which reads/writes the `playlists` / `playlist_tracks` tables the Liquidsoap-side
 * picker (pick_next) already consults for "today's scheduled playlist". Creating a
 * playlist here and adding tracks genuinely changes what goes to air for that
 * daypart — this is not a mockup.
 *
 * "Reserved slot type" (news / talk show / ads-jingles) is an organizational label
 * only (playlists.slot_type) — nothing server-side restricts which tracks can go
 * into a "news" playlist, since the catalog has no tagged news/jingle audio to
 * enforce that against. The operator just uses it to remember what a slot is for.
 */

function fmtDate(iso: string | null): string {
  if (!iso) return 'தினசரி இயல்பு'; // "daily default" — unscheduled = standing playlist for the daypart
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

export default function ScheduleEditor({ compact = false }: { compact?: boolean }) {
  const facets = useFacets();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Playlist | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    setLoading(true);
    api
      .playlists()
      .then((res) => setPlaylists(res.results))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(p: Playlist) {
    if (!confirm(`"${p.name}" நீக்கவா?`)) return;
    await api.deletePlaylist(p.id);
    if (selected?.id === p.id) setSelected(null);
    load();
  }

  if (selected) {
    return (
      <PlaylistTracksEditor
        playlist={selected}
        onBack={() => {
          setSelected(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="tamil text-sm font-bold" style={{ color: 'var(--gold)' }}>
          நேர அட்டவணை
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="tamil rounded-lg border px-2.5 py-1 text-xs text-white/70 hover:text-white/95"
          style={{ borderColor: 'var(--card-border)' }}
        >
          {showCreate ? 'ரத்து' : '+ புதிய பட்டியல்'}
        </button>
      </div>

      {showCreate && (
        <CreatePlaylistForm
          dayparts={facets?.dayparts ?? []}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {error && <div className="text-[11px] text-red-400 mb-2">{error}</div>}
      {loading ? (
        <div className="text-white/40 text-xs">ஏற்றுகிறது...</div>
      ) : playlists.length === 0 ? (
        <div className="text-white/40 text-xs">பட்டியல்கள் இல்லை. "+ புதிய பட்டியல்" ஐ அழுத்தவும்.</div>
      ) : (
        <div className={`flex flex-col gap-2 ${compact ? 'max-h-64 overflow-y-auto' : ''}`}>
          {playlists.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border px-3 py-2.5"
              style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <button className="min-w-0 flex-1 text-left" onClick={() => setSelected(p)}>
                  <div className="tamil truncate text-sm font-medium text-white/90">{p.name}</div>
                  <div className="text-[11px] text-white/40 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="tamil">{p.daypart_label_tamil || p.daypart_label}</span>
                    <span>·</span>
                    <span>{fmtDate(p.scheduled_at)}</span>
                    <span>·</span>
                    <span>{p.track_count} பாடல்</span>
                  </div>
                </button>
                <span
                  className="tamil shrink-0 rounded-full px-2 py-0.5 text-[10px]"
                  style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)' }}
                >
                  {slotTypeLabel(p.slot_type)}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setSelected(p)}
                  className="tamil rounded-lg border px-2.5 py-1 text-[11px] text-white/70"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  திருத்து
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="tamil rounded-lg border px-2.5 py-1 text-[11px] text-red-300/80 hover:text-red-300"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  நீக்கு
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePlaylistForm({
  dayparts,
  onCreated,
}: {
  dayparts: { code: string; label: string; label_tamil: string | null }[];
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [daypart, setDaypart] = useState(dayparts[0]?.code ?? '');
  const [slotType, setSlotType] = useState('music');
  const [scheduledAt, setScheduledAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!daypart && dayparts[0]) setDaypart(dayparts[0].code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayparts]);

  async function submit() {
    if (!name.trim() || !daypart) {
      setError('பெயர் மற்றும் நேரப் பகுதி தேவை');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.createPlaylist({
        name: name.trim(),
        daypart,
        slot_type: slotType,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      onCreated();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border p-3 mb-3" style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="பட்டியல் பெயர்..."
        className="tamil w-full rounded-lg border bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none mb-2"
        style={{ borderColor: 'var(--card-border)' }}
      />
      <div className="grid grid-cols-2 gap-2 mb-2">
        <select
          value={daypart}
          onChange={(e) => setDaypart(e.target.value)}
          className="tamil rounded-lg border bg-black/30 px-2 py-1.5 text-xs text-white/80"
          style={{ borderColor: 'var(--card-border)' }}
        >
          {dayparts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.label_tamil || d.label}
            </option>
          ))}
        </select>
        <select
          value={slotType}
          onChange={(e) => setSlotType(e.target.value)}
          className="tamil rounded-lg border bg-black/30 px-2 py-1.5 text-xs text-white/80"
          style={{ borderColor: 'var(--card-border)' }}
        >
          {SLOT_TYPES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.icon} {s.label}
            </option>
          ))}
        </select>
      </div>
      <input
        type="date"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        title="குறிப்பிட்ட தேதி (விடுவித்தால் தினசரி இயல்பு)"
        className="w-full rounded-lg border bg-black/30 px-2.5 py-1.5 text-xs text-white/70 outline-none mb-2"
        style={{ borderColor: 'var(--card-border)' }}
      />
      {error && <div className="text-[11px] text-red-400 mb-2">{error}</div>}
      <button
        onClick={submit}
        disabled={busy}
        className="tamil w-full rounded-lg py-1.5 text-xs font-semibold disabled:opacity-40"
        style={{ background: 'var(--gold)', color: '#1a0a2e' }}
      >
        {busy ? '···' : 'உருவாக்கு'}
      </button>
    </div>
  );
}

/**
 * Real playlist-contents editor: drag-to-reorder, remove, search-and-add, and a
 * double-confirmed "clear all" (the first half of "replace entire playlist" —
 * the second half is just using the existing search-add flow again afterwards,
 * since there's no bulk-add endpoint to build a separate path for). Exported so
 * schedule/TodayTimeline.tsx's segment-expansion view can embed the exact same
 * editor for a clock slot's playlist_id, not a re-implementation of it.
 */
export function PlaylistTracksEditor({
  playlist,
  onBack,
  scopeNotice,
}: {
  playlist: Playlist;
  onBack: () => void;
  /** Extra copy shown above the editor — e.g. clarifying that editing here
   * changes the persistent template for a clock slot (this + all future
   * occurrences), not a one-off, when embedded from TodayTimeline. */
  scopeNotice?: string;
}) {
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [clearArmed, setClearArmed] = useState(false);
  const [clearing, setClearing] = useState(false);

  function load() {
    setLoading(true);
    api
      .playlistTracks(playlist.id)
      .then((res) => setTracks(res.results))
      .finally(() => setLoading(false));
  }

  useEffect(load, [playlist.id]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const id = setTimeout(() => {
      api
        .search({ q, limit: 8 })
        .then((res) => setResults(res.results))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  async function addTrack(t: Track) {
    await api.addPlaylistTrack(playlist.id, t.id);
    setQ('');
    setResults([]);
    load();
  }

  async function removeTrack(id: string) {
    await api.removePlaylistTrack(playlist.id, id);
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }

  async function commitReorder(next: PlaylistTrack[]) {
    setTracks(next);
    try {
      await api.reorderPlaylistTracks(playlist.id, next.map((t) => t.id));
    } catch {
      load(); // revert to server truth on failure
    }
  }

  function onDrop(targetIndex: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null || from === targetIndex) return;
    const next = [...tracks];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    commitReorder(next);
  }

  async function clearAll() {
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }
    setClearing(true);
    try {
      await Promise.all(tracks.map((t) => api.removePlaylistTrack(playlist.id, t.id)));
      setTracks([]);
    } finally {
      setClearing(false);
      setClearArmed(false);
    }
  }

  return (
    <div>
      <button onClick={onBack} className="tamil text-xs text-white/50 hover:text-white/80 mb-2">
        ‹ பட்டியல்களுக்குத் திரும்பு
      </button>
      <div className="tamil text-sm font-bold mb-1" style={{ color: 'var(--gold)' }}>
        {playlist.name}
      </div>
      {scopeNotice && (
        <div
          className="tamil text-[11px] rounded-lg border px-2.5 py-2 mb-2.5 leading-relaxed"
          style={{ borderColor: 'var(--gold)', background: 'rgba(212,175,55,0.08)', color: 'rgba(255,255,255,0.8)' }}
        >
          {scopeNotice}
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] text-white/40">
          இழுத்து-விடுவதன் மூலம் மறுவரிசைப்படுத்தவும் (drag to reorder)
        </div>
        {tracks.length > 0 && (
          <button
            onClick={clearAll}
            disabled={clearing}
            className="tamil rounded-lg border px-2 py-1 text-[10px] shrink-0 disabled:opacity-40"
            style={{
              borderColor: clearArmed ? '#ef4444' : 'var(--card-border)',
              color: clearArmed ? '#f87171' : 'rgba(255,255,255,0.4)',
            }}
          >
            {clearing ? '···' : clearArmed ? 'உறுதியா? மீண்டும் — அனைத்தும் நீக்கப்படும்' : 'முழுவதும் மாற்று (காலி செய்)'}
          </button>
        )}
      </div>

      <div className="relative mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="பாடல் சேர்க்க தேடு..."
          className="tamil w-full rounded-lg border bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none"
          style={{ borderColor: 'var(--card-border)' }}
        />
        {q && (
          <div
            className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border"
            style={{ borderColor: 'var(--card-border)', background: 'var(--bg-mid)' }}
          >
            {searching ? (
              <div className="px-2.5 py-2 text-[11px] text-white/40">தேடுகிறது...</div>
            ) : results.length === 0 ? (
              <div className="px-2.5 py-2 text-[11px] text-white/40">முடிவுகள் இல்லை</div>
            ) : (
              results.map((t) => (
                <button
                  key={t.id}
                  onClick={() => addTrack(t)}
                  className="tamil block w-full truncate px-2.5 py-1.5 text-left text-[11px] text-white/80 hover:bg-white/5"
                >
                  {t.title_tamil || t.title || t.filename} — <span className="text-white/40">{t.artist}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-white/40 text-xs">ஏற்றுகிறது...</div>
      ) : tracks.length === 0 ? (
        <div className="text-white/40 text-xs">பாடல்கள் இல்லை. மேலே தேடி சேர்க்கவும்.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tracks.map((t, i) => (
            <div
              key={t.id}
              draggable
              onDragStart={() => {
                dragIndex.current = i;
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(i);
              }}
              onDrop={() => onDrop(i)}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 cursor-grab active:cursor-grabbing"
              style={{
                borderColor: dragOverIndex === i ? 'var(--gold)' : 'var(--card-border)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <span className="text-white/25 text-xs shrink-0" aria-hidden>
                ⠿
              </span>
              <span className="tamil truncate flex-1 text-xs text-white/85">{t.title_tamil || t.title}</span>
              <button onClick={() => removeTrack(t.id)} className="text-red-300/70 hover:text-red-300 text-xs shrink-0" title="நீக்கு">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
