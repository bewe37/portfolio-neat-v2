"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function ScrollToTop() {
  const pathname = usePathname()
  useEffect(() => {
    // Skip scroll reset for gallery — it has no scroll
    if (pathname === "/gallery") return
    // Disable smooth scrolling momentarily so the reset is instant, not animated
    document.documentElement.style.scrollBehavior = "auto"
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = ""
    })
  }, [pathname])
  return null
}
