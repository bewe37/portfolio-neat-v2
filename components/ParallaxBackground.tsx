"use client"

import { useScroll, useTransform, motion } from "framer-motion"

export default function ParallaxBackground() {
  const { scrollY } = useScroll()

  // Each layer scrolls at a different fraction of page scroll speed
  const y1 = useTransform(scrollY, v => v * 0.07)   // large rings — barely drift
  const y2 = useTransform(scrollY, v => v * 0.16)   // small ring — medium drift
  const y3 = useTransform(scrollY, v => v * 0.28)   // cross marks — most drift
  const y4 = useTransform(scrollY, v => v * 0.03)   // warm glow — almost still

  const crosses = [
    { left: "4.5vw",  top: "14%" },
    { left: "93.5vw", top: "31%" },
    { left: "5vw",    top: "55%" },
    { left: "92vw",   top: "69%" },
    { left: "4vw",    top: "84%" },
    { left: "94vw",   top: "90%" },
  ]

  return (
    <div
      aria-hidden
      style={{
        position: "fixed", inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* Warm orange glow — anchored top-left quadrant, barely moves */}
      <motion.div style={{
        position: "absolute",
        top: -280, left: "8%",
        width: 680, height: 680,
        background: "radial-gradient(circle, rgba(255,107,48,0.065) 0%, transparent 65%)",
        borderRadius: "50%",
        y: y4,
      }} />

      {/* Second glow — bottom-right, cooler tint */}
      <motion.div style={{
        position: "absolute",
        bottom: -200, right: "10%",
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(255,107,48,0.035) 0%, transparent 65%)",
        borderRadius: "50%",
        y: useTransform(scrollY, v => v * 0.05),
      }} />

      {/* Large concentric rings — top right corner */}
      <motion.svg
        width="560" height="560" viewBox="0 0 560 560" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: -160, right: -140, y: y1 }}
      >
        <circle cx="280" cy="280" r="270" stroke="var(--border-mid)" strokeWidth="1"/>
        <circle cx="280" cy="280" r="208" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="5 10"/>
        <circle cx="280" cy="280" r="148" stroke="var(--border)" strokeWidth="0.75"/>
        <circle cx="280" cy="280" r="90"  stroke="var(--border)" strokeWidth="0.5"  strokeDasharray="3 7"/>
      </motion.svg>

      {/* Smaller ring — bottom left */}
      <motion.svg
        width="340" height="340" viewBox="0 0 340 340" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", bottom: -70, left: -90, y: y2 }}
      >
        <circle cx="170" cy="170" r="163" stroke="var(--border-mid)" strokeWidth="1"/>
        <circle cx="170" cy="170" r="108" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="4 8"/>
      </motion.svg>

      {/* Mid-page accent ring — right edge, mid scroll */}
      <motion.svg
        width="220" height="220" viewBox="0 0 220 220" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: "38%", right: -60, y: useTransform(scrollY, v => v * 0.11) }}
      >
        <circle cx="110" cy="110" r="106" stroke="var(--border)" strokeWidth="0.75"/>
        <circle cx="110" cy="110" r="72"  stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 6"/>
      </motion.svg>

      {/* Cross / plus marks — scattered in the outer margins */}
      {crosses.map((pos, i) => (
        <motion.svg
          key={i}
          width="11" height="11" viewBox="0 0 11 11" fill="none"
          style={{ position: "absolute", top: pos.top, left: pos.left, y: y3 }}
        >
          <path d="M5.5 0V11M0 5.5H11" stroke="var(--c-ghost)" strokeWidth="1"/>
        </motion.svg>
      ))}
    </div>
  )
}
