export type AnimDef = { row: number; frames: number; fps: number }

export type BuddyDef = {
  id:           string
  name:         string
  tagline:      string
  traits:       [string, string]
  src:          string        // URL-encoded path
  tileW:        number
  tileH:        number
  sheetW:       number        // full sprite sheet pixel width
  sheetH:       number        // full sprite sheet pixel height
  anims:        Record<string, AnimDef>
  idleAnim:     string
  hoverAnim:    string
  pool:         string[]      // weighted behaviour pool for idle wandering
  displayScale?: number       // overrides the global SCALE if set
}

export const BUDDIES: BuddyDef[] = [
  {
    id:        "fox",
    name:      "Fox",
    tagline:   "Judges your taste in fonts.",
    traits:    ["Mischievous", "Curious"],
    src:       "/Fox%20Sprite%20Sheet.png",
    tileW: 32, tileH: 32, sheetW: 448, sheetH: 224,
    anims: {
      idle:  { row: 0, frames: 5, fps: 6  },
      walk:  { row: 1, frames: 8, fps: 10 },
      run:   { row: 2, frames: 4, fps: 12 },
      trot:  { row: 3, frames: 8, fps: 10 },
      jump:  { row: 4, frames: 7, fps: 10 },
      sit:   { row: 5, frames: 3, fps: 5  },
      sleep: { row: 6, frames: 4, fps: 4  },
    },
    idleAnim:  "idle",
    hoverAnim: "trot",
    pool: [
      "idle","idle","idle",
      "sit","sit",
      "sleep","sleep",
      "walk","trot","run","jump",
    ],
  },
  {
    id:        "squirrel",
    name:      "Squirrel",
    tagline:   "Has seventeen side projects.",
    traits:    ["Hyperactive", "Chaotic"],
    src:       "/Squirrel%20Sprite%20Sheet.png",
    tileW: 32, tileH: 32, sheetW: 256, sheetH: 224,
    anims: {
      idle:  { row: 0, frames: 5, fps: 6  },
      walk:  { row: 1, frames: 6, fps: 10 },
      run:   { row: 2, frames: 4, fps: 14 },
      sit:   { row: 3, frames: 3, fps: 5  },
      sleep: { row: 5, frames: 4, fps: 4  },
      jump:  { row: 6, frames: 3, fps: 10 },
    },
    idleAnim:  "idle",
    hoverAnim: "run",
    pool: [
      "idle","idle",
      "walk","walk",
      "run","run",
      "sit",
      "sleep",
      "jump","jump",
    ],
  },
  {
    id:        "cat",
    name:      "Cat",
    tagline:   "Pretends not to care. Always watching.",
    traits:    ["Unbothered", "Mysterious"],
    src:       "/Cat%20Sprite%20Sheet.png",
    tileW: 32, tileH: 32, sheetW: 256, sheetH: 320,
    anims: {
      idle:    { row: 0, frames: 4, fps: 6  },
      walk:    { row: 1, frames: 4, fps: 10 },
      sit:     { row: 2, frames: 4, fps: 5  },
      rest:    { row: 3, frames: 4, fps: 4  },
      run:     { row: 4, frames: 8, fps: 12 },
      jump:    { row: 5, frames: 8, fps: 10 },
      sleep:   { row: 7, frames: 4, fps: 4  },
    },
    idleAnim:  "idle",
    hoverAnim: "jump",
    pool: [
      "idle","idle","idle",
      "sit","sit",
      "rest","rest",
      "sleep",
      "walk","walk",
      "run","jump",
    ],
  },
  {
    id:        "hermitcrab",
    name:      "Hermit Crab",
    tagline:   "Home is wherever I carry it.",
    traits:    ["Introverted", "Resilient"],
    src:       "/Hermit%20Crab%20Sprite%20Sheet.png",
    tileW: 32, tileH: 32, sheetW: 192, sheetH: 160,
    anims: {
      idle:  { row: 0, frames: 6, fps: 6  },
      walk:  { row: 1, frames: 6, fps: 10 },
      hide:  { row: 2, frames: 6, fps: 8  },
      pop:   { row: 3, frames: 6, fps: 8  },
      sleep: { row: 4, frames: 6, fps: 4  },
    },
    idleAnim:  "idle",
    hoverAnim: "walk",
    pool: [
      "idle","idle","idle",
      "walk","walk",
      "hide","pop",
      "sleep",
    ],
  },
  {
    id:        "jellyfish",
    name:      "Jellyfish",
    tagline:   "Going wherever the current takes me.",
    traits:    ["Drifty", "Luminous"],
    src:       "/Jellyfish%20Sprite%20Sheet.png",
    tileW: 32, tileH: 32, sheetW: 224, sheetH: 160,
    anims: {
      float: { row: 0, frames: 7, fps: 7  },
      swim:  { row: 1, frames: 7, fps: 10 },
      idle:  { row: 2, frames: 7, fps: 5  },
      pulse: { row: 3, frames: 7, fps: 8  },
      glow:  { row: 4, frames: 7, fps: 6  },
    },
    idleAnim:  "idle",
    hoverAnim: "swim",
    pool: [
      "float","float","float",
      "idle","idle",
      "swim","swim",
      "pulse","glow",
    ],
  },
  {
    id:        "raven",
    name:      "Raven",
    tagline:   "Watching. Always watching.",
    traits:    ["Observant", "Dramatic"],
    src:       "/Raven_Sprite_Sheet.png",
    tileW: 32, tileH: 32, sheetW: 512, sheetH: 576,
    anims: {
      fly:  { row: 0, frames: 8, fps: 10 },
      idle: { row: 1, frames: 8, fps: 5  },
      walk: { row: 2, frames: 8, fps: 8  },
    },
    idleAnim:  "idle",
    hoverAnim: "fly",
    pool: [
      "idle","idle","idle",
      "fly","fly",
      "walk","walk",
    ],
  },
]

export function getBuddy(id: string): BuddyDef | undefined {
  return BUDDIES.find(b => b.id === id)
}
