import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ScheduleEditor from './ScheduleEditor';
import QueuePanel from './QueuePanel';
import IzicastSetupPanel from './IzicastSetupPanel';
import ArchivedTracksPanel from './ArchivedTracksPanel';
import { TYPE_LABELS } from './schedule/InsertsPanel';
import { useStatus } from '../StatusContext';
import { api, ApiError } from '../api';
import { playSfx, type SfxKind } from '../lib/sfx';
import type { InsertType, ScheduleInsert } from '../types';

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

/** Locally-synthesized RJ cue buttons (Web Audio API — see lib/sfx.ts). Plays only
 * in this browser tab for the RJ's own timing reference; never touches Liquidsoap
 * or the live broadcast (no jingle/SFX audio library exists on the box to draw
 * real clips from, and there's no ad-hoc live-injection mechanism to push into —
 * see the build report). A brief flash on click is the only feedback needed since
 * playback is immediate and local. */
function SfxGrid({
  items,
}: {
  items: { label: string; icon: string; kind: SfxKind }[];
}) {
  const [active, setActive] = useState<SfxKind | null>(null);

  function trigger(kind: SfxKind) {
    playSfx(kind);
    setActive(kind);
    setTimeout(() => setActive((v) => (v === kind ? null : v)), 250);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => trigger(item.kind)}
          title="உலாவியில் மட்டும் இயங்கும் — நேரடி ஒலிபரப்பில் சேர்க்கப்படாது (RJ cue only, local to this browser; not broadcast)"
          className="tamil flex flex-col items-center gap-1 rounded-lg border py-2.5 text-[11px] text-white/70 transition-colors hover:text-white/95"
          style={{
            borderColor: active === item.kind ? 'var(--gold)' : 'var(--card-border)',
            background: active === item.kind ? 'rgba(212,175,55,0.15)' : 'transparent',
          }}
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
 * Sound Effects buttons synthesize their cue locally via Web Audio (lib/sfx.ts) —
 * the catalog has no curated applause/horn/bell/transition clips, so this is an
 * honest RJ-only timing cue rather than a broadcast injection (no mechanism exists
 * to push ad-hoc audio into the live mix outside the normal catalog/insert picker,
 * and building one is out of scope — see the build report). "Live Mic" below stays
 * a disabled placeholder for the same reason true browser-mic capture would need:
 * see the persistent 🎙️ நேரடி மைக் button in TopBar for the real (non-mic-capture)
 * live-priority mechanism that does exist.
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

      <Link
        to="/schedule"
        className="tamil mx-4 mt-3 flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-xs font-semibold"
        style={{ borderColor: 'var(--gold)', color: 'var(--gold)', background: 'rgba(212,175,55,0.08)' }}
      >
        🕐 மணி நேர கடிகாரம் &amp; காலண்டர்
        <span aria-hidden>→</span>
      </Link>

      <Section title="பட்டியல் விரைவு திருத்தி — Playlist Quick-Editor" defaultOpen>
        <ScheduleEditor compact />
      </Section>

      <Section title="விரைவு செருகல் — Quick Insert" defaultOpen>
        <QuickInsertGrid />
      </Section>

      <Section title="ஒலி விளைவுகள் — Sound Effects">
        <SfxGrid
          items={[
            { label: 'கைதட்டல்', icon: '👏', kind: 'applause' },
            { label: 'கொம்பு', icon: '📯', kind: 'horn' },
            { label: 'மணி', icon: '🔔', kind: 'bell' },
            { label: 'இடைநிலை', icon: '🔀', kind: 'transition' },
          ]}
        />
        <div className="text-[10px] text-white/30 mt-2 leading-relaxed">
          இந்த உலாவியில் மட்டும் ஒலிக்கும் (RJ-க்கான நேர குறிப்பு) — நேரடி ஒலிபரப்பில்
          சேர்க்கப்படாது. இந்த வகை ஒலி விளைவு கோப்புகள் சேவையகத்தில் இல்லை, எனவே Web Audio
          மூலம் இங்கேயே உருவாக்கப்படுகிறது.
        </div>
      </Section>

      <Section title="நேரடி மைக் — Live Mic" defaultOpen>
        <LiveMicConsoleToggle />
        <div className="text-[10px] text-white/30 mt-2 mb-3 leading-relaxed">
          இந்த உலாவி உங்கள் மைக்கை நேரடி ஒலிபரப்பில் சேர்க்காது — இது ஒரு switch (cttr.live):
          வெளிப்புற DJ மூலத்திற்கு (கீழே உள்ள iziCast அமைவு போன்றவை) முன்னுரிமை அளிக்கும்.
          மேலே TopBar-இல் உள்ள 🎙️ நேரடி மைக் பொத்தானும் இதே switch-ஐத்தான் கட்டுப்படுத்துகிறது.
        </div>
        <div className="text-[11px] font-semibold text-white/60 tamil mb-1.5">
          iziCast அமைவு (iPhone) — Live Broadcast Setup
        </div>
        <IzicastSetupPanel />
      </Section>

      <Section title="வரிசை — Queue">
        <QueuePanel compact />
      </Section>

      <Section title="காப்பகம் — Archived Tracks">
        <ArchivedTracksPanel />
      </Section>
    </div>
  );
}

/**
 * One-tap fire buttons for the configured jingle/station-ID/time-announcement
 * schedule_inserts rows, right on the home page — previously the RJ had to
 * navigate to /schedule -> "தானியங்கி செருகல்கள் — Auto-Insert" and find the
 * right row's own "▶ இப்போது இயக்கு" button just to fire a station ID between
 * songs. One button per insert_type, wired straight to the same
 * POST /api/schedule/inserts/{id}/fire-now (api.fireInsertNow) InsertsPanel's
 * per-row button already uses — this doesn't duplicate the fire mechanism,
 * just surfaces the first configured rule of each type here for speed.
 *
 * /schedule's Auto-Insert panel is kept as-is and still the only place to
 * create/delete a rule, change its interval, or enable/disable its recurring
 * auto-fire — this grid is purely the quick-fire action for whatever's
 * already configured, not a replacement for that management UI.
 */
function QuickInsertGrid() {
  const [inserts, setInserts] = useState<ScheduleInsert[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .inserts()
      .then((r) => {
        if (!cancelled) setInserts(r.results);
      })
      .catch(() => {
        if (!cancelled) setInserts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function fire(insert: ScheduleInsert) {
    setBusy(insert.id);
    setResult(null);
    try {
      const res = await api.fireInsertNow(insert.id);
      setResult(`✓ ${res.label}`);
    } catch (err) {
      setResult(`✗ ${err instanceof ApiError ? err.message : 'தோல்வி'}`);
    } finally {
      setBusy(null);
      setTimeout(() => setResult(null), 4000);
    }
  }

  if (inserts === null) {
    return <div className="text-[10px] text-white/30 tamil">ஏற்றுகிறது…</div>;
  }

  if (inserts.length === 0) {
    return (
      <div className="text-[10px] text-white/40 leading-relaxed tamil">
        இன்னும் விதிகள் இல்லை — "மணி நேர கடிகாரம் &amp; காலண்டர்" பக்கத்தில் "தானியங்கி
        செருகல்கள்" பகுதியில் உருவாக்கவும்.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(TYPE_LABELS) as InsertType[]).map((t) => {
          const insert = inserts.find((i) => i.insert_type === t);
          const meta = TYPE_LABELS[t];
          const isBusy = insert != null && busy === insert.id;
          return (
            <button
              key={t}
              onClick={() => insert && fire(insert)}
              disabled={!insert || busy !== null}
              title={
                insert
                  ? `${insert.label || meta.label} — இப்போதே இயக்கு (enabled ஐ மாற்றாது)`
                  : 'இந்த வகைக்கு விதி கட்டமைக்கப்படவில்லை — /schedule பக்கத்தில் சேர்க்கவும்'
              }
              className="tamil flex flex-col items-center gap-1 rounded-lg border py-2.5 text-[11px] transition-colors disabled:opacity-30"
              style={{
                borderColor: 'var(--card-border)',
                color: insert ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
              }}
            >
              <span className="text-base" aria-hidden>
                {isBusy ? '···' : meta.icon}
              </span>
              {meta.label}
            </button>
          );
        })}
      </div>
      {result && <div className="text-[11px] text-white/60 tamil break-words">{result}</div>}
      <Link to="/schedule" className="tamil text-[10px] text-white/30 hover:text-white/55">
        இடைவெளி / வரம்பு அமைப்பு → அட்டவணை பக்கம்
      </Link>
    </div>
  );
}

/** Compact live on/off toggle for the RightConsole panel — same /api/live
 * endpoint as TopBar's LiveMicButton, just a fuller labelled variant here. */
function LiveMicConsoleToggle() {
  const { status, refresh } = useStatus();
  const [busy, setBusy] = useState(false);
  const active = !!status?.live?.enabled;
  const connected = !!status?.live?.connected;

  async function toggle() {
    setBusy(true);
    try {
      await api.setLive(!active);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="tamil w-full rounded-xl border-2 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
      style={{
        borderColor: active ? '#ef4444' : 'var(--card-border)',
        background: active ? 'rgba(239,68,68,0.12)' : 'transparent',
        color: active ? '#f87171' : 'rgba(255,255,255,0.7)',
      }}
    >
      <span className="text-lg" aria-hidden>
        🎙️
      </span>
      {active ? (connected ? 'நேரடியில் — On Air' : 'ஆயத்தம் — Armed (no source yet)') : 'நேரடி மைக் — Off'}
    </button>
  );
}
