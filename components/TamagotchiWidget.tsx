"use client"

import { useState, useEffect, useRef } from "react"

type CharAction = "idle" | "walk" | "sleep" | "dance" | "excited" | "jump"

type Screen     = "idle" | "mood" | "location" | "availability"
type TimePeriod = "dawn" | "day" | "dusk" | "night"

const LCD = "#c8d8ac"
const PX  = "#2a3d1f"
const EYE = "#b0c494"

function getTimePeriod(h: number): TimePeriod {
  if (h >= 5  && h < 8)  return "dawn"
  if (h >= 8  && h < 17) return "day"
  if (h >= 17 && h < 21) return "dusk"
  return "night"
}

/* ── characters ── */
function CharNormal({ speed = 2.2 }: { speed?: number }) {
  return (
    <svg viewBox="0 0 22 24" style={{ width: 46, height: 46, animation: `tama-bounce ${speed}s ease-in-out infinite` }} fill={PX} shapeRendering="crispEdges">
      <rect x="7"  y="1"  width="8"  height="2" /><rect x="5"  y="3"  width="12" height="2" />
      <rect x="3"  y="5"  width="16" height="2" /><rect x="2"  y="7"  width="18" height="8" />
      <rect x="3"  y="15" width="16" height="2" /><rect x="5"  y="17" width="12" height="2" />
      <rect x="7"  y="19" width="8"  height="2" />
      <rect x="5"  y="8"  width="4"  height="4" fill={EYE} /><rect x="13" y="8"  width="4" height="4" fill={EYE} />
      <rect x="6"  y="9"  width="2"  height="2" fill={PX}  /><rect x="14" y="9"  width="2" height="2" fill={PX}  />
      <rect x="9"  y="13" width="4"  height="1" fill={EYE} />
      <rect x="6"  y="21" width="3"  height="2" /><rect x="13" y="21" width="3" height="2" />
    </svg>
  )
}

function CharHappy() {
  return (
    <svg viewBox="0 0 22 24" style={{ width: 46, height: 46, animation: "tama-sway 1.5s ease-in-out infinite" }} fill={PX} shapeRendering="crispEdges">
      <rect x="7"  y="1"  width="8"  height="2" /><rect x="5"  y="3"  width="12" height="2" />
      <rect x="3"  y="5"  width="16" height="2" /><rect x="2"  y="7"  width="18" height="8" />
      <rect x="3"  y="15" width="16" height="2" /><rect x="5"  y="17" width="12" height="2" />
      <rect x="7"  y="19" width="8"  height="2" />
      {/* squinting happy eyes */}
      <rect x="5"  y="8"  width="4"  height="3" fill={EYE} /><rect x="13" y="8"  width="4"  height="3" fill={EYE} />
      <rect x="6"  y="10" width="3"  height="1" fill={PX}  /><rect x="14" y="10" width="3"  height="1" fill={PX}  />
      {/* U-shaped smile */}
      <rect x="7"  y="12" width="1"  height="2" fill={PX}  />
      <rect x="14" y="12" width="1"  height="2" fill={PX}  />
      <rect x="8"  y="13" width="6"  height="1" fill={PX}  />
      {/* rosy cheeks */}
      <rect x="3"  y="11" width="2"  height="1" fill={PX}  />
      <rect x="17" y="11" width="2"  height="1" fill={PX}  />
      <rect x="6"  y="21" width="3"  height="2" /><rect x="13" y="21" width="3" height="2" />
    </svg>
  )
}

function CharExcited() {
  return (
    <svg viewBox="0 0 22 24" style={{ width: 46, height: 46, animation: "tama-bounce 0.55s ease-in-out infinite" }} fill={PX} shapeRendering="crispEdges">
      <rect x="7"  y="1"  width="8"  height="2" /><rect x="5"  y="3"  width="12" height="2" />
      <rect x="3"  y="5"  width="16" height="2" /><rect x="2"  y="7"  width="18" height="8" />
      <rect x="3"  y="15" width="16" height="2" /><rect x="5"  y="17" width="12" height="2" />
      <rect x="7"  y="19" width="8"  height="2" />
      <rect x="5"  y="8"  width="2"  height="2" fill={PX} /><rect x="8"  y="9"  width="1" height="1" fill={PX} />
      <rect x="6"  y="10" width="2"  height="2" fill={PX} />
      <rect x="13" y="8"  width="2"  height="2" fill={PX} /><rect x="16" y="9"  width="1" height="1" fill={PX} />
      <rect x="14" y="10" width="2"  height="2" fill={PX} />
      <rect x="8"  y="13" width="6"  height="2" fill={PX} />
      <rect x="6"  y="21" width="3"  height="2" /><rect x="13" y="21" width="3" height="2" />
    </svg>
  )
}

function CharSleepy() {
  return (
    <svg viewBox="0 0 22 24" style={{ width: 46, height: 46, animation: "tama-sleep 2.8s ease-in-out infinite" }} fill={PX} shapeRendering="crispEdges">
      <rect x="7"  y="1"  width="8"  height="2" /><rect x="5"  y="3"  width="12" height="2" />
      <rect x="3"  y="5"  width="16" height="2" /><rect x="2"  y="7"  width="18" height="8" />
      <rect x="3"  y="15" width="16" height="2" /><rect x="5"  y="17" width="12" height="2" />
      <rect x="7"  y="19" width="8"  height="2" />
      {/* closed eyes — horizontal lines */}
      <rect x="5"  y="10" width="5"  height="1" fill={PX} />
      <rect x="13" y="10" width="5"  height="1" fill={PX} />
      {/* tiny sleeping mouth */}
      <rect x="10" y="13" width="2"  height="1" fill={PX} />
      <rect x="6"  y="21" width="3"  height="2" /><rect x="13" y="21" width="3" height="2" />
    </svg>
  )
}

function CharJump() {
  return (
    <svg viewBox="0 0 22 24" style={{ width: 46, height: 46, animation: "tama-jump 0.7s ease-out infinite" }} fill={PX} shapeRendering="crispEdges">
      <rect x="7"  y="1"  width="8"  height="2" /><rect x="5"  y="3"  width="12" height="2" />
      <rect x="3"  y="5"  width="16" height="2" /><rect x="2"  y="7"  width="18" height="8" />
      <rect x="3"  y="15" width="16" height="2" /><rect x="5"  y="17" width="12" height="2" />
      <rect x="7"  y="19" width="8"  height="2" />
      {/* wide-open surprised eyes */}
      <rect x="4"  y="7"  width="5"  height="5" fill={EYE} /><rect x="13" y="7" width="5" height="5" fill={EYE} />
      <rect x="5"  y="8"  width="3"  height="3" fill={PX}  /><rect x="14" y="8" width="3" height="3" fill={PX}  />
      {/* O mouth */}
      <rect x="9"  y="12" width="4"  height="1" fill={PX} />
      <rect x="8"  y="13" width="1"  height="2" fill={PX} /><rect x="13" y="13" width="1" height="2" fill={PX} />
      <rect x="9"  y="15" width="4"  height="1" fill={PX} />
      {/* legs spread out mid-jump */}
      <rect x="4"  y="21" width="3"  height="2" /><rect x="15" y="21" width="3" height="2" />
    </svg>
  )
}



function CharListening() {
  return (
    <svg viewBox="0 0 22 28" style={{ width: 46, height: 52, animation: "tama-groove 0.8s ease-in-out infinite", transformOrigin: "bottom center" }} fill={PX} shapeRendering="crispEdges">
      {/* headphone band across top */}
      <rect x="4"  y="0"  width="14" height="1" />
      <rect x="3"  y="1"  width="2"  height="3" />
      <rect x="17" y="1"  width="2"  height="3" />
      {/* headphone cups */}
      <rect x="1"  y="3"  width="4"  height="4" />
      <rect x="17" y="3"  width="4"  height="4" />
      {/* body */}
      <rect x="7"  y="3"  width="8"  height="2" /><rect x="5"  y="5"  width="12" height="2" />
      <rect x="3"  y="7"  width="16" height="2" /><rect x="2"  y="9"  width="18" height="8" />
      <rect x="3"  y="17" width="16" height="2" /><rect x="5"  y="19" width="12" height="2" />
      <rect x="7"  y="21" width="8"  height="2" />
      {/* happy squinting eyes */}
      <rect x="5"  y="10" width="4"  height="3" fill={EYE} /><rect x="13" y="10" width="4"  height="3" fill={EYE} />
      <rect x="6"  y="12" width="3"  height="1" fill={PX}  /><rect x="14" y="12" width="3"  height="1" fill={PX}  />
      {/* smile */}
      <rect x="7"  y="14" width="1"  height="2" fill={PX} />
      <rect x="14" y="14" width="1"  height="2" fill={PX} />
      <rect x="8"  y="15" width="6"  height="1" fill={PX} />
      {/* legs */}
      <rect x="6"  y="23" width="3"  height="2" /><rect x="13" y="23" width="3" height="2" />
    </svg>
  )
}

/* ── pixel decorations ── */
function PixelHeart({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 11 11" style={{ width: 13, height: 11, ...style }} fill={PX} shapeRendering="crispEdges">
      <rect x="1" y="1" width="3" height="1" /><rect x="7" y="1" width="3" height="1" />
      <rect x="0" y="2" width="5" height="3" /><rect x="6" y="2" width="5" height="3" />
      <rect x="1" y="5" width="9" height="2" /><rect x="2" y="7" width="7" height="2" />
      <rect x="3" y="9" width="5" height="1" /><rect x="4" y="10" width="3" height="1" />
    </svg>
  )
}

function PixelStar({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 9 9" style={{ width: 9, height: 9, ...style }} fill={PX} shapeRendering="crispEdges">
      <rect x="4" y="0" width="1" height="3" />
      <rect x="4" y="6" width="1" height="3" />
      <rect x="0" y="4" width="3" height="1" />
      <rect x="6" y="4" width="3" height="1" />
      <rect x="1" y="1" width="2" height="2" />
      <rect x="6" y="1" width="2" height="2" />
      <rect x="1" y="6" width="2" height="2" />
      <rect x="6" y="6" width="2" height="2" />
      <rect x="3" y="3" width="3" height="3" />
    </svg>
  )
}

/* ── sky elements ── */
function PixelSun({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill={PX} shapeRendering="crispEdges">
      <rect x="7"  y="0"  width="2" height="3" /><rect x="7"  y="13" width="2" height="3" />
      <rect x="0"  y="7"  width="3" height="2" /><rect x="13" y="7"  width="3" height="2" />
      <rect x="1"  y="2"  width="2" height="2" /><rect x="13" y="2"  width="2" height="2" />
      <rect x="1"  y="12" width="2" height="2" /><rect x="13" y="12" width="2" height="2" />
      <rect x="5"  y="4"  width="6" height="8" /><rect x="4"  y="5"  width="8" height="6" />
    </svg>
  )
}

function PixelMoon({ size = 12 }: { size?: number }) {
  // Draw crescent directly — no LCD-fill cutout trick that breaks on non-LCD backgrounds
  return (
    <svg viewBox="0 0 8 12" width={size} height={size} fill={PX} shapeRendering="crispEdges">
      {/* outer arc (right side) */}
      <rect x="3" y="0"  width="4" height="1" />
      <rect x="2" y="1"  width="5" height="1" />
      <rect x="1" y="2"  width="5" height="1" />
      {/* body — left strip stays thin, right side fills out */}
      <rect x="0" y="3"  width="6" height="1" />
      <rect x="0" y="4"  width="6" height="1" />
      <rect x="0" y="5"  width="5" height="1" />
      <rect x="0" y="6"  width="5" height="1" />
      <rect x="0" y="7"  width="6" height="1" />
      <rect x="0" y="8"  width="6" height="1" />
      {/* lower arc */}
      <rect x="1" y="9"  width="5" height="1" />
      <rect x="2" y="10" width="5" height="1" />
      <rect x="3" y="11" width="4" height="1" />
    </svg>
  )
}

function PixelHalfSun({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 10" width={size} height={Math.round(size * 10 / 16)} fill={PX} shapeRendering="crispEdges">
      <rect x="7"  y="0" width="2" height="2" />
      <rect x="1"  y="1" width="2" height="2" /><rect x="13" y="1" width="2" height="2" />
      <rect x="5"  y="3" width="6" height="6" />
      <rect x="4"  y="4" width="8" height="5" />
      <rect x="0"  y="6" width="3" height="2" /><rect x="13" y="6" width="3" height="2" />
      <rect x="0"  y="9" width="16" height="1" />
    </svg>
  )
}

function PixelStars() {
  const pts = [[3,1],[10,0],[18,2],[5,5],[14,4],[22,6],[8,8],[19,8]]
  return (
    <svg viewBox="0 0 28 10" width={28} height={10} fill={PX} shapeRendering="crispEdges"
      style={{ position: "absolute", top: 2, left: 0, pointerEvents: "none" }}>
      {pts.map(([x,y], i) => <rect key={i} x={x} y={y} width="1" height="1" />)}
    </svg>
  )
}

/* ── city scene with sky ── */
const SKY_TINTS: Record<TimePeriod, string> = {
  day:   "transparent",
  dawn:  "rgba(210,160,80,0.13)",
  dusk:  "rgba(200,90,50,0.13)",
  night: "rgba(10,20,50,0.11)",
}

function CityScene({ period }: { period?: TimePeriod }) {
  return (
    <div style={{ width: "50%", position: "relative", display: "flex", alignItems: "flex-end" }}>
      {period && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 32, pointerEvents: "none" }}>
          {period === "night" && <PixelStars />}
          <div style={{ position: "absolute", top: 3, right: 2 }}>
            {period === "day"   && <PixelSun size={13} />}
            {period === "dawn"  && <PixelHalfSun size={13} />}
            {period === "dusk"  && <PixelHalfSun size={13} />}
            {period === "night" && <PixelMoon size={11} />}
          </div>
        </div>
      )}
      <span style={{ position: "absolute", top: 0, left: 0, fontSize: 7, opacity: 0.55 }}>YZ</span>
      <svg viewBox="0 0 32 30" style={{ width: "100%", height: 56 }} fill={PX} shapeRendering="crispEdges">
        <rect x="10" y="0"  width="1" height="6"  /><rect x="9"  y="6"  width="3" height="2" />
        <rect x="10" y="8"  width="1" height="3"  /><rect x="8"  y="11" width="5" height="3" />
        <rect x="10" y="14" width="1" height="8"  /><rect x="8"  y="22" width="5" height="6" />
        <rect x="7"  y="20" width="7" height="2"  /><rect x="16" y="13" width="5" height="15" />
        <rect x="22" y="17" width="5" height="11" /><rect x="0"  y="20" width="6" height="8" />
        <rect x="0"  y="28" width="32" height="2" />
      </svg>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem" }}>
      <span style={{ opacity: 0.5 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  )
}

function getTimeActivities(h: number): CharAction[] {
  if (h >= 22 || h < 5)  return ["sleep","sleep","sleep","idle"]
  if (h >= 5  && h < 7)  return ["idle","idle","walk","idle"]
  if (h >= 7  && h < 9)  return ["excited","walk","excited","jump"]
  if (h >= 9  && h < 12) return ["idle","walk","idle","idle"]
  if (h >= 12 && h < 14) return ["dance","excited","walk","jump"]
  if (h >= 14 && h < 17) return ["idle","idle","walk","sleep"]
  if (h >= 17 && h < 19) return ["dance","walk","excited","jump"]
  return ["walk","idle","dance","idle"]
}

function playArcadeBeep(ctx: AudioContext, freq: number) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = "square"
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.65, t + 0.055)

  // slight bit-crush feel via a gentle waveshaper
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.16, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09)

  osc.connect(gain); gain.connect(ctx.destination)
  osc.start(t); osc.stop(t + 0.1)
}

const BTN_FREQS: Record<string, number> = { a: 480, b: 360, c: 560 }

export default function TamagotchiWidget() {
  const [time,       setTime]       = useState("")
  const [period,     setPeriod]     = useState<TimePeriod>("day")
  const [screen,     setScreen]     = useState<Screen>("idle")
  const [btnDown,    setBtnDown]    = useState<string | null>(null)
  const [charAction, setCharAction] = useState<CharAction>("idle")
  const [charX,      setCharX]      = useState(30)
  const [facing,     setFacing]     = useState<"left"|"right">("right")
  const charXRef   = useRef(30)
  const hour24Ref  = useRef(new Date().getHours())
  const audioCtxRef = useRef<AudioContext | null>(null)

  function pressBtn(name: string) {
    if (typeof window !== "undefined") {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()
      playArcadeBeep(ctx, BTN_FREQS[name])
    }
    setBtnDown(name)
  }

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const hour24 = now.getHours()
      hour24Ref.current = hour24
      let h = hour24
      const m = now.getMinutes()
      const ampm = h >= 12 ? "PM" : "AM"
      h = h % 12 || 12
      setTime(`${h}:${m.toString().padStart(2, "0")} ${ampm}`)
      setPeriod(getTimePeriod(hour24))
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>
    function next() {
      const pool = getTimeActivities(hour24Ref.current)
      const action = pool[Math.floor(Math.random() * pool.length)]
      setCharAction(action)
      if (action === "sleep") {
        charXRef.current = 48
        setCharX(48)
      } else if (action === "walk") {
        const newX = 4 + Math.floor(Math.random() * 72)
        setFacing(newX > charXRef.current ? "right" : "left")
        charXRef.current = newX
        setCharX(newX)
      }
      tid = setTimeout(next, 1400 + Math.random() * 2000)
    }
    tid = setTimeout(next, 800)
    return () => clearTimeout(tid)
  }, [])

  const toggle = (s: Screen) => setScreen(prev => prev === s ? "idle" : s)

  function btnStyle(name: string): React.CSSProperties {
    const active  = screen === (name === "a" ? "mood" : name === "b" ? "location" : "availability")
    const pressed = btnDown === name
    const down    = pressed || active
    return {
      width: 32, height: 32, borderRadius: "50%",
      cursor: "pointer", outline: "none", border: "none",
      background: down
        ? "radial-gradient(circle at 45% 42%, #b8a860, #968644)"
        : "radial-gradient(circle at 33% 27%, #f0e8a8 0%, #d4c060 50%, #b09a3a 100%)",
      boxShadow: down
        ? "inset 0 3px 7px rgba(0,0,0,0.45)"
        : "0 4px 0 #7a6a20, 0 5px 12px rgba(0,0,0,0.28), inset 0 1px 3px rgba(255,248,200,0.45)",
      transform: down ? "translateY(4px)" : "translateY(0)",
      transition: "transform 0.07s ease, box-shadow 0.07s ease, background 0.07s ease",
    }
  }

  return (
    <div style={{ position: "relative", width: 266, height: 306 }}>

      {/* Hanger loop */}
      <div style={{
        position: "absolute", top: -20, left: "50%",
        transform: "translateX(-50%)",
        width: 28, height: 22,
        borderRadius: "14px 14px 0 0",
        border: "4px solid #3a3842",
        borderBottom: "none",
        background: "transparent",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.35), -1px 0 2px rgba(0,0,0,0.35), 1px 0 2px rgba(255,255,255,0.08)",
        zIndex: 15,
      }} />

      {/* Egg body — polished silver */}
      <div style={{
        position: "relative", width: "100%", height: "100%", zIndex: 10,
        borderRadius: "50% 50% 46% 54% / 56% 56% 44% 44%",
        background: "radial-gradient(ellipse at 30% 22%, #f4f4f8 0%, #c6c6d0 42%, #8e8e98 100%)",
        boxShadow: [
          "0 20px 48px rgba(0,0,0,0.28)",
          "0 6px 16px rgba(0,0,0,0.22)",
          "inset 14px 16px 30px rgba(255,255,255,0.55)",
          "inset -10px -16px 28px rgba(0,0,0,0.22)",
          "inset 12px -16px 32px rgba(0,0,0,0.32)",
          "inset 0 2px 1px rgba(255,255,255,0.65)",
        ].join(", "),
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", paddingBottom: 16,
        overflow: "hidden",
      }}>


        {/* Gloss specular — upper-left shine */}
        <div style={{
          position: "absolute", top: "4%", left: "8%",
          width: "55%", height: "40%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at 40% 38%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 66%)",
          transform: "rotate(-14deg)",
          pointerEvents: "none",
        }} />

        {/* Secondary gloss — right edge catch-light */}
        <div style={{
          position: "absolute", top: "28%", right: "6%",
          width: "8%", height: "32%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        }} />

        {/* TAMAGOTCHI wordmark */}
        <div style={{
          position: "absolute", top: 22, left: 0, right: 0,
          textAlign: "center",
          fontFamily: "'Uncut Sans', system-ui, sans-serif",
          fontSize: "0.8125rem", fontWeight: 800, letterSpacing: "0.09em",
          color: "rgba(40,40,55,0.82)",
          textShadow: "0 1px 0 rgba(255,255,255,0.55), 0 -1px 0 rgba(0,0,0,0.18)",
          fontStyle: "italic",
          pointerEvents: "none", zIndex: 3,
        }}>
          TAMAGOTCHI
        </div>

        {/* Screen bezel — silver chrome */}
        <div style={{
          position: "relative", zIndex: 1,
          width: 160, marginTop: 24,
          background: "linear-gradient(160deg, #e4e4ec 0%, #b8b8c2 48%, #8e8e98 100%)",
          borderRadius: 13,
          padding: 6,
          boxShadow: [
            "0 2px 0 rgba(255,255,255,0.35) inset",
            "0 -2px 3px rgba(0,0,0,0.32) inset",
            "0 3px 9px rgba(0,0,0,0.55)",
            "0 1px 0 rgba(255,255,255,0.25)",
          ].join(", "),
        }}>
          {/* Chrome inner ring — recessed bezel */}
          <div style={{
            borderRadius: 7, overflow: "hidden",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35), inset 0 2px 5px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.25)",
          }}>
            <div className="tama-lcd-grid" style={{
              background: LCD, borderRadius: 6,
              fontFamily: "'DotGothic16', monospace", color: PX,
              overflow: "hidden",
            }}>

              {/* IDLE — full-width roaming playground */}
              {screen === "idle" && (
                <div style={{ position: "relative", height: 96, overflow: "hidden" }}>
                  {/* sky period element */}
                  <div style={{ position: "absolute", top: 4, right: 6 }}>
                    {period === "day"   && <PixelSun size={11} />}
                    {period === "dawn"  && <PixelHalfSun size={11} />}
                    {period === "dusk"  && <PixelHalfSun size={11} />}
                    {period === "night" && <PixelMoon size={9} />}
                  </div>
                  {period === "night" && <PixelStars />}

                  {/* Z's when sleeping */}
                  {charAction === "sleep" && (<>
                    <span style={{ position: "absolute", bottom: 57, left: charX + 30, fontFamily: "monospace", fontSize: 8, fontWeight: 700, color: PX, animation: "tama-zzz 1.8s ease-out infinite", animationDelay: "0s" }}>z</span>
                    <span style={{ position: "absolute", bottom: 64, left: charX + 36, fontFamily: "monospace", fontSize: "0.625rem", fontWeight: 700, color: PX, animation: "tama-zzz 1.8s ease-out infinite", animationDelay: "0.7s" }}>Z</span>
                    <span style={{ position: "absolute", bottom: 70, left: charX + 26, fontFamily: "monospace", fontSize: 7,  fontWeight: 700, color: PX, animation: "tama-zzz 1.8s ease-out infinite", animationDelay: "1.3s" }}>z</span>
                  </>)}

                  {/* Hearts when excited/dancing */}
                  {(charAction === "excited" || charAction === "dance") && (<>
                    <PixelHeart style={{ position: "absolute", bottom: 57, left: charX + 32, animation: "tama-float 1.4s ease-out infinite", animationDelay: "0s" }} />
                    <PixelHeart style={{ position: "absolute", bottom: 57, left: charX + 16, animation: "tama-float 1.4s ease-out infinite", animationDelay: "0.6s" }} />
                  </>)}

                  {/* thought bubble when idling */}
                  {charAction === "idle" && (
                    <span style={{ position: "absolute", bottom: 57, left: charX + 26, fontFamily: "monospace", fontSize: 8, color: PX, opacity: 0, animation: "tama-think 3s ease-in-out infinite" }}>...</span>
                  )}

                  {/* ground line */}
                  <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, height: 1, background: `${PX}28`, borderRadius: 1 }} />

                  {/* roaming character */}
                  <div style={{
                    position:   "absolute",
                    bottom:     charAction === "sleep" ? 7 : 9,
                    left:       charX,
                    transition: "left 1.4s ease-in-out, bottom 0.3s ease",
                    transform:  facing === "left" ? "scaleX(-1)" : "none",
                  }}>
                    {charAction === "sleep"   && <CharSleepy />}
                    {charAction === "jump"    && <CharJump />}
                    {charAction === "dance"   && <CharHappy />}
                    {charAction === "excited" && <CharExcited />}
                    {(charAction === "idle" || charAction === "walk") && <CharNormal speed={charAction === "walk" ? 0.6 : 2.2} />}
                  </div>
                </div>
              )}

              {/* MOOD (A) */}
              {screen === "mood" && (
                <div style={{ display: "flex", height: 96, padding: "6px 7px 4px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "56%" }}>
                    <span style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.08em", opacity: 0.55 }}>MOOD //</span>
                    <div style={{ height: 1, background: `${PX}28` }} />
                    <Row label="state"  value="happy"    />
                    <Row label="energy" value="high"     />
                    <Row label="vibe"   value="creative" />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end", position: "relative" }}>
                    <PixelStar style={{ position: "absolute", top: 0, right: 2, animation: "tama-float 2s ease-out infinite", animationDelay: "0.3s" }} />
                    <PixelHeart style={{ position: "absolute", top: 10, right: 0, animation: "tama-float 2s ease-out infinite", animationDelay: "1.1s" }} />
                    <PixelHeart style={{ position: "absolute", top: 4, right: 10, animation: "tama-float 2.4s ease-out infinite", animationDelay: "0s" }} />
                    <CharHappy />
                  </div>
                </div>
              )}

              {/* LOCATION (B) */}
              {screen === "location" && (
                <div style={{ position: "relative", display: "flex", height: 96, padding: "4px 7px 2px" }}>
                  <CityScene period={period} />
                  <div style={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-end", paddingBottom: 3, gap: 3 }}>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 700 }}>Toronto</span>
                    <span style={{ fontSize: 8, opacity: 0.6 }}>Ontario, CA</span>
                    <span style={{ fontSize: 8, opacity: 0.45 }}>YYZ · GMT-5</span>
                  </div>
                </div>
              )}

              {/* NOW PLAYING (C) */}
              {screen === "availability" && (
                <div style={{ position: "relative", display: "flex", height: 96, padding: "6px 7px 2px", overflow: "hidden" }}>
                  {/* floating note */}
                  <span style={{
                    position: "absolute", top: 4, right: 34, fontSize: "0.5625rem",
                    animation: "tama-note 1.4s ease-out infinite",
                    pointerEvents: "none",
                  }}>♪</span>
                  <span style={{
                    position: "absolute", top: 10, right: 24, fontSize: 7,
                    animation: "tama-note 1.4s ease-out infinite 0.7s",
                    pointerEvents: "none",
                  }}>♫</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "62%" }}>
                    <span style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.08em", opacity: 0.55 }}>NOW PLAYING</span>
                    <div style={{ height: 1, background: `${PX}28` }} />
                    <span style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "-0.01em" }}>Beast of Burden</span>
                    <span style={{ fontSize: "0.5625rem", opacity: 0.6 }}>Rolling Stones</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                    <CharListening />
                  </div>
                </div>
              )}

              {/* Clock */}
              <div style={{
                borderTop: `1px solid rgba(42,61,31,0.16)`,
                display: "flex", justifyContent: "center", alignItems: "center",
                padding: "3px 7px",
                fontSize: "0.5625rem", letterSpacing: "0.07em",
              }}>
                {time}
              </div>
            </div>
          </div>
        </div>

        {/* 3 buttons — middle sits slightly lower */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          width: 134, marginTop: 16,
        }}>
          <button
            style={btnStyle("a")}
            onClick={() => toggle("mood")}
            onMouseDown={() => pressBtn("a")}
            onMouseUp={() => setBtnDown(null)}
            onMouseLeave={() => setBtnDown(null)}
          />
          <button
            style={{ ...btnStyle("b"), marginTop: 8 }}
            onClick={() => toggle("location")}
            onMouseDown={() => pressBtn("b")}
            onMouseUp={() => setBtnDown(null)}
            onMouseLeave={() => setBtnDown(null)}
          />
          <button
            style={btnStyle("c")}
            onClick={() => toggle("availability")}
            onMouseDown={() => pressBtn("c")}
            onMouseUp={() => setBtnDown(null)}
            onMouseLeave={() => setBtnDown(null)}
          />
        </div>

      </div>
    </div>
  )
}
