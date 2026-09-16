import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TopBar from './TopBar';
import LeftPanel from './LeftPanel';
import RightConsole from './RightConsole';
import NowPlayingCard from './NowPlayingCard';
import AudioPlayer from './AudioPlayer';

const TOP_H = 52; // px, matches TopBar's padding
const BOTTOM_H = 60; // px, matches AudioPlayer's padding

/**
 * The fixed 3-panel radio console shell: TopBar / LeftPanel (nav) / center
 * (persistent Now Playing card + routed page) / RightConsole (schedule, queue,
 * placeholders) / bottom mini-mixer. Desktop keeps left+right panels fixed at all
 * times; mobile collapses the left panel to a hamburger drawer and the right
 * console to a right-edge slide-in, with the bottom bar always pinned.
 */
export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [locked, setLocked] = useState(false);

  // Close mobile overlays on viewport growth so they don't get stuck open behind
  // the desktop fixed layout.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setMobileNavOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const sidebarW = sidebarCollapsed ? 64 : 224;
  const consoleW = 320;

  // The hour-clock + calendar editor (/schedule) needs real width — a 60-minute
  // timeline and a 7x24 calendar grid don't fit the 720px column every other
  // page uses. Widen just that route rather than the whole shell.
  const location = useLocation();
  const isSchedulePage = location.pathname.startsWith('/schedule');
  const contentMaxWidth = isSchedulePage ? 1400 : 720;

  return (
    <div className="min-h-screen" data-cttr-layout="three-panel-console-v1" style={{ paddingTop: TOP_H, paddingBottom: BOTTOM_H }}>
      <TopBar
        onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
        onToggleConsole={() => setConsoleOpen((v) => !v)}
        onToggleSidebarCollapse={() => setSidebarCollapsed((v) => !v)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <LeftPanel collapsed={sidebarCollapsed} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      {/* Center panel */}
      <main className="cttr-main min-h-[calc(100vh-112px)] px-3 py-4 md:px-6 md:py-6 transition-all duration-200">
        <div className="mx-auto transition-all duration-200" style={{ maxWidth: contentMaxWidth }}>
          {!isSchedulePage && <NowPlayingCard />}
          <Outlet />
        </div>
      </main>

      {/* Desktop left margin spacer + right console column reserve, via media-query-driven wrapper */}
      <style>{`
        @media (min-width: 768px) {
          .cttr-main { margin-left: ${sidebarW}px; }
        }
        @media (min-width: 1024px) {
          .cttr-main { margin-right: ${consoleW}px; }
        }
      `}</style>

      {/* Right console: fixed column on lg+, slide-in drawer below that */}
      <aside
        className="hidden lg:flex lg:flex-col fixed right-0 top-[52px] bottom-[60px] z-20 border-l"
        style={{ width: consoleW, borderColor: 'var(--card-border)', background: 'rgba(13,5,24,0.85)' }}
      >
        <RightConsole />
      </aside>

      <div
        className={`lg:hidden fixed inset-y-0 right-0 z-30 border-l transition-transform duration-200 ${
          consoleOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: 'min(88vw, 360px)', borderColor: 'var(--card-border)', background: 'var(--bg-mid)', paddingTop: TOP_H, paddingBottom: BOTTOM_H }}
      >
        <RightConsole />
      </div>
      {consoleOpen && <div className="lg:hidden fixed inset-0 z-20 bg-black/60" onClick={() => setConsoleOpen(false)} />}

      <AudioPlayer locked={locked} onToggleLock={() => setLocked((v) => !v)} />

      {/* Layout lock: absorbs taps everywhere except the bottom bar (z-40, above this) */}
      {locked && (
        <div
          className="fixed z-[35] flex items-start justify-center pt-24"
          style={{ top: TOP_H, bottom: BOTTOM_H, left: 0, right: 0, background: 'rgba(13,5,24,0.55)' }}
        >
          <div
            className="tamil rounded-xl border px-4 py-2.5 text-xs text-white/70"
            style={{ borderColor: 'var(--gold)', background: 'rgba(13,5,24,0.9)' }}
          >
            🔒 பூட்டப்பட்டுள்ளது — திறக்க கீழே உள்ள பூட்டு பொத்தானை அழுத்தவும்
          </div>
        </div>
      )}
    </div>
  );
}
