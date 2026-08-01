"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

// The homepage and its four case-study sheet URLs all share one persistent
// layout (see the (home) route group) — "/" plus the same four project
// slugs used in PROJECTS in app/(home)/layout.tsx.
const HOME_LAYOUT_PATHS = ["/", "/amd_ai_project", "/amd_project", "/fme_annotation_project", "/blueprint"]

function isHomeLayoutPath(p: string) {
  return HOME_LAYOUT_PATHS.includes(p)
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevPathname = useRef<string | null>(null)
  const [prevState, setPrevState] = useState<string | null>(null)

  useEffect(() => {
    const prev = prevPathname.current
    prevPathname.current = pathname
    setPrevState(prev)

    if (prev === null) return
    // Clear gallery bg when leaving (overflow/class handled by gallery page cleanup)
    if (prev === "/gallery") document.body.style.background = ""
  }, [pathname])

  // No animation when going to or coming from gallery
  const isGalleryTransition = pathname === "/gallery" || prevState === "/gallery" || prevPathname.current === "/gallery"
  if (isGalleryTransition) return <>{children}</>

  // The homepage opens/closes case studies as a sheet on top of one
  // persistent layout, updating the URL via window.history.pushState
  // instead of a real navigation (see the (home) layout) specifically so
  // nothing above it re-renders. usePathname() still picks up that URL
  // change, though — so without this carve-out, every open/close changed
  // `pathname`, which changed this component's `key={pathname}` below,
  // which made AnimatePresence unmount and remount this entire subtree
  // (the whole layout, every project card, every <video>) on every single
  // open/close. That's what was showing up as the whole right column
  // flickering and videos restarting from 0 instead of resuming.
  //
  // Only bypassed when BOTH sides of the change are within that shared
  // layout — moving in from or out to a genuinely different page (e.g.
  // /about) still gets the normal fade, since that's a real page
  // boundary, not a sheet toggle.
  const wasHome = prevPathname.current !== null && isHomeLayoutPath(prevPathname.current)
  const isHome = isHomeLayoutPath(pathname)
  if (wasHome && isHome) return <>{children}</>

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
