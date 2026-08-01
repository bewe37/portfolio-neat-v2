import { getAudioContext, loadAudioBuffer, playBufferRegion } from "@/lib/sound-engine"

// SND kit 01 ("sine") — https://snd.dev, MIT-licensed, vendored under
// public/snd-lib-master. Audio is a single sprite file; each named sound
// lives at a fixed [start, end) offset taken from that kit's own
// audioSprite.json manifest.
const SPRITE_URL = "/sounds/snd-01.mp3"

const SPRITE_MAP: Record<string, { start: number; end: number }> = {
  tap: { start: 30, end: 30.01 },
  button: { start: 0, end: 0.1001814058956916 },
  select: { start: 16, end: 16.1 },
}

let bufferPromise: Promise<AudioBuffer> | null = null

function getBuffer(): Promise<AudioBuffer> {
  if (!bufferPromise) bufferPromise = loadAudioBuffer(SPRITE_URL)
  return bufferPromise
}

// Fire-and-forget: resumes the (likely browser-suspended) AudioContext on
// the same user-gesture call stack, then plays once the sprite is decoded.
// Never throws — a slow/failed load should never block a click handler.
export function playV2Sound(name: keyof typeof SPRITE_MAP, volume = 0.5) {
  const region = SPRITE_MAP[name]
  if (!region) return

  const ctx = getAudioContext()
  if (ctx.state === "suspended") ctx.resume().catch(() => {})

  getBuffer()
    .then((buffer) => playBufferRegion(buffer, region.start, region.end, { volume }))
    .catch(() => {})
}

export function playV2Click(volume = 0.5) {
  playV2Sound("tap", volume)
}
