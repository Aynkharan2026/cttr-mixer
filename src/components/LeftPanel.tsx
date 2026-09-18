import { NavLink } from 'react-router-dom';
import { clearToken } from '../api';

const NAV = [
  { to: '/', label: 'முகப்பு', icon: '🏠', end: true },
  { to: '/movies', label: 'திரைப்படம்', icon: '🎬' },
  { to: '/singers', label: 'பாடகர்', icon: '🎤' },
  { to: '/music-directors', label: 'இசையமைப்பாளர்', icon: '🎼' },
  { to: '/songwriters', label: 'பாடலாசிரியர்', icon: '✍️' },
  { to: '/moods', label: 'உணர்வு', icon: '💫' },
  { to: '/dayparts', label: 'நேரம்', icon: '🕐' },
  { to: '/content-types', label: 'வகை', icon: '🏷️' },
  { to: '/years', label: 'ஆண்டு', icon: '📅' },
  { to: '/search', label: 'பாடல் தேடல்', icon: '🔍' },
  { to: '/broadcast-log', label: 'ஒலிபரப்பு பதிவு', icon: '📋' },
];

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            `tamil flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
              isActive ? 'font-semibold' : 'text-white/60 hover:text-white/90 hover:bg-white/5'
            } ${collapsed ? 'justify-center px-0' : ''}`
          }
          style={({ isActive }) => (isActive ? { background: 'rgba(212,175,55,0.12)', color: 'var(--gold)' } : {})}
        >
          <span aria-hidden>{item.icon}</span>
          {!collapsed && <span className="truncate">{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export default function LeftPanel({ collapsed, mobileOpen, onCloseMobile }: Props) {
  return (
    <>
      {/* Desktop: collapsible fixed sidebar */}
      <aside
        className={`hidden md:flex md:flex-col fixed left-0 top-[52px] bottom-[60px] z-20 border-r py-4 transition-all duration-200 ${
          collapsed ? 'md:w-16 md:px-2' : 'md:w-56 md:px-3'
        }`}
        style={{ borderColor: 'var(--card-border)', background: 'rgba(13,5,24,0.85)' }}
      >
        <div className="flex-1 overflow-y-auto">
          <NavList collapsed={collapsed} />
        </div>
        <button
          onClick={() => {
            clearToken();
            window.location.reload();
          }}
          title="குறியீட்டை மறு-உள்ளிடு"
          className={`tamil mt-3 rounded-lg px-3 py-2 text-left text-xs text-white/30 hover:text-white/60 ${collapsed ? 'text-center px-0' : ''}`}
        >
          {collapsed ? '⎋' : 'குறியீட்டை மறு-உள்ளிடு'}
        </button>
      </aside>

      {/* Mobile: dropdown/drawer from the hamburger */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} />
          <div
            className="relative w-64 max-w-[80vw] h-full border-r p-4 overflow-y-auto"
            style={{ borderColor: 'var(--card-border)', background: 'var(--bg-mid)' }}
          >
            <div className="tamil text-sm font-bold mb-4" style={{ color: 'var(--gold)' }}>
              CTTR மிக்சர்
            </div>
            <NavList collapsed={false} onNavigate={onCloseMobile} />
            <button
              onClick={() => {
                clearToken();
                window.location.reload();
              }}
              className="tamil mt-4 rounded-lg px-3 py-2 text-left text-xs text-white/30 hover:text-white/60"
            >
              குறியீட்டை மறு-உள்ளிடு
            </button>
          </div>
        </div>
      )}
    </>
  );
}
