import { useStatus } from '../StatusContext';

/**
 * Honest stand-in for a "VU meter": Icecast exposes no sample-level audio level for
 * the source, only whether an encoder is connected and its configured bitrate
 * (control_api.py's stream_health(), from status-json.xsl). So this renders a
 * deterministic segment count driven by real connection state — full bars when the
 * source is connected and on air, dimmed when paused, dark when disconnected — never
 * a randomly-animated needle pretending to read actual audio levels.
 */
export default function StreamMeter() {
  const { status } = useStatus();
  const stream = status?.stream;
  const connected = stream?.connected ?? false;
  const paused = status?.paused ?? false;
  const active = connected && !paused;

  const segments = 5;
  const lit = active ? segments : connected ? 2 : 0;

  return (
    <div className="flex items-center gap-2" title={
      connected
        ? `ஒலிபரப்பு இணைக்கப்பட்டுள்ளது · ${stream?.bitrate_kbps ?? '—'}kbps (encoder connection + bitrate — not a live audio level meter)`
        : 'ஒலிபரப்பு இணைக்கப்படவில்லை'
    }>
      <div className="flex items-end gap-[2px] h-4">
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-sm transition-colors"
            style={{
              height: `${((i + 1) / segments) * 100}%`,
              background: i < lit ? (i >= segments - 1 ? '#f87171' : 'var(--gold)') : 'rgba(255,255,255,0.12)',
            }}
          />
        ))}
      </div>
      <span
        className="hidden sm:inline text-[10px] tabular-nums"
        style={{ color: connected ? 'rgba(255,255,255,0.5)' : '#f87171' }}
      >
        {connected ? `${stream?.bitrate_kbps ?? '—'}kbps` : 'OFFLINE'}
      </span>
    </div>
  );
}
