import { useState } from 'react';
import { api, ApiError } from '../../api';
import type { InsertType, ScheduleInsert } from '../../types';

const TYPE_LABELS: Record<InsertType, { label: string; icon: string }> = {
  station_id: { label: 'நிலைய அடையாளம்', icon: '🆔' },
  time_announce: { label: 'நேர அறிவிப்பு', icon: '⏰' },
  jingle: { label: 'ஜிங்கிள்', icon: '🔔' },
};

interface Props {
  inserts: ScheduleInsert[];
  ttsAvailable: boolean;
  onChange: () => void;
}

/**
 * Auto-insert config: independent, individually enable/disable-able interval
 * rules (station ID every 15 min AND jingle every 30 min can both run). Ships
 * with enabled=false always — see the create form default — so nothing new
 * starts firing just because an operator opens this panel.
 */
export default function InsertsPanel({ inserts, ttsAvailable, onChange }: Props) {
  const [busy, setBusy] = useState<number | null>(null);
  const [fireResult, setFireResult] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState<InsertType | null>(null);
  const [label, setLabel] = useState('');
  const [interval, setIntervalMinutes] = useState(15);
  const [audioFile, setAudioFile] = useState('');

  async function toggle(insert: ScheduleInsert) {
    setBusy(insert.id);
    try {
      await api.updateInsert(insert.id, { enabled: !insert.enabled });
      onChange();
    } finally {
      setBusy(null);
    }
  }

  async function changeInterval(insert: ScheduleInsert, minutes: number) {
    if (!minutes || minutes < 1) return;
    await api.updateInsert(insert.id, { interval_minutes: minutes });
    onChange();
  }

  async function remove(insert: ScheduleInsert) {
    if (!confirm(`"${insert.label || TYPE_LABELS[insert.insert_type].label}" ஐ நீக்கவா?`)) return;
    await api.deleteInsert(insert.id);
    onChange();
  }

  async function fireNow(insert: ScheduleInsert) {
    setBusy(insert.id);
    setFireResult(null);
    try {
      const res = await api.fireInsertNow(insert.id);
      setFireResult(`✓ ${res.label}`);
    } catch (err) {
      setFireResult(`✗ ${err instanceof ApiError ? err.message : 'தோல்வி'}`);
    } finally {
      setBusy(null);
    }
  }

  async function createInsert() {
    if (!showCreate) return;
    await api.createInsert({
      insert_type: showCreate,
      label: label || undefined,
      interval_minutes: interval,
      audio_file: showCreate !== 'time_announce' && audioFile ? audioFile : undefined,
      enabled: false, // always created dormant; operator flips it on explicitly
    });
    setShowCreate(null);
    setLabel('');
    setAudioFile('');
    onChange();
  }

  return (
    <div className="flex flex-col gap-3">
      {!ttsAvailable && (
        <div className="tamil rounded-lg border px-3 py-2 text-[11px] text-amber-300/90" style={{ borderColor: '#92400e', background: 'rgba(146,64,14,0.15)' }}>
          ⚠ Sarvam TTS இணைக்கப்படவில்லை — நேர அறிவிப்பு இயங்காது. மற்றவை (நிலைய அடையாளம், ஜிங்கிள்) பாதிக்கப்படாது.
        </div>
      )}

      {inserts.length === 0 && <div className="text-xs text-white/35 tamil">இன்னும் விதிகள் இல்லை.</div>}

      {inserts.map((insert) => {
        const meta = TYPE_LABELS[insert.insert_type];
        const disabledByTts = insert.insert_type === 'time_announce' && !ttsAvailable;
        return (
          <div
            key={insert.id}
            className="rounded-xl border px-3 py-2.5"
            style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="tamil text-xs font-semibold text-white/85 truncate">
                  {meta.icon} {insert.label || meta.label}
                </div>
                <div className="text-[10px] text-white/35 mt-0.5">
                  {insert.last_fired_at ? `கடைசியாக: ${new Date(insert.last_fired_at).toLocaleTimeString('en-CA')}` : 'இன்னும் இயக்கப்படவில்லை'}
                </div>
              </div>
              <button
                onClick={() => toggle(insert)}
                disabled={busy === insert.id || disabledByTts}
                className="tamil shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold disabled:opacity-40"
                style={{
                  background: insert.enabled ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
                  color: insert.enabled ? '#4ade80' : 'rgba(255,255,255,0.5)',
                }}
              >
                {insert.enabled ? 'இயக்கத்தில்' : 'நிறுத்தப்பட்டது'}
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <label className="tamil text-[10px] text-white/40">இடைவெளி (நிமிடம்)</label>
              <input
                type="number"
                min={1}
                defaultValue={insert.interval_minutes}
                onBlur={(e) => changeInterval(insert, Number(e.target.value))}
                className="w-16 rounded border bg-transparent px-1.5 py-0.5 text-xs text-white/80 tabular-nums"
                style={{ borderColor: 'var(--card-border)' }}
              />
              <button
                onClick={() => fireNow(insert)}
                disabled={busy === insert.id || disabledByTts}
                className="tamil ml-auto rounded-lg border px-2 py-1 text-[10px] text-white/60 hover:text-white/90 disabled:opacity-30"
                style={{ borderColor: 'var(--card-border)' }}
                title="சோதனைக்காக இப்போதே இயக்கு (enabled ஐ மாற்றாது)"
              >
                ▶ இப்போது இயக்கு
              </button>
              <button
                onClick={() => remove(insert)}
                className="text-[10px] text-white/30 hover:text-red-400"
                title="நீக்கு"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}

      {fireResult && <div className="text-[11px] text-white/60 tamil break-words">{fireResult}</div>}

      {showCreate ? (
        <div className="rounded-xl border px-3 py-2.5 flex flex-col gap-2" style={{ borderColor: 'var(--gold)' }}>
          <div className="tamil text-xs font-semibold" style={{ color: 'var(--gold)' }}>
            புதிய விதி: {TYPE_LABELS[showCreate].icon} {TYPE_LABELS[showCreate].label}
          </div>
          <input
            placeholder="லேபிள் (விருப்பம்)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="tamil rounded border bg-transparent px-2 py-1 text-xs"
            style={{ borderColor: 'var(--card-border)' }}
          />
          <div className="flex items-center gap-2">
            <label className="tamil text-[10px] text-white/40 shrink-0">இடைவெளி (நிமிடம்)</label>
            <input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="w-16 rounded border bg-transparent px-1.5 py-0.5 text-xs tabular-nums"
              style={{ borderColor: 'var(--card-border)' }}
            />
          </div>
          {showCreate !== 'time_announce' && (
            <input
              placeholder="ஒலிக்கோப்பு பெயர் (JINGLES_DIR க்குள்; காலியாக விட்டால் ஜிங்கிள் சீரற்று தேர்ந்தெடுக்கும்)"
              value={audioFile}
              onChange={(e) => setAudioFile(e.target.value)}
              className="tamil rounded border bg-transparent px-2 py-1 text-[11px]"
              style={{ borderColor: 'var(--card-border)' }}
            />
          )}
          {showCreate === 'time_announce' && (
            <div className="text-[10px] text-white/35 tamil">
              கட்டமைக்கப்பட்ட Tamil நேர சொற்றொடர் தானாகவே பயன்படுத்தப்படும் (எ.கா. "இப்போது நேரம் மாலை 4 மணி 30 நிமிடம்").
            </div>
          )}
          <div className="flex gap-2 mt-1">
            <button
              onClick={createInsert}
              className="tamil flex-1 rounded-lg py-1.5 text-xs font-semibold text-black"
              style={{ background: 'var(--gold)' }}
            >
              சேர் (நிறுத்தப்பட்ட நிலையில்)
            </button>
            <button
              onClick={() => setShowCreate(null)}
              className="tamil rounded-lg border px-3 py-1.5 text-xs text-white/60"
              style={{ borderColor: 'var(--card-border)' }}
            >
              ரத்து
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TYPE_LABELS) as InsertType[]).map((t) => (
            <button
              key={t}
              onClick={() => setShowCreate(t)}
              className="tamil flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] text-white/60 hover:text-white/90 hover:border-white/30"
              style={{ borderColor: 'var(--card-border)' }}
            >
              <span className="text-sm">{TYPE_LABELS[t].icon}</span>
              {TYPE_LABELS[t].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
