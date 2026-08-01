"use client"

import { useLayoutEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import SpriteBuddy from "@/components/SpriteBuddy"

export default function BuddyGate() {
  const router   = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    if (pathname === "/onboarding" || pathname.startsWith("/admin")) {
      setReady(true)
      return
    }
    // Skip onboarding entirely on mobile
    const isMobile = window.matchMedia("(max-width: 768px)").matches
    if (isMobile) {
      setReady(true)
      return
    }
    const saved = localStorage.getItem("buddyId")
    if (!saved) {
      router.replace("/onboarding")
    } else {
      setReady(true)
    }
  }, [pathname, router])

  return (
    <>
      {!ready && (
        <div style={{
          position:   "fixed",
          inset:      0,
          background: "#18181b",
          zIndex:     9999,
          pointerEvents: "none",
        }} />
      )}
      {pathname !== "/onboarding" && (
        <div className="rsp-hide-mobile">
          <SpriteBuddy />
        </div>
      )}
    </>
  )
}
