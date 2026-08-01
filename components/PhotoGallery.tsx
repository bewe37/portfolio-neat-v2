"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { motion, useMotionValue } from "framer-motion"

interface Photo { src: string; label?: string }

const PHOTOS: Photo[] = [
  { src: "/nyc.jpg",         label: "Employees Only"   },
  { src: "/austria.jpg",     label: "Austria"          },
  { src: "/korea.jpg",       label: "Korea"            },
  { src: "/paris.jpg",       label: "Paris"            },
  { src: "/banfff.jpg",      label: "Banff"            },
  { src: "/parisSelfie.jpg", label: "Paris & Me"       },
  { src: "/BC.jpg",          label: "Vancouver Island" },
  { src: "/vanc.jpg",        label: "Vancouver"        },
  { src: "/dawg.jpg",        label: "Leo - My Dawg"   },
  { src: "/fred.jpg",        label: "Fred Again"       },
  { src: "/image3.jpg",      label: "Dumbo"            },
  { src: "/image4.jpg",      label: "Austria"          },
]

const CARD_W = 140

// Positions are percentages of container so they stay centered at any width
// Two loose rows, clustered toward center with breathing room around edges
const LAYOUT_PCT = [
  { cx: 14, cy: 22, r: -11 },
  { cx: 24, cy: 17, r:   8 },
  { cx: 34, cy: 20, r: -14 },
  { cx: 45, cy: 15, r:  10 },
  { cx: 56, cy: 19, r:  -7 },
  { cx: 66, cy: 16, r:  13 },
  { cx: 18, cy: 50, r:  13 },
  { cx: 29, cy: 54, r:  -9 },
  { cx: 40, cy: 49, r:   7 },
  { cx: 51, cy: 52, r: -12 },
  { cx: 62, cy: 48, r:  -5 },
  { cx: 72, cy: 53, r:  11 },
]

const CONTAINER_H = 460

// Use a tighter spring — less work per frame
const SPRING = { type: "spring" as const, stiffness: 260, damping: 28 }

function Card({
  photo, ir, zIndex, onActivate, containerRef, isActive,
}: {
  photo: Photo
  ir: number
  zIndex: number
  onActivate: () => void
  containerRef: React.RefObject<HTMLDivElement>
  isActive: boolean
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [hovered,  setHovered]  = useState(false)
  const [dragging, setDragging] = useState(false)

  const handlePointerDown = useCallback(() => { onActivate() }, [onActivate])

  return (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragMomentum={true}
      dragElastic={0.12}
      dragTransition={{ power: 0.3, timeConstant: 200, bounceStiffness: 280, bounceDamping: 36 }}
      onPointerDown={handlePointerDown}
      onDragStart={() => { setDragging(true); onActivate() }}
      onDragEnd={() => setDragging(false)}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ rotate: ir }}
      animate={{
        rotate: dragging ? ir * 0.2 : hovered ? 0 : ir,
        scale:  dragging ? 1.06 : hovered ? 1.03 : 1,
      }}
      transition={SPRING}
      style={{
        position:    "absolute",
        top:         0,
        left:        0,
        x, y,
        zIndex,
        cursor:      dragging ? "grabbing" : "grab",
        touchAction: "none",
        // only promote to GPU layer when the card is actually being interacted with
        willChange:  isActive ? "transform" : "auto",
      }}
    >
      <div style={{
        backgroundColor: "#fefcf8",
        padding:         "8px 8px 32px",
        borderRadius:    3,
        boxShadow:       dragging || hovered
          ? "0 24px 56px rgba(0,0,0,0.24), 0 6px 16px rgba(0,0,0,0.11)"
          : "0 4px 16px rgba(0,0,0,0.11), 0 1px 4px rgba(0,0,0,0.06)",
        transition:      "box-shadow 0.2s ease",
        userSelect:      "none",
      }}>
        <div style={{
          overflow:   "hidden",
          borderRadius: 1,
          boxShadow:  "inset 0 0 0 1px rgba(0,0,0,0.06)",
          lineHeight: 0,
          width:      CARD_W - 16,
          height:     CARD_W - 16,
          flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.label ?? ""}
            draggable={false}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
          />
        </div>
        <p style={{
          margin:        0,
          padding:       "9px 4px 0",
          fontFamily:    "'Departure Mono', monospace",
          fontSize:      "0.625rem",
          fontWeight:    400,
          color:         "rgba(0,0,0,0.38)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          textAlign:     "center",
          lineHeight:    1,
          minHeight:     12,
        }}>
          {photo.label ?? ""}
        </p>
      </div>
    </motion.div>
  )
}


export default function PhotoGallery() {
  const containerRef = useRef<HTMLDivElement>(null!)
  const [zStack, setZStack]   = useState<number[]>(PHOTOS.map((_, i) => i + 1))
  const [activeIdx, setActive] = useState<number | null>(null)
  // Defer mounting the heavy drag gallery until after first paint
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const bringToFront = useCallback((i: number) => {
    setActive(i)
    setZStack(prev => {
      const cur = prev[i]
      return prev.map((z, j) => j === i ? PHOTOS.length : z > cur ? z - 1 : z)
    })
  }, [])

  return (
    <>
      {/* ── Desktop: draggable polaroid scatter ── */}
      <div
        className="rsp-gallery-desktop"
        ref={containerRef}
        style={{
          position:        "relative",
          height:          CONTAINER_H,
          borderRadius:    8,
          overflow:        "hidden",
          backgroundColor: "var(--surface)",
          backgroundImage: "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)",
          backgroundSize:  "18px 18px",
        }}
      >
        {/* Caption inside gallery */}
        <div style={{ position: "absolute", bottom: 14, left: 20, right: 20, display: "flex", justifyContent: "space-between", alignItems: "baseline", zIndex: 0, pointerEvents: "none" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 500, color: "var(--c-faint)", letterSpacing: "-0.01em" }}>
            Through the lens
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 400, color: "var(--c-faint)", letterSpacing: "-0.01em" }}>
            A collective memory of my 20s
          </span>
        </div>

        {mounted && (
          <div style={{ position: "absolute", inset: "16px 16px 40px" }}>
            {PHOTOS.map((photo, i) => {
              const { cx, cy, r } = LAYOUT_PCT[i % LAYOUT_PCT.length]
              return (
                <div key={i} style={{
                  position: "absolute",
                  left: `${cx}%`,
                  top:  `${cy}%`,
                }}>
                  <Card
                    photo={photo}
                    ir={r}
                    zIndex={zStack[i]}
                    isActive={activeIdx === i}
                    onActivate={() => bringToFront(i)}
                    containerRef={containerRef}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Mobile: single portrait photo ── */}
      <div className="rsp-gallery-mobile" style={{ display: "none" }}>
        <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "4/5", backgroundColor: "var(--surface)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/parisSelfie.jpg"
            alt="Paris & Me"
            draggable={false}
            loading="eager"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </div>
    </>
  )
}
