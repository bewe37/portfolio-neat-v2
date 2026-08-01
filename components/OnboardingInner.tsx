"use client"

// Renders the full onboarding flow inside the lightbox (no routing).
// All "navigate away" actions call onClose instead.

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { playClick } from "@/lib/click-sound"
import { BUDDIES, type BuddyDef } from "@/lib/buddies"
import { SpriteView } from "@/components/SpriteBuddy"
import { useRef } from "react"

const SCALE = 3  // smaller scale to fit all buddies in one row inside the lightbox

// ── Draw canvas ───────────────────────────────────────────────
const DRAW_PALETTE = [
  "#000000", "#1D2B53", "#7E2553", "#008751",
  "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8",
  "#FF004D", "#FFA300", "#FFEC27", "#00E436",
  "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA",
]
const DG = 16
const DC = 16

function DrawCanvas({ onSave }: { onSave: () => void }) {
  const [pixels,   setPixels]   = useState<(string | null)[]>(() => Array(DG * DG).fill(null))
  const [color,    setColor]    = useState(DRAW_PALETTE[8])
  const [erasing,  setErasing]  = useState(false)
  const [painting, setPainting] = useState(false)
  const [history,  setHistory]  = useState<(string | null)[][]>([])
  const [isMobile, setIsMobile] = useState(false)
  const gridRef    = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 500)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

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
        const r = data[i*4], g = data[i*4+1], b = data[i*4+2], a = data[i*4+3]
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
    pixels.forEach((px, i) => { if (!px) return; ctx.fillStyle = px; ctx.fillRect(i % DG, Math.floor(i / DG), 1, 1) })
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
    const cs = rect.width / DG
    applyAt(Math.floor((t.clientY - rect.top) / cs) * DG + Math.floor((t.clientX - rect.left) / cs))
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault(); if (!painting) return
    const t = e.touches[0], rect = gridRef.current!.getBoundingClientRect()
    const cs = rect.width / DG
    applyAt(Math.floor((t.clientY - rect.top) / cs) * DG + Math.floor((t.clientX - rect.left) / cs))
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
    fetch("/api/companions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: dataUrl }) }).catch(() => {})
    onSave()
  }

  const PV = DG * 3

  // ── Mobile layout ─────────────────────────────────────────────
  if (isMobile) {
    // canvas size = viewport width minus the 8px padding on each side of CompanionStep
    const canvasSize = `min(calc(100vw - 16px), 260px)`
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
        <div
          ref={gridRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setPainting(false)}
          style={{
            display: "grid", gridTemplateColumns: `repeat(${DG}, 1fr)`,
            width: canvasSize, height: canvasSize, flexShrink: 0,
            borderRadius: 10, overflow: "hidden", border: "1px solid #e0e0e0",
            userSelect: "none", touchAction: "none",
            backgroundImage: `linear-gradient(45deg,rgba(0,0,0,.06) 25%,transparent 25%),linear-gradient(-45deg,rgba(0,0,0,.06) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,rgba(0,0,0,.06) 75%),linear-gradient(-45deg,transparent 75%,rgba(0,0,0,.06) 75%)`,
            backgroundSize: "12.5% 12.5%", backgroundPosition: "0 0, 0 6.25%, 6.25% -6.25%, -6.25% 0",
          }}
        >
          {pixels.map((px, i) => (
            <div key={i} style={{ backgroundColor: px ?? "transparent", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.07)" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, width: canvasSize }}>
          {([
            { label: "Erase", active: erasing,  onClick: () => setErasing(e => !e), disabled: false },
            { label: "Undo",  active: false,     onClick: undo,                      disabled: !history.length },
            { label: "Clear", active: false,     onClick: clear,                     disabled: !hasContent },
          ] as const).map(btn => (
            <button key={btn.label} onClick={() => { playClick(); btn.onClick() }} disabled={btn.disabled} style={{
              flex: 1, padding: "7px 0", borderRadius: 8,
              border: btn.active ? "1px solid #111111" : "1px solid rgba(0,0,0,0.18)",
              background: btn.active ? "#111111" : "rgba(0,0,0,0.06)",
              color: btn.disabled ? "rgba(0,0,0,0.25)" : btn.active ? "#ffffff" : "rgba(0,0,0,0.65)",
              fontSize: "0.625rem", fontWeight: 700, fontFamily: "var(--font-sans)",
              letterSpacing: "0.06em", textTransform: "uppercase" as const,
              cursor: btn.disabled ? "default" : "pointer", transition: "all 0.15s ease",
            }}>{btn.label}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 5, width: canvasSize }}>
          {DRAW_PALETTE.map(c => (
            <motion.button key={c}
              onClick={() => { playClick(); setColor(c); setErasing(false) }}
              whileTap={{ scale: 0.85 }}
              style={{
                aspectRatio: "1", borderRadius: 6, backgroundColor: c,
                border: "none", outline: "none", cursor: "pointer",
                boxShadow: color === c && !erasing ? "0 0 0 2px #fff, 0 0 0 4px #111111" : "0 1px 4px rgba(0,0,0,0.22)",
                transition: "box-shadow 0.15s ease",
              }}
            />
          ))}
        </div>
        <motion.button
          onClick={() => { if (hasContent) { playClick(); save() } }} disabled={!hasContent}
          className="btn-shiny"
          animate={{ opacity: hasContent ? 1 : 0.32, y: hasContent ? 0 : 4 }}
          transition={{ duration: 0.22 }}
          style={{
            padding: "11px 32px", borderRadius: 99, border: "none",
            background: "#111111", color: "#ffffff",
            fontSize: "0.875rem", fontWeight: 700, fontFamily: "var(--font-sans)",
            cursor: hasContent ? "pointer" : "default", letterSpacing: "-0.01em",
            position: "relative", overflow: "hidden", width: canvasSize,
          }}
        >
          Use as companion →
        </motion.button>
      </div>
    )
  }

  // ── Desktop layout (original, unchanged) ──────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            ref={gridRef}
            onMouseLeave={() => setPainting(false)}
            onMouseUp={() => setPainting(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setPainting(false)}
            style={{
              display: "grid", gridTemplateColumns: `repeat(${DG}, ${DC}px)`,
              borderRadius: 10, overflow: "hidden", border: "1px solid #e0e0e0",
              userSelect: "none", touchAction: "none",
              cursor: erasing ? "cell" : "crosshair",
              backgroundImage: `linear-gradient(45deg,rgba(0,0,0,.06) 25%,transparent 25%),linear-gradient(-45deg,rgba(0,0,0,.06) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,rgba(0,0,0,.06) 75%),linear-gradient(-45deg,transparent 75%,rgba(0,0,0,.06) 75%)`,
              backgroundSize: `${DC*2}px ${DC*2}px`,
              backgroundPosition: `0 0, 0 ${DC}px, ${DC}px -${DC}px, -${DC}px 0`,
            }}
          >
            {pixels.map((px, i) => (
              <div key={i}
                onMouseDown={e => startPaint(i, e)}
                onMouseEnter={() => { if (painting) applyAt(i) }}
                style={{ width: DC, height: DC, backgroundColor: px ?? "transparent", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.07)" }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { label: "Erase", active: erasing,  onClick: () => setErasing(e => !e), disabled: false },
              { label: "Undo",  active: false,     onClick: undo,                      disabled: !history.length },
              { label: "Clear", active: false,     onClick: clear,                     disabled: !hasContent },
            ] as const).map(btn => (
              <button key={btn.label} onClick={() => { playClick(); btn.onClick() }} disabled={btn.disabled} style={{
                flex: 1, padding: "7px 0", borderRadius: 8,
                border: btn.active ? "1px solid #111111" : "1px solid rgba(0,0,0,0.18)",
                background: btn.active ? "#111111" : "rgba(0,0,0,0.06)",
                color: btn.disabled ? "rgba(0,0,0,0.25)" : btn.active ? "#ffffff" : "rgba(0,0,0,0.65)",
                fontSize: "0.625rem", fontWeight: 700, fontFamily: "var(--font-sans)",
                letterSpacing: "0.06em", textTransform: "uppercase" as const,
                cursor: btn.disabled ? "default" : "pointer", transition: "all 0.15s ease",
              }}>{btn.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 140 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", fontWeight: 700, color: "#888888", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Preview</span>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: PV + 28, height: PV + 28, borderRadius: 12,
                border: "1px solid #e0e0e0", background: "#f5f5f5",
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }}
            >
              <canvas ref={previewRef} width={DG} height={DG} style={{ width: PV, height: PV, imageRendering: "pixelated", display: "block" }} />
            </motion.div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", fontWeight: 700, color: "#888888", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Colors</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 30px)", gap: 5 }}>
              {DRAW_PALETTE.map(c => (
                <motion.button key={c}
                  onClick={() => { playClick(); setColor(c); setErasing(false) }}
                  whileHover={{ scale: 1.18 }} whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 440, damping: 18 }}
                  style={{
                    width: 30, height: 30, borderRadius: 7, backgroundColor: c,
                    border: "none", outline: "none", cursor: "pointer",
                    boxShadow: color === c && !erasing ? "0 0 0 2px #fff, 0 0 0 4px #111111" : "0 1px 4px rgba(0,0,0,0.22)",
                    transition: "box-shadow 0.15s ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.button
        onClick={() => { if (hasContent) { playClick(); save() } }} disabled={!hasContent}
        className="btn-shiny"
        animate={{ opacity: hasContent ? 1 : 0.32, y: hasContent ? 0 : 4 }}
        transition={{ duration: 0.22 }}
        style={{
          padding: "11px 32px", borderRadius: 99, border: "none",
          background: "#111111", color: "#ffffff",
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
        background: "none", border: "none", padding: 0, cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10, outline: "none",
        width: "100%",
        opacity: dimmed ? 0.35 : 1,
        filter: dimmed ? "saturate(0)" : "none",
        transform: selected ? "translateY(-8px) scale(1.04)" : hovered && !dimmed ? "translateY(-4px) scale(1.02)" : "none",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease, filter 0.4s ease",
      }}
    >
      <div style={{
        width: "100%", aspectRatio: "1",
        borderRadius: 16, border: `2px solid ${selected ? "#111111" : "#e0e0e0"}`,
        background: selected ? "#f0f0f0" : "#fafafa",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "border-color 0.2s ease, background 0.2s ease",
        boxShadow: selected ? "0 0 0 4px rgba(0,0,0,0.08)" : "none",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "10px 10px", pointerEvents: "none",
        }} />
        <SpriteView buddy={buddy} animKey={animKey} scale={SCALE} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(12px, 3vw, 18px)", fontWeight: 700, color: "#111111", letterSpacing: "-0.01em" }}>
          {buddy.name}
        </span>
      </div>
      {selected && (
        <div style={{
          width: 22, height: 22, borderRadius: "50%", background: "#111111",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4L4.2 7.5L10 1" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </button>
  )
}

// ── Back / close btn ──────────────────────────────────────────

// ── Gallery constants ─────────────────────────────────────────
type DrawFn = (ctx: CanvasRenderingContext2D) => void
const G_SAMPLES: DrawFn[] = [
  (c) => { c.fillStyle="#1D2B53"; c.fillRect(5,1,6,5); c.fillRect(4,3,8,5); c.fillRect(3,6,10,4); c.fillStyle="#7E2553"; c.fillRect(6,7,4,2); c.fillStyle="#FFF1E8"; c.fillRect(6,3,2,2); c.fillRect(9,3,2,2); c.fillStyle="#FF004D"; c.fillRect(7,5,2,1) },
  (c) => { c.fillStyle="#5F574F"; c.fillRect(4,2,8,3); c.fillRect(3,4,10,5); c.fillRect(4,9,8,3); c.fillStyle="#FFF1E8"; c.fillRect(5,4,3,3); c.fillRect(9,4,3,3); c.fillStyle="#FF77A8"; c.fillRect(6,6,4,1); c.fillStyle="#FFEC27"; c.fillRect(4,2,8,1) },
  (c) => { c.fillStyle="#008751"; c.fillRect(5,0,6,4); c.fillRect(3,3,10,6); c.fillRect(4,8,8,4); c.fillStyle="#FFF1E8"; c.fillRect(5,4,2,2); c.fillRect(9,4,2,2); c.fillStyle="#FF004D"; c.fillRect(7,6,2,1); c.fillStyle="#FFEC27"; c.fillRect(6,1,4,2) },
  (c) => { c.fillStyle="#7E2553"; c.fillRect(6,1,4,6); c.fillRect(5,3,6,4); c.fillRect(4,5,8,3); c.fillRect(3,7,10,2); c.fillRect(2,9,12,3); c.fillStyle="#FFEC27"; c.fillRect(7,3,2,1); c.fillStyle="#FFF1E8"; c.fillRect(7,3,1,1); c.fillRect(8,4,1,1); c.fillStyle="#FF77A8"; c.fillRect(5,10,6,2); c.fillStyle="#FFCCAA"; c.fillRect(6,12,4,4); c.fillStyle="#5F574F"; c.fillRect(6,13,1,2); c.fillRect(9,13,1,2) },
]

const G_ITEM_SIZE = 80
const G_ITEM_GAP  = 10
const G_ITEMS_HALF = 12
const G_ROW_CFG = [
  { dir: "left",  duration: 28 },
  { dir: "right", duration: 34 },
  { dir: "left",  duration: 25 },
] as const

function buildGalleryRow(pool: string[], rowIdx: number): string[] {
  const offset  = (rowIdx * 4) % pool.length
  const shifted = [...pool.slice(offset), ...pool.slice(0, offset)]
  const half: string[] = []
  while (half.length < G_ITEMS_HALF) half.push(...shifted)
  return [...half.slice(0, G_ITEMS_HALF), ...half.slice(0, G_ITEMS_HALF)]
}

// ── Companion step ────────────────────────────────────────────
function CompanionStep({ selected, onSelect, onConfirm, onConfirmDraw, onBack, onClose, confirmed }: {
  selected: string | null
  onSelect: (id: string) => void
  onConfirm: () => void
  onConfirmDraw: () => void
  onBack: () => void
  onClose: () => void
  confirmed: boolean
}) {
  const [tab, setTab]             = useState<"pick" | "draw" | "gallery">("pick")
  const [galleryPool, setGalleryPool] = useState<string[]>([])
  const [tabsMobile, setTabsMobile]   = useState(false)
  const pickBtnRef   = useRef<HTMLButtonElement>(null)
  const drawBtnRef   = useRef<HTMLButtonElement>(null)
  const seeAllBtnRef = useRef<HTMLButtonElement>(null)
  const [pillStyle, setPillStyle] = useState({ x: 0, width: 0 })

  useEffect(() => {
    const check = () => setTabsMobile(window.innerWidth < 500)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const ref = tab === "pick" ? pickBtnRef.current : tab === "draw" ? drawBtnRef.current : seeAllBtnRef.current
    if (ref) setPillStyle({ x: ref.offsetLeft, width: ref.offsetWidth })
  }, [tab, tabsMobile])

  useEffect(() => {
    if (tab !== "gallery" || galleryPool.length > 0) return
    const samples = G_SAMPLES.map(fn => {
      const cv = document.createElement("canvas")
      cv.width = 16; cv.height = 16
      fn(cv.getContext("2d")!)
      return cv.toDataURL()
    })
    // Show samples immediately, then merge in real data when it arrives
    setGalleryPool(samples)
    fetch("/api/companions")
      .then(r => r.json())
      .then((d: { companions?: string[] }) => {
        if (d.companions?.length) setGalleryPool([...d.companions, ...samples])
      })
      .catch(() => {})
  }, [tab, galleryPool.length])

  const isGallery = tab === "gallery"

  const mobileDraw = tabsMobile && tab === "draw"

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
      height: "100%",
      padding: mobileDraw
        ? "clamp(56px, 10vw, 72px) 8px 24px"
        : "clamp(56px, 10vw, 72px) clamp(20px, 6vw, 32px) 40px",
      position: "relative",
      fontFamily: "var(--font-sans)",
      background: isGallery ? "#18181b" : "#ffffff",
      transition: "background 0.55s cubic-bezier(0.22,1,0.36,1)",
      overflowY: isGallery ? "hidden" : "auto",
      overflowX: "hidden",
    }}>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: confirmed ? 0 : 1, y: confirmed ? 4 : 0 }}
        transition={{ duration: 0.35 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, marginBottom: isGallery ? 0 : 32, position: "relative", zIndex: 2 }}
      >
        {/* Toggle */}
        <div style={{
          position: "relative", display: "flex", gap: 2, padding: 3, borderRadius: 99,
          background: isGallery ? "rgba(255,255,255,0.06)" : "#f0f0f0",
          border: isGallery ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e0e0e0",
          width: "fit-content", maxWidth: "calc(100vw - 48px)",
        }}>
          {pillStyle.width > 0 && (
            <motion.span
              animate={{ x: pillStyle.x, width: pillStyle.width }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              style={{
                position: "absolute", top: 4, bottom: 4, left: 0, borderRadius: 99,
                background: isGallery ? "rgba(255,255,255,0.14)" : "#ffffff",
                boxShadow: isGallery ? "none" : "0 2px 8px rgba(0,0,0,0.09)",
                pointerEvents: "none",
              }}
            />
          )}
          {([
            { id: "pick",    ref: pickBtnRef,   label: "Pick a companion", icon: (
              <svg width="14" height="14" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="4.8" cy="5.6" r="0.75" fill="currentColor"/>
                <circle cx="8.2" cy="5.6" r="0.75" fill="currentColor"/>
                <path d="M4.2 8C4.2 8 5 9.3 6.5 9.3C8 9.3 8.8 8 8.8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            )},
            { id: "draw",    ref: drawBtnRef,   label: "Draw your own", icon: (
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )},
            { id: "gallery", ref: seeAllBtnRef, label: "See all",   icon: (
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ flexShrink: 0 }}>
                <ellipse cx="4.5" cy="5" rx="3.5" ry="4" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="5.5" cy="5" r="1.4" fill="currentColor"/>
                <ellipse cx="11.5" cy="5" rx="3.5" ry="4" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="12.5" cy="5" r="1.4" fill="currentColor"/>
              </svg>
            )},
          ] as { id: string; ref: React.RefObject<HTMLButtonElement | null>; label: string; icon: React.ReactNode }[]).map(({ id, ref, label, icon }) => (
            <motion.button
              key={id}
              ref={ref}
              onClick={() => { playClick(); setTab(id as typeof tab) }}
              style={{
                padding: tabsMobile ? "8px 12px" : "8px 16px",
                borderRadius: 99, border: "none", background: "transparent",
                color: isGallery
                  ? (id === "gallery" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)")
                  : (tab === id ? "#111111" : "#aaaaaa"),
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, position: "relative", zIndex: 1,
                fontSize: "0.8125rem", fontWeight: 600, fontFamily: "var(--font-sans)", letterSpacing: "-0.01em",
                transition: "color 0.25s ease",
              }}
            >
              {icon}
              {!tabsMobile && (
                <span style={{ whiteSpace: "nowrap" }}>{label}</span>
              )}
            </motion.button>
          ))}
        </div>

        <h1 style={{
          fontSize: "clamp(18px, 2.8vw, 38px)", fontWeight: 600,
          color: isGallery ? "rgba(255,255,255,0.88)" : "#111111",
          margin: 0, marginBottom: isGallery ? 40 : 0, letterSpacing: "-0.03em", textAlign: "center",
          position: "relative", zIndex: 2,
        }}>
          {tab === "draw" ? "Draw your companion." : tab === "pick" ? "Pick your companion." : "What others drew."}
        </h1>
      </motion.div>

      {/* Gallery overlay */}
      {isGallery && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          display: "flex", flexDirection: "column", justifyContent: "center",
          gap: G_ITEM_GAP, overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)" }} />

          {galleryPool.length > 0 && G_ROW_CFG.map(({ dir, duration }, rowIdx) => (
            <div key={rowIdx} style={{ overflow: "hidden", flexShrink: 0, animation: `rowFadeIn 0.65s cubic-bezier(0.22,1,0.36,1) ${rowIdx * 0.07}s both` }}>
              <div style={{ display: "flex", gap: G_ITEM_GAP, width: "fit-content", animation: `g-scroll-${dir} ${duration}s linear infinite` }}>
                {buildGalleryRow(galleryPool, rowIdx).map((url, i) => (
                  <div key={i} style={{ width: G_ITEM_SIZE, height: G_ITEM_SIZE, flexShrink: 0, padding: 9, borderRadius: 8, background: "#f0ece4", boxShadow: "0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" draggable={false} style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab content */}
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
                <div style={{ display: "grid", gridTemplateColumns: tabsMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: 24, width: "100%" }}>
                  {BUDDIES.map((buddy, i) => (
                    <div key={buddy.id} style={{ animation: `buddyCardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both`, display: "flex", justifyContent: "center" }}>
                      <BuddyCard buddy={buddy} selected={selected === buddy.id}
                        dimmed={selected !== null && selected !== buddy.id}
                        onSelect={() => onSelect(buddy.id)} />
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 24,
                  opacity: selected && !confirmed ? 1 : 0,
                  transform: selected && !confirmed ? "translateY(0)" : "translateY(6px)",
                  transition: "opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  pointerEvents: selected ? "auto" : "none",
                  visibility: selected ? "visible" : "hidden",
                }}>
                  <button className="btn-shiny" onClick={() => { playClick(); onConfirm() }} style={{
                    padding: "11px 32px", borderRadius: 99, border: "none",
                    background: "#111111", color: "#ffffff",
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

// ── Root ──────────────────────────────────────────────────────
export default function OnboardingInner({ onClose }: { onClose: () => void }) {
  const [selected,  setSelected]  = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [leaving,   setLeaving]   = useState(false)

  function confirm() {
    if (!selected) return
    localStorage.setItem("buddyId", selected)
    window.dispatchEvent(new Event("buddySelected"))
    setConfirmed(true)
    setTimeout(onClose, 600)
  }

  return (
    <div style={{
      height: "100%", overflow: "hidden", position: "relative",
      background: "#ffffff",
      opacity: leaving ? 0 : 1,
      transition: leaving ? "opacity 0.22s ease" : undefined,
      pointerEvents: leaving ? "none" : undefined,
    }}>
      <CompanionStep
        selected={selected}
        onSelect={setSelected}
        onConfirm={confirm}
        onConfirmDraw={() => { setConfirmed(true); setTimeout(onClose, 600) }}
        onBack={() => { setLeaving(true); setTimeout(onClose, 240) }}
        onClose={onClose}
        confirmed={confirmed}
      />

      <style>{`
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
        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
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
