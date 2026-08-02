"use client"

import { usePathname } from "next/navigation"
import { useState, useCallback } from "react"
import HeaderNav from "@/components/HeaderNav"
import Link from "next/link"

function Sparkle({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="11" height="11" viewBox="0 0 11 11" fill="none"
      style={{
        flexShrink: 0,
        animation: spinning
          ? "sparkle-click 0.5s cubic-bezier(0.22,1,0.36,1)"
          : "sparkle-spin 6s linear infinite",
      }}
    >
      <style>{`
        @keyframes sparkle-spin {
          from { transform: rotate(0deg);   opacity: 0.5; }
          25%  { opacity: 1; }
          50%  { opacity: 0.5; }
          75%  { opacity: 1; }
          to   { transform: rotate(360deg); opacity: 0.5; }
        }
        @keyframes sparkle-click {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <path
        d="M5.5 0 L6.1 4.9 L11 5.5 L6.1 6.1 L5.5 11 L4.9 6.1 L0 5.5 L4.9 4.9 Z"
        fill="currentColor"
      />
    </svg>
  )
}

const CASE_STUDY_PATHS = ["/gallery"]
// The homepage (the case-study sheet experience) and /about both render
// their own nav — this shared one is only for pages that don't
// (companions, admin, onboarding, explore). The four /*_project + /blueprint
// paths are also the homepage: opening a case study sheet updates the URL
// via pushState (see V2Layout's openCaseStudy) without a real navigation,
// which usePathname() does still pick up — so without listing them here
// too, this nav would start rendering behind the open sheet the moment the
// URL changes, becoming visible through the recede animation's gap.
const HIDDEN_NAV_PATHS = ["/explore", "/about", "/amd_ai_project", "/amd_project", "/fme_annotation_project", "/blueprint"]

export default function SharedNav() {
  const pathname = usePathname()
  const isCaseStudy = CASE_STUDY_PATHS.some(p => pathname.startsWith(p))
  const isHidden = pathname === "/" || HIDDEN_NAV_PATHS.some(p => pathname.startsWith(p))
  const [spinning, setSpinning] = useState(false)

  const handleClick = useCallback(() => {
    setSpinning(true)
    setTimeout(() => setSpinning(false), 700)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  if (isCaseStudy || isHidden) return null

  return (
    <div
      data-shared-nav
      style={{
        position:      "absolute",
        top:           0,
        left:          0,
        right:         0,
        zIndex:        100,
        pointerEvents: "none",
        padding:       "0 clamp(20px, 4vw, 48px)",
      }}
      className="rsp-px"
    >
      <div style={{
        maxWidth:       1340,
        margin:         "0 auto",
        display:        "flex",
        alignItems:     "flex-start",
        justifyContent: "space-between",
        paddingTop:     28,
        paddingBottom:  24,
      }}>
        {/* Name — left */}
        <Link
          href="/"
          onClick={handleClick}
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:            6,
            fontFamily:     "var(--font-sans)",
            fontSize:       "0.875rem",
            fontWeight:     500,
            letterSpacing:  "-0.01em",
            color:          "var(--c-primary)",
            textDecoration: "none",
            pointerEvents:  "auto",
            paddingTop:     4,
            paddingBottom:  4,
          }}
        >
          <Sparkle spinning={spinning} />
          Georgius Bryan
        </Link>

        {/* Nav — right */}
        <span className="rsp-hide-mobile" style={{ display: "inline-flex", alignItems: "center", gap: 4, pointerEvents: "auto" }}>
          <HeaderNav />
        </span>
      </div>
    </div>
  )
}
