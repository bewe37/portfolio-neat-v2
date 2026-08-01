"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const DG = 16  // grid matches DrawCanvas

// 15 sample hand-drawn companions (canvas drawing functions)
type DrawFn = (ctx: CanvasRenderingContext2D) => void

const SAMPLES: DrawFn[] = [
  // Cat
  (c) => {
    c.fillStyle="#FFA300"; c.fillRect(3,4,10,8); c.fillRect(3,2,3,3); c.fillRect(10,2,3,3)
    c.fillStyle="#00E436"; c.fillRect(5,5,2,3); c.fillRect(9,5,2,3)
    c.fillStyle="#FF77A8"; c.fillRect(7,8,2,1)
    c.fillStyle="#FFF1E8"; c.fillRect(1,8,3,1); c.fillRect(12,8,3,1)
  },
  // Bird
  (c) => {
    c.fillStyle="#29ADFF"; c.fillRect(3,5,9,5)
    c.fillStyle="#1D2B53"; c.fillRect(10,4,2,2)
    c.fillStyle="#FFEC27"; c.fillRect(12,5,2,1)
    c.fillStyle="#FFF1E8"; c.fillRect(11,4,1,1)
    c.fillStyle="#83769C"; c.fillRect(5,8,3,2)
    c.fillStyle="#FFA300"; c.fillRect(4,10,1,2); c.fillRect(7,10,1,2)
  },
  // Flower
  (c) => {
    c.fillStyle="#FFEC27"; c.fillRect(6,6,4,4)
    c.fillStyle="#FF77A8"
    c.fillRect(5,3,2,3); c.fillRect(9,3,2,3); c.fillRect(3,5,3,2); c.fillRect(10,5,3,2)
    c.fillRect(5,10,2,3); c.fillRect(9,10,2,3); c.fillRect(3,9,3,2); c.fillRect(10,9,3,2)
    c.fillStyle="#008751"; c.fillRect(7,13,2,3); c.fillRect(5,14,2,1); c.fillRect(9,12,2,1)
  },
  // Fish
  (c) => {
    c.fillStyle="#83769C"; c.fillRect(3,6,9,4); c.fillRect(1,5,3,6)
    c.fillStyle="#FF77A8"; c.fillRect(11,6,3,4)
    c.fillStyle="#FFF1E8"; c.fillRect(12,7,1,1)
    c.fillStyle="#C2C3C7"; c.fillRect(5,7,1,2); c.fillRect(7,7,1,2); c.fillRect(9,7,1,2)
    c.fillStyle="#5F574F"; c.fillRect(3,5,2,1); c.fillRect(3,9,2,1)
  },
  // Ghost
  (c) => {
    c.fillStyle="#C2C3C7"
    c.fillRect(4,2,8,10); c.fillRect(3,4,1,7); c.fillRect(12,4,1,7)
    c.fillRect(3,11,2,2); c.fillRect(7,11,2,2); c.fillRect(11,11,2,2)
    c.fillStyle="#1D2B53"; c.fillRect(5,5,3,4); c.fillRect(9,5,3,4)
    c.fillStyle="#FFF1E8"; c.fillRect(6,6,1,1); c.fillRect(10,6,1,1)
  },
  // Mushroom
  (c) => {
    c.fillStyle="#FF004D"
    c.fillRect(4,3,8,7); c.fillRect(3,5,1,5); c.fillRect(12,5,1,5)
    c.fillStyle="#FFF1E8"; c.fillRect(5,4,3,3); c.fillRect(9,5,2,2)
    c.fillStyle="#FFCCAA"; c.fillRect(5,10,6,5)
    c.fillStyle="#FFF1E8"; c.fillRect(4,12,1,1); c.fillRect(11,12,1,1)
  },
  // Heart
  (c) => {
    c.fillStyle="#FF004D"
    c.fillRect(2,4,4,5); c.fillRect(10,4,4,5)
    c.fillRect(1,7,14,5); c.fillRect(3,11,10,2); c.fillRect(5,12,6,2); c.fillRect(7,13,2,2)
    c.fillStyle="#FF77A8"; c.fillRect(3,5,2,2); c.fillRect(11,5,2,2)
  },
  // Robot
  (c) => {
    c.fillStyle="#5F574F"; c.fillRect(3,3,10,10); c.fillRect(2,5,1,6); c.fillRect(13,5,1,6)
    c.fillStyle="#29ADFF"; c.fillRect(5,5,3,3); c.fillRect(9,5,3,3)
    c.fillStyle="#FFEC27"; c.fillRect(6,6,1,1); c.fillRect(10,6,1,1)
    c.fillStyle="#C2C3C7"; c.fillRect(5,10,6,2)
    c.fillStyle="#AB5236"; c.fillRect(6,2,1,1); c.fillRect(10,2,1,1); c.fillRect(6,1,1,1); c.fillRect(10,1,1,1)
  },
  // Tree
  (c) => {
    c.fillStyle="#008751"; c.fillRect(5,2,6,4); c.fillRect(4,5,8,4); c.fillRect(3,8,10,4)
    c.fillStyle="#00E436"; c.fillRect(6,3,2,3); c.fillRect(5,6,2,2)
    c.fillStyle="#AB5236"; c.fillRect(6,12,4,4)
    c.fillStyle="#5F574F"; c.fillRect(5,14,1,2)
  },
  // Alien
  (c) => {
    c.fillStyle="#00E436"
    c.fillRect(5,4,6,8); c.fillRect(4,5,1,6); c.fillRect(11,5,1,6); c.fillRect(6,3,4,1)
    c.fillStyle="#29ADFF"; c.fillRect(5,6,3,3); c.fillRect(8,6,3,3)
    c.fillStyle="#FFF1E8"; c.fillRect(5,7,2,1); c.fillRect(8,7,2,1)
    c.fillStyle="#008751"; c.fillRect(6,10,4,1); c.fillRect(5,11,1,3); c.fillRect(10,11,1,3)
    c.fillRect(6,12,2,4); c.fillRect(8,12,2,4)
  },
  // Star
  (c) => {
    c.fillStyle="#FFEC27"
    c.fillRect(7,1,2,5); c.fillRect(7,10,2,5); c.fillRect(1,7,5,2); c.fillRect(10,7,5,2)
    c.fillRect(3,3,2,2); c.fillRect(11,3,2,2); c.fillRect(3,11,2,2); c.fillRect(11,11,2,2)
    c.fillRect(5,5,6,6)
    c.fillStyle="#FFA300"; c.fillRect(6,6,4,4)
    c.fillStyle="#FFF1E8"; c.fillRect(6,5,2,2)
  },
  // Sun
  (c) => {
    c.fillStyle="#FFEC27"
    c.fillRect(4,4,8,8); c.fillRect(7,1,2,3); c.fillRect(7,12,2,3)
    c.fillRect(1,7,3,2); c.fillRect(12,7,3,2)
    c.fillRect(2,2,2,2); c.fillRect(12,2,2,2); c.fillRect(2,12,2,2); c.fillRect(12,12,2,2)
    c.fillStyle="#5F574F"; c.fillRect(6,6,2,2); c.fillRect(9,6,2,2)
    c.fillStyle="#FFF1E8"; c.fillRect(6,5,1,1); c.fillRect(9,5,1,1)
    c.fillStyle="#AB5236"; c.fillRect(6,10,4,1)
  },
  // Bunny
  (c) => {
    c.fillStyle="#C2C3C7"
    c.fillRect(4,5,8,7); c.fillRect(5,4,6,1); c.fillRect(3,6,1,5); c.fillRect(12,6,1,5)
    c.fillRect(5,2,2,4); c.fillRect(9,2,2,4)
    c.fillStyle="#FF77A8"; c.fillRect(5,3,2,2); c.fillRect(9,3,2,2)
    c.fillStyle="#5F574F"; c.fillRect(6,7,2,2); c.fillRect(9,7,2,2)
    c.fillStyle="#FF77A8"; c.fillRect(7,9,2,2)
    c.fillStyle="#FFF1E8"; c.fillRect(6,6,1,1); c.fillRect(9,6,1,1)
    c.fillStyle="#C2C3C7"; c.fillRect(3,11,3,2); c.fillRect(10,11,3,2)
  },
  // Dragon
  (c) => {
    c.fillStyle="#7E2553"
    c.fillRect(4,5,8,7); c.fillRect(3,6,1,5); c.fillRect(12,6,1,5)
    c.fillRect(3,3,3,3); c.fillRect(10,3,3,3)
    c.fillStyle="#FF004D"; c.fillRect(4,4,2,2); c.fillRect(10,4,2,2)
    c.fillStyle="#FFEC27"; c.fillRect(5,7,2,2); c.fillRect(9,7,2,2)
    c.fillStyle="#5F574F"; c.fillRect(5,6,1,1); c.fillRect(10,6,1,1)
    c.fillStyle="#FF004D"; c.fillRect(6,10,4,1)
    c.fillStyle="#FFA300"; c.fillRect(4,11,2,4); c.fillRect(10,11,2,4)
  },
  // Wizard
  (c) => {
    c.fillStyle="#7E2553"
    c.fillRect(6,1,4,6); c.fillRect(5,3,6,4); c.fillRect(4,5,8,3); c.fillRect(3,7,10,2)
    c.fillRect(2,9,12,3)
    c.fillStyle="#FFEC27"; c.fillRect(7,3,2,1)
    c.fillStyle="#FFF1E8"; c.fillRect(7,3,1,1); c.fillRect(8,4,1,1)
    c.fillStyle="#FF77A8"; c.fillRect(5,10,6,2)
    c.fillStyle="#FFCCAA"; c.fillRect(6,12,4,4)
    c.fillStyle="#5F574F"; c.fillRect(6,13,1,2); c.fillRect(9,13,1,2)
  },
]

function renderFn(draw: DrawFn): string {
  const cv = document.createElement("canvas")
  cv.width = DG; cv.height = DG
  draw(cv.getContext("2d")!)
  return cv.toDataURL()
}

// 6 rows: alternating scroll direction, varied speeds
const ROW_CFG: { dir: "left" | "right"; duration: number }[] = [
  { dir: "left",  duration: 38 },
  { dir: "right", duration: 26 },
  { dir: "left",  duration: 44 },
  { dir: "right", duration: 22 },
  { dir: "left",  duration: 32 },
  { dir: "right", duration: 48 },
]

const ITEM_SIZE  = 100  // card px
const ITEM_GAP   = 14
const ITEMS_HALF = 22   // items in one half — doubled for seamless loop

function buildRow(pool: string[], rowIdx: number): string[] {
  // Offset starting position per row so columns don't align
  const offset = (rowIdx * 4) % pool.length
  const shifted = [...pool.slice(offset), ...pool.slice(0, offset)]
  const half: string[] = []
  while (half.length < ITEMS_HALF) half.push(...shifted)
  const trimmed = half.slice(0, ITEMS_HALF)
  return [...trimmed, ...trimmed]  // doubled for seamless loop
}

export default function CompanionsPage() {
  const [pool, setPool] = useState<string[]>([])

  useEffect(() => {
    const samples = SAMPLES.map(renderFn)
    const custom  = localStorage.getItem("customBuddyData")

    function buildPool(real: string[]) {
      const base = real.length > 0 ? [...real, ...samples] : samples
      if (custom) {
        const mixed: string[] = []
        base.forEach((s, i) => { mixed.push(s); if (i % 4 === 3) mixed.push(custom) })
        setPool(mixed)
      } else {
        setPool(base)
      }
    }

    fetch("/api/companions")
      .then(r => r.json())
      .then((d: { companions?: string[] }) => buildPool(d.companions ?? []))
      .catch(() => buildPool([]))
  }, [])

  return (
    <div style={{
      background:     "#18181b",
      minHeight:      "100dvh",
      overflow:       "hidden",
      display:        "flex",
      flexDirection:  "column",
      justifyContent: "center",
      position:       "relative",
    }}>
      {/* Subtle vignette */}
      <div style={{
        position:      "absolute", inset: 0, pointerEvents: "none",
        background:    "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)",
      }} />

      {/* Back button */}
      <Link
        href="/onboarding"
        style={{
          position:      "fixed", top: 24, left: 24, zIndex: 20,
          display:       "inline-flex", alignItems: "center", gap: 6,
          fontFamily:    "var(--font-sans)", fontSize: "0.75rem", fontWeight: 600,
          letterSpacing: "-0.01em", color: "rgba(255,255,255,0.45)",
          textDecoration:"none",
          padding:       "7px 12px 7px 8px",
          borderRadius:  99,
          border:        "1px solid rgba(255,255,255,0.1)",
          background:    "rgba(255,255,255,0.04)",
          transition:    "color 0.15s ease, border-color 0.15s ease, background 0.15s ease",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.color = "rgba(255,255,255,0.9)"
          el.style.borderColor = "rgba(255,255,255,0.22)"
          el.style.background = "rgba(255,255,255,0.08)"
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.color = "rgba(255,255,255,0.45)"
          el.style.borderColor = "rgba(255,255,255,0.1)"
          el.style.background = "rgba(255,255,255,0.04)"
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </Link>

      {/* Title — bottom left */}
      <div style={{
        position:   "fixed", bottom: 28, left: 32, zIndex: 20,
        fontFamily: "'Departure Mono', monospace",
        lineHeight: 1.5, userSelect: "none",
      }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 400, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", margin: 0 }}>
          The companions
        </p>
        <p style={{ fontSize: "0.6875rem", fontWeight: 400, color: "rgba(255,255,255,0.22)", letterSpacing: "0.04em", margin: 0 }}>
          Hand-drawn — {SAMPLES.length + 1} visitors
        </p>
      </div>

      {/* Rows */}
      {pool.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: ITEM_GAP }}>
          {ROW_CFG.map(({ dir, duration }, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                overflow:  "hidden",
                animation: `rowFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) ${rowIdx * 0.07}s both`,
              }}
            >
              <div
                style={{
                  display:   "flex",
                  gap:       ITEM_GAP,
                  width:     "fit-content",
                  animation: `companions-scroll-${dir} ${duration}s linear infinite`,
                }}
              >
                {buildRow(pool, rowIdx).map((url, i) => (
                  <div
                    key={i}
                    style={{
                      width:        ITEM_SIZE,
                      height:       ITEM_SIZE,
                      flexShrink:   0,
                      padding:      9,
                      borderRadius: 5,
                      background:   "#f0ece4",
                      boxShadow:    "0 4px 18px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      draggable={false}
                      style={{
                        width:          "100%",
                        height:         "100%",
                        display:        "block",
                        imageRendering: "pixelated",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes companions-scroll-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes companions-scroll-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
