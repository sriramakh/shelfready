/**
 * Web Audio API sound effects engine for ShelfReady Studio.
 * Uses pleasant, musical tones — not raw oscillators.
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (typeof window === "undefined") throw new Error("Audio not available on server");
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

/** Soft keyboard tick — gentle tap sound */
export function playKeyTick() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // White noise-ish tick via high-freq triangle wave
  osc.type = "triangle";
  osc.frequency.setValueAtTime(3000 + Math.random() * 1500, ctx.currentTime);

  filter.type = "highpass";
  filter.frequency.setValueAtTime(2000, ctx.currentTime);

  gain.gain.setValueAtTime(0.015, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.04);
}

/** Soft button click — pleasant pop */
export function playClick() {
  const ctx = getCtx();
  // Two-tone pop
  [800, 1200].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.03 + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.03);
    osc.stop(ctx.currentTime + i * 0.03 + 0.12);
  });
}

/** Success sound — pleasant ascending major chord arpeggio */
export function playSuccess() {
  const ctx = getCtx();
  // C major arpeggio: C4, E4, G4, C5 — soft and musical
  const notes = [261.6, 329.6, 392.0, 523.3];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

    // Soft attack, gentle decay
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + i * 0.1 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.5);

    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.55);
  });

  // Add a soft shimmer overtone
  const shimmer = ctx.createOscillator();
  const sGain = ctx.createGain();
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3); // C6
  sGain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
  sGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.35);
  sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
  shimmer.connect(sGain).connect(ctx.destination);
  shimmer.start(ctx.currentTime + 0.3);
  shimmer.stop(ctx.currentTime + 1.1);
}

/** Gentle processing sound — soft pulsing pad, not a hum */
export function playProcessing(): () => void {
  const ctx = getCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.012, ctx.currentTime);
  masterGain.connect(ctx.destination);

  // Soft major chord pad
  const freqs = [261.6, 329.6, 392.0]; // C4, E4, G4
  const oscs = freqs.map((f) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.connect(g).connect(masterGain);
    osc.start();
    return osc;
  });

  // Gentle volume pulse
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.5, ctx.currentTime); // Very slow pulse
  lfoGain.gain.setValueAtTime(0.004, ctx.currentTime);
  lfo.connect(lfoGain).connect(masterGain.gain);
  lfo.start();

  return () => {
    masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    setTimeout(() => { oscs.forEach((o) => o.stop()); lfo.stop(); }, 600);
  };
}

/**
 * BGM — gentle ambient pad, barely noticeable.
 */
export function createBGM(): { start: () => void; stop: () => void; setVolume: (v: number) => void } {
  let playing = false;
  let nodes: { osc: OscillatorNode[]; gain: GainNode; lfo: OscillatorNode } | null = null;

  return {
    start() {
      if (playing) return;
      const ctx = getCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.008, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Very soft ambient chord — C major 7th spread
      const freqs = [65.41, 130.81, 164.81, 196.0, 246.94]; // C2, C3, E3, G3, B3
      const oscs = freqs.map((f) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.connect(g).connect(masterGain);
        osc.start();
        return osc;
      });

      // Very slow breathing effect
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.003, ctx.currentTime);
      lfo.connect(lfoGain).connect(masterGain.gain);
      lfo.start();

      nodes = { osc: oscs, gain: masterGain, lfo };
      playing = true;
    },
    stop() {
      if (!playing || !nodes) return;
      nodes.gain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 1.5);
      const n = nodes;
      setTimeout(() => { n.osc.forEach((o) => o.stop()); n.lfo.stop(); }, 1800);
      nodes = null;
      playing = false;
    },
    setVolume(v: number) {
      if (nodes) nodes.gain.gain.setValueAtTime(Math.max(0.001, v * 0.015), getCtx().currentTime);
    },
  };
}
