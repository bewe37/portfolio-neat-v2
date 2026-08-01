let audioContext: AudioContext | null = null;
const bufferCache = new Map<string, AudioBuffer>();
const urlBufferPromiseCache = new Map<string, Promise<AudioBuffer>>();

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function decodeAudioData(dataUri: string): Promise<AudioBuffer> {
  const cached = bufferCache.get(dataUri);
  if (cached) return cached;

  const ctx = getAudioContext();
  const base64 = dataUri.split(",")[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
  bufferCache.set(dataUri, audioBuffer);
  return audioBuffer;
}

// For larger static assets (audio sprites) served from /public rather than
// inlined as a data URI — fetched and decoded once, cached by URL.
export function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const cached = urlBufferPromiseCache.get(url);
  if (cached) return cached;

  const ctx = getAudioContext();
  const promise = fetch(url)
    .then((res) => res.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data));
  urlBufferPromiseCache.set(url, promise);
  return promise;
}

export interface PlaySoundOptions {
  volume?: number;
  playbackRate?: number;
  onEnd?: () => void;
}

export interface SoundPlayback {
  stop: () => void;
}

export async function playSound(
  dataUri: string,
  options: PlaySoundOptions = {}
): Promise<SoundPlayback> {
  const { volume = 1, playbackRate = 1, onEnd } = options;
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const buffer = await decodeAudioData(dataUri);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();

  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);

  source.onended = () => {
    onEnd?.();
  };

  source.start(0);

  return {
    stop: () => {
      try {
        source.stop();
      } catch {
        // No-op if already stopped.
      }
    },
  };
}

export interface PlaySpriteOptions {
  volume?: number;
  playbackRate?: number;
}

// Plays a [start, end) region of an already-loaded buffer — for audio
// sprites, where many short sounds are packed into one file at known
// timestamps (see the sprite's own JSON manifest for offsets).
export function playBufferRegion(
  buffer: AudioBuffer,
  start: number,
  end: number,
  options: PlaySpriteOptions = {}
): SoundPlayback {
  const { volume = 1, playbackRate = 1 } = options;
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();

  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);

  source.start(0, start, Math.max(0, end - start));

  return {
    stop: () => {
      try {
        source.stop();
      } catch {
        // No-op if already stopped.
      }
    },
  };
}
