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
 *
 * 2026-09: this button was already wired up correctly (previous commit bfdfbae)
 * and DOES render in the deployed bundle — confirmed live via Playwright, it's
 * genuinely present in the DOM and clickable. The station owner not noticing it
 * was a real design bug, not a deploy/regression bug: at 11px text on a
 * near-transparent grey pill, tucked between the listener count and the console
 * toggle, it read as ambient chrome rather than "the mic button" — and on
 * mobile it collapsed to a single unlabeled icon glyph. Rebuilt bigger, always
 * red (a station's on-air light reads as "the live control" whether lit or not,
 * not just when active), with a visible Tamil+English label at every viewport
 * width instead of icon-only on mobile.
 */
function LiveMicButton() {
  const { status, refresh } = useStatus();
  const [busy, setBusy] = useState(false);
  const active = !!status?.live?.enabled;
  const connected = !!status?.live?.connected;
  const sinceRef = useRef<number | null>(null);
  const [, tick] = useState(0);
  // Synchronous re-entrancy lock. `busy` (React state) is not enough on its
  // own: setBusy(true) only takes effect -- and disables the button in the
  // DOM -- on the next render/commit, which is at least one frame away. A
  // fast double-click/double-tap can dispatch both click events before that
  // commit happens, so both calls read the same stale `active` from the
  // closure and both fire the same /api/live POST -- confirmed as the actual
  // cause of the reported double-fire, not a hypothetical. A ref updates
  // immediately, synchronously, inside the very first handler invocation, so
  // the second (near-simultaneous) invocation sees it and bails before
  // calling the API at all.
  const busyRef = useRef(false);

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
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await api.setLive(!active);
      await refresh();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const elapsed = active && sinceRef.current ? formatElapsed(Date.now() - sinceRef.current) : null;
  const onAir = active && connected;

  return (
    <button
      onClick={toggle}
      disabled={busy}
      data-testid="topbar-live-mic-button"
      title={
        active
          ? 'நிறுத்த சொடுக்கவும் — திட்டமிடப்பட்ட நிகழ்ச்சிக்குத் திரும்பும் (cttr.live off)'
          : 'வெளிப்புற நேரடி மூலத்திற்கு (DJ encoder/phone app) முன்னுரிமை அளிக்கும் — இது இந்த உலாவியின் மைக்கைப் பிடிக்காது; ஒரு வெளிப்புற மூலம் இணைந்திருந்தால் மட்டுமே உடனடியாக நேரடியாகும் (cttr.live on)'
      }
      className="tamil flex items-center gap-2 rounded-full px-3 py-2 text-xs sm:text-sm font-bold shrink-0 disabled:opacity-50 shadow-lg transition-transform active:scale-95"
      style={{
        background: onAir ? '#ef4444' : active ? '#b91c1c' : 'rgba(220,38,38,0.9)',
        color: '#fff',
        border: `1.5px solid ${onAir ? '#fca5a5' : 'rgba(255,255,255,0.4)'}`,
        boxShadow: onAir ? '0 0 0 3px rgba(239,68,68,0.25)' : undefined,
      }}
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${onAir ? 'animate-pulse' : ''}`}
        style={{ background: active ? '#fff' : 'rgba(255,255,255,0.55)' }}
        aria-hidden
      />
      <span className="text-base leading-none" aria-hidden>
        🎙️
      </span>
      <span className="hidden min-[420px]:inline">நேரடி மைக்</span>
      {elapsed && <span className="tabular-nums font-normal opacity-90">{elapsed}</span>}
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
