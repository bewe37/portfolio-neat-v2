"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion"
import { playClick } from "@/lib/click-sound"
import { BUDDIES, type BuddyDef } from "@/lib/buddies"
import { SpriteView } from "@/components/SpriteBuddy"
import LogoAvatar from "@/components/LogoAvatar"

const SCALE = 4

// ── Meteor canvas ─────────────────────────────────────────────
interface MeteorData {
  x: number; y: number; vx: number; vy: number
  age: number; life: number; tail: number; bright: boolean
}
const M_ANGLE = 32 * Math.PI / 180
const M_COS   = Math.cos(M_ANGLE)
const M_SIN   = Math.sin(M_ANGLE)

function MeteorCanvas({ spawnRef }: { spawnRef: React.RefObject<((x: number, y: number) => void) | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext("2d")!
    const meteors: MeteorData[] = []
    let raf = 0, lastTime = performance.now(), nextSpawnIn = 0

    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function spawn(bright = false, sx?: number, sy?: number) {
      const spd = bright ? 750 : 160 + Math.random() * 220
      meteors.push({
        x: sx ?? (0.05 + Math.random() * 0.85) * canvas.width,
        y: sy ?? -10 + Math.random() * canvas.height * 0.35,
        vx: M_COS * spd, vy: M_SIN * spd,
        age: 0, life: bright ? 1.1 : 1.6 + Math.random() * 2.6,
        tail: bright ? 240 : 60 + Math.random() * 90, bright,
      })
    }
    spawnRef.current = (x, y) => spawn(true, x, y)

    interface Star { x: number; y: number; r: number; base: number; phase: number; speed: number; driftR: number; driftPhase: number; driftSpeed: number }
    const stars: Star[] = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.4 + Math.random() * 1.2, base: 0.18 + Math.random() * 0.48,
      phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 1.2,
      driftR: 8 + Math.random() * 24, driftPhase: Math.random() * Math.PI * 2,
      driftSpeed: 0.04 + Math.random() * 0.08,
    }))

    for (let i = 0; i < 5; i++) { spawn(); meteors[i].age = Math.random() * meteors[i].life * 0.6 }

    function frame(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const t = now / 1000
      for (const s of stars) {
        const alpha = Math.max(0, s.base + Math.sin(t * s.speed + s.phase) * 0.22)
        const px = s.x * canvas.width  + Math.cos(t * s.driftSpeed + s.driftPhase) * s.driftR
        const py = s.y * canvas.height + Math.sin(t * s.driftSpeed + s.driftPhase * 1.3) * s.driftR * 0.6
        ctx.beginPath(); ctx.arc(px, py, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.fill()
      }
      nextSpawnIn -= dt
      if (nextSpawnIn <= 0) { spawn(); nextSpawnIn = 1.8 + Math.random() * 3.5 }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]; m.age += dt
        if (m.age >= m.life) { meteors.splice(i, 1); continue }
        const t2 = m.age / m.life
        const fade = t2 < 0.08 ? t2 / 0.08 : t2 > 0.62 ? 1 - (t2 - 0.62) / 0.38 : 1
        const hx = m.x + m.vx * m.age, hy = m.y + m.vy * m.age
        const tx = hx - M_COS * m.tail, ty = hy - M_SIN * m.tail
        const g = ctx.createLinearGradient(tx, ty, hx, hy)
        if (m.bright) {
          g.addColorStop(0, "rgba(255,200,100,0)")
          g.addColorStop(0.6, `rgba(255,225,150,${0.6 * fade})`)
          g.addColorStop(1, `rgba(255,255,235,${fade})`)
        } else {
          g.addColorStop(0, "rgba(255,255,255,0)")
          g.addColorStop(1, `rgba(255,255,255,${0.42 * fade})`)
        }
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy)
        ctx.strokeStyle = g; ctx.lineWidth = m.bright ? 2.5 : 1; ctx.stroke()
        if (m.bright) {
          const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 10)
          glow.addColorStop(0, `rgba(255,245,200,${fade * 0.9})`); glow.addColorStop(1, "rgba(255,245,200,0)")
          ctx.beginPath(); ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill()
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    function onVis() { if (document.hidden) cancelAnimationFrame(raf); else { lastTime = performance.now(); raf = requestAnimationFrame(frame) } }
    document.addEventListener("visibilitychange", onVis)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener("visibilitychange", onVis); spawnRef.current = null }
  }, [spawnRef])

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
}

// ── Buddy card ────────────────────────────────────────────────
function BuddyCard({ buddy, selected, dimmed, onSelect }: {
  buddy: BuddyDef; selected: boolean; dimmed: boolean; onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const animKey = dimmed ? "sleep" : hovered || selected ? buddy.hoverAnim : buddy.idleAnim

  return (
    <button
      onClick={() => { playClick(); onSelect() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:  "none",
        border:      "none",
        padding:     0,
        cursor:      "pointer",
        display:     "flex",
        flexDirection: "column",
        alignItems:  "center",
        gap:         16,
        outline:     "none",
        opacity:     dimmed ? 0.35 : 1,
        filter:      dimmed ? "saturate(0)" : "none",
        transform:   selected ? "translateY(-8px) scale(1.04)" : hovered && !dimmed ? "translateY(-4px) scale(1.02)" : "none",
        transition:  "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease, filter 0.4s ease",
      }}
    >
      <div style={{
        width:          buddy.tileW * SCALE + 32,
        height:         buddy.tileH * SCALE + 32,
        borderRadius:   20,
        border:         `2px solid ${selected ? "var(--c-primary)" : "var(--border)"}`,
        background:     selected ? "var(--hover-bg)" : "var(--image-bg)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        transition:     "border-color 0.2s ease, background 0.2s ease",
        boxShadow:      selected ? "0 0 0 4px var(--c-ghost)" : "none",
        position:       "relative",
        overflow:       "hidden",
      }}>
        <div style={{
          position:        "absolute", inset: 0,
          backgroundImage: "radial-gradient(var(--dot-color) 1px, transparent 1px)",
          backgroundSize:  "10px 10px",
          pointerEvents:   "none",
        }} />
        <SpriteView buddy={buddy} animKey={animKey} scale={SCALE} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "1.125rem", fontWeight: 700, color: "var(--c-primary)", letterSpacing: "-0.01em" }}>
          {buddy.name}
        </span>
      </div>

      {selected && (
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "var(--c-primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4L4.2 7.5L10 1" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </button>
  )
}

// ── Welcome step ──────────────────────────────────────────────
const W_COL_GAP = 8
const W_COL_CFG = [
  { dur: 22, dir: "up",   offset: 0  },
  { dur: 16, dir: "down", offset: 4  },
  { dur: 27, dir: "up",   offset: 9  },
  { dur: 19, dir: "down", offset: 2  },
  { dur: 24, dir: "up",   offset: 7  },
  { dur: 17, dir: "down", offset: 11 },
  { dur: 29, dir: "up",   offset: 5  },
] as const

function WelcomeStep({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
  const spawnRef = useRef<((x: number, y: number) => void) | null>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [sampleUrls] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    return G_SAMPLES.map(fn => {
      const cv = document.createElement("canvas")
      cv.width = 16; cv.height = 16
      fn(cv.getContext("2d")!)
      return cv.toDataURL()
    })
  })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top)  / rect.height - 0.5)
  }

  function handleLeftClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return
    spawnRef.current?.(e.clientX, e.clientY)
  }

  const springCfg = { stiffness: 38, damping: 18, mass: 1 }
  const panelX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springCfg)
  const panelY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-6,   6]), springCfg)

  function colItems(offset: number): string[] {
    if (sampleUrls.length === 0) return []
    const n = sampleUrls.length
    const base = Array.from({ length: 14 }, (_, i) => sampleUrls[(i + offset) % n])
    return [...base, ...base]
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{ display: "flex", minHeight: "100dvh", fontFamily: "var(--font-sans)", background: "#0e0d0c", overflow: "hidden" }}
    >
      {/* ── Left: meteor + editorial text ── */}
      <div
        onClick={handleLeftClick}
        style={{
          width: "48%", flexShrink: 0,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "64px 80px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          position: "relative", zIndex: 2,
          overflow: "hidden", cursor: "default",
        }}
      >
        <MeteorCanvas spawnRef={spawnRef} />
        {/* Top/bottom fades so stars don't bleed into edges */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, #0e0d0c, transparent)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, #0e0d0c, transparent)", pointerEvents: "none", zIndex: 1 }} />

        {/* Content sits above canvas */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column" }}>
          <div style={{ animation: "fadeUp 0.55s 0.05s cubic-bezier(0.22,1,0.36,1) both", marginBottom: 40 }}>
            <motion.div
              initial={{ y: 0, rotate: -4 }}
              animate={{ y: -10, rotate: 4 }}
              transition={{
                y:      { duration: 3.2, repeat: Infinity, repeatType: "reverse", ease: [0.37, 0, 0.63, 1], delay: 0.6 },
                rotate: { duration: 4.5, repeat: Infinity, repeatType: "reverse", ease: [0.37, 0, 0.63, 1], delay: 0.2 },
              }}
              style={{ display: "inline-block" }}
            >
              <LogoAvatar />
            </motion.div>
          </div>

          <div style={{ animation: "fadeUp 0.55s 0.14s cubic-bezier(0.22,1,0.36,1) both", marginBottom: 20 }}>
            <h1 style={{
              fontSize: "clamp(38px, 3.8vw, 62px)", fontWeight: 800,
              color: "#f4f4f5", margin: 0, letterSpacing: "-0.04em", lineHeight: 1.06,
            }}>
              Hey,<br /><span className="shiny-text">I'm Georgius</span>.
            </h1>
          </div>

          <div style={{ animation: "fadeUp 0.55s 0.22s cubic-bezier(0.22,1,0.36,1) both", marginBottom: 40 }}>
            <p style={{
              fontSize: "0.9375rem", fontWeight: 450, color: "rgba(244,244,245,0.52)",
              margin: 0, lineHeight: 1.65, maxWidth: 400,
            }}>
              Every good portfolio needs a companion. Pick one and they'll keep you company as you browse.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, animation: "fadeUp 0.55s 0.30s cubic-bezier(0.22,1,0.36,1) both", marginBottom: 48 }}>
            <button className="btn-dark-fill" onClick={() => { playClick(); onContinue() }} style={{
              padding: "12px 28px", borderRadius: 99, border: "none",
              fontSize: "0.875rem", fontWeight: 600, fontFamily: "var(--font-sans)",
              cursor: "pointer", letterSpacing: "-0.01em", position: "relative", overflow: "hidden",
            }}>
              Pick a companion →
            </button>
            <button onClick={() => { playClick(); onSkip() }} style={{
              padding: "12px 20px", borderRadius: 99,
              border: "1px solid rgba(244,244,245,0.12)", background: "rgba(255,255,255,0.04)",
              color: "rgba(244,244,245,0.38)", fontSize: "0.875rem", fontWeight: 500,
              fontFamily: "var(--font-sans)", cursor: "pointer", letterSpacing: "-0.01em",
              transition: "color 0.15s ease, border-color 0.15s ease, background 0.15s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(244,244,245,0.80)"; e.currentTarget.style.borderColor = "rgba(244,244,245,0.28)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)" }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(244,244,245,0.38)"; e.currentTarget.style.borderColor = "rgba(244,244,245,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
            >
              Skip
            </button>
          </div>

        </div>

        {/* Bottom-left footer */}
        <div style={{
          position: "absolute", bottom: 28, left: 52, zIndex: 2,
          animation: "fadeUp 0.55s 0.40s cubic-bezier(0.22,1,0.36,1) both",
          fontFamily: "'Departure Mono', monospace", fontSize: "0.625rem",
          color: "rgba(244,244,245,0.30)", letterSpacing: "0.06em", lineHeight: 1.6, userSelect: "none",
        }}>
          Georgius Bryan<br />
          <span style={{ color: "rgba(244,244,245,0.18)" }}>Portfolio — 2026</span>
        </div>
      </div>

      {/* ── Right: vertical scrolling companion columns ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Grain */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.40,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px", mixBlendMode: "overlay",
        }} />
        {/* Edge fades */}
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 70, zIndex: 5, pointerEvents: "none", background: "linear-gradient(to right, #0e0d0c, transparent)" }} />
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 50, zIndex: 5, pointerEvents: "none", background: "linear-gradient(to left, #0e0d0c, transparent)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 100, zIndex: 5, pointerEvents: "none", background: "linear-gradient(to bottom, #0e0d0c, transparent)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, zIndex: 5, pointerEvents: "none", background: "linear-gradient(to top, #0e0d0c, transparent)" }} />

        {/* Mouse-drift + columns filling the full width */}
        <motion.div style={{
          x: panelX, y: panelY,
          display: "flex", gap: W_COL_GAP,
          position: "absolute", inset: 0,
        }}>
          {W_COL_CFG.map((col, ci) => {
            const items = colItems(col.offset)
            return (
              <div key={ci} style={{ flex: 1, overflow: "hidden", height: "100%" }}>
                <div style={{
                  display: "flex", flexDirection: "column", gap: W_COL_GAP,
                  willChange: "transform",
                  animation: `w-scroll-${col.dir} ${col.dur}s linear infinite`,
                }}>
                  {items.map((url, j) => (
                    <div key={j} style={{
                      width: "100%", aspectRatio: "1", flexShrink: 0,
                      background: "#f0ece4", borderRadius: 10, padding: "11%",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.35)",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" draggable={false}
                        style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" }} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

// ── Close (X) button ──────────────────────────────────────────
function BackBtn({ onClick, dark }: { onClick: () => void; dark?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => { playClick(); onClick() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:   "absolute", top: 24, left: 24, zIndex: 10,
        display:    "inline-flex", alignItems: "center", justifyContent: "center",
        width:      32, height: 32, borderRadius: "50%",
        background: dark
          ? (hov ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)")
          : (hov ? "var(--hover-bg)" : "transparent"),
        border:     dark
          ? `1px solid ${hov ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)"}`
          : "1px solid var(--border)",
        cursor:     "pointer",
        color:      dark
          ? (hov ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)")
          : (hov ? "var(--c-primary)" : "var(--c-secondary)"),
        transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
        padding:    0,
      }}
      aria-label="Close"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

// ── Pixel draw canvas ─────────────────────────────────────────
const DRAW_PALETTE = [
  "#000000", "#1D2B53", "#7E2553", "#008751",
  "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8",
  "#FF004D", "#FFA300", "#FFEC27", "#00E436",
  "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA",
]
const DG = 16  // grid size
const DC = 18  // cell px

// ── Gallery data ───────────────────────────────────────────────
const G_ROW_CFG: { dir: "left" | "right"; duration: number }[] = [
  { dir: "left",  duration: 38 },
  { dir: "right", duration: 26 },
  { dir: "left",  duration: 44 },
  { dir: "right", duration: 22 },
  { dir: "left",  duration: 32 },
  { dir: "right", duration: 48 },
]
const G_ITEM_SIZE  = 100
const G_ITEM_GAP   = 14
const G_ITEMS_HALF = 22
type GDrawFn = (ctx: CanvasRenderingContext2D) => void
const G_SAMPLES: GDrawFn[] = [
  (c) => { c.fillStyle="#FFA300"; c.fillRect(3,4,10,8); c.fillRect(3,2,3,3); c.fillRect(10,2,3,3); c.fillStyle="#00E436"; c.fillRect(5,5,2,3); c.fillRect(9,5,2,3); c.fillStyle="#FF77A8"; c.fillRect(7,8,2,1); c.fillStyle="#FFF1E8"; c.fillRect(1,8,3,1); c.fillRect(12,8,3,1) },
  (c) => { c.fillStyle="#29ADFF"; c.fillRect(3,5,9,5); c.fillStyle="#1D2B53"; c.fillRect(10,4,2,2); c.fillStyle="#FFEC27"; c.fillRect(12,5,2,1); c.fillStyle="#FFF1E8"; c.fillRect(11,4,1,1); c.fillStyle="#83769C"; c.fillRect(5,8,3,2); c.fillStyle="#FFA300"; c.fillRect(4,10,1,2); c.fillRect(7,10,1,2) },
  (c) => { c.fillStyle="#FFEC27"; c.fillRect(6,6,4,4); c.fillStyle="#FF77A8"; c.fillRect(5,3,2,3); c.fillRect(9,3,2,3); c.fillRect(3,5,3,2); c.fillRect(10,5,3,2); c.fillRect(5,10,2,3); c.fillRect(9,10,2,3); c.fillRect(3,9,3,2); c.fillRect(10,9,3,2); c.fillStyle="#008751"; c.fillRect(7,13,2,3); c.fillRect(5,14,2,1); c.fillRect(9,12,2,1) },
  (c) => { c.fillStyle="#FF004D"; c.fillRect(4,1,8,2); c.fillRect(3,3,10,4); c.fillRect(2,7,12,2); c.fillStyle="#FFF1E8"; c.fillRect(5,9,6,6); c.fillRect(4,4,2,2); c.fillRect(10,5,2,2); c.fillRect(7,3,2,1); c.fillStyle="#5F574F"; c.fillRect(6,10,1,1); c.fillRect(9,10,1,1); c.fillRect(7,12,2,1) },
  (c) => { c.fillStyle="#C2C3C7"; c.fillRect(4,2,8,10); c.fillRect(3,4,1,7); c.fillRect(12,4,1,7); c.fillRect(3,11,2,2); c.fillRect(7,11,2,2); c.fillRect(11,11,2,2); c.fillStyle="#1D2B53"; c.fillRect(5,5,3,4); c.fillRect(9,5,3,4); c.fillStyle="#FFF1E8"; c.fillRect(6,6,1,1); c.fillRect(10,6,1,1) },
  (c) => { c.fillStyle="#FF004D"; c.fillRect(4,3,8,7); c.fillRect(3,5,1,5); c.fillRect(12,5,1,5); c.fillStyle="#FFF1E8"; c.fillRect(5,4,3,3); c.fillRect(9,5,2,2); c.fillStyle="#FFCCAA"; c.fillRect(5,10,6,5); c.fillStyle="#FFF1E8"; c.fillRect(4,12,1,1); c.fillRect(11,12,1,1) },
  (c) => { c.fillStyle="#FF004D"; c.fillRect(2,4,4,5); c.fillRect(10,4,4,5); c.fillRect(1,7,14,5); c.fillRect(3,11,10,2); c.fillRect(5,12,6,2); c.fillRect(7,13,2,2); c.fillStyle="#FF77A8"; c.fillRect(3,5,2,2); c.fillRect(11,5,2,2) },
  (c) => { c.fillStyle="#5F574F"; c.fillRect(3,3,10,10); c.fillRect(2,5,1,6); c.fillRect(13,5,1,6); c.fillStyle="#29ADFF"; c.fillRect(5,5,3,3); c.fillRect(9,5,3,3); c.fillStyle="#FFEC27"; c.fillRect(6,6,1,1); c.fillRect(10,6,1,1); c.fillStyle="#C2C3C7"; c.fillRect(5,10,6,2); c.fillStyle="#AB5236"; c.fillRect(6,2,1,1); c.fillRect(10,2,1,1) },
  (c) => { c.fillStyle="#008751"; c.fillRect(5,2,6,4); c.fillRect(4,5,8,4); c.fillRect(3,8,10,4); c.fillStyle="#00E436"; c.fillRect(6,3,2,3); c.fillRect(5,6,2,2); c.fillStyle="#AB5236"; c.fillRect(6,12,4,4); c.fillStyle="#5F574F"; c.fillRect(5,14,1,2) },
  (c) => { c.fillStyle="#00E436"; c.fillRect(5,4,6,8); c.fillRect(4,5,1,6); c.fillRect(11,5,1,6); c.fillRect(6,3,4,1); c.fillStyle="#29ADFF"; c.fillRect(5,6,3,3); c.fillRect(8,6,3,3); c.fillStyle="#FFF1E8"; c.fillRect(5,7,2,1); c.fillRect(8,7,2,1); c.fillStyle="#008751"; c.fillRect(6,10,4,1); c.fillRect(5,11,1,3); c.fillRect(10,11,1,3); c.fillRect(6,12,2,4); c.fillRect(8,12,2,4) },
  (c) => { c.fillStyle="#FFEC27"; c.fillRect(7,1,2,5); c.fillRect(7,10,2,5); c.fillRect(1,7,5,2); c.fillRect(10,7,5,2); c.fillRect(3,3,2,2); c.fillRect(11,3,2,2); c.fillRect(3,11,2,2); c.fillRect(11,11,2,2); c.fillRect(5,5,6,6); c.fillStyle="#FFA300"; c.fillRect(6,6,4,4); c.fillStyle="#FFF1E8"; c.fillRect(6,5,2,2) },
  (c) => { c.fillStyle="#FFEC27"; c.fillRect(4,4,8,8); c.fillRect(7,1,2,3); c.fillRect(7,12,2,3); c.fillRect(1,7,3,2); c.fillRect(12,7,3,2); c.fillRect(2,2,2,2); c.fillRect(12,2,2,2); c.fillRect(2,12,2,2); c.fillRect(12,12,2,2); c.fillStyle="#5F574F"; c.fillRect(6,6,2,2); c.fillRect(9,6,2,2); c.fillStyle="#FFF1E8"; c.fillRect(6,5,1,1); c.fillRect(9,5,1,1); c.fillStyle="#AB5236"; c.fillRect(6,10,4,1) },
  (c) => { c.fillStyle="#C2C3C7"; c.fillRect(4,5,8,7); c.fillRect(5,4,6,1); c.fillRect(3,6,1,5); c.fillRect(12,6,1,5); c.fillRect(5,2,2,4); c.fillRect(9,2,2,4); c.fillStyle="#FF77A8"; c.fillRect(5,3,2,2); c.fillRect(9,3,2,2); c.fillStyle="#5F574F"; c.fillRect(6,7,2,2); c.fillRect(9,7,2,2); c.fillStyle="#FF77A8"; c.fillRect(7,9,2,2); c.fillStyle="#FFF1E8"; c.fillRect(6,6,1,1); c.fillRect(9,6,1,1); c.fillStyle="#C2C3C7"; c.fillRect(3,11,3,2); c.fillRect(10,11,3,2) },
  (c) => { c.fillStyle="#7E2553"; c.fillRect(4,5,8,7); c.fillRect(3,6,1,5); c.fillRect(12,6,1,5); c.fillRect(3,3,3,3); c.fillRect(10,3,3,3); c.fillStyle="#FF004D"; c.fillRect(4,4,2,2); c.fillRect(10,4,2,2); c.fillStyle="#FFEC27"; c.fillRect(5,7,2,2); c.fillRect(9,7,2,2); c.fillStyle="#5F574F"; c.fillRect(5,6,1,1); c.fillRect(10,6,1,1); c.fillStyle="#FF004D"; c.fillRect(6,10,4,1); c.fillStyle="#FFA300"; c.fillRect(4,11,2,4); c.fillRect(10,11,2,4) },
  (c) => { c.fillStyle="#7E2553"; c.fillRect(6,1,4,6); c.fillRect(5,3,6,4); c.fillRect(4,5,8,3); c.fillRect(3,7,10,2); c.fillRect(2,9,12,3); c.fillStyle="#FFEC27"; c.fillRect(7,3,2,1); c.fillStyle="#FFF1E8"; c.fillRect(7,3,1,1); c.fillRect(8,4,1,1); c.fillStyle="#FF77A8"; c.fillRect(5,10,6,2); c.fillStyle="#FFCCAA"; c.fillRect(6,12,4,4); c.fillStyle="#5F574F"; c.fillRect(6,13,1,2); c.fillRect(9,13,1,2) },
]
function buildGalleryRow(pool: string[], rowIdx: number): string[] {
  const offset  = (rowIdx * 4) % pool.length
  const shifted = [...pool.slice(offset), ...pool.slice(0, offset)]
  const half: string[] = []
  while (half.length < G_ITEMS_HALF) half.push(...shifted)
  return [...half.slice(0, G_ITEMS_HALF), ...half.slice(0, G_ITEMS_HALF)]
}

function DrawCanvas({ onSave }: { onSave: () => void }) {
  const [pixels,   setPixels]   = useState<(string | null)[]>(() => Array(DG * DG).fill(null))
  const [color,    setColor]    = useState(DRAW_PALETTE[8])
  const [erasing,  setErasing]  = useState(false)
  const [painting, setPainting] = useState(false)
  const [history,  setHistory]  = useState<(string | null)[][]>([])
  const gridRef    = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)

  // Load existing drawing from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("customBuddyData")
    if (!saved) return
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement("canvas")
      cv.width = DG; cv.height = DG
      const ctx = cv.getContext("2d")!
      ctx.drawImage(img, 0, 0, DG, DG)
      const data = ctx.getImageData(0, 0, DG, DG).data
      const loaded: (string | null)[] = Array(DG * DG).fill(null)
      for (let i = 0; i < DG * DG; i++) {
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3]
        if (a < 10) continue
        loaded[i] = `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`
      }
      setPixels(loaded)
    }
    img.src = saved
  }, [])
  const hasContent = pixels.some(Boolean)

  useEffect(() => {
    const cv = previewRef.current; if (!cv) return
    const ctx = cv.getContext("2d")!
    ctx.clearRect(0, 0, DG, DG)
    pixels.forEach((px, i) => {
      if (!px) return
      ctx.fillStyle = px
      ctx.fillRect(i % DG, Math.floor(i / DG), 1, 1)
    })
  }, [pixels])

  function applyAt(idx: number) {
    if (idx < 0 || idx >= DG * DG) return
    setPixels(prev => {
      const val = erasing ? null : color
      if (prev[idx] === val) return prev
      const next = [...prev]; next[idx] = val; return next
    })
  }

  function startPaint(idx: number, e: React.MouseEvent) {
    e.preventDefault()
    setHistory(h => [...h.slice(-29), [...pixels]])
    setPainting(true); applyAt(idx)
  }

  function handleTouchStart(e: React.TouchEvent) {
    e.preventDefault()
    setHistory(h => [...h.slice(-29), [...pixels]])
    setPainting(true)
    const t = e.touches[0], rect = gridRef.current!.getBoundingClientRect()
    applyAt(Math.floor((t.clientY - rect.top) / DC) * DG + Math.floor((t.clientX - rect.left) / DC))
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault(); if (!painting) return
    const t = e.touches[0], rect = gridRef.current!.getBoundingClientRect()
    applyAt(Math.floor((t.clientY - rect.top) / DC) * DG + Math.floor((t.clientX - rect.left) / DC))
  }

  const undo  = () => { if (!history.length) return; setPixels(history[history.length - 1]); setHistory(h => h.slice(0, -1)) }
  const clear = () => { if (!hasContent) return; setHistory(h => [...h.slice(-29), [...pixels]]); setPixels(Array(DG * DG).fill(null)) }

  function save() {
    let topRow = DG
    pixels.forEach((px, i) => { if (px) { const r = Math.floor(i / DG); if (r < topRow) topRow = r } })
    const cv = document.createElement("canvas"); cv.width = DG; cv.height = DG
    const ctx = cv.getContext("2d")!
    pixels.forEach((px, i) => { if (!px) return; ctx.fillStyle = px; ctx.fillRect(i % DG, Math.floor(i / DG), 1, 1) })
    const dataUrl = cv.toDataURL("image/png")
    localStorage.setItem("customBuddyData", dataUrl)
    localStorage.setItem("customBuddyTop", String(topRow / DG))
    localStorage.setItem("buddyId", "custom")
    window.dispatchEvent(new Event("buddySelected"))
    // Share with other visitors — fire and forget
    fetch("/api/companions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: dataUrl }),
    }).catch(() => {})
    onSave()
  }

  const PV = DG * 3

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* Left: grid + tools */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            ref={gridRef}
            onMouseLeave={() => setPainting(false)}
            onMouseUp={() => setPainting(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setPainting(false)}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${DG}, ${DC}px)`,
              borderRadius: 10, overflow: "hidden",
              border: "1px solid var(--border-mid)",
              userSelect: "none", touchAction: "none",
              cursor: erasing ? "cell" : "crosshair",
              backgroundImage: `linear-gradient(45deg,rgba(0,0,0,.06) 25%,transparent 25%),linear-gradient(-45deg,rgba(0,0,0,.06) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,rgba(0,0,0,.06) 75%),linear-gradient(-45deg,transparent 75%,rgba(0,0,0,.06) 75%)`,
              backgroundSize: `${DC * 2}px ${DC * 2}px`,
              backgroundPosition: `0 0, 0 ${DC}px, ${DC}px -${DC}px, -${DC}px 0`,
            }}
          >
            {pixels.map((px, i) => (
              <div key={i}
                onMouseDown={(e) => startPaint(i, e)}
                onMouseEnter={() => { if (painting) applyAt(i) }}
                style={{ width: DC, height: DC, backgroundColor: px ?? "transparent", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.07)" }}
              />
            ))}
          </div>

          {/* Tools below grid */}
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { label: "Erase", active: erasing,  onClick: () => setErasing(e => !e), disabled: false },
              { label: "Undo",  active: false,     onClick: undo,                      disabled: !history.length },
              { label: "Clear", active: false,     onClick: clear,                     disabled: !hasContent },
            ] as const).map(btn => (
              <button key={btn.label} onClick={() => { playClick(); btn.onClick() }} disabled={btn.disabled} style={{
                flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid var(--border-mid)",
                background: btn.active ? "var(--c-primary)" : "transparent",
                color: btn.disabled ? "var(--c-faint)" : btn.active ? "var(--bg)" : "var(--c-secondary)",
                fontSize: "0.625rem", fontWeight: 700, fontFamily: "var(--font-sans)",
                letterSpacing: "0.06em", textTransform: "uppercase" as const,
                cursor: btn.disabled ? "default" : "pointer", transition: "all 0.15s ease",
              }}>{btn.label}</button>
            ))}
          </div>
        </div>

        {/* Right panel: preview + palette */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 148 }}>

          {/* Preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", fontWeight: 700, color: "var(--c-secondary)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Preview</span>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: PV + 28, height: PV + 28, borderRadius: 12,
                border: "1px solid var(--border-mid)", background: "var(--surface)",
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundImage: "radial-gradient(var(--dot-color) 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }}
            >
              <canvas ref={previewRef} width={DG} height={DG}
                style={{ width: PV, height: PV, imageRendering: "pixelated", display: "block" }}
              />
            </motion.div>
          </div>

          {/* Palette */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", fontWeight: 700, color: "var(--c-secondary)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Colors</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 32px)", gap: 5 }}>
              {DRAW_PALETTE.map(c => (
                <motion.button key={c}
                  onClick={() => { playClick(); setColor(c); setErasing(false) }}
                  whileHover={{ scale: 1.18 }} whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 440, damping: 18 }}
                  style={{
                    width: 32, height: 32, borderRadius: 8, backgroundColor: c,
                    border: "none", outline: "none", cursor: "pointer",
                    boxShadow: color === c && !erasing
                      ? "0 0 0 2px #fff, 0 0 0 4px var(--c-primary)"
                      : "0 1px 4px rgba(0,0,0,0.22)",
                    transition: "box-shadow 0.15s ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <motion.button
        onClick={() => { if (hasContent) playClick(); save() }} disabled={!hasContent}
        className="btn-shiny"
        animate={{ opacity: hasContent ? 1 : 0.32, y: hasContent ? 0 : 4 }}
        transition={{ duration: 0.22 }}
        style={{
          padding: "11px 32px", borderRadius: 99, border: "none",
          background: "var(--c-primary)", color: "var(--bg)",
          fontSize: "0.875rem", fontWeight: 700, fontFamily: "var(--font-sans)",
          cursor: hasContent ? "pointer" : "default", letterSpacing: "-0.01em",
          position: "relative", overflow: "hidden",
        }}
      >
        Use as companion →
      </motion.button>
    </div>
  )
}

// ── Companion step ────────────────────────────────────────────
function CompanionStep({ selected, onSelect, onConfirm, onConfirmDraw, onBack, onClose, confirmed, initialTab = "pick" }: {
  selected: string | null
  onSelect: (id: string) => void
  onConfirm: () => void
  onConfirmDraw: () => void
  onBack: () => void
  onClose: () => void
  confirmed: boolean
  initialTab?: "pick" | "draw"
}) {
  const [tab, setTab] = useState<"pick" | "draw" | "gallery">(initialTab)
  const [galleryPool, setGalleryPool] = useState<string[]>([])
  const pickBtnRef   = useRef<HTMLButtonElement>(null)
  const drawBtnRef   = useRef<HTMLButtonElement>(null)
  const seeAllBtnRef = useRef<HTMLButtonElement>(null)
  const [pillStyle, setPillStyle] = useState({ x: 0, width: 0 })

  useEffect(() => {
    const ref = tab === "pick" ? pickBtnRef.current
              : tab === "draw" ? drawBtnRef.current
              : seeAllBtnRef.current
    if (ref) setPillStyle({ x: ref.offsetLeft, width: ref.offsetWidth })
  }, [tab])

  useEffect(() => {
    if (tab !== "gallery" || galleryPool.length > 0) return

    const samples = G_SAMPLES.map(fn => {
      const cv = document.createElement("canvas")
      cv.width = 16; cv.height = 16
      fn(cv.getContext("2d")!)
      return cv.toDataURL()
    })
    const custom = localStorage.getItem("customBuddyData")

    function buildPool(real: string[]) {
      const base = real.length > 0 ? [...real, ...samples] : samples
      if (custom) {
        const mixed: string[] = []
        base.forEach((s, i) => { mixed.push(s); if (i % 4 === 3) mixed.push(custom) })
        setGalleryPool(mixed)
      } else {
        setGalleryPool(base)
      }
    }

    fetch("/api/companions")
      .then(r => r.json())
      .then((d: { companions?: string[] }) => buildPool(d.companions ?? []))
      .catch(() => buildPool([]))
  }, [tab, galleryPool.length])

  const isGallery = tab === "gallery"

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
      minHeight: "100dvh", padding: "88px 24px 48px", position: "relative",
      fontFamily: "var(--font-sans)",
      background: isGallery ? "#18181b" : "var(--bg)",
      transition: "background 0.55s cubic-bezier(0.22,1,0.36,1)",
      overflowY: isGallery ? "hidden" : "auto",
      overflowX: "hidden",
    }}>
      <BackBtn onClick={isGallery ? onClose : onBack} dark={isGallery} />

      {/* ── Toggle + title ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: confirmed ? 0 : 1, y: confirmed ? 4 : 0 }}
        transition={{ duration: 0.35 }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 28, marginBottom: isGallery ? 0 : 36,
          position: "relative", zIndex: 2,
        }}
      >
        {/* Sliding pill toggle */}
        <div style={{
          position: "relative", display: "flex", gap: 3, padding: 4, borderRadius: 99,
          background:  isGallery ? "rgba(255,255,255,0.06)" : "var(--surface)",
          border:      isGallery ? "1px solid rgba(255,255,255,0.1)" : "1px solid var(--border-mid)",
          transition:  "background 0.55s ease, border-color 0.55s ease",
        }}>
          {pillStyle.width > 0 && (
            <motion.span
              animate={{ x: pillStyle.x, width: pillStyle.width }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              style={{
                position:   "absolute", top: 4, bottom: 4, left: 0,
                borderRadius: 99,
                background:  isGallery ? "rgba(255,255,255,0.14)" : "var(--bg)",
                boxShadow:   isGallery ? "none" : "0 2px 8px rgba(0,0,0,0.09)",
                pointerEvents: "none",
                transition:  "background 0.55s ease",
              }}
            />
          )}

          {(["pick", "draw"] as const).map(t => (
            <motion.button
              key={t}
              ref={t === "pick" ? pickBtnRef : drawBtnRef}
              onClick={() => { playClick(); setTab(t) }}
              style={{
                padding: "8px 20px", borderRadius: 99, border: "none",
                background: "transparent",
                color: isGallery
                  ? "rgba(255,255,255,0.4)"
                  : (tab === t ? "var(--c-primary)" : "var(--c-secondary)"),
                fontSize: "0.8125rem", fontWeight: 600, fontFamily: "var(--font-sans)",
                cursor: "pointer", letterSpacing: "-0.01em",
                display: "flex", alignItems: "center", gap: 6,
                position: "relative", zIndex: 1,
                transition: "color 0.3s ease",
              }}
            >
              {t === "pick" ? (
                <>
                  Pick a companion
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="4.8" cy="5.6" r="0.75" fill="currentColor"/>
                    <circle cx="8.2" cy="5.6" r="0.75" fill="currentColor"/>
                    <path d="M4.2 8C4.2 8 5 9.3 6.5 9.3C8 9.3 8.8 8 8.8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </>
              ) : (
                <>
                  Draw your own
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </motion.button>
          ))}

          {/* See all — opens gallery inline */}
          <motion.button
            ref={seeAllBtnRef}
            onClick={() => { playClick(); setTab("gallery") }}
            style={{
              padding: "8px 20px", borderRadius: 99, border: "none",
              background: "transparent",
              color: isGallery ? "rgba(255,255,255,0.9)" : "var(--c-secondary)",
              fontSize: "0.8125rem", fontWeight: 600, fontFamily: "var(--font-sans)",
              cursor: "pointer", letterSpacing: "-0.01em",
              display: "flex", alignItems: "center", gap: 6,
              position: "relative", zIndex: 1,
              transition: "color 0.3s ease",
            }}
          >
            See all
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <ellipse cx="4.5" cy="5" rx="3.5" ry="4" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="5.5" cy="5" r="1.4" fill="currentColor"/>
              <ellipse cx="11.5" cy="5" rx="3.5" ry="4" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="12.5" cy="5" r="1.4" fill="currentColor"/>
            </svg>
          </motion.button>
        </div>

        {!isGallery && (
          <h1 style={{
            fontSize: clamp(28, 42), fontWeight: 800, color: "var(--c-primary)",
            margin: 0, letterSpacing: "-0.03em", textAlign: "center",
          }}>
            {tab === "pick" ? "Pick your companion." : "Draw your companion."}
          </h1>
        )}
      </motion.div>

      {/* ── Gallery overlay ── */}
      {isGallery && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          display: "flex", flexDirection: "column", justifyContent: "center",
          gap: G_ITEM_GAP, overflow: "hidden",
          paddingTop: "clamp(120px, 18vh, 160px)",
        }}>
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)",
          }} />
          {galleryPool.length > 0 && G_ROW_CFG.map(({ dir, duration }, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                overflow: "hidden", flexShrink: 0,
                animation: `rowFadeIn 0.65s cubic-bezier(0.22,1,0.36,1) ${rowIdx * 0.07}s both`,
              }}
            >
              <div style={{
                display: "flex", gap: G_ITEM_GAP, width: "fit-content",
                animation: `g-scroll-${dir} ${duration}s linear infinite`,
              }}>
                {buildGalleryRow(galleryPool, rowIdx).map((url, i) => (
                  <div key={i} style={{
                    width: G_ITEM_SIZE, height: G_ITEM_SIZE, flexShrink: 0,
                    padding: 9, borderRadius: 5, background: "#f0ece4",
                    boxShadow: "0 4px 18px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" draggable={false}
                      style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab content — crossfades, no layout shift ── */}
      {!isGallery && (
        <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
          <AnimatePresence mode="wait" initial={false}>
            {tab === "pick" ? (
              <motion.div
                key="pick"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: confirmed ? 0 : 1, y: confirmed ? -8 : 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
                  {BUDDIES.map((buddy, i) => (
                    <div key={buddy.id} style={{ animation: `buddyCardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both` }}>
                      <BuddyCard buddy={buddy} selected={selected === buddy.id}
                        dimmed={selected !== null && selected !== buddy.id}
                        onSelect={() => onSelect(buddy.id)} />
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: 36,
                  opacity: selected && !confirmed ? 1 : 0,
                  transform: selected && !confirmed ? "translateY(0)" : "translateY(6px)",
                  transition: "opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  pointerEvents: selected ? "auto" : "none",
                  visibility: selected ? "visible" : "hidden",
                }}>
                  <button className="btn-shiny" onClick={() => { playClick(); onConfirm() }} style={{
                    padding: "12px 36px", borderRadius: 99, border: "none",
                    background: "var(--c-primary)", color: "var(--bg)",
                    fontSize: "0.875rem", fontWeight: 700, fontFamily: "var(--font-sans)",
                    cursor: "pointer", letterSpacing: "-0.01em", position: "relative", overflow: "hidden",
                  }}>
                    {`Let's go with ${BUDDIES.find(b => b.id === selected)?.name ?? ""} →`}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="draw"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: confirmed ? 0 : 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <DrawCanvas onSave={onConfirmDraw} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

import { Suspense } from "react"

export const dynamic = "force-dynamic"

// ── Page ──────────────────────────────────────────────────────
function OnboardingPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const drawMode     = searchParams.get("draw") === "1"
  const editMode     = searchParams.get("edit") === "1"
  const skipWelcome  = drawMode || editMode

  const [step,      setStep]      = useState<0 | 1>(skipWelcome ? 1 : 0)
  const [selected,  setSelected]  = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [leaving,   setLeaving]   = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!skipWelcome && localStorage.getItem("buddyId")) router.replace("/")
  }, [router, skipWelcome])

  function goToStep1() { setRevealing(true) }

  function closeAll() {
    setLeaving(true)
    setTimeout(() => router.replace("/"), 240)
  }

  function goBack() {
    setLeaving(true)
    if (skipWelcome) {
      setTimeout(() => router.replace("/"), 240)
    } else {
      setTimeout(() => { setLeaving(false); setStep(0); setRevealing(false) }, 240)
    }
  }

  function confirm() {
    if (!selected) return
    localStorage.setItem("buddyId", selected)
    window.dispatchEvent(new Event("buddySelected"))
    setConfirmed(true)
    setTimeout(() => router.replace("/"), 600)
  }

  function confirmDraw() {
    setConfirmed(true)
    setTimeout(() => router.replace("/"), 600)
  }

  function skip() {
    localStorage.setItem("buddyId", "none")
    setLeaving(true)
    setTimeout(() => router.replace("/"), 240)
  }

  if (!mounted) return null

  return (
    <div style={{
      minHeight:  "100dvh",
      overflow:   "hidden",
      position:   "relative",
      background: step === 0 ? "#0e0d0c" : "var(--bg)",
      opacity:    leaving ? 0 : 1,
      transition: leaving ? "opacity 0.22s ease" : undefined,
      pointerEvents: leaving ? "none" : undefined,
    }}>
      {/* Companion step — circle clip reveals it (or shown immediately in edit/draw mode) */}
      <div
        style={{
          position:  "fixed",
          inset:     0,
          zIndex:    15,
          clipPath:  step === 1 ? "none" : revealing ? undefined : "circle(0% at 50% 50%)",
          animation: revealing ? "circleOpen 1.3s cubic-bezier(0.22,1,0.36,1) forwards" : undefined,
        }}
        onAnimationEnd={(e: React.AnimationEvent<HTMLDivElement>) => {
          if (e.target !== e.currentTarget) return
          if (revealing) { setRevealing(false); setStep(1) }
        }}
      >
        <CompanionStep
          selected={selected}
          onSelect={setSelected}
          onConfirm={confirm}
          onConfirmDraw={confirmDraw}
          onBack={goBack}
          onClose={closeAll}
          confirmed={confirmed}
          initialTab={drawMode ? "draw" : "pick"}
        />
      </div>

      {/* Dark welcome overlay — hidden in edit/draw mode */}
      {step === 0 && !skipWelcome && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10 }}>
          <WelcomeStep onContinue={goToStep1} onSkip={skip} />
        </div>
      )}

      <style>{`
        @keyframes textShine {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shiny-text {
          background: linear-gradient(
            90deg,
            #f4f4f5 0%,
            #f4f4f5 35%,
            rgba(255,255,255,1) 47%,
            rgba(255,230,200,1) 50%,
            rgba(255,255,255,1) 53%,
            #f4f4f5 65%,
            #f4f4f5 100%
          );
          background-size: 250% auto;
          background-position: -200% center;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .shiny-text:hover {
          animation: textShine 0.75s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes circleOpen {
          from { clip-path: circle(0%   at 50% 50%); }
          to   { clip-path: circle(150% at 50% 50%); }
        }

        @keyframes buddyCardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes g-scroll-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes g-scroll-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        @keyframes w-scroll-up {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
        @keyframes w-scroll-down {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0); }
        }
        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .btn-dark-fill {
          background: linear-gradient(to top, rgb(255,107,48) 50%, #f4f4f5 50%);
          background-size: 100% 205%;
          background-position: 0% 0%;
          color: #18181b;
          transition: background-position 0.42s cubic-bezier(0.22,1,0.36,1),
                      color 0.3s ease, box-shadow 0.25s ease;
        }
        .btn-dark-fill:hover {
          background-position: 0% 100%;
          color: #fff;
          box-shadow: 0 8px 28px rgba(255,107,48,0.35);
        }
        @keyframes btnShimmer {
          0%   { left: -100%; }
          100% { left: 160%; }
        }
        .btn-shiny { position: relative; overflow: hidden; }
        .btn-shiny::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 55%; height: 100%;
          background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 50%, transparent 80%);
          transform: skewX(-18deg);
          pointer-events: none;
        }
        .btn-shiny:hover::after { animation: btnShimmer 0.48s ease forwards; }
      `}</style>
    </div>
  )
}

function clamp(min: number, max: number): number {
  return typeof window !== "undefined"
    ? Math.min(max, Math.max(min, window.innerWidth * 0.04))
    : max
}

export default function Page() {
  return (
    <Suspense>
      <OnboardingPage />
    </Suspense>
  )
}
