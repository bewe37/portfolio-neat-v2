"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const CONFETTI = [
  { color: "#FF6B30" }, { color: "#FFD93D" }, { color: "#6BCB77" },
  { color: "#4D96FF" }, { color: "#FF6B9D" }, { color: "#C77DFF" },
  { color: "#FF6B30" }, { color: "#FFD93D" }, { color: "#4D96FF" },
  { color: "#6BCB77" }, { color: "#FF6B9D" }, { color: "#C77DFF" },
]

const ORANGE = "#FF6B30"
const RAINBOW = "linear-gradient(90deg, #FF6B30, #FFD93D, #6BCB77, #4D96FF, #C77DFF)"

export function EasyWord() {
  const [hovered, setHovered] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  function handleEnter() {
    setHovered(true)
    setBurstKey(k => k + 1)
  }

  return (
    <span
      onMouseEnter={handleEnter}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "inline-block", position: "relative", cursor: "default" }}
    >
      {/* Confetti burst */}
      <AnimatePresence>
        {hovered && CONFETTI.map((c, i) => {
          const angle = (i / CONFETTI.length) * 360
          const rad = (angle * Math.PI) / 180
          const dist = 30 + (i % 3) * 10
          const tx = Math.cos(rad) * dist
          const ty = Math.sin(rad) * dist - 10
          return (
            <motion.span
              key={`${burstKey}-${i}`}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x: tx, y: ty, scale: 0.3 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: i * 0.012 }}
              style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: i % 2 === 0 ? 6 : 7,
                height: i % 2 === 0 ? 6 : 4,
                borderRadius: i % 2 === 0 ? "50%" : 1,
                backgroundColor: c.color,
                pointerEvents: "none",
                marginTop: -3, marginLeft: -3,
              }}
            />
          )
        })}
      </AnimatePresence>

      {/* Word — bounce animation */}
      <motion.span
        animate={hovered ? { y: [0, -7, 1, -2, 0], scale: [1, 1.1, 0.97, 1.02, 1] } : {}}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{ display: "inline-block", position: "relative", fontWeight: 600 }}
      >
        {/* Orange base — always visible, fades out on hover */}
        <motion.span
          animate={{ opacity: hovered ? 0 : 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ color: ORANGE, display: "inline-block" }}
        >
          easy?
        </motion.span>

        {/* Rainbow — sits on top, fades in on hover */}
        <motion.span
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: RAINBOW,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "inline-block",
          }}
        >
          easy?
        </motion.span>
      </motion.span>
    </span>
  )
}

export function CoffeeWord() { return null }
