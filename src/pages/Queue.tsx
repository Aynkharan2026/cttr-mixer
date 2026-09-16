import QueuePanel from '../components/QueuePanel';

export default function Queue() {
  return (
    <div>
      <h1 className="tamil text-lg font-bold mb-1" style={{ color: 'var(--gold)' }}>
        வரிசை
      </h1>
      <div className="text-xs text-white/40 mb-4">
        Any page's "வரிசை" (queue) button adds a track here. The control API only supports adding to the
        queue and skipping to advance — there is no reorder or remove endpoint yet, so this list is
        read-only until that's added server-side. This same list is also always reachable from the right
        console (🎚).
      </div>
      <QueuePanel />
    </div>
  );
}
