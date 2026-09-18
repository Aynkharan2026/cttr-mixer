// Local-only RJ cue tones — Web Audio API synthesis in the browser, no audio
// files and no path into the live broadcast. These buttons shipped disabled in
// an earlier build because no real applause/horn/bell/transition clips exist
// anywhere in this Tamil-music catalog or on the box (checked /srv/cttr/jingles/
// and elsewhere on the VPS — nothing generic; the one synthesized clip that
// exists there, station_id.mp3, is a spoken station ID, not SFX material).
// Rather than leave them as permanent no-ops, they synthesize the cue locally
// so the RJ actually hears something for their own timing reference. This is
// intentionally NOT pushed into Liquidsoap/Icecast — see RightConsole.tsx and
// the build report for why local-only is the honest scope here (no existing
// mechanism to inject ad-hoc audio into the live mix outside the normal
// catalog/insert picker, and building one is out of scope).

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function noiseBuffer(context: AudioContext, seconds: number): AudioBuffer {
  const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * seconds)), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function envelope(param: AudioParam, context: AudioContext, points: [number, number][]) {
  const now = context.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(points[0][1], now);
  for (const [t, v] of points.slice(1)) {
    param.linearRampToValueAtTime(v, now + t);
  }
}

/** கைதட்டல் — Applause: a burst of randomly-timed, band-passed noise "claps". */
function playApplause(): void {
  const context = audioCtx();
  const master = context.createGain();
  master.gain.value = 0.5;
  master.connect(context.destination);
  for (let i = 0; i < 18; i++) {
    const start = context.currentTime + Math.random() * 1.1;
    const src = context.createBufferSource();
    src.buffer = noiseBuffer(context, 0.08);
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800 + Math.random() * 2200;
    filter.Q.value = 0.8;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.7, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
    src.connect(filter).connect(gain).connect(master);
    src.start(start);
    src.stop(start + 0.12);
  }
}

/** கொம்பு — Air horn: a sustained sawtooth blast. */
function playHorn(): void {
  const context = audioCtx();
  const osc = context.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(233, context.currentTime);
  const gain = context.createGain();
  envelope(gain.gain, context, [[0, 0], [0.05, 0.6], [1.3, 0.6], [1.6, 0]]);
  osc.connect(gain).connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 1.7);
}

/** மணி — Bell: a sine fundamental plus inharmonic overtones with a long decay. */
function playBell(): void {
  const context = audioCtx();
  const master = context.createGain();
  master.gain.value = 0.5;
  master.connect(context.destination);
  for (const ratio of [1, 2.4, 3.8, 5.4]) {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880 * ratio;
    const gain = context.createGain();
    envelope(gain.gain, context, [[0, 0.5 / ratio], [0.02, 0.5 / ratio], [2.2, 0]]);
    osc.connect(gain).connect(master);
    osc.start();
    osc.stop(context.currentTime + 2.3);
  }
}

/** இடைநிலை — Transition swoosh: band-passed noise sweeping up in frequency. */
function playTransition(): void {
  const context = audioCtx();
  const src = context.createBufferSource();
  src.buffer = noiseBuffer(context, 0.6);
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(300, context.currentTime);
  filter.frequency.exponentialRampToValueAtTime(6000, context.currentTime + 0.55);
  const gain = context.createGain();
  envelope(gain.gain, context, [[0, 0], [0.05, 0.6], [0.5, 0.3], [0.6, 0]]);
  src.connect(filter).connect(gain).connect(context.destination);
  src.start();
  src.stop(context.currentTime + 0.65);
}

export type SfxKind = 'applause' | 'horn' | 'bell' | 'transition';

export function playSfx(kind: SfxKind): void {
  switch (kind) {
    case 'applause':
      playApplause();
      return;
    case 'horn':
      playHorn();
      return;
    case 'bell':
      playBell();
      return;
    case 'transition':
      playTransition();
      return;
  }
}
