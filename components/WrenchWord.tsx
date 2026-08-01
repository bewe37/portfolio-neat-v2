"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMagnetic } from "@/hooks/useMagnetic"

export default function WrenchWord() {
  const [hovered, setHovered] = useState(false)
  const magneticRef = useMagnetic(0.25, 48)

  return (
    <span
      ref={magneticRef as React.RefObject<HTMLSpanElement>}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "inline-block", position: "relative", cursor: "default" }}
    >
      {/* Spacer keeps layout stable */}
      <span aria-hidden style={{
        visibility: "hidden",
        fontFamily: "'Departure Mono', monospace",
        fontSize: "0.88em",
        letterSpacing: "-0.02em",
        whiteSpace: "nowrap",
      }}>
        detail-tweaking.
      </span>

      {/* Animated word */}
      <motion.span
        animate={{ rotate: hovered ? 0 : -2.5, y: hovered ? 0 : 1 }}
        transition={hovered
          ? { type: "spring", stiffness: 500, damping: 22 }
          : { duration: 1.4, ease: "easeInOut" }
        }
        style={{
          position: "absolute",
          left: 0, top: 0,
          transformOrigin: "left center",
          whiteSpace: "nowrap",
          fontFamily: "'Departure Mono', monospace",
          fontSize: "0.88em",
          letterSpacing: "-0.02em",
        }}
      >
        {/* Figma selection box */}
        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                inset: "-4px -8px",
                border: "1.5px solid #0090FF",
                borderRadius: 2,
                pointerEvents: "none",
              }}
            >
              {[
                { top: 0, left: 0 }, { top: 0, left: "50%" }, { top: 0, left: "100%" },
                { top: "50%", left: "100%" },
                { top: "100%", left: "100%" }, { top: "100%", left: "50%" }, { top: "100%", left: 0 },
                { top: "50%", left: 0 },
              ].map((pos, i) => (
                <span key={i} style={{
                  position: "absolute", top: pos.top, left: pos.left,
                  width: 5, height: 5,
                  backgroundColor: "#fff", border: "1.5px solid #0090FF",
                  borderRadius: 1, transform: "translate(-50%, -50%)",
                }} />
              ))}
              <span style={{
                position: "absolute", top: -10, left: "50%",
                transform: "translateX(-50%)",
                width: 1, height: 8, backgroundColor: "#0090FF",
              }} />
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
                style={{
                  position: "absolute", top: -20, left: "50%",
                  transform: "translateX(-50%)",
                  width: 12, height: 12, borderRadius: "50%",
                  border: "1.5px solid #0090FF", backgroundColor: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1.5A3.5 3.5 0 1 1 1.5 5" stroke="#0090FF" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M1.5 2.5V5H4" stroke="#0090FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>

        detail-twe
        <AnimatePresence mode="wait" initial={false}>
          {hovered ? (
            <motion.span key="a"
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ display: "inline-block" }}
            >a</motion.span>
          ) : (
            <motion.span key="star"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ display: "inline-block" }}
            >*</motion.span>
          )}
        </AnimatePresence>
        king.
      </motion.span>
    </span>
  )
}
