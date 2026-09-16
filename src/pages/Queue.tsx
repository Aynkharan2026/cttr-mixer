import { useStatus } from '../StatusContext';

export default function Queue() {
  const { status } = useStatus();
  const queue = status?.queue ?? [];

  return (
    <div>
      <h1 className="tamil text-lg font-bold mb-1" style={{ color: 'var(--gold)' }}>
        வரிசை
      </h1>
      <div className="text-xs text-white/40 mb-4">
        Any page's "வரிசை" (queue) button adds a track here. The control API only supports adding to the
        queue and skipping to advance — there is no reorder or remove endpoint yet, so this list is
        read-only until that's added server-side.
      </div>
      {queue.length === 0 ? (
        <div className="text-white/40 text-sm">வரிசை காலியாக உள்ளது</div>
      ) : (
        <div className="flex flex-col gap-2">
          {queue.map((t, i) => (
            <div
              key={`${t.id}-${i}`}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
              style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div
                className="tamil flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)' }}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="tamil truncate text-sm font-medium text-white/95">
                  {t.title_tamil || t.title || 'Untitled'}
                </div>
                <div className="truncate text-xs text-white/50">
                  {[t.artist, t.movie_name].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
