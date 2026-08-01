"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { InlineLogoChip } from "@/components/HeroTextWithPen"
import { CyclingFlipBoard } from "@/components/HeroTextWithPen"

gsap.registerPlugin(ScrollTrigger)

const ROLES = ["complex", "dense", "technical", "overwhelming"]

export default function HeroNew() {
  const nameRef    = useRef<HTMLDivElement>(null)
  const tagRef     = useRef<HTMLDivElement>(null)
  const bodyRef    = useRef<HTMLDivElement>(null)
  const cardRef    = useRef<HTMLDivElement>(null)

  // Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

      tl.fromTo(tagRef.current,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.1 }
      )
      .fromTo(nameRef.current,
        { y: 48, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, ease: "power4.out" },
        "-=0.3"
      )
      .fromTo(bodyRef.current,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.5"
      )
      .fromTo(cardRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.4"
      )

      // Scroll parallax on name — drifts up slightly faster than scroll
      gsap.to(nameRef.current, {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: nameRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section style={{
      position:   "relative",
      padding:    "120px 0 40px",
      overflow:   "visible",
      minHeight:  "60vh",
      display:    "flex",
      flexDirection: "column",
      justifyContent: "center",
    }}>

      {/* Tagline — top left, small */}
      <div ref={tagRef} style={{
        display:       "flex",
        alignItems:    "center",
        gap:           10,
        marginBottom:  24,
      }}>
        <span style={{
          fontFamily:    "'Departure Mono', monospace",
          fontSize:      "0.6875rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color:         "var(--c-dim)",
        }}>
          Making
        </span>
        <CyclingFlipBoard words={ROLES} tileH={20} intervalMs={2600} />
        <span style={{
          fontFamily:    "'Departure Mono', monospace",
          fontSize:      "0.6875rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color:         "var(--c-dim)",
        }}>
          software feel human
        </span>
      </div>

      {/* Big name — bleeds right */}
      <div
        ref={nameRef}
        style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "clamp(42px, 16vw, 220px)",
          fontWeight:    600,
          letterSpacing: "-0.05em",
          lineHeight:    0.88,
          color:         "var(--c-primary)",
          whiteSpace:    "nowrap",
          marginLeft:    "-0.04em",
          // Slightly clipped on right — intentional bleed
          overflow:      "visible",
          position:      "relative",
          userSelect:    "none",
        }}
      >
        Georgius
        {/* Subtle texture overlay — matches grid dot aesthetic */}
        <div style={{
          position:   "absolute",
          inset:      0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 3px, var(--dot-color) 3px, var(--dot-color) 4px)",
          pointerEvents: "none",
          mixBlendMode: "multiply",
          opacity: 0.4,
        }} />
      </div>

      {/* Body + card row */}
      <div style={{
        display:       "flex",
        alignItems:    "flex-end",
        justifyContent:"space-between",
        marginTop:     40,
        gap:           24,
        flexWrap:      "wrap",
      }}>
        {/* Body copy */}
        <div ref={bodyRef} style={{ maxWidth: 400 }}>
          <p style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "1rem",
            fontWeight:    400,
            letterSpacing: "-0.01em",
            lineHeight:    1.8,
            color:         "var(--c-mid)",
            margin:        0,
          }}>
            Product designer who loves working on the software most people find overwhelming —
            and making it something they&apos;d actually enjoy using.
          </p>
        </div>

        {/* Floating previously-at card */}
        <div
          ref={cardRef}
          style={{
            flexShrink:    0,
            border:        "1px solid var(--border-mid)",
            borderRadius:  12,
            padding:       "14px 18px",
            background:    "var(--bg)",
            boxShadow:     "0 2px 12px rgba(0,0,0,0.06)",
            display:       "flex",
            flexDirection: "column",
            gap:           6,
          }}
        >
          <span style={{
            fontFamily:    "'Departure Mono', monospace",
            fontSize:      "0.5625rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color:         "var(--c-dim)",
          }}>
            Previously at
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <InlineLogoChip src="/amdchip.svg"  alt="AMD"           link="https://www.amd.com"  size={48} />
            <span style={{ color: "var(--c-dim)", fontSize: "0.8125rem" }}>&amp;</span>
            <InlineLogoChip src="/safechip.svg" alt="Safe Software" link="https://www.safe.com" size={64} />
          </div>
        </div>
      </div>

    </section>
  )
}
