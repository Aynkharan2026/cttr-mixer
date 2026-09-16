import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useStatus } from '../StatusContext';
import { api } from '../api';
import { clearToken } from '../api';
import AudioPlayer from './AudioPlayer';

const NAV = [
  { to: '/', label: 'தற்போது ஒலிபரப்பு', end: true },
  { to: '/search', label: 'பாடல் தேடல்' },
  { to: '/movies', label: 'திரைப்படம்' },
  { to: '/singers', label: 'பாடகர்' },
  { to: '/music-directors', label: 'இசையமைப்பாளர்' },
  { to: '/songwriters', label: 'பாடலாசிரியர்' },
  { to: '/moods', label: 'உணர்வு' },
  { to: '/dayparts', label: 'நேரம்' },
  { to: '/content-types', label: 'வகை' },
  { to: '/years', label: 'ஆண்டு' },
  { to: '/queue', label: 'வரிசை' },
  { to: '/schedule', label: 'நேர அட்டவணை' },
];

function pillClass(active: boolean) {
  return `tamil whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition ${
    active ? 'font-semibold' : 'text-white/60 hover:text-white/90'
  }`;
}

function TransportControls() {
  const { status, refresh } = useStatus();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(name: string, fn: () => Promise<unknown>) {
    setBusy(name);
    try {
      await fn();
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  const paused = status?.paused;
  const live = status?.live?.enabled;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => run('pause', () => (paused ? api.resume() : api.pause()))}
        disabled={busy !== null}
        title={paused ? 'தொடர் (Resume)' : 'நிறுத்து (Pause)'}
        className="tamil rounded-lg border px-2.5 py-1.5 text-xs font-medium text-white/80 disabled:opacity-40"
        style={{ borderColor: 'var(--card-border)' }}
      >
        {paused ? '▶ தொடர்' : '⏸ நிறுத்து'}
      </button>
      <button
        onClick={() => run('skip', () => api.skip())}
        disabled={busy !== null}
        title="அடுத்த பாடல் (Skip)"
        className="tamil rounded-lg border px-2.5 py-1.5 text-xs font-medium text-white/80 disabled:opacity-40"
        style={{ borderColor: 'var(--card-border)' }}
      >
        ⏭ அடுத்தது
      </button>
      <button
        onClick={() => run('live', () => api.setLive(!live))}
        disabled={busy !== null}
        title="நேரடி ஒலிபரப்பு (Live mode)"
        className="tamil rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"
        style={{
          background: live ? 'var(--gold)' : 'transparent',
          color: live ? '#1a0a2e' : 'rgba(255,255,255,0.7)',
          border: `1px solid ${live ? 'var(--gold)' : 'var(--card-border)'}`,
        }}
      >
        ● நேரடி
      </button>
    </div>
  );
}

export default function Layout() {
  const { status } = useStatus();
  const listeners = status?.listeners?.total ?? null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar (md+) */}
      <aside
        className="hidden md:flex md:w-56 md:flex-col md:border-r md:px-3 md:py-5 md:shrink-0"
        style={{ borderColor: 'var(--card-border)' }}
      >
        <div className="px-2 mb-6">
          <div className="tamil text-base font-bold" style={{ color: 'var(--gold)' }}>
            CTTR மிக்சர்
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">Canada Trenton Tamil Radio</div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `tamil rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'font-semibold' : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => (isActive ? { background: 'rgba(212,175,55,0.12)', color: 'var(--gold)' } : {})}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => {
            clearToken();
            window.location.reload();
          }}
          className="tamil mt-auto rounded-lg px-3 py-2 text-left text-xs text-white/30 hover:text-white/60"
        >
          குறியீட்டை மறு-உள்ளிடு
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="sticky top-0 z-20 border-b px-3 py-2.5 backdrop-blur-md"
          style={{ borderColor: 'var(--card-border)', background: 'rgba(13,5,24,0.85)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="md:hidden tamil text-sm font-bold" style={{ color: 'var(--gold)' }}>
              CTTR
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: status?.liquidsoap_online ? '#4ade80' : '#f87171' }}
              />
              <span className="tamil">கேட்போர்</span>
              <span className="font-semibold text-white/80">{listeners ?? '—'}</span>
            </div>
            <TransportControls />
          </div>
        </header>

        {/* Mobile nav strip */}
        <nav
          className="md:hidden flex gap-1 overflow-x-auto border-b px-3 py-2"
          style={{ borderColor: 'var(--card-border)' }}
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => pillClass(isActive)}
              style={({ isActive }) => (isActive ? { background: 'rgba(212,175,55,0.14)', color: 'var(--gold)' } : {})}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-3 py-4 md:px-6 md:py-6 max-w-4xl w-full mx-auto md:mx-0">
          <Outlet />
        </main>

        <AudioPlayer />
      </div>
    </div>
  );
}
