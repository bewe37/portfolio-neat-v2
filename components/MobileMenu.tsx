"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpRight } from "@phosphor-icons/react"
import Link from "next/link"
import { playClick } from "@/lib/click-sound"

// The homepage and /about handle their own responsive layout instead of
// this hamburger menu — same set SharedNav hides for.
const HIDDEN_NAV_PATHS = ["/explore", "/about"]

const MotionLink = motion(Link)


const NAV_ITEMS = [
  { label: "Work",       href: "/",                                                    newTab: false },
  { label: "About",      href: "/about",                                               newTab: false },
  { label: "Contact me", href: "https://www.linkedin.com/in/bryan-winata/", newTab: true  },
]

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isHidden = pathname === "/" || HIDDEN_NAV_PATHS.some(p => pathname.startsWith(p))

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (isHidden) return null

  const barBase: React.CSSProperties = {
    display: "block",
    width: 22,
    height: 1.5,
    background: "var(--c-primary)",
    borderRadius: 2,
    transformOrigin: "center",
    transition: "transform 0.26s cubic-bezier(0.22,1,0.36,1), opacity 0.18s ease",
  }

  return (
    <div data-mobile-menu style={{ display: "contents" }}>
      {/* Hamburger / X button — inline flex item in header row, shown on mobile only via .rsp-hamburger */}
      <button
        onClick={() => { setOpen(o => !o); playClick() }}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="rsp-hamburger"
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 1002,
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "50%",
          cursor: "pointer",
          width: 44, height: 44,
          padding: 0,
          flexDirection: "column",
          gap: 5,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ ...barBase, transform: open ? "translateY(6.5px) rotate(45deg)" : "none" }} />
        <span style={{ ...barBase, opacity: open ? 0 : 1, transform: open ? "scaleX(0.4)" : "none" }} />
        <span style={{ ...barBase, transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none" }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mob-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 999,
                background: "rgba(0,0,0,0.22)",
                backdropFilter: "blur(3px)",
                WebkitBackdropFilter: "blur(3px)",
              }}
            />

            {/* Slide-down panel */}
            <motion.div
              key="mob-panel"
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: "var(--bg)",
                borderBottom: "1px solid var(--border)",
                paddingTop: 80,
                paddingLeft: 20,
                paddingRight: 20,
                paddingBottom: 36,
              }}
            >
              {NAV_ITEMS.map(({ label, href, newTab }, i) => (
                <MotionLink
                  key={label}
                  href={href}
                  target={newTab ? "_blank" : undefined}
                  rel={newTab ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1], delay: 0.06 + i * 0.05 }}
                  onClick={() => { setOpen(false); playClick() }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "15px 0",
                    borderBottom: "1px solid var(--border)",
                    textDecoration: "none",
                    color: "var(--c-primary)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "1.25rem",
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {label}
                  <ArrowUpRight size={16} weight="regular" style={{ color: "var(--c-dim)", flexShrink: 0 }} />
                </MotionLink>
              ))}

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
