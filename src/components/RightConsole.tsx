import { useState, type ReactNode } from 'react';
import ScheduleEditor from './ScheduleEditor';
import QueuePanel from './QueuePanel';

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function Section({ title, defaultOpen, children }: SectionProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: 'var(--card-border)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="tamil flex w-full items-center justify-between px-4 py-3 text-xs font-semibold text-white/70 hover:text-white/95"
      >
        {title}
        <span className="text-white/35">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function PlaceholderGrid({
  items,
}: {
  items: { label: string; icon: string }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <button
          key={item.label}
          disabled
          title="இணைக்கப்படவில்லை — ஒலி நூலகம் சேவையகத்தில் இல்லை (not wired: no audio library on the server yet)"
          className="tamil flex flex-col items-center gap-1 rounded-lg border py-2.5 text-[11px] text-white/30 cursor-not-allowed opacity-50"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <span className="text-base" aria-hidden>
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Fixed right console. Schedule Editor and Queue are real (wired to control_api.py).
 * Quick-insert and special-effects buttons are disabled placeholders: the catalog
 * has no curated jingle/station-ID/time-announcement/SFX audio, and there is no
 * telnet command in cttr.liq to inject an ad-hoc clip outside the normal picker —
 * building "working" buttons here would mean either faking playback or queuing a
 * random Tamil song mislabeled as a jingle, which we're not doing. See the build
 * report for what it would take to make these real.
 */
export default function RightConsole() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div className="tamil text-sm font-bold" style={{ color: 'var(--gold)' }}>
          கட்டுப்பாட்டு பலகை
        </div>
        <div className="text-[10px] text-white/35 mt-0.5">Console</div>
      </div>

      <Section title="நேர அட்டவணை — Schedule Editor" defaultOpen>
        <ScheduleEditor compact />
      </Section>

      <Section title="விரைவு செருகல் — Quick Insert">
        <PlaceholderGrid
          items={[
            { label: 'ஜிங்கிள்', icon: '🎶' },
            { label: 'நிலைய அடையாளம்', icon: '🆔' },
            { label: 'நேர அறிவிப்பு', icon: '🕐' },
          ]}
        />
        <div className="text-[10px] text-white/30 mt-2 leading-relaxed">
          இணைக்கப்படவில்லை: இந்த ஒலிக் கோப்புகள் தரவுத்தளத்தில் இல்லை.
        </div>
      </Section>

      <Section title="ஒலி விளைவுகள் — Sound Effects">
        <PlaceholderGrid
          items={[
            { label: 'கைதட்டல்', icon: '👏' },
            { label: 'கொம்பு', icon: '📯' },
            { label: 'மணி', icon: '🔔' },
            { label: 'இடைநிலை', icon: '🔀' },
          ]}
        />
        <div className="text-[10px] text-white/30 mt-2 leading-relaxed">
          இணைக்கப்படவில்லை: ஒலி விளைவு நூலகம் இன்னும் கட்டப்படவில்லை.
        </div>
      </Section>

      <Section title="நேரடி மைக் — Live Mic">
        <button
          disabled
          title="இணைக்கப்படவில்லை — நேரடி மைக் உள்ளீடு Liquidsoap இல் அமைக்கப்படவில்லை (needs real audio-input plumbing into Liquidsoap; out of scope for this build)"
          className="tamil w-full rounded-xl border-2 py-4 text-sm font-bold text-white/30 cursor-not-allowed opacity-50 flex flex-col items-center gap-1"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <span className="text-xl" aria-hidden>
            🎙️
          </span>
          நேரடி மைக்
        </button>
        <div className="text-[10px] text-white/30 mt-2 leading-relaxed">
          இது "நேரடி ஒலிபரப்பு" (relay) பொத்தானிலிருந்து வேறுபட்டது — உண்மையான மைக் உள்ளீட்டுக்கு
          Liquidsoap-இல் ஹார்ட்வேர் ஆடியோ இன்புட் அமைவு தேவை.
        </div>
      </Section>

      <Section title="வரிசை — Queue">
        <QueuePanel compact />
      </Section>
    </div>
  );
}
