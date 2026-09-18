import { useState } from 'react';
import { api, ApiError } from '../api';

/**
 * iziCast (iPhone RTMP/Icecast-source app) connection guide for the harbor
 * cttr.liq already listens on (LIVE_HARBOR_PORT/MOUNT/USER — see control_api.py
 * settings). Server/port/mount/user are not secret and load with the page via
 * GET /api/live/harbor-info. The password is deliberately NOT part of that
 * response or any static bundle: it's fetched only when the RJ clicks "reveal",
 * from GET /api/live/harbor-password (same Bearer-token auth as every other
 * /api/* call), and kept only in this component's React state — never logged,
 * never written to localStorage, cleared again on "hide".
 */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard permission denied — the value is still visible to select/copy manually
    }
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--card-border)' }}>
      <div className="min-w-0">
        <div className="tamil text-[9px] text-white/35">{label}</div>
        <div className="truncate text-xs font-mono text-white/90">{value}</div>
      </div>
      <button onClick={copy} className="shrink-0 text-[10px] text-white/40 hover:text-white/80" title="நகலெடு">
        {copied ? '✓' : '⧉'}
      </button>
    </div>
  );
}

export default function IzicastSetupPanel() {
  const [info, setInfo] = useState<{ server: string; port: number; mount: string; user: string } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [password, setPassword] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  async function loadInfo() {
    setLoadingInfo(true);
    setInfoError(null);
    try {
      setInfo(await api.liveHarborInfo());
    } catch (e) {
      setInfoError(e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setLoadingInfo(false);
    }
  }

  async function reveal() {
    if (password) {
      setPassword(null); // hide again
      return;
    }
    setRevealing(true);
    setRevealError(null);
    try {
      const res = await api.liveHarborPassword();
      setPassword(res.password);
    } catch (e) {
      setRevealError(e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setRevealing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] text-white/40 tamil leading-relaxed">
        iPhone-இல் iziCast (அல்லது இதே போன்ற Icecast/Shoutcast source app) மூலம் நேரடியாக ஒலிபரப்ப, கீழே உள்ள
        விவரங்களை உள்ளிடவும். இணைந்தவுடன் மேலே TopBar-இல் உள்ள 🎙️ நேரடி மைக் பொத்தானை (அல்லது இதற்கு கீழே)
        "on" செய்தால் இந்த மூலம் திட்டமிடப்பட்ட நிகழ்ச்சிக்கு முன்னுரிமை பெறும்.
      </div>

      {!info ? (
        <button
          onClick={loadInfo}
          disabled={loadingInfo}
          className="tamil rounded-lg border py-1.5 text-xs text-white/70 disabled:opacity-40"
          style={{ borderColor: 'var(--card-border)' }}
        >
          {loadingInfo ? '···' : 'இணைப்பு விவரங்களைக் காட்டு'}
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <CopyField label="Server / சேவையகம்" value={info.server} />
          <CopyField label="Port" value={String(info.port)} />
          <CopyField label="Mount point" value={info.mount} />
          <CopyField label="Username" value={info.user} />

          <div className="rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="tamil text-[9px] text-white/35">Password</div>
              <button
                onClick={reveal}
                disabled={revealing}
                data-testid="izicast-reveal-password"
                className="tamil text-[10px] text-white/50 hover:text-white/85 disabled:opacity-40"
              >
                {revealing ? '···' : password ? 'மறை (hide)' : 'காட்டு (reveal)'}
              </button>
            </div>
            {password ? (
              <div className="truncate text-xs font-mono text-white/90 mt-0.5" data-testid="izicast-password-value">
                {password}
              </div>
            ) : (
              <div className="truncate text-xs font-mono text-white/25 mt-0.5 select-none">••••••••••••</div>
            )}
            {revealError && <div className="text-[10px] text-red-400 mt-1">{revealError}</div>}
          </div>
        </div>
      )}
      {infoError && <div className="text-[10px] text-red-400">{infoError}</div>}
    </div>
  );
}
