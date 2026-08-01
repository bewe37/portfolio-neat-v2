"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion"
import { BUDDIES, type BuddyDef } from "@/lib/buddies"
import { SpriteView } from "@/components/SpriteBuddy"

const SPRITE_SCALE = 4

// Each companion lives at a different depth:
// speed = parallax multiplier (higher = moves more = feels closer)
// baseY = initial vertical stagger within the row (px down from row top)
const LAYER_CFG = [
  { speed: 0.40, baseY:  40 },  // fox
  { speed: 0.95, baseY: 120 },  // squirrel
  { speed: 0.18, baseY:   8 },  // cat
  { speed: 1.15, baseY: 160 },  // hermitcrab
  { speed: 0.62, baseY:  72 },  // jellyfish
  { speed: 0.22, baseY:  24 },  // raven
]

function CompanionFloat({
  buddy,
  scrollYProgress,
  speed,
  baseY,
  isYours,
  index,
}: {
  buddy:            BuddyDef
  scrollYProgress:  MotionValue<number>
  speed:            number
  baseY:            number
  isYours:          boolean
  index:            number
}) {
  const [hovered, setHovered] = useState(false)
  const y = useTransform(scrollYProgress, [0, 1], [-speed * 64, speed * 64])

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay: index * 0.09, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        paddingTop:    baseY,
        minWidth:      0,
      }}
    >
      <motion.div
        style={{ y }}
        animate={{ scale: hovered ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        <div style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          gap:            12,
        }}>
          {/* Sprite card */}
          <div style={{
            position:        "relative",
            width:           buddy.tileW * SPRITE_SCALE + 24,
            height:          buddy.tileH * SPRITE_SCALE + 24,
            borderRadius:    16,
            border:          isYours
              ? "1.5px solid rgba(255,107,48,0.45)"
              : `1.5px solid rgba(255,255,255,${hovered ? 0.12 : 0.06})`,
            background:      isYours
              ? "rgba(255,107,48,0.07)"
              : `rgba(255,255,255,${hovered ? 0.05 : 0.025})`,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            transition:      "border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease",
            boxShadow:       isYours
              ? "0 0 0 3px rgba(255,107,48,0.14), 0 12px 36px rgba(0,0,0,0.5)"
              : hovered
              ? "0 12px 36px rgba(0,0,0,0.5)"
              : "0 4px 16px rgba(0,0,0,0.35)",
          }}>
            {/* Dot grid texture */}
            <div style={{
              position:        "absolute",
              inset:           0,
              borderRadius:    16,
              backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
              backgroundSize:  "8px 8px",
              pointerEvents:   "none",
            }} />

            <SpriteView
              buddy={buddy}
              animKey={hovered ? buddy.hoverAnim : buddy.idleAnim}
              scale={SPRITE_SCALE}
            />

            {/* "Yours" badge */}
            {isYours && (
              <div style={{
                position:      "absolute",
                top:           -10,
                right:         -8,
                background:    "rgb(255,107,48)",
                color:         "#fff",
                fontSize:      8,
                fontWeight:    700,
                letterSpacing: "0.09em",
                textTransform: "uppercase" as const,
                padding:       "3px 7px",
                borderRadius:  99,
                fontFamily:    "var(--font-sans)",
                whiteSpace:    "nowrap" as const,
                boxShadow:     "0 2px 10px rgba(255,107,48,0.5)",
              }}>
                Yours
              </div>
            )}
          </div>

          {/* Name */}
          <p style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.8125rem",
            fontWeight:    700,
            color:         isYours
              ? "rgba(255,107,48,0.9)"
              : `rgba(255,255,255,${hovered ? 0.9 : 0.72})`,
            letterSpacing: "-0.02em",
            margin:        0,
            lineHeight:    1.2,
            transition:    "color 0.2s ease",
            textAlign:     "center",
          }}>
            {buddy.name}
          </p>

          {/* Tagline — desktop only */}
          <p className="rsp-hide-mobile" style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.625rem",
            fontWeight:    400,
            color:         "rgba(255,255,255,0.28)",
            letterSpacing: "-0.01em",
            margin:        "-4px 0 0",
            lineHeight:    1.5,
            textAlign:     "center",
            maxWidth:      110,
          }}>
            {buddy.tagline}
          </p>

          {/* Trait chips */}
          <div className="rsp-hide-mobile" style={{
            display:        "flex",
            gap:            4,
            flexWrap:       "wrap" as const,
            justifyContent: "center",
          }}>
            {buddy.traits.map(t => (
              <span key={t} style={{
                fontFamily:    "var(--font-sans)",
                fontSize:      "0.5625rem",
                fontWeight:    600,
                letterSpacing: "0.05em",
                textTransform: "uppercase" as const,
                color:         "rgba(255,255,255,0.25)",
                padding:       "2px 6px",
                border:        "1px solid rgba(255,255,255,0.08)",
                borderRadius:  99,
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function CompanionParallax() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [myBuddy,    setMyBuddy]    = useState<string | null>(null)
  const [customSrc,  setCustomSrc]  = useState<string | null>(null)

  const { scrollYProgress } = useScroll({
    target:  wrapperRef,
    offset:  ["start end", "end start"],
  })

  useEffect(() => {
    function sync() {
      const id = localStorage.getItem("buddyId")
      setMyBuddy(id)
      if (id === "custom") setCustomSrc(localStorage.getItem("customBuddyData"))
    }
    sync()
    window.addEventListener("buddySelected", sync)
    return () => window.removeEventListener("buddySelected", sync)
  }, [])

  return (
    <div
      ref={wrapperRef}
      style={{
        width:     "100vw",
        position:  "relative",
        left:      "50%",
        transform: "translateX(-50%)",
        overflow:  "hidden",
        background: "#18181b",
        paddingBottom: 80,
      }}
    >
      {/* Soft orange ambient glow */}
      <div style={{
        position:      "absolute",
        inset:         0,
        background:    "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,107,48,0.045) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Very faint star-scatter */}
      <div style={{
        position:      "absolute",
        inset:         0,
        backgroundImage: [
          "radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "120px 120px",
        backgroundPosition: "23px 18px",
        opacity:       0.18,
        pointerEvents: "none",
      }} />

      {/* Content shell — same max-width as the rest of the page */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 48px 0" }} className="rsp-px">

        {/* Section header */}
        <div style={{ marginBottom: 0 }}>
          <p style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "1.0625rem",
            fontWeight:    500,
            color:         "rgba(255,255,255,0.88)",
            letterSpacing: "-0.02em",
            lineHeight:    1.2,
            margin:        0,
          }}>
            The companions
          </p>
          <p style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.9375rem",
            fontWeight:    400,
            color:         "rgba(255,255,255,0.3)",
            letterSpacing: "-0.01em",
            lineHeight:    1.5,
            margin:        "6px 0 0",
          }}>
            Six characters keeping visitors company. Which one found you?
          </p>
        </div>

        {/* ── Desktop parallax row ── */}
        <div
          className="rsp-hide-mobile"
          style={{
            display:   "flex",
            minHeight: 380,
            paddingTop: 32,
          }}
        >
          {BUDDIES.map((buddy, i) => (
            <CompanionFloat
              key={buddy.id}
              buddy={buddy}
              scrollYProgress={scrollYProgress}
              speed={LAYER_CFG[i].speed}
              baseY={LAYER_CFG[i].baseY}
              isYours={myBuddy === buddy.id}
              index={i}
            />
          ))}
          {myBuddy === "custom" && customSrc && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, delay: BUDDIES.length * 0.09, ease: [0.16, 1, 0.3, 1] }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 80, minWidth: 0 }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{
                  position: "relative",
                  width: 32 * SPRITE_SCALE + 24, height: 32 * SPRITE_SCALE + 24,
                  borderRadius: 16,
                  border: "1.5px solid rgba(255,107,48,0.45)",
                  background: "rgba(255,107,48,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 3px rgba(255,107,48,0.14), 0 12px 36px rgba(0,0,0,0.5)",
                }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: 16, backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize: "8px 8px", pointerEvents: "none" }} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={customSrc} alt="Your companion" style={{ width: 32 * SPRITE_SCALE, height: 32 * SPRITE_SCALE, imageRendering: "pixelated", display: "block" }} />
                  <div style={{
                    position: "absolute", top: -10, right: -8,
                    background: "rgb(255,107,48)", color: "#fff",
                    fontSize: 8, fontWeight: 700, letterSpacing: "0.09em",
                    textTransform: "uppercase" as const,
                    padding: "3px 7px", borderRadius: 99, fontFamily: "var(--font-sans)",
                    whiteSpace: "nowrap" as const, boxShadow: "0 2px 10px rgba(255,107,48,0.5)",
                  }}>Yours</div>
                </div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 700, color: "rgba(255,107,48,0.9)", letterSpacing: "-0.02em", margin: 0, textAlign: "center" }}>
                  Custom
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Mobile 2×3 grid (no parallax) ── */}
        <div
          className="rsp-show-mobile-grid"
          style={{
            display:               "none",
            gridTemplateColumns:   "1fr 1fr",
            gap:                   24,
            paddingTop:            32,
          }}
        >
          {BUDDIES.map((buddy, i) => (
            <motion.div
              key={buddy.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
            >
              <div style={{
                position:        "relative",
                width:           buddy.tileW * 3 + 20,
                height:          buddy.tileH * 3 + 20,
                borderRadius:    14,
                border:          myBuddy === buddy.id
                  ? "1.5px solid rgba(255,107,48,0.45)"
                  : "1.5px solid rgba(255,255,255,0.07)",
                background:      myBuddy === buddy.id
                  ? "rgba(255,107,48,0.07)"
                  : "rgba(255,255,255,0.03)",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                boxShadow:       myBuddy === buddy.id
                  ? "0 0 0 3px rgba(255,107,48,0.14)"
                  : "none",
              }}>
                <SpriteView buddy={buddy} animKey={buddy.idleAnim} scale={3} />
                {myBuddy === buddy.id && (
                  <div style={{
                    position: "absolute", top: -9, right: -6,
                    background: "rgb(255,107,48)", color: "#fff",
                    fontSize: 8, fontWeight: 700, letterSpacing: "0.09em",
                    textTransform: "uppercase" as const,
                    padding: "2px 6px", borderRadius: 99,
                    fontFamily: "var(--font-sans)",
                    boxShadow: "0 2px 8px rgba(255,107,48,0.5)",
                  }}>Yours</div>
                )}
              </div>
              <p style={{
                fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 700,
                color: myBuddy === buddy.id ? "rgba(255,107,48,0.9)" : "rgba(255,255,255,0.72)",
                letterSpacing: "-0.01em", margin: 0, textAlign: "center",
              }}>{buddy.name}</p>
            </motion.div>
          ))}
          {myBuddy === "custom" && customSrc && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: BUDDIES.length * 0.07, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
            >
              <div style={{
                position: "relative", width: 32 * 3 + 20, height: 32 * 3 + 20,
                borderRadius: 14, border: "1.5px solid rgba(255,107,48,0.45)",
                background: "rgba(255,107,48,0.07)", display: "flex",
                alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 0 3px rgba(255,107,48,0.14)",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={customSrc} alt="Your companion" style={{ width: 32 * 3, height: 32 * 3, imageRendering: "pixelated", display: "block" }} />
                <div style={{
                  position: "absolute", top: -9, right: -6,
                  background: "rgb(255,107,48)", color: "#fff",
                  fontSize: 8, fontWeight: 700, letterSpacing: "0.09em",
                  textTransform: "uppercase" as const,
                  padding: "2px 6px", borderRadius: 99, fontFamily: "var(--font-sans)",
                  boxShadow: "0 2px 8px rgba(255,107,48,0.5)",
                }}>Yours</div>
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,107,48,0.9)", letterSpacing: "-0.01em", margin: 0, textAlign: "center" }}>
                Custom
              </p>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  )
}
