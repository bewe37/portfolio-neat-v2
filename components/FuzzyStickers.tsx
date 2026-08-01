"use client"

// Sticker peel effect based on the work of @BalintFerenczy on Twitter
// SVG light/fuzzy filter effect based on the work of @jh3yy on Twitter

import { useRef, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { playClick } from "@/lib/click-sound"

const PEELBACK_HOVER  = "30%"
const PEELBACK_ACTIVE = "60%"
const PAD   = "10px"
const START = `calc(-1 * ${PAD})`
const END   = `calc(100% + ${PAD})`
const PEEL_EASING  = `1.4s linear(0,0.002 0.4%,0.008 0.9%,0.02 1.4%,0.035 1.9%,0.055 2.4%,0.083 3%,0.11 3.5%,0.146 4.1%,0.214 5.1%,0.297 6.2%,0.624 10.2%,0.756 11.9%,0.821 12.8%,0.874 13.6%,0.93 14.5%,0.975 15.3%,1.016 16.1%,1.053 16.9%,1.085 17.7%,1.116 18.6%,1.139 19.4%,1.16 20.3%,1.176 21.2%,1.187 22.1%,1.195 23.2%,1.197 24.4%,1.193 25.6%,1.183 26.9%,1.17 28.1%,1.153 29.4%,1.055 35.6%,1.031 37.3%,1.012 38.8%,0.994 40.6%,0.98 42.3%,0.97 44.1%,0.964 45.9%,0.961 48.3%,0.964 51.1%,0.97 53.7%,0.997 62.7%,1.003 66%,1.007 69.3%,1.007 74.4%,1 89.2%,1)`
const HOVER_EASING = `1s linear(0,0.008 1.1%,0.031 2.2%,0.129 4.8%,0.257 7.2%,0.671 14.2%,0.789 16.5%,0.881 18.6%,0.957 20.7%,1.019 22.9%,1.063 25.1%,1.094 27.4%,1.114 30.7%,1.112 34.5%,1.018 49.9%,0.99 59.1%,1)`

interface StickerDef {
  id: string; src: string; label: string
  size: number; top: number; left?: number | string; rotate: number; defaultOn: boolean
}



const ALL_STICKERS: StickerDef[] = [
  { id: "thunder", src: "/Thunder.svg",    label: "Thunder", size: 86,  top:  80, left: "calc(50% - 280px - 86px - 16px)", rotate: -15, defaultOn: true  },
  { id: "cloud",   src: "/Cloud.svg",      label: "Cloud",   size: 84,  top: 260, left: "calc(50% - 280px - 20px)", rotate:  18, defaultOn: true  },
  { id: "spark",   src: "/Spark.svg",      label: "Spark",   size: 76,  top: 100, left: "calc(50% + 290px)", rotate:  22, defaultOn: true  },
  { id: "green",   src: "/Green.svg",      label: "Green",   size: 100, top:  95, left: "calc(50% + 280px + 16px)", rotate: -12, defaultOn: false },
  { id: "bang",    src: "/Bang.svg",       label: "Bang",    size: 80,  top: 260, left: "calc(50% + 210px)", rotate:  -8, defaultOn: true  },
  { id: "figma",      src: "/Figma.svg",      label: "Figma",      size: 76, top: 280, left: "calc(50% + 280px + 100px)", rotate:   8, defaultOn: false },
  { id: "claude",    src: "/Claude.svg",     label: "Claude",     size: 80, top: 300, left: "calc(50% + 280px + 200px)", rotate: -10, defaultOn: false },
  { id: "vercel",    src: "/Vercel.svg",     label: "Vercel",     size: 76, top: 200, left: "calc(50% + 280px + 280px)", rotate:  12, defaultOn: false },
  { id: "hello",     src: "/HelloWorld.svg", label: "Hello",      size: 92, top: 100, left: "calc(50% + 280px + 280px)", rotate:  16, defaultOn: false },
  { id: "tumpeng",   src: "/Tumpeng.svg",   label: "Tumpeng",    size: 90, top: 160, left: "calc(50% + 280px + 320px)", rotate:   6, defaultOn: false },
  { id: "rickshaw",  src: "/Rickshaw.svg",  label: "Rickshaw",   size: 96, top: 300, left: "calc(50% + 280px + 260px)", rotate:  -8, defaultOn: false },
  { id: "friedrice", src: "/FriedRice.svg", label: "Fried Rice", size: 88, top: 120, left: "calc(50% + 280px + 360px)", rotate:  12, defaultOn: false },
  { id: "satay",     src: "/Satay.svg",     label: "Satay",      size: 82, top: 260, left: "calc(50% + 280px + 340px)", rotate:  -5, defaultOn: false },
]

function Sticker({ src, size, top, left, rotate, uid, spawnAt, appearDelay = 0, stickerEffect = false }: {
  src: string; size: number; top: number; left?: number | string
  rotate: number; uid: string; spawnAt?: { x: number; y: number }; appearDelay?: number; stickerEffect?: boolean
}) {
  const draggableRef  = useRef<HTMLDivElement>(null)
  const pointLightRef = useRef<SVGFEPointLightElement>(null)
  const isDragging    = useRef(false)
  const dragOffset    = useRef({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const [active,  setActive]  = useState(false)

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (isDragging.current && draggableRef.current) {
        const el = draggableRef.current
        const parent = el.offsetParent as HTMLElement | null
        const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 }
        el.style.left  = (e.clientX - dragOffset.current.x - parentRect.left) + "px"
        el.style.top   = (e.clientY - dragOffset.current.y - parentRect.top)  + "px"
      }
      if (stickerEffect && pointLightRef.current && draggableRef.current) {
        const rect = draggableRef.current.getBoundingClientRect()
        pointLightRef.current.setAttribute("x", String(e.clientX - rect.left))
        pointLightRef.current.setAttribute("y", String(e.clientY - rect.top))
      }
    }
    function onMouseUp() {
      isDragging.current = false
      setActive(false)
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup",   onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup",   onMouseUp)
    }
  }, [stickerEffect])

  // If spawned from palette, immediately start dragging from cursor position
  useEffect(() => {
    if (!spawnAt) return
    const el = draggableRef.current
    if (!el) return
    const parent = el.offsetParent as HTMLElement | null
    const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 }
    // center the sticker on the cursor
    dragOffset.current = { x: size / 2, y: size / 2 }
    el.style.right = "auto"
    el.style.left  = (spawnAt.x - size / 2 - parentRect.left) + "px"
    el.style.top   = (spawnAt.y - size / 2 - parentRect.top)  + "px"
    isDragging.current = true
    setActive(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onMouseDown(e: React.MouseEvent) {
    const el = draggableRef.current
    if (!el) return
    e.preventDefault()
    const rect = el.getBoundingClientRect()
    const parent = el.offsetParent as HTMLElement | null
    const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 }
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    el.style.right = "auto"
    el.style.left  = (rect.left - parentRect.left) + "px"
    el.style.top   = (rect.top  - parentRect.top)  + "px"
    isDragging.current = true
    setActive(true)
  }

  const peeled = active
  const mainClip = peeled
    ? `polygon(${START} ${PEELBACK_ACTIVE}, ${END} ${PEELBACK_ACTIVE}, ${END} ${END}, ${START} ${END})`
    : hovered
    ? `polygon(${START} ${PEELBACK_HOVER},  ${END} ${PEELBACK_HOVER},  ${END} ${END}, ${START} ${END})`
    : `polygon(${START} ${START}, ${END} ${START}, ${END} ${END}, ${START} ${END})`

  const flapClip = peeled
    ? `polygon(${START} ${START}, ${END} ${START}, ${END} ${PEELBACK_ACTIVE}, ${START} ${PEELBACK_ACTIVE})`
    : hovered
    ? `polygon(${START} ${START}, ${END} ${START}, ${END} ${PEELBACK_HOVER},  ${START} ${PEELBACK_HOVER})`
    : `polygon(${START} ${START}, ${END} ${START}, ${END} ${START}, ${START} ${START})`

  const flapTop = peeled
    ? `calc(-100% + 2 * ${PEELBACK_ACTIVE} - 1px)`
    : hovered
    ? `calc(-100% + 2 * ${PEELBACK_HOVER} - 1px)`
    : `calc(-100% - ${PAD} - ${PAD})`

  const transition = peeled ? `all ${PEEL_EASING}` : `all ${HOVER_EASING}`
  const imgStyle: React.CSSProperties = { width: size, display: "block", transform: `rotate(${rotate}deg)`, userSelect: "none" }

  const fillId    = `st-fi-${uid}`
  const filterId  = `st-eff-${uid}`

  return (
    <>
      <svg height="0" width="0" style={{ position: "absolute", pointerEvents: "none" }}>
        <defs>
          <filter id={fillId}>
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(179,179,179)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
          {stickerEffect && (
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feMorphology in="SourceAlpha" result="dilate" operator="dilate" radius="0" />
              <feFlood floodColor="#ffffff" result="outlinecolor" />
              <feTurbulence baseFrequency="0.63" seed="120" numOctaves="4" type="fractalNoise" result="turb" />
              <feComposite in="turb" in2="dilate" operator="in" result="outline" />
              <feComposite in="outlinecolor" in2="dilate" operator="in" result="outlineflat" />
              <feMerge result="merged">
                <feMergeNode in="outlineflat" />
                <feMergeNode in="outline" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
              <feGaussianBlur in="SourceAlpha" stdDeviation="2.9" result="blur" />
              <feSpecularLighting result="lighting" in="blur" surfaceScale="11" specularConstant="8.1" specularExponent="110" lightingColor="hsla(0,0%,80%,0.5)">
                <fePointLight ref={pointLightRef} x="-202" y="-331" z="23" />
              </feSpecularLighting>
              <feComposite in="lighting" in2="SourceAlpha" operator="in" result="composite" />
              <feComposite in="merged" in2="composite" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
              <feDropShadow dx="2" dy="2" stdDeviation="0" floodColor="hsl(0,0%,0%)" floodOpacity="0.17" />
            </filter>
          )}
        </defs>
      </svg>

      <motion.div
        ref={draggableRef}
        onMouseDown={onMouseDown}
        initial={spawnAt ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spawnAt ? undefined : {
          delay: appearDelay / 1000,
          type: "spring",
          stiffness: 400,
          damping: 18,
        }}
        style={{ position: "absolute", top, left, cursor: isDragging.current ? "grabbing" : "grab", zIndex: 20, userSelect: "none", pointerEvents: "auto" }}
      >
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); if (!isDragging.current) setActive(false) }}
          style={{ position: "relative" }}
        >
          {/* Main sticker body */}
          <div style={{ clipPath: mainClip, transition, willChange: "clip-path", ...(stickerEffect ? { filter: `url(#${filterId})`, overflow: "visible" } : {}) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} style={imgStyle} />
          </div>

          {/* Drop shadow blob */}
          <div style={{ position: "absolute", top: "0.1rem", left: "0.05rem", width: "100%", height: "100%", filter: "brightness(0) blur(0.5px)", opacity: 0.04, pointerEvents: "none" }}>
            <div style={{ filter: `url(#${fillId})` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" draggable={false} style={imgStyle} />
            </div>
          </div>

          {/* Peeled flap */}
          <div style={{ position: "absolute", width: "100%", height: "100%", left: 0, top: flapTop, clipPath: flapClip, transform: "scaleY(-1)", transition, willChange: "clip-path, top", pointerEvents: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} style={{ ...imgStyle, filter: `url(#${fillId})` }} />
          </div>
        </div>
      </motion.div>
    </>
  )
}


export default function FuzzyStickers() {
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState<Set<string>>(
    () => new Set(ALL_STICKERS.filter(s => s.defaultOn).map(s => s.id))
  )
  const [spawnMap, setSpawnMap] = useState<Record<string, { x: number; y: number }>>({})
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400)
    return () => clearTimeout(t)
  }, [])

  function handlePaletteMouseDown(s: StickerDef, e: React.MouseEvent) {
    if (active.has(s.id)) {
      // already on canvas — just toggle off
      playClick()
      setActive(prev => { const n = new Set(prev); n.delete(s.id); return n })
      return
    }
    // spawn and immediately drag from cursor
    playClick()
    setSpawnMap(prev => ({ ...prev, [s.id]: { x: e.clientX, y: e.clientY } }))
    setActive(prev => { const n = new Set(prev); n.add(s.id); return n })
  }

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
      {ready && ALL_STICKERS.filter(s => active.has(s.id)).map((s, i) => (
        <Sticker
          key={s.id} uid={s.id} src={s.src} size={s.size}
          top={s.top} left={s.left} rotate={s.rotate}
          spawnAt={spawnMap[s.id]}
          appearDelay={spawnMap[s.id] ? 0 : i * 80}
          stickerEffect
        />
      ))}

      <div style={{ position: "absolute", bottom: 24, right: 0, zIndex: 30, pointerEvents: "auto" }}>
        <AnimatePresence>
          {paletteOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="sticker-palette"
              style={{
                position: "absolute", bottom: 44, right: 0,
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: 16, padding: "10px 10px",
                display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4,
                width: 212, transformOrigin: "bottom right",
              }}
            >
              {ALL_STICKERS.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02, duration: 0.14, ease: "easeOut" }}
                  onMouseDown={e => handlePaletteMouseDown(s, e)}
                  title={s.label}
                  style={{
                    background:   active.has(s.id) ? "rgba(37, 37, 37, 0.06)" : "transparent",
                    border:       `1.5px solid ${active.has(s.id) ? "var(--border)" : "transparent"}`,
                    borderRadius: 10, padding: 5, cursor: "grab",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.label} draggable={false} style={{ width: 30, height: 30, objectFit: "contain" }} />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => { playClick(); setPaletteOpen(o => !o) }}
          title="Stickers"
          className="sticker-toggle-btn"
          style={{
            background: "var(--bg)", border: "0.5px solid var(--border)",
            borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="m23.967 10.417a12.04 12.04 0 1 0 -13.55 13.55 3.812 3.812 0 0 0 .489.032 3.993 3.993 0 0 0 2.805-1.184l9.1-9.1a3.962 3.962 0 0 0 1.156-3.298zm-21.9.474a10.034 10.034 0 0 1 19.8-.884 12.006 12.006 0 0 0 -11.86 11.852 9.988 9.988 0 0 1 -7.944-10.968zm10.233 10.509a2.121 2.121 0 0 1 -.278.225 10 10 0 0 1 9.606-9.607 2.043 2.043 0 0 1 -.224.279z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
