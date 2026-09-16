import { useStatus } from '../StatusContext';
import { useDaypartLabel } from '../FacetsContext';
import LiveClock from './LiveClock';

interface Props {
  onToggleMobileNav: () => void;
  onToggleConsole: () => void;
  onToggleSidebarCollapse: () => void;
  sidebarCollapsed: boolean;
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
