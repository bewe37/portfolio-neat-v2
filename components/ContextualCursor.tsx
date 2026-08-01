"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion"

interface CursorState {
  label: string | null
  variant: "dot" | "ring" | "pill"
}

export default function ContextualCursor() {
  const rawX = useMotionValue(-200)
  const rawY = useMotionValue(-200)

  const x = useSpring(rawX, { stiffness: 900, damping: 60, mass: 0.4 })
  const y = useSpring(rawY, { stiffness: 900, damping: 60, mass: 0.4 })

  const [state, setState] = useState<CursorState>({ label: null, variant: "dot" })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX)
      rawY.set(e.clientY)
    }

    const onEnter = () => setVisible(true)
    const onLeave = () => setVisible(false)

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const labeled = target.closest("[data-cursor]") as HTMLElement | null
      if (labeled) {
        const label = labeled.getAttribute("data-cursor") || null
        setState({ label, variant: label ? "pill" : "dot" })
      } else {
        const isInteractive = !!target.closest("a, button, [role='button'], input, select, textarea")
        setState({ label: null, variant: isInteractive ? "ring" : "dot" })
      }
    }

    window.addEventListener("mousemove", onMove)
    document.addEventListener("mouseenter", onEnter)
    document.addEventListener("mouseleave", onLeave)
    document.addEventListener("mouseover", onOver)

    return () => {
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseenter", onEnter)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("mouseover", onOver)
    }
  }, [rawX, rawY])

  return (
    <>
      <style>{`html, * { cursor: none !important; }`}</style>

      <motion.div
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 999999,
          x,
          y,
        }}
      >
        <AnimatePresence mode="wait">
          {state.variant === "pill" && state.label ? (
            <motion.div
              key="pill"
              initial={{ opacity: 0, scale: 0.72, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                backgroundColor: "rgba(18,18,18,0.88)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                borderRadius: 999,
                padding: "6px 14px",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-sans)",
                fontSize: "0.6875rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.92)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              {state.label}
            </motion.div>
          ) : state.variant === "ring" ? (
            <motion.div
              key="ring"
              initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1.5px solid rgba(18,18,18,0.55)",
              }}
            />
          ) : (
            <motion.div
              key="dot"
              initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "rgb(18,18,18)",
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
