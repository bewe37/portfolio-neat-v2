"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useAnimate, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { getBuddy, BUDDIES, type BuddyDef, type AnimDef } from "@/lib/buddies"

const SCALE        = 3
const MAIN_RIGHT   = 16

// ── Frame validity detection ──────────────────────────────────
// Caches which frame indices in a given animation row have visible pixels.
// Key: "src:row:totalFrames:tileW:tileH"
const frameCache = new Map<string, number[]>()

function detectValidFrames(
  src: string, row: number, frames: number,
  tileW: number, tileH: number, sheetW: number, sheetH: number,
): Promise<number[]> {
  const key = `${src}:${row}:${frames}:${tileW}:${tileH}`
  if (frameCache.has(key)) return Promise.resolve(frameCache.get(key)!)

  return new Promise(resolve => {
    const fallback = Array.from({ length: frames }, (_, i) => i)
    const img = new Image()
    img.onload = () => {
      try {
        const cv = document.createElement("canvas")
        cv.width = sheetW; cv.height = sheetH
        const ctx = cv.getContext("2d")!
        ctx.drawImage(img, 0, 0)
        const valid: number[] = []
        for (let f = 0; f < frames; f++) {
          const d = ctx.getImageData(f * tileW, row * tileH, tileW, tileH).data
          for (let i = 3; i < d.length; i += 4) {
            if (d[i] > 8) { valid.push(f); break }
          }
        }
        const result = valid.length ? valid : fallback
        frameCache.set(key, result)
        resolve(result)
      } catch { resolve(fallback) }
    }
    img.onerror = () => resolve(fallback)
    img.src = src
  })
}

// ── Dialog lines ──────────────────────────────────────────────
const DIALOG: Record<string, string[]> = {
  fox: [
    "Nice kerning.",
    "Still here? Impressive.",
    "I've seen better portfolios. Kidding.",
    "You clicked me. Bold.",
    "I'm watching you scroll.",
    "Did you read everything?",
  ],
  squirrel: [
    "NOT NOW I'M BUSY",
    "Did you see my 17 side projects??",
    "AHHHHHH",
    "Wait what were we doing",
    "I found a bug. It's mine now.",
    "SO MUCH ENERGY",
  ],
  cat: [
    "...",
    "hmm.",
    "I was sleeping.",
    "Don't.",
    "*ignores you*",
    "fine.",
  ],
  hermitcrab: [
    "Don't mind me.",
    "I brought my house.",
    "Just passing through.",
    "Cozy in here.",
    "Shell check: passed.",
    "I need more space. Just kidding.",
  ],
  jellyfish: [
    "I have no brain. Thriving.",
    "Just vibing.",
    "90% water. Relatable.",
    "Floating is my cardio.",
    "No thoughts, only drift.",
    "✦ glow ✦",
  ],
  raven: [
    "I know things.",
    "Fascinating.",
    "*tilts head*",
    "Nevermore.",
    "I was watching.",
    "Curious.",
  ],
}

// ── Reusable sprite renderer ──────────────────────────────────
function SpriteView({
  buddy, animKey, scale = SCALE, flip = false,
}: {
  buddy: BuddyDef; animKey: string; scale?: number; flip?: boolean
}) {
  const divRef       = useRef<HTMLDivElement>(null)
  const validRef     = useRef<number[]>([])          // valid frame indices once detected
  const idxRef       = useRef(0)                     // current position in validRef
  const w = buddy.tileW * scale
  const h = buddy.tileH * scale

  const anim: AnimDef = buddy.anims[animKey] ?? buddy.anims[buddy.idleAnim]

  // Detect valid frames once per anim; result lands in validRef
  useEffect(() => {
    validRef.current = []
    idxRef.current   = 0
    detectValidFrames(buddy.src, anim.row, anim.frames, buddy.tileW, buddy.tileH, buddy.sheetW, buddy.sheetH)
      .then(frames => { validRef.current = frames; idxRef.current = 0 })
  }, [buddy.src, anim.row, anim.frames, buddy.tileW, buddy.tileH, buddy.sheetW, buddy.sheetH])

  useEffect(() => {
    const el = divRef.current
    if (!el) return
    idxRef.current = 0
    el.style.backgroundPosition = `0px -${anim.row * h}px`
    const id = setInterval(() => {
      const valid = validRef.current
      if (valid.length) {
        idxRef.current = (idxRef.current + 1) % valid.length
        const f = valid[idxRef.current]
        el.style.backgroundPosition = `-${f * w}px -${anim.row * h}px`
      } else {
        // Detection pending — advance raw but only within declared frame count
        idxRef.current = (idxRef.current + 1) % anim.frames
        el.style.backgroundPosition = `-${idxRef.current * w}px -${anim.row * h}px`
      }
    }, 1000 / anim.fps)
    return () => clearInterval(id)
  }, [animKey, buddy, w, h, anim.row, anim.fps, anim.frames])

  return (
    <div
      ref={divRef}
      style={{
        width:              w,
        height:             h,
        backgroundImage:    `url('${buddy.src}')`,
        backgroundRepeat:   "no-repeat",
        backgroundSize:     `${buddy.sheetW * scale}px ${buddy.sheetH * scale}px`,
        backgroundPosition: "0px 0px",
        imageRendering:     "pixelated",
        transform:          flip ? "scaleX(-1)" : "none",
        flexShrink:         0,
      }}
    />
  )
}

export { SpriteView }

// ── Pet indicator ─────────────────────────────────────────────
const SPARKS = [
  { angle: -80, dist: 28, size: 9  },
  { angle: -40, dist: 34, size: 13 },
  { angle:   0, dist: 30, size: 10 },
  { angle:  40, dist: 26, size: 12 },
  { angle:  80, dist: 32, size: 8  },
]

function PetHand({ onDone }: { onDone: () => void }) {
  return (
    <div style={{ position: "absolute", bottom: "102%", right: "83%", width: 0, height: 0, pointerEvents: "none", zIndex: 75 }}>
      {SPARKS.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180
        const tx  = Math.cos(rad) * s.dist
        const ty  = -Math.sin(rad) * s.dist
        return (
          <motion.div
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1.1 }}
            animate={{ opacity: 0, x: tx, y: ty, scale: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.03, ease: [0.215, 0.61, 0.355, 1] }}
            onAnimationComplete={i === SPARKS.length - 1 ? onDone : undefined}
            style={{ position: "absolute", fontSize: s.size, color: "var(--c-primary)", userSelect: "none", lineHeight: 1 }}
          >
            ✦
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Speech bubble (inline, for flex-column companion wrappers) ─
function SpeechBubble({ text }: { text: string }) {
  return (
    <div style={{
      position:      "relative",
      background:    "var(--bg)",
      border:        "1px solid var(--border)",
      borderRadius:  10,
      padding:       "8px 12px",
      fontSize:      "0.75rem",
      fontFamily:    "var(--font-sans)",
      fontWeight:    500,
      color:         "var(--c-primary)",
      whiteSpace:    "nowrap",
      boxShadow:     "0 4px 18px rgba(0,0,0,0.10)",
      animation:     "bubbleIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
      pointerEvents: "none",
      zIndex:        70,
    }}>
      {text}
      {/* caret pointing bottom-right toward companion */}
      <div style={{
        position:    "absolute",
        bottom:      -5,
        right:       14,
        transform:   "rotate(45deg)",
        width:       8,
        height:      8,
        background:  "var(--bg)",
        border:      "1px solid var(--border)",
        borderTop:   "none",
        borderLeft:  "none",
      }} />
    </div>
  )
}

// ── Speech bubble (absolute, for custom buddy with head offset) ─
function SpeechBubbleAbs({ text, bottom }: { text: string; bottom: number }) {
  return (
    <div style={{
      position:      "absolute",
      bottom,
      left:          "50%",
      transform:     "translateX(-50%)",
      background:    "var(--bg)",
      border:        "1px solid var(--border)",
      borderRadius:  10,
      padding:       "8px 12px",
      fontSize:      "0.75rem",
      fontFamily:    "var(--font-sans)",
      fontWeight:    500,
      color:         "var(--c-primary)",
      whiteSpace:    "nowrap",
      boxShadow:     "0 4px 18px rgba(0,0,0,0.10)",
      animation:     "bubbleIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
      pointerEvents: "none",
      zIndex:        70,
    }}>
      {text}
      <div style={{
        position:   "absolute",
        bottom:     -5,
        left:       "50%",
        transform:  "translateX(-50%) rotate(45deg)",
        width:      8,
        height:     8,
        background: "var(--bg)",
        border:     "1px solid var(--border)",
        borderTop:  "none",
        borderLeft: "none",
      }} />
    </div>
  )
}

// ── Companion editor modal ────────────────────────────────────
function CompanionEditModal({ currentId, onClose }: { currentId: string | null; onClose: () => void }) {
  const router = useRouter()

  function selectBuddy(id: string) {
    localStorage.setItem("buddyId", id)
    window.dispatchEvent(new Event("buddySelected"))
    onClose()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)", zIndex: 200 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "calc(-50% + 14px)" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
        exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "calc(-50% + 14px)" }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        style={{
          position: "fixed", top: "50%", left: "50%", zIndex: 201,
          background: "var(--bg)", border: "1px solid var(--border-mid)",
          borderRadius: 20, padding: 24, width: 300,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        }}
      >
        <p style={{ margin: "0 0 14px", fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 700, color: "var(--c-primary)", letterSpacing: "-0.02em" }}>
          Switch companion
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
          {BUDDIES.map(b => {
            const idle    = b.anims[b.idleAnim]
            // Normalize all previews to a fixed 56px wide so any tile size fits
            const scale   = 56 / b.tileW
            const pw      = 56
            const ph      = Math.round(b.tileH * scale)
            const active  = currentId === b.id
            return (
              <motion.button
                key={b.id}
                onClick={() => selectBuddy(b.id)}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{
                  border: active ? "2px solid var(--c-primary)" : "1.5px solid var(--border-mid)",
                  borderRadius: 12, background: active ? "var(--surface)" : "transparent",
                  cursor: "pointer", padding: "12px 4px 10px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}
              >
                <div style={{
                  width: pw, height: ph,
                  backgroundImage: `url('${b.src}')`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${Math.round(b.sheetW * scale)}px ${Math.round(b.sheetH * scale)}px`,
                  backgroundPosition: `0px -${Math.round(idle.row * ph)}px`,
                  imageRendering: "pixelated",
                }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", fontWeight: 500, color: "var(--c-secondary)" }}>
                  {b.name}
                </span>
              </motion.button>
            )
          })}
        </div>

        <motion.button
          onClick={() => { onClose(); router.push("/onboarding?draw=1") }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 12, cursor: "pointer",
            border: currentId === "custom" ? "2px solid var(--c-primary)" : "1.5px solid var(--border-mid)",
            background: currentId === "custom" ? "var(--surface)" : "transparent",
            fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 600,
            color: "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Draw your own
        </motion.button>
      </motion.div>
    </>
  )
}

// ── Custom drawn buddy ────────────────────────────────────────
function CustomBuddy() {
  const [src,         setSrc]         = useState<string | null>(null)
  const [topFraction, setTopFraction] = useState(0.1)
  const [speech,      setSpeech]      = useState<string | null>(null)
  const [petId,       setPetId]       = useState<number | null>(null)
  const petCount    = useRef(0)
  const lineRef     = useRef(0)
  const speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [imgRef, animate] = useAnimate()

  useEffect(() => {
    setSrc(localStorage.getItem("customBuddyData"))
    const t = localStorage.getItem("customBuddyTop")
    if (t) setTopFraction(parseFloat(t))
    function onUpdate() {
      if (localStorage.getItem("buddyId") !== "custom") return
      setSrc(localStorage.getItem("customBuddyData"))
      const t2 = localStorage.getItem("customBuddyTop")
      if (t2) setTopFraction(parseFloat(t2))
    }
    window.addEventListener("buddySelected", onUpdate)
    return () => window.removeEventListener("buddySelected", onUpdate)
  }, [])

  useEffect(() => {
    if (!src || !imgRef.current) return
    let cancelled = false

    async function roam() {
      let x = 0

      while (!cancelled) {
        // In CSS/Framer Motion: positive x = RIGHT (off screen), negative x = LEFT (into screen).
        // Companion is anchored at right:MAIN_RIGHT (16px from right edge).
        // maxRightward: how far right we allow (keep ≥8px from right viewport edge)
        // maxLeftward:  how far left we allow (keep ≥16px from left viewport edge)
        const maxRightward = Math.max(0, MAIN_RIGHT - 8)
        const maxLeftward  = Math.max(0, Math.min(160, window.innerWidth - 96 - MAIN_RIGHT - 16))

        // Uniform random in [-maxLeftward, +maxRightward]
        const nextX = Math.max(-maxLeftward, Math.min(maxRightward,
          -maxLeftward + Math.random() * (maxLeftward + maxRightward)
        ))
        const dist = Math.abs(nextX - x)
        const dur  = 0.5 + (dist / 100) * 1.0 + Math.random() * 0.4

        if (Math.random() < 0.22) {
          const midX = (x + nextX) / 2
          await animate(imgRef.current, { x: midX, y: -38 }, { duration: dur * 0.45, ease: [0.215, 0.61, 0.355, 1] })
          if (cancelled) break
          await animate(imgRef.current, { x: nextX, y: 0 }, { duration: dur * 0.4, ease: [0.55, 0, 1, 0.45] })
        } else {
          await animate(imgRef.current, { x: nextX }, { duration: dur, ease: "easeInOut" })
        }

        if (cancelled) break
        x = nextX
        await new Promise(r => setTimeout(r, 400 + Math.random() * 900))
      }
    }

    roam()
    return () => { cancelled = true }
  }, [src])

  function handleClick() {
    petCount.current++
    setPetId(petCount.current)
    const lines = ["You drew me!", "One of a kind.", "Pixel perfect.", "Still here!", "Made with love.", "✦"]
    clearTimeout(speechTimer.current)
    setSpeech(lines[lineRef.current % lines.length])
    lineRef.current++
    speechTimer.current = setTimeout(() => setSpeech(null), 2500)
  }

  if (!src) return null

  const bubbleBottom = Math.round((1 - topFraction) * 96) + 6

  return (
    <div
      ref={imgRef}
      onClick={handleClick}
      style={{ position: "fixed", bottom: 12, right: MAIN_RIGHT, zIndex: 60, cursor: "pointer", lineHeight: 0 }}
    >
      <div style={{ position: "relative", lineHeight: 0 }}>
        {speech && <SpeechBubbleAbs text={speech} bottom={bubbleBottom} />}
        {petId !== null && <PetHand key={petId} onDone={() => setPetId(null)} />}
        <img
          src={src} alt="Your companion" draggable={false}
          style={{ width: 96, height: 96, imageRendering: "pixelated", display: "block" }}
        />
      </div>
    </div>
  )
}

// ── Main page buddy ───────────────────────────────────────────
export default function SpriteBuddy() {
  const [buddy,    setBuddy]    = useState<BuddyDef | null>(null)
  const [isCustom, setIsCustom] = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [speech,   setSpeech]   = useState<string | null>(null)
  const [petId,    setPetId]    = useState<number | null>(null)
  const petCount    = useRef(0)

  const divRef      = useRef<HTMLDivElement>(null)
  const animRef     = useRef<string>("")
  const flipRef     = useRef(false)
  const lineIndex   = useRef(0)
  const speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    function load() {
      const id = localStorage.getItem("buddyId")
      if (!id || id === "none") return
      if (id === "custom") { setIsCustom(true); setBuddy(null); return }
      setIsCustom(false)
      const def = getBuddy(id)
      if (!def) return
      setBuddy(def)
      animRef.current = def.idleAnim
    }
    load()
    window.addEventListener("buddySelected", load)
    return () => window.removeEventListener("buddySelected", load)
  }, [])

  useEffect(() => {
    const open = () => setEditing(true)
    window.addEventListener("openCompanionEditor", open)
    return () => window.removeEventListener("openCompanionEditor", open)
  }, [])

  // Behaviour pool
  useEffect(() => {
    if (!buddy) return
    let tid: ReturnType<typeof setTimeout>
    function next() {
      const picked = buddy!.pool[Math.floor(Math.random() * buddy!.pool.length)]
      animRef.current = picked
      flipRef.current = ["walk", "run", "trot"].includes(picked) && Math.random() < 0.4
      tid = setTimeout(next, 1800 + Math.random() * 4200)
    }
    tid = setTimeout(next, 1200)
    return () => clearTimeout(tid)
  }, [buddy])

  // Pre-detect valid frames for all animations when buddy changes
  const validFramesMap = useRef<Record<string, number[]>>({})
  useEffect(() => {
    if (!buddy) return
    validFramesMap.current = {}
    for (const [key, animDef] of Object.entries(buddy.anims)) {
      detectValidFrames(buddy.src, animDef.row, animDef.frames, buddy.tileW, buddy.tileH, buddy.sheetW, buddy.sheetH)
        .then(frames => { validFramesMap.current[key] = frames })
    }
  }, [buddy])

  // Sprite frame ticker + flip
  useEffect(() => {
    if (!buddy) return
    const el = divRef.current
    if (!el) return
    const safeEl = el
    const buddyScale = buddy.displayScale ?? SCALE
    const w = buddy.tileW * buddyScale
    const h = buddy.tileH * buddyScale
    let lastAnim = ""
    let iid: ReturnType<typeof setInterval> | undefined
    let frameIdx = 0   // index into validFrames (not raw frame number)

    function startAnim() {
      const key     = animRef.current || buddy!.idleAnim
      const animDef = buddy!.anims[key] ?? buddy!.anims[buddy!.idleAnim]
      clearInterval(iid)
      frameIdx = 0
      safeEl.style.backgroundPosition = `0px -${animDef.row * h}px`
      safeEl.style.transform = flipRef.current ? "scaleX(-1)" : "none"
      lastAnim = key
      iid = setInterval(() => {
        if (animRef.current !== lastAnim) { startAnim(); return }
        const valid = validFramesMap.current[key]
        if (valid?.length) {
          frameIdx = (frameIdx + 1) % valid.length
          safeEl.style.backgroundPosition = `-${valid[frameIdx] * w}px -${animDef.row * h}px`
        } else {
          frameIdx = (frameIdx + 1) % animDef.frames
          safeEl.style.backgroundPosition = `-${frameIdx * w}px -${animDef.row * h}px`
        }
        safeEl.style.transform = flipRef.current ? "scaleX(-1)" : "none"
      }, 1000 / animDef.fps)
    }
    startAnim()
    return () => clearInterval(iid)
  }, [buddy])

  function handleClick() {
    if (!buddy) return

    petCount.current++
    setPetId(petCount.current)

    const lines = DIALOG[buddy.id] ?? ["..."]
    clearTimeout(speechTimer.current)
    setSpeech(lines[lineIndex.current % lines.length])
    lineIndex.current++
    speechTimer.current = setTimeout(() => setSpeech(null), 2500)
  }

  const keyframes = `
    @keyframes bubbleIn {
      from { opacity: 0; transform: scale(0.85) translateY(4px); transform-origin: bottom right; }
      to   { opacity: 1; transform: scale(1)    translateY(0px); transform-origin: bottom right; }
    }
    @keyframes summonSlideUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

  `

  const currentId = isCustom ? "custom" : (buddy?.id ?? null)

  if (isCustom) return (
    <>
      <AnimatePresence>
        {editing && <CompanionEditModal currentId={currentId} onClose={() => setEditing(false)} />}
      </AnimatePresence>
      <CustomBuddy />
      <style>{keyframes}</style>
    </>
  )

  if (!buddy) return null

  const buddyScale = buddy.displayScale ?? SCALE
  const w = buddy.tileW * buddyScale
  const h = buddy.tileH * buddyScale

  return (
    <>
      <AnimatePresence>
        {editing && <CompanionEditModal currentId={currentId} onClose={() => setEditing(false)} />}
      </AnimatePresence>

      {/* Bubble: sits upper-left of companion, tail points bottom-right toward it */}
      {speech && (
        <div style={{
          position: "fixed", bottom: 12 + h * 0.65,
          right: MAIN_RIGHT + w - 36,
          pointerEvents: "none", zIndex: 70,
        }}>
          <SpeechBubble text={speech} />
        </div>
      )}

      <div
        onClick={handleClick}
        style={{ position: "fixed", bottom: 12, right: `max(${MAIN_RIGHT}px, env(safe-area-inset-right, 0px))`, zIndex: 60, cursor: "pointer", lineHeight: 0 }}
        className="companion-anchor"
      >
        <div style={{ position: "relative", lineHeight: 0 }}>
          {petId !== null && <PetHand key={petId} onDone={() => setPetId(null)} />}
          <div
            ref={divRef}
            style={{
              width:              w,
              height:             h,
              backgroundImage:    `url('${buddy.src}')`,
              backgroundRepeat:   "no-repeat",
              backgroundSize:     `${buddy.sheetW * buddyScale}px ${buddy.sheetH * buddyScale}px`,
              backgroundPosition: "0px 0px",
              imageRendering:     "pixelated",
            }}
          />
        </div>
      </div>

      <style>{keyframes}</style>
    </>
  )
}
