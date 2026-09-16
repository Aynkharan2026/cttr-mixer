import { useRef, useState } from 'react';
import { useStatus } from '../StatusContext';
import { api } from '../api';
import StreamMeter from './StreamMeter';

const PRIMARY_SRC = 'https://stream.cttr.ca/stream';
const FALLBACK_SRC = 'http://77.42.6.218:8000/stream';

/** Broadcast transport — pause/resume/skip/live-relay, wired to control_api.py's
 * /api/pause /api/resume /api/skip /api/live over Liquidsoap telnet. This is the
 * same control that used to live in the header; it now lives here so on-air
 * control and local monitoring share one strip. */
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
        ⏭
      </button>
      <button
        onClick={() => run('live', () => api.setLive(!live))}
        disabled={busy !== null}
        title="நேரடி ஒலிபரப்பு (Live relay mode)"
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

interface Props {
  locked: boolean;
  onToggleLock: () => void;
}

export default function AudioPlayer({ locked, onToggleLock }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const triedFallback = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  function handleFailure() {
    const audio = audioRef.current;
    if (!triedFallback.current) {
      triedFallback.current = true;
      setUsingFallback(true);
      if (audio) {
        audio.src = FALLBACK_SRC;
        setBuffering(true);
        audio.play().catch(() => {
          setBuffering(false);
          setError(true);
          setPlaying(false);
        });
      }
    } else {
      setBuffering(false);
      setError(true);
      setPlaying(false);
    }
  }

  function play() {
    const audio = audioRef.current;
    if (!audio) return;
    setError(false);
    setBuffering(true);
    triedFallback.current = false;
    setUsingFallback(false);
    audio.src = PRIMARY_SRC;
    audio.volume = volume;
    audio.muted = muted;
    audio.play().catch(() => {
      setBuffering(false);
      handleFailure();
    });
  }

  function pause() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    setPlaying(false);
    setBuffering(false);
  }

  function toggle() {
    if (playing || buffering) {
      pause();
    } else {
      play();
    }
  }

  function onVolumeChange(v: number) {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0 && muted) {
      setMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
    }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t px-2.5 md:px-4 py-2 backdrop-blur-md"
      style={{ borderColor: 'var(--card-border)', background: 'rgba(13,5,24,0.94)' }}
    >
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => {
          setPlaying(true);
          setBuffering(false);
        }}
        onWaiting={() => setBuffering(true)}
        onError={handleFailure}
        onPause={() => setPlaying(false)}
      />

      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
        {/* Local monitor listen button */}
        <button
          onClick={toggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: 'var(--gold)', color: '#1a0a2e' }}
          title={playing ? 'நிறுத்து (Pause monitor)' : 'கேளு (Listen — local monitor)'}
        >
          {buffering ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#1a0a2e] border-t-transparent" />
          ) : playing ? (
            '⏸'
          ) : (
            '▶'
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2 min-w-0 shrink-0">
          {playing && !buffering && (
            <div className="flex items-end gap-[2px] h-3.5 shrink-0">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="eq-bar w-[2px] rounded-full"
                  style={{ background: 'var(--gold)', height: '100%', animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          )}
          <span className="tamil text-[11px] text-white/55 truncate max-w-[9rem]">
            {error ? 'இணைப்பு தோல்வி' : buffering ? 'இணைக்கிறது...' : usingFallback ? 'fallback' : 'நேரடி'}
          </span>
        </div>

        <div className="w-px h-6 shrink-0" style={{ background: 'var(--card-border)' }} />

        <TransportControls />

        <div className="w-px h-6 shrink-0 hidden md:block" style={{ background: 'var(--card-border)' }} />

        <div className="hidden md:block shrink-0">
          <StreamMeter />
        </div>

        <div className="ml-auto flex items-center gap-2.5 shrink-0">
          <button onClick={toggleMute} className="text-white/60 hover:text-white/90 text-sm" title={muted ? 'ஒலி இயக்கு (Unmute)' : 'ஒலி நிறுத்து (Mute)'}>
            {muted || volume === 0 ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-14 md:w-20"
            style={{ accentColor: 'var(--gold)' }}
            title="ஒலி அளவு (Volume)"
          />
          <button
            onClick={onToggleLock}
            title={locked ? 'பூட்டைத் திற (Unlock layout)' : 'தற்செயலான தொடுதலைத் தடு (Lock layout)'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm"
            style={{
              borderColor: locked ? 'var(--gold)' : 'var(--card-border)',
              color: locked ? 'var(--gold)' : 'rgba(255,255,255,0.6)',
              background: locked ? 'rgba(212,175,55,0.12)' : 'transparent',
            }}
          >
            {locked ? '🔒' : '🔓'}
          </button>
        </div>
      </div>
    </div>
  );
}
