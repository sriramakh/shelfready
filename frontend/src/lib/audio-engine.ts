/**
 * Audio engine for ShelfReady Studio.
 * Uses real MP3 sound effects from /sounds/ directory.
 */

const audioCache: Record<string, HTMLAudioElement> = {};

function getAudio(src: string): HTMLAudioElement {
  if (typeof window === "undefined") throw new Error("Audio not available on server");
  if (!audioCache[src]) {
    audioCache[src] = new Audio(src);
  }
  return audioCache[src];
}

function playSound(src: string, volume = 1.0) {
  try {
    const audio = getAudio(src).cloneNode(true) as HTMLAudioElement;
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.play().catch(() => {});
  } catch {}
}

/** Keyboard single key press — short typewriter tick */
export function playKeyTick() {
  playSound("/sounds/keytick.mp3", 0.4);
}

/** UI button click — soft plastic tap */
export function playClick() {
  playSound("/sounds/click.mp3", 0.5);
}

/** Success chime — bright uplifting notification */
export function playSuccess() {
  playSound("/sounds/success.mp3", 0.5);
}

/** Processing/loading sound — returns stop function */
export function playProcessing(): () => void {
  const audio = getAudio("/sounds/processing.mp3").cloneNode(true) as HTMLAudioElement;
  audio.volume = 0.3;
  audio.loop = true;
  audio.play().catch(() => {});
  return () => {
    audio.pause();
    audio.currentTime = 0;
  };
}

/**
 * BGM player — ambient synth loop.
 */
export function createBGM(): { start: () => void; stop: () => void; setVolume: (v: number) => void } {
  let audio: HTMLAudioElement | null = null;

  return {
    start() {
      if (typeof window === "undefined") return;
      if (!audio) {
        audio = new Audio("/sounds/bgm.mp3");
        audio.loop = true;
        audio.volume = 0.15;
      }
      audio.play().catch(() => {});
    },
    stop() {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    },
    setVolume(v: number) {
      if (audio) audio.volume = Math.min(1, Math.max(0, v * 0.3));
    },
  };
}
