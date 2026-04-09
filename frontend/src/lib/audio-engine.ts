/**
 * Web Audio API sound effects engine for ShelfReady Studio.
 * Generates all sounds procedurally — no external files needed.
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (typeof window === "undefined") throw new Error("Audio not available on server");
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

/** Short keyboard tick — plays during typing animation */
export function playKeyTick() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
  gain.gain.setValueAtTime(0.03, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

/** Button click sound */
export function playClick() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

/** Success chime — ascending notes */
export function playSuccess() {
  const ctx = getCtx();
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.35);
  });
}

/** Streaming/processing sound — subtle low hum pulse */
export function playProcessing(): () => void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  gain.gain.setValueAtTime(0.02, ctx.currentTime);

  lfo.type = "sine";
  lfo.frequency.setValueAtTime(2, ctx.currentTime);
  lfoGain.gain.setValueAtTime(0.01, ctx.currentTime);

  lfo.connect(lfoGain).connect(gain.gain);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  lfo.start();

  // Return stop function
  return () => {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    setTimeout(() => { osc.stop(); lfo.stop(); }, 400);
  };
}

/**
 * BGM player — loops a procedurally generated ambient background.
 * Returns start/stop controls.
 */
export function createBGM(): { start: () => void; stop: () => void; setVolume: (v: number) => void } {
  let playing = false;
  let nodes: { osc: OscillatorNode[]; gain: GainNode } | null = null;

  return {
    start() {
      if (playing) return;
      const ctx = getCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.015, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Ambient pad — layered sine waves
      const freqs = [130.81, 164.81, 196.00, 261.63]; // C3, E3, G3, C4
      const oscs = freqs.map((f) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        g.gain.setValueAtTime(0.25, ctx.currentTime);
        osc.connect(g).connect(masterGain);
        osc.start();
        return osc;
      });

      nodes = { osc: oscs, gain: masterGain };
      playing = true;
    },
    stop() {
      if (!playing || !nodes) return;
      nodes.gain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 1);
      const n = nodes;
      setTimeout(() => { n.osc.forEach((o) => o.stop()); }, 1200);
      nodes = null;
      playing = false;
    },
    setVolume(v: number) {
      if (nodes) nodes.gain.gain.setValueAtTime(Math.max(0.001, v * 0.03), getCtx().currentTime);
    },
  };
}

/** Get the AudioContext destination as a MediaStream (for recording) */
export function getAudioStream(): MediaStream | null {
  try {
    const ctx = getCtx();
    const dest = ctx.createMediaStreamDestination();
    // Re-route master to dest as well
    // This is tricky — for now return null and we'll use display capture with audio
    return dest.stream;
  } catch {
    return null;
  }
}
