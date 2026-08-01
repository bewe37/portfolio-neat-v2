"use client"

import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion"
import { useRef, useState } from "react"

const LOGOS = ["/logoName.svg", "/logoNameBlue.svg"]

export default function LogoAvatar() {
  const ref        = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  const springCfg = { stiffness: 300, damping: 20 }
  const rotateX   = useSpring(useTransform(rawY, [-0.5, 0.5], [14, -14]), springCfg)
  const rotateY   = useSpring(useTransform(rawX, [-0.5, 0.5], [-14, 14]), springCfg)
  const scale     = useSpring(1,  { stiffness: 500, damping: 22 })
  const y         = useSpring(0,  { stiffness: 500, damping: 22 })

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    rawX.set((e.clientX - rect.left)  / rect.width  - 0.5)
    rawY.set((e.clientY - rect.top)   / rect.height - 0.5)
  }

  function onMouseEnter() { scale.set(1.13); y.set(-8) }

  function onMouseLeave() {
    rawX.set(0); rawY.set(0)
    scale.set(1); y.set(0)
  }

  function onClick() { setIdx(i => (i + 1) % LOGOS.length) }

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-flex", perspective: 600, cursor: "pointer" }}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <motion.div
        style={{
          rotateX, rotateY, scale, y,
          display: "inline-flex",
          transformStyle: "preserve-3d",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={idx}
            src={LOGOS[idx]}
            alt="georgius"
            draggable={false}
            initial={{ opacity: 0, scale: 0.72, rotate: -8, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1,    rotate: 0,  filter: "blur(0px)" }}
            exit={{    opacity: 0, scale: 0.72, rotate:  8, filter: "blur(6px)" }}
            transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
            whileHover={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.18))" } as never}
            style={{ height: 60, width: "auto", display: "block" }}
          />
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
