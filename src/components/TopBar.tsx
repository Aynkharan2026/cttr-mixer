import { useEffect, useRef, useState } from 'react';
import { useStatus } from '../StatusContext';
import { useDaypartLabel } from '../FacetsContext';
import { api } from '../api';
import LiveClock from './LiveClock';

interface Props {
  onToggleMobileNav: () => void;
  onToggleConsole: () => void;
  onToggleSidebarCollapse: () => void;
  sidebarCollapsed: boolean;
}

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 🎙️ நேரடி மைக் — persistent TopBar priority-switch. Precisely what this does,
 * because it's easy to misread: clicking it calls the SAME /api/live endpoint
 * (cttr.live on/off telnet) as AudioPlayer's existing "நேரடி ஒலிபரப்பு" button and
 * the scheduler's own is_live clock-slot gate (control_api.py's _tick_live_gate).
 * It does NOT capture this browser's microphone and does NOT itself put any audio
 * on air — cttr.liq's live_gate only wins Liquidsoap's outer fallback over
 * scheduled programming once BOTH live_enabled() is true AND an external Icecast
 * source (a DJ app/encoder connecting to the harbor on the LIVE_HARBOR_PORT /live
 * mount) is actually connected (see /api/status: on_air is only "live" when
 * live.enabled && live.connected). So: one click arms "prefer an external live
 * source over the schedule the moment one connects"; it only takes over
 * immediately, audibly, if an encoder is already connected when you click. No
 * browser-mic-to-broadcast bridge exists (would need MediaRecorder/WebRTC -> a
 * relay -> Liquidsoap harbor, which is real Liquidsoap/infra work, out of scope
 * here). Timer resets every time the gate transitions off->on, from whichever
 * side toggled it (this button, the AudioPlayer button, or the scheduler's
 * clock-driven gate), since status.live.enabled is the one shared source of truth.
 */
function LiveMicButton() {
  const { status, refresh } = useStatus();
  const [busy, setBusy] = useState(false);
  const active = !!status?.live?.enabled;
  const sinceRef = useRef<number | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    if (active && sinceRef.current === null) sinceRef.current = Date.now();
    if (!active) sinceRef.current = null;
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => tick((v) => v + 1), 1000);
    return () => clearInterval(iv);
  }, [active]);

  async function toggle() {
    setBusy(true);
    try {
      await api.setLive(!active);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const elapsed = active && sinceRef.current ? formatElapsed(Date.now() - sinceRef.current) : null;

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={
        active
          ? 'நிறுத்த சொடுக்கவும் — திட்டமிடப்பட்ட நிகழ்ச்சிக்குத் திரும்பும் (cttr.live off)'
          : 'வெளிப்புற நேரடி மூலத்திற்கு (DJ encoder/phone app) முன்னுரிமை அளிக்கும் — இது இந்த உலாவியின் மைக்கைப் பிடிக்காது; ஒரு வெளிப்புற மூலம் இணைந்திருந்தால் மட்டுமே உடனடியாக நேரடியாகும் (cttr.live on)'
      }
      className="tamil flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0 disabled:opacity-50"
      style={{
        background: active ? '#dc2626' : 'rgba(255,255,255,0.06)',
        color: active ? '#fff' : 'rgba(255,255,255,0.65)',
        border: `1px solid ${active ? '#dc2626' : 'var(--card-border)'}`,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: active ? '#fff' : 'rgba(255,255,255,0.3)' }}
      />
      <span className="hidden sm:inline">🎙️ நேரடி மைக்</span>
      <span className="sm:hidden">🎙️</span>
      {elapsed && <span className="tabular-nums">{elapsed}</span>}
    </button>
  );
}

export default function TopBar({ onToggleMobileNav, onToggleConsole, onToggleSidebarCollapse, sidebarCollapsed }: Props) {
  const { status } = useStatus();
  const daypartLabel = useDaypartLabel();
  const listeners = status?.listeners?.total ?? null;
  const daypart = status?.daypart;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 border-b px-3 py-2.5 backdrop-blur-md"
      style={{ borderColor: 'var(--card-border)', background: 'rgba(13,5,24,0.9)' }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onToggleMobileNav}
        className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border text-white/70"
        style={{ borderColor: 'var(--card-border)' }}
        aria-label="மெனு"
        title="மெனு"
      >
        <span className="block w-4 space-y-1">
          <span className="block h-[1.5px] bg-current" />
          <span className="block h-[1.5px] bg-current" />
          <span className="block h-[1.5px] bg-current" />
        </span>
      </button>

      {/* Desktop sidebar collapse toggle */}
      <button
        onClick={onToggleSidebarCollapse}
        className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border text-white/60 hover:text-white/90"
        style={{ borderColor: 'var(--card-border)' }}
        title={sidebarCollapsed ? 'பட்டியை விரிவாக்கு' : 'பட்டியை சுருக்கு'}
      >
        {sidebarCollapsed ? '»' : '«'}
      </button>

      <div className="tamil text-sm md:text-base font-bold shrink-0" style={{ color: 'var(--gold)' }}>
        CTTR மிக்சர்
      </div>

      <div className="hidden sm:block text-[11px] text-white/35 shrink-0">Canada Trenton Tamil Radio</div>

      <div className="ml-auto flex items-center gap-3 md:gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-white/60">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: status?.liquidsoap_online ? '#4ade80' : '#f87171' }}
          />
          <span className="tamil hidden sm:inline">கேட்போர்</span>
          <span className="font-semibold text-white/85">{listeners ?? '—'}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-white/60">
          <span className="tamil">நேரப் பகுதி</span>
          <span className="tamil font-semibold" style={{ color: 'var(--gold)' }}>
            {daypart ? daypartLabel(daypart) : '—'}
          </span>
        </div>

        <LiveClock className="font-semibold text-white/75 text-[11px] md:text-xs" />

        <LiveMicButton />

        {/* Mobile: open right console */}
        <button
          onClick={onToggleConsole}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border text-white/70"
          style={{ borderColor: 'var(--card-border)' }}
          aria-label="கட்டுப்பாட்டு பலகை"
          title="கட்டுப்பாட்டு பலகை"
        >
          🎚
        </button>
      </div>
    </header>
  );
}
