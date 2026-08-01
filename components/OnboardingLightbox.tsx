"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

const OnboardingInner = dynamic(() => import("./OnboardingInner"), { ssr: false })

export default function OnboardingLightbox({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "fixed", inset: 0, zIndex: 1010,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 32px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.96, opacity: 0, y: 12 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(960px, 100%)",
          height: "min(680px, 90dvh)",
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 20,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(0,0,0,0.28)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.48)"; e.currentTarget.style.color = "#ffffff" }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.28)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <OnboardingInner onClose={onClose} />
      </motion.div>
    </motion.div>,
    document.body
  )
}
