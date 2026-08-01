"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { playClick } from "@/lib/click-sound"

type Theme = "light" | "dark" | "sunset"

const CYCLE: Record<Theme, Theme> = {
  light:  "dark",
  dark:   "sunset",
  sunset: "light",
}

function SunIcon({ color, hovered }: { color: string; hovered: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <circle cx="7.5" cy="7.5" r="3" stroke={color} strokeWidth="1.4"/>
      <motion.g
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
        animate={hovered ? { rotate: 360 } : { rotate: 0 }}
        transition={hovered
          ? { duration: 4, ease: "linear", repeat: Infinity }
          : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <path
          d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.05 3.05l1.06 1.06M10.89 10.89l1.06 1.06M10.89 4.11l1.06-1.06M3.05 11.95l1.06-1.06"
          stroke={color} strokeWidth="1.4" strokeLinecap="round"
        />
      </motion.g>
    </svg>
  )
}

function MoonIcon({ color, hovered }: { color: string; hovered: boolean }) {
  return (
    <motion.svg
      width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden
      style={{ transformOrigin: "center" }}
      animate={{ rotate: hovered ? -20 : 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <path d="M12.5 9.5A5.5 5.5 0 0 1 5.5 2.5a5.5 5.5 0 1 0 7 7z"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </motion.svg>
  )
}

function SunsetIcon({ color, hovered }: { color: string; hovered: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M1 11h13M4 11a3.5 3.5 0 0 1 7 0"
        stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <motion.path
        d="M7.5 2v1.5M1.5 5.5l1 1M13.5 5.5l-1 1"
        stroke={color} strokeWidth="1.4" strokeLinecap="round"
        animate={{ y: hovered ? -1.5 : 0, opacity: hovered ? 1 : 0.7 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

const ICONS: Record<Theme, React.ComponentType<{ color: string; hovered: boolean }>> = {
  light:  SunIcon,
  dark:   MoonIcon,
  sunset: SunsetIcon,
}

function applyTheme(theme: Theme) {
  const body = document.body
  body.classList.add("theme-switching")
  requestAnimationFrame(() => {
    body.classList.remove("dark", "sunset")
    if (theme !== "light") body.classList.add(theme)
    setTimeout(() => body.classList.remove("theme-switching"), 600)
  })
}

export default function ThemeToggle() {
  const [theme,   setTheme]   = useState<Theme>("dark")
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null
    const initial: Theme = saved ?? "dark"
    setTheme(initial)
    document.body.classList.remove("dark", "sunset")
    if (initial !== "light") document.body.classList.add(initial)
  }, [])

  function toggle() {
    const next = CYCLE[theme]
    setTheme(next)
    applyTheme(next)
    localStorage.setItem("theme", next)
    playClick()
  }

  const Icon      = ICONS[theme]
  const iconColor = hovered ? "rgb(255,107,48)" : "var(--c-secondary)"

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Toggle theme"
      style={{
        background:     "none",
        border:         "none",
        cursor:         "pointer",
        padding:        "4px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
        transition:     "opacity 0.15s ease",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -30, scale: 0.7, filter: "blur(4px)" }}
          animate={{ opacity: 1, rotate: 0,   scale: 1,   filter: "blur(0px)" }}
          exit={{    opacity: 0, rotate:  30,  scale: 0.7, filter: "blur(4px)" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <Icon color={iconColor} hovered={hovered} />
        </motion.div>
      </AnimatePresence>
    </button>
  )
}
