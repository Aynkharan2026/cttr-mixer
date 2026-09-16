import { useRef, useState } from 'react';

const PRIMARY_SRC = 'https://stream.cttr.ca/stream';
const FALLBACK_SRC = 'http://77.42.6.218:8000/stream';

export default function AudioPlayer() {
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
      className="sticky bottom-0 z-30 border-t px-3 py-2.5 backdrop-blur-md flex items-center gap-3"
      style={{ borderColor: 'var(--card-border)', background: 'rgba(13,5,24,0.92)' }}
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

      <button
        onClick={toggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: 'var(--gold)', color: '#1a0a2e' }}
        title={playing ? 'நிறுத்து (Pause)' : 'கேளு (Listen)'}
      >
        {buffering ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#1a0a2e] border-t-transparent" />
        ) : playing ? (
          '⏸'
        ) : (
          '▶'
        )}
      </button>

      <div className="flex items-center gap-2 min-w-0">
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
        <span className="tamil text-xs text-white/60 truncate">
          {error
            ? 'இணைப்பு தோல்வி — மீண்டும் முயற்சி செய்யவும்'
            : buffering
              ? 'இணைக்கிறது...'
              : usingFallback
                ? 'நேரடி ஒலிபரப்பு (fallback)'
                : 'நேரடி ஒலிபரப்பு'}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        <button
          onClick={toggleMute}
          className="text-white/60 hover:text-white/90 text-sm"
          title={muted ? 'ஒலி இயக்கு (Unmute)' : 'ஒலி நிறுத்து (Mute)'}
        >
          {muted || volume === 0 ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-16 md:w-20"
          style={{ accentColor: 'var(--gold)' }}
          title="ஒலி அளவு (Volume)"
        />
      </div>
    </div>
  );
}
