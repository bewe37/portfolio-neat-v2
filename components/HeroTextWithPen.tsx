"use client"

import { motion, AnimatePresence, useAnimation } from "framer-motion"
import {
  useState,
  useMemo,
  useRef,
  useEffect,
  type CSSProperties,
} from "react"
import { createPortal } from "react-dom"

/* ── pseudo-random ───────────────────────────────────────────────────── */
function makeRand(seed: number) {
  return (step: number) => {
    const x = Math.sin(seed * 9301 + step * 49297) * 233280
    return x - Math.floor(x)
  }
}

/* ── rough ellipse path ──────────────────────────────────────────────── */
function buildRoughEllipsePath(
  vbW: number,
  vbH: number,
  padX: number,
  padY: number,
  seed: number,
  roughness: number,
  overshoot: number,
  offsetX = 0,
  offsetY = 0,
  rotation = 0
): string {
  const rand = makeRand(seed)
  const jitter = (amp: number, n: number) => (rand(n) - 0.5) * amp
  const cx = vbW / 2 + offsetX
  const cy = vbH / 2 + offsetY
  const rx = vbW / 2 - padX
  const ry = vbH / 2 - padY
  const N = 20
  const radial = 4 * roughness
  const tangent = 6 * roughness
  const armJitter = 0.25 * roughness
  const rot = (rotation * Math.PI) / 180

  type Pt = { x: number; y: number; t: number }
  const anchors: Pt[] = []
  for (let i = 0; i <= N; i++) {
    const baseT = -Math.PI / 2 + (2 * Math.PI * i) / N
    const extra =
      i === N ? (overshoot / ((rx + ry) / 2)) * (roughness * 0.5 + 0.8) : 0
    const t = baseT + extra
    const rJit = jitter(radial, i * 3 + 1)
    const rxi = rx + rJit
    const ryi = ry + rJit * 0.85
    const tangentShift = jitter(tangent / ((rxi + ryi) / 2), i * 3 + 2)
    const tt = t + tangentShift
    let px = rxi * Math.cos(tt)
    let py = ryi * Math.sin(tt)
    if (rot !== 0) {
      const rxp = px * Math.cos(rot) - py * Math.sin(rot)
      const ryp = px * Math.sin(rot) + py * Math.cos(rot)
      px = rxp; py = ryp
    }
    anchors.push({ x: cx + px, y: cy + py, t: tt })
  }

  const segs: string[] = [`M ${anchors[0].x.toFixed(2)} ${anchors[0].y.toFixed(2)}`]
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]
    const b = anchors[i + 1]
    const dt = b.t - a.t
    const baseArm = (4 / 3) * Math.tan(dt / 4)
    const arm1 = baseArm * (1 + jitter(armJitter, i * 5 + 3))
    const arm2 = baseArm * (1 + jitter(armJitter, i * 5 + 4))
    const prev = i === 0 ? a : anchors[i - 1]
    const next = i + 2 >= anchors.length ? b : anchors[i + 2]
    const t1x = (b.x - prev.x) * 0.5
    const t1y = (b.y - prev.y) * 0.5
    const t2x = (next.x - a.x) * 0.5
    const t2y = (next.y - a.y) * 0.5
    const c1x = a.x + t1x * arm1 + jitter(radial * 0.5, i * 5 + 5)
    const c1y = a.y + t1y * arm1 + jitter(radial * 0.5, i * 5 + 6)
    const c2x = b.x - t2x * arm2 + jitter(radial * 0.5, i * 5 + 7)
    const c2y = b.y - t2y * arm2 + jitter(radial * 0.5, i * 5 + 8)
    segs.push(
      `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
    )
  }
  return segs.join(" ")
}

/* ── Tooltip ─────────────────────────────────────────────────────────── */
function Tooltip({
  show,
  anchor,
  imageSrc,
  width,
  height,
  radius,
  offset,
}: {
  show: boolean
  anchor: React.RefObject<HTMLElement | null>
  imageSrc?: string
  width: number
  height: number
  radius: number
  offset: number
}) {
  const [coords, setCoords] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!show || !anchor.current || typeof window === "undefined") return
    const update = () => {
      const el = anchor.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setCoords({ x: r.left + window.scrollX + r.width / 2, y: r.bottom + window.scrollY })
    }
    update()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [show, anchor])

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {show && imageSrc && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.14, ease: [0.55, 0, 1, 0.45] } }}
          transition={{ duration: 0.22, ease: [0.215, 0.61, 0.355, 1] }}
          style={{
            position: "absolute",
            top: coords.y + offset,
            left: coords.x,
            transform: "translateX(-50%)",
            zIndex: 99999,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width,
              height,
              borderRadius: radius,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 20px 48px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.35)",
              backgroundColor: "rgb(20,20,20)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/* ── pencil scratch sound ────────────────────────────────────────────── */
function playPencilScratch(ctx: AudioContext) {
  const t = ctx.currentTime
  // One continuous stroke: 320ms with smooth arc envelope
  const dur = 0.32
  const sr = ctx.sampleRate
  const bufSize = Math.floor(sr * dur)
  const buf = ctx.createBuffer(1, bufSize, sr)
  const data = buf.getChannelData(0)

  for (let i = 0; i < bufSize; i++) {
    const p = i / bufSize
    // Arc envelope: rise 60ms, sustain, fall last 30%
    const atk = Math.min(1, p / 0.18)
    const rel = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1
    const env = atk * rel
    // Slow grain ~55 Hz — feels like pencil dragging on tooth of paper
    const grain = 0.55 + 0.45 * Math.sin((i / sr) * 2 * Math.PI * 55)
    // Occasional micro-stutters for paper texture
    const stutter = Math.random() > 0.92 ? 0.4 : 1
    data[i] = (Math.random() * 2 - 1) * env * grain * stutter
  }

  const src = ctx.createBufferSource()
  src.buffer = buf

  // Soft mid-heavy eq — pencil body sits around 800–4500 Hz
  const hpf = ctx.createBiquadFilter()
  hpf.type = "highpass"; hpf.frequency.value = 700

  const lpf = ctx.createBiquadFilter()
  lpf.type = "lowpass"; lpf.frequency.value = 5500

  // Gentle presence around 2kHz for the "shhh" of graphite
  const mid = ctx.createBiquadFilter()
  mid.type = "peaking"; mid.frequency.value = 2000; mid.gain.value = 5; mid.Q.value = 0.8

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.09, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur)

  src.connect(hpf); hpf.connect(mid); mid.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination)
  src.start(t)
}

/* ── PenChip ─────────────────────────────────────────────────────────── */
function PenChip({
  label, link, color, strokeWidth, duration, idleOpacity, wordGap,
  circlePadX, circlePadY, roughness, textColor, seedBase, image,
  tooltipWidth, tooltipHeight, tooltipRadius, tooltipOffset, font, playSound,
}: {
  label: string; link?: string; color: string; strokeWidth: number
  duration: number; idleOpacity: number; wordGap: number; circlePadX: number
  circlePadY: number; roughness: number; textColor: string; seedBase: number
  image?: { src?: string }; tooltipWidth: number; tooltipHeight: number
  tooltipRadius: number; tooltipOffset: number; font?: string; playSound?: boolean
}) {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const ref = useRef<HTMLSpanElement | null>(null)
  const [hovered, setHovered] = useState(false)
  const seed = useMemo(() => seedBase + label.length * 17, [seedBase, label])

  const vbW = 300, vbH = 80, pathInset = 14, overshoot = 22

  const pathPrimary = useMemo(() =>
    buildRoughEllipsePath(vbW, vbH, pathInset, pathInset, seed, roughness, overshoot,
      0, 0, (makeRand(seed)(99) - 0.5) * 6 * roughness),
    [seed, roughness]
  )
  const pathSecondary = useMemo(() =>
    buildRoughEllipsePath(vbW, vbH, pathInset, pathInset, seed + 9991, roughness * 0.9,
      overshoot * 0.6, (makeRand(seed)(1000) - 0.5) * 3 * roughness,
      (makeRand(seed)(1001) - 0.5) * 2 * roughness, (makeRand(seed)(1002) - 0.5) * 4 * roughness),
    [seed, roughness]
  )

  const controls = useAnimation()
  const controlsSecondary = useAnimation()

  const draw = (delay = 0) => {
    controls.set({ pathLength: 0, opacity: 1 })
    controlsSecondary.set({ pathLength: 0, opacity: 0 })
    controls.start({ pathLength: 1, transition: { duration, ease: [0.65, 0, 0.35, 1], delay } })
    controlsSecondary.start({
      pathLength: 1, opacity: 1,
      transition: {
        pathLength: { duration: duration * 0.7, ease: [0.65, 0, 0.35, 1], delay: delay + duration * 0.55 },
        opacity: { duration: 0.2, delay: delay + duration * 0.55 },
      },
    })
  }

  useEffect(() => {
    draw(0.15 + (seedBase - 1) * 0.35)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEnter = () => {
    setHovered(true)
    draw()
    if (playSound && typeof window !== "undefined") {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()
      playPencilScratch(ctx)
    }
  }
  const handleLeave = () => setHovered(false)

  const chipPadding = circlePadX + wordGap
  const showSecondary = roughness >= 0.6

  const inner = (
    <motion.span
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: "relative", display: "inline-block",
        padding: `0 ${chipPadding}px`, color: textColor,
        cursor: link ? "pointer" : "default", textDecoration: "none", whiteSpace: "nowrap",
      }}
      animate={{ color: hovered ? color : textColor }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <span style={{ position: "relative", zIndex: 1, fontFamily: font ?? "inherit" }}>{label}</span>
      <motion.svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          top: `-${circlePadY}px`,
          left: `${wordGap}px`,
          width: `calc(100% - ${wordGap * 2}px)`,
          height: `calc(100% + ${circlePadY * 2}px)`,
          pointerEvents: "none",
          overflow: "visible",
        }}
        animate={{ opacity: hovered ? 1 : idleOpacity }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        aria-hidden
      >
        <motion.path
          d={pathPrimary} fill="none" stroke={color}
          strokeWidth={strokeWidth * (vbW / 200)}
          strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 1 }} animate={controls}
        />
        {showSecondary && (
          <motion.path
            d={pathSecondary} fill="none" stroke={color}
            strokeWidth={strokeWidth * (vbW / 200) * 0.75}
            strokeLinecap="round" strokeLinejoin="round"
            opacity={0.45} initial={{ pathLength: 0, opacity: 0 }} animate={controlsSecondary}
          />
        )}
      </motion.svg>
      <Tooltip
        show={hovered} anchor={ref} imageSrc={image?.src}
        width={tooltipWidth} height={tooltipHeight} radius={tooltipRadius} offset={tooltipOffset}
      />
    </motion.span>
  )

  if (link) return <a href={link} style={{ color: "inherit", textDecoration: "none", display: "inline" }}>{inner}</a>
  return inner
}

/* ── Split-flap board ────────────────────────────────────────────────── */
const FLIP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

function SplitFlapTile({ target, flipKey, delay, tileH, startChar }: {
  target: string; flipKey: number; delay: number; tileH: number; startChar?: string
}) {
  const [char, setChar] = useState(startChar ?? target.toUpperCase())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const iters  = 7
    const stepMs = 50
    let   count  = 0

    function tick() {
      count++
      const next = count >= iters
        ? target.toUpperCase()
        : FLIP_CHARS[Math.floor(Math.random() * FLIP_CHARS.length)]
      setChar(next)
      if (count < iters) timerRef.current = setTimeout(tick, stepMs)
    }

    timerRef.current = setTimeout(tick, delay)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipKey])

  const isSpace = target === " "
  const w = isSpace ? tileH * 0.35 : tileH * 0.72

  return (
    <span style={{
      display:         "inline-flex",
      alignItems:      "center",
      justifyContent:  "center",
      width:            w,
      height:           tileH,
      background:       isSpace ? "transparent" : "linear-gradient(160deg, #3a3a46 0%, #28272f 55%, #302e3c 100%)",
      borderRadius:     isSpace ? 0 : 4,
      border:           isSpace ? "none" : "1px solid #46465a",
      boxShadow:        isSpace ? "none" : "inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.3)",
      position:         "relative",
      flexShrink:       0,
      overflow:         "hidden",
    }}>
      {!isSpace && (
        <span style={{
          position:        "absolute",
          top:             "50%",
          left:            0,
          right:           0,
          height:          1,
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex:          2,
          transform:       "translateY(-50%)",
          pointerEvents:   "none",
        }} />
      )}
      <span style={{
        fontFamily:  "'Departure Mono', monospace",
        fontSize:     tileH * 0.54,
        fontWeight:   700,
        color:        isSpace ? "transparent" : "#e8e8e8",
        lineHeight:   1,
        userSelect:   "none",
        position:     "relative",
        zIndex:       1,
      }}>{char}</span>
    </span>
  )
}

function SplitFlapBoard({ text, tileH = 18, flipKey, startChars }: {
  text: string; tileH?: number; flipKey: number; startChars?: string[]
}) {
  const chars = text.toUpperCase().split("")
  return (
    <span style={{
      display:         "inline-flex",
      alignItems:      "center",
      gap:             2,
      padding:         "2px 3px",
      borderRadius:    4,
      background:      "linear-gradient(180deg, #18181e 0%, #0e0e12 100%)",
      border:          "1px solid #2a2a36",
      boxShadow:       "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {chars.map((ch, i) => (
        <SplitFlapTile
          key={i}
          target={ch}
          flipKey={flipKey}
          delay={i * 50 + 10}
          tileH={tileH}
          startChar={startChars?.[i]}
        />
      ))}
    </span>
  )
}

export { SplitFlapBoard }

/* ── Auto-cycling flip board ─────────────────────────────────────────── */
export function CyclingFlipBoard({
  words,
  tileH = 48,
  intervalMs = 3200,
}: {
  words: string[]
  tileH?: number
  intervalMs?: number
}) {
  const maxLen = Math.max(...words.map(w => w.length))
  const padded = words.map(w => w.toUpperCase().padEnd(maxLen, " "))
  const [idx, setIdx]         = useState(0)
  const [flipKey, setFlipKey] = useState(0)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      try {
        if (typeof window !== "undefined") {
          if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
          const ctx = audioCtxRef.current
          if (ctx.state === "suspended") ctx.resume()
          for (let i = 0; i < maxLen; i++) playFlipClick(ctx, (i * 50 + 10) / 1000)
        }
      } catch { /* audio blocked */ }
      setIdx(i => (i + 1) % padded.length)
      setFlipKey(k => k + 1)
    }, intervalMs)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [padded.length, maxLen, intervalMs])

  return <SplitFlapBoard text={padded[idx]} tileH={tileH} flipKey={flipKey} />
}

/* ── Hover-triggered cycling flip board ──────────────────────────────── */
export function HoverCyclingFlipBoard({ words, tileH = 20 }: { words: string[]; tileH?: number }) {
  const maxLen = Math.max(...words.map(w => w.length))
  const padded = words.map(w => w.toUpperCase().padEnd(maxLen, " "))
  const [idx, setIdx]         = useState(0)
  const [flipKey, setFlipKey] = useState(0)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const handleEnter = () => {
    try {
      if (typeof window !== "undefined") {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
        const ctx = audioCtxRef.current
        if (ctx.state === "suspended") ctx.resume()
        for (let i = 0; i < maxLen; i++) playFlipClick(ctx, (i * 50 + 10) / 1000)
      }
    } catch { /* audio blocked */ }
    setIdx(i => (i + 1) % padded.length)
    setFlipKey(k => k + 1)
  }

  return (
    <span onMouseEnter={handleEnter} style={{ cursor: "default", display: "inline-block", verticalAlign: "middle" }}>
      <SplitFlapBoard text={padded[idx]} tileH={tileH} flipKey={flipKey} />
    </span>
  )
}

/* ── Inline name flip-board chip ─────────────────────────────────────── */
function playFlipClick(ctx: AudioContext, delayS: number) {
  const t = ctx.currentTime + delayS

  // ── Noise burst (the crisp "snap") ──
  const bufSize = Math.floor(ctx.sampleRate * 0.022)
  const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data    = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3)
  }
  const src = ctx.createBufferSource()
  src.buffer = buf

  const hpf = ctx.createBiquadFilter()
  hpf.type = "highpass"; hpf.frequency.value = 1800

  const peak = ctx.createBiquadFilter()
  peak.type = "peaking"; peak.frequency.value = 3200; peak.gain.value = 10; peak.Q.value = 1.2

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.28, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.028)

  src.connect(hpf); hpf.connect(peak); peak.connect(noiseGain); noiseGain.connect(ctx.destination)
  src.start(t)

  // ── Pitch-drop oscillator (the mechanical "thud" body) ──
  const osc = ctx.createOscillator()
  osc.type = "sine"
  osc.frequency.setValueAtTime(200, t)
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.025)

  const oscGain = ctx.createGain()
  oscGain.gain.setValueAtTime(0.12, t)
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)

  osc.connect(oscGain); oscGain.connect(ctx.destination)
  osc.start(t); osc.stop(t + 0.03)
}

export function NameFlipChip({ label, link, tileH = 18 }: { label: string; link?: string; tileH?: number }) {
  const [flipKey, setFlipKey] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Start with the label itself so SSR and first client render match,
  // then swap to random gibberish after mount.
  const [gibberish, setGibberish] = useState<string[]>(() => label.split(""))
  useEffect(() => {
    setGibberish(label.split("").map(() => FLIP_CHARS[Math.floor(Math.random() * FLIP_CHARS.length)]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEnter() {
    // Synthesize staggered flip clicks via Web Audio
    if (typeof window !== "undefined") {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()
      label.split("").forEach((_, i) => {
        playFlipClick(ctx, (i * 50 + 10) / 1000)
      })
    }

    if (!revealed) {
      setRevealed(true)
      setFlipKey(1)
    } else {
      setFlipKey(k => k + 1)
    }
  }

  const board = (
    <span
      onMouseEnter={handleEnter}
      style={{ display: "inline-block", verticalAlign: "2px", margin: "0 4px", cursor: link ? "pointer" : "default" }}
    >
      <SplitFlapBoard
        text={label}
        tileH={tileH}
        flipKey={flipKey}
        startChars={revealed ? undefined : gibberish}
      />
    </span>
  )

  if (link) return <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "inline", textDecoration: "none" }}>{board}</a>
  return board
}

/* ── Inline tilt logo chip ───────────────────────────────────────────── */
export function InlineLogoChip({ src, alt, link, size = 40 }: { src: string; alt: string; link?: string; size?: number }) {
  const [hov, setHov] = useState(false)
  const inner = (
    <motion.span
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      animate={{ rotate: hov ? -10 : 0, scale: hov ? 1.18 : 1, y: hov ? -3 : 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      style={{ display: "inline-block", verticalAlign: "-4px", margin: "0 7px", cursor: link ? "pointer" : "default", lineHeight: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} draggable={false} style={{ width: size, height: "auto", display: "block", userSelect: "none", border: "1.5px solid var(--border-mid)", borderRadius: 6, padding: 2, boxSizing: "border-box" }} />
    </motion.span>
  )
  if (link) return <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "inline", textDecoration: "none" }}>{inner}</a>
  return inner
}

/* ── Main ────────────────────────────────────────────────────────────── */
export default function HeroTextWithPen({
  before = "Hey, I'm",
  middle = "a design engineer at",
  after = "based in Toronto. I spend most of my time crafting polished interfaces for web experiences, and I'm passionate about accessibility, web animation and building products.",
  name: personName = "Georgius",
  nameLink: _nameLink = "",
  nameColor = "rgb(255, 107, 48)",
  nameImage,
  company = "AMD",
  companyLink = "/amd_software_simplified",
  companyColor = "rgb(176, 190, 255)",
  companyImage,
  companyLogoSrc,
  companyLogoSize = 40,
  afterCompany,
  secondCompany,
  secondCompanyLink,
  secondCompanyLogoSrc,
  secondCompanyLogoSize = 40,
  strokeWidth = 1.6,
  duration = 0.7,
  idleOpacity = 0.7,
  wordGap = 4,
  circlePadX = 8,
  circlePadY = 10,
  roughness = 1,
  textColor = "rgba(255, 255, 255, 0.95)",
  dimmedColor = "rgba(255, 255, 255, 0.55)",
  fontSize = 16,
  lineHeight = 1.75,
  fontWeight = 500,
  fontFamily = "var(--font-sans)",
  nameFont,
  companyFont,
  tooltipWidth = 160,
  tooltipHeight = 110,
  tooltipRadius = 10,
  tooltipOffset = 12,
  style,
}: {
  before?: string; middle?: string; after?: string
  name?: string; nameLink?: string; nameColor?: string; nameImage?: { src?: string }
  company?: string; companyLink?: string; companyColor?: string; companyImage?: { src?: string }
  companyLogoSrc?: string; companyLogoSize?: number
  afterCompany?: string
  secondCompany?: string; secondCompanyLink?: string; secondCompanyLogoSrc?: string; secondCompanyLogoSize?: number
  strokeWidth?: number; duration?: number; idleOpacity?: number; wordGap?: number
  circlePadX?: number; circlePadY?: number; roughness?: number
  textColor?: string; dimmedColor?: string; fontSize?: number; lineHeight?: number
  fontWeight?: number; fontFamily?: string; nameFont?: string; companyFont?: string
  tooltipWidth?: number; tooltipHeight?: number; tooltipRadius?: number; tooltipOffset?: number
  style?: CSSProperties
}) {
  const [blockHovered, setBlockHovered] = useState(false)
  const chipProps = { strokeWidth, duration, idleOpacity, wordGap, circlePadX, circlePadY, roughness, textColor, tooltipWidth, tooltipHeight, tooltipRadius, tooltipOffset }

  const nameParts = personName && before.includes(personName) ? before.split(personName) : null

  return (
    <motion.p
      onMouseEnter={() => setBlockHovered(true)}
      onMouseLeave={() => setBlockHovered(false)}
      style={{ margin: 0, fontFamily, fontSize: `${fontSize}px`, fontWeight, lineHeight, letterSpacing: "-0.01em", ...style }}
      animate={{ color: blockHovered ? dimmedColor : textColor }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {nameParts ? (
        <>
          {nameParts[0]}
          <PenChip
            label={personName}
            color={nameColor}
            seedBase={1}
            image={nameImage}
            font={nameFont}
            playSound
            {...chipProps}
            idleOpacity={0.6}
            circlePadX={10}
            circlePadY={6}
            roughness={1.2}
          />
          {nameParts[1]}
        </>
      ) : before}
      {middle}
      <span style={{ whiteSpace: "nowrap" }}>
        {companyLogoSrc
          ? <InlineLogoChip src={companyLogoSrc} alt={company} link={companyLink || undefined} size={companyLogoSize} />
          : <PenChip label={company} link={companyLink || undefined} color={companyColor} seedBase={2} image={companyImage} font={companyFont} {...chipProps} />
        }
        {afterCompany && <span style={{ whiteSpace: "pre" }}> {afterCompany} </span>}
        {secondCompanyLogoSrc && (
          <InlineLogoChip src={secondCompanyLogoSrc} alt={secondCompany ?? ""} link={secondCompanyLink} size={secondCompanyLogoSize} />
        )}
      </span>
      {after}
    </motion.p>
  )
}
