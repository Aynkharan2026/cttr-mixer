import { useEffect, useState } from 'react';
import { api } from '../api';
import { useFacets } from '../FacetsContext';
import { slotTypeLabel } from '../slotTypes';
import type { Playlist } from '../types';

function hourLabel(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${period}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return 'தினசரி இயல்பு';
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Full-page read view of the same real playlists (playlists / playlist_tracks
 * tables) the right console's Schedule Editor writes to. Editing (create, add
 * tracks, drag-reorder, delete) lives in the right console so it's always one tap
 * away no matter which page you're browsing — this page is the bigger-picture
 * calendar view of what's been built so far.
 */
export default function Schedule() {
  const facets = useFacets();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .playlists()
      .then((res) => setPlaylists(res.results))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="tamil text-lg font-bold mb-1" style={{ color: 'var(--gold)' }}>
        நேர அட்டவணை
      </h1>
      <div className="text-xs text-white/40 mb-4">
        புதிய பட்டியல் உருவாக்க / பாடல்கள் சேர்க்க வலது கட்டுப்பாட்டு பலகையைப் பயன்படுத்தவும் (🎚).
      </div>

      {!facets ? (
        <div className="text-white/40 text-sm">ஏற்றுகிறது...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {facets.dayparts.map((d) => {
            const forDaypart = playlists.filter((p) => p.daypart === d.code);
            return (
              <div key={d.code}>
                <div className="flex items-center justify-between rounded-xl border px-4 py-3.5" style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <div className="tamil text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                      {d.label_tamil || d.label}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">{d.label}</div>
                  </div>
                  <div className="text-sm text-white/70 tabular-nums">
                    {hourLabel(d.start_hour)} – {hourLabel(d.end_hour)}
                  </div>
                </div>
                {!loading && forDaypart.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2 pl-2">
                    {forDaypart.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--card-border)' }}>
                        <div className="min-w-0 flex-1">
                          <span className="tamil text-white/85">{p.name}</span>
                          <span className="text-white/35 ml-2">{fmtDate(p.scheduled_at)} · {p.track_count} பாடல்</span>
                        </div>
                        <span className="tamil shrink-0 ml-2 rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)' }}>
                          {slotTypeLabel(p.slot_type)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
