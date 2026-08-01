"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { gsap } from "gsap"
import Link from "next/link"

interface Project {
  title: string
  category: string
  date: string
  href: string
  image?: string
}

const POSITIONS = [
  { x: -270, y: 38, rotate: -10 },
  { x:  -90, y:  6, rotate:  -3 },
  { x:   90, y:  6, rotate:   3 },
  { x:  270, y: 38, rotate:  10 },
]
const BASE_SCALE = [0.86, 0.94, 0.94, 0.86]

// Hand SVG points UP at rotation=0.
// Angles derived from geometry: hand at (0,300), cards at x=±270/±90, y≈120-140.
// atan2(dx, -(cardY - handY)) gives degrees clockwise from up.
// Card 0 (-270, 139): -59°  Card 1 (-90, 117): -26°
// Card 2 (+90, 117):  +26°  Card 3 (+270, 139): +59°
const HAND_ANGLES = [-59, -26, 26, 59]

const PLACEHOLDER_BG = [
  "linear-gradient(150deg, rgb(225,222,216) 0%, rgb(212,209,203) 100%)",
  "linear-gradient(150deg, rgb(217,221,228) 0%, rgb(204,209,220) 100%)",
  "linear-gradient(150deg, rgb(222,217,226) 0%, rgb(210,204,218) 100%)",
  "linear-gradient(150deg, rgb(221,225,217) 0%, rgb(209,213,204) 100%)",
]


export default function ProjectCarousel({ projects }: { projects: Project[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const handRef = useRef<HTMLDivElement>(null)
  const floatTween = useRef<gsap.core.Tween | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isVisible = useRef(false)

  useEffect(() => {
    const el = handRef.current
    if (!el) return
    // rotation=0 → hand points UP
    gsap.set(el, { rotation: 0, opacity: 0, scale: 0.8, y: 0 })
    return () => {
      floatTween.current?.kill()
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  const startFloat = () => {
    floatTween.current?.kill()
    floatTween.current = gsap.to(handRef.current, {
      y: -7,
      duration: 0.85,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    })
  }

  const handleEnter = (i: number) => {
    setHovered(i)
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }

    const el = handRef.current
    if (!el) return
    const targetRot = HAND_ANGLES[i]

    if (!isVisible.current) {
      isVisible.current = true
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.5, y: 14, rotation: targetRot },
        {
          opacity: 1, scale: 1, y: 0, rotation: targetRot,
          duration: 0.65,
          ease: "elastic.out(1, 0.48)",
          onComplete: startFloat,
        }
      )
    } else {
      gsap.to(el, {
        rotation: targetRot,
        duration: 0.4,
        ease: "elastic.out(1.2, 0.55)",
      })
    }
  }

  const handleLeave = () => {
    setHovered(null)
    hideTimer.current = setTimeout(() => {
      const el = handRef.current
      if (!el) return
      floatTween.current?.kill()
      floatTween.current = null
      isVisible.current = false
      gsap.to(el, { opacity: 0, scale: 0.65, y: 10, duration: 0.22, ease: "power2.in" })
    }, 80)
  }

  return (
    <div
      style={{
        position: "relative",
        height: 430,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      {projects.slice(0, 4).map((p, i) => {
        const pos = POSITIONS[i]
        const base = BASE_SCALE[i]
        const isHov = hovered === i
        const isDimmed = hovered !== null && !isHov
        const z = isHov ? 10 : i === 1 ? 3 : i === 2 ? 2 : 1

        return (
          <motion.div
            key={p.href}
            onMouseEnter={() => handleEnter(i)}
            onMouseLeave={handleLeave}
            initial={{ x: pos.x, y: pos.y, rotate: pos.rotate, scale: base, opacity: 1 }}
            animate={{
              x: pos.x,
              y: isHov ? pos.y - 22 : pos.y,
              rotate: isHov ? pos.rotate * 0.25 : pos.rotate,
              scale: isHov ? base + 0.10 : base,
              opacity: isDimmed ? 0.72 : 1,
            }}
            transition={{ type: "spring", stiffness: 340, damping: 26, mass: 0.8 }}
            style={{
              position: "absolute",
              width: 280,
              zIndex: z,
              cursor: "pointer",
              transformOrigin: "50% 100%",
              willChange: "transform",
            }}
          >
            <Link href={p.href} style={{ textDecoration: "none", display: "block" }}>
              <div
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: isHov
                    ? "0 22px 52px rgba(0,0,0,0.13), 0 6px 16px rgba(0,0,0,0.07)"
                    : "0 8px 28px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.04)",
                  transition: "box-shadow 0.25s ease",
                }}
              >
                <div style={{ aspectRatio: "16/10", overflow: "hidden" }}>
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: PLACEHOLDER_BG[i] }} />
                  )}
                </div>
                <div
                  style={{
                    padding: "13px 15px 15px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    backgroundColor: "rgb(250,249,247)",
                    borderTop: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "rgba(0,0,0,0.8)",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.45,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    } as React.CSSProperties}
                  >
                    {p.title}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                      color: "rgba(0,0,0,0.3)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {p.category}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}

      {/* Single hand — rotates to point at the hovered card */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div ref={handRef} style={{ willChange: "transform, opacity", fontSize: "2.5rem", lineHeight: 1, userSelect: "none" }}>
          👆
        </div>
      </div>
    </div>
  )
}
