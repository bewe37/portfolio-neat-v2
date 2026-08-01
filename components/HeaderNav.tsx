"use client"

import { useRef, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { playClick } from "@/lib/click-sound"

const LINKS = [
  { href: "/#work", label: "Work" },
  { href: "/about", label: "About" },
]

export default function HeaderNav() {
  const pathname  = usePathname()
  const navRef    = useRef<HTMLElement>(null)
  const wrapRefs  = useRef<(HTMLSpanElement | null)[]>([])
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)

  // "Work" links to a section anchor on the homepage, not a distinct route,
  // so it never gets the active-pill treatment — only real pages (About) do.
  const activeIdx = LINKS.findIndex(({ href }) => {
    if (href.startsWith("/#")) return false
    return pathname.startsWith(href)
  })

  useEffect(() => {
    let raf: number
    function measure() {
      const nav  = navRef.current
      const wrap = wrapRefs.current[activeIdx]
      if (!nav || !wrap) { setPill(null); return }
      const navRect  = nav.getBoundingClientRect()
      const wrapRect = wrap.getBoundingClientRect()
      if (wrapRect.width === 0) { raf = requestAnimationFrame(measure); return }
      setPill({ left: wrapRect.left - navRect.left, width: wrapRect.width })
    }
    raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [activeIdx])

  // Close on outside click
  useEffect(() => {
    if (!contactOpen) return
    const handler = (e: MouseEvent) => {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setContactOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [contactOpen])

  return (
    <nav ref={navRef} style={{ display: "inline-flex", alignItems: "center", gap: 4, position: "relative" }}>
      {pill && (
        <span
          aria-hidden
          style={{
            position:      "absolute",
            top:           0,
            bottom:        0,
            left:          pill.left,
            width:         pill.width,
            background:    "var(--surface)",
            borderRadius:  6,
            transition:    "left 0.32s cubic-bezier(0.22,1,0.36,1), width 0.32s cubic-bezier(0.22,1,0.36,1)",
            pointerEvents: "none",
            zIndex:        0,
          }}
        />
      )}

      {LINKS.map(({ href, label }, i) => {
        const active = i === activeIdx
        return (
          <span key={href} ref={el => { wrapRefs.current[i] = el }} style={{ position: "relative", zIndex: 1 }}>
            <Link
              href={href}
              onClick={() => playClick()}
              style={{
                display:        "block",
                fontFamily:     "var(--font-sans)",
                fontSize:       "0.875rem",
                fontWeight:     500,
                letterSpacing:  "-0.01em",
                color:          active ? "var(--c-primary)" : "var(--c-dim)",
                transition:     "color 0.18s ease",
                textDecoration: "none",
                padding:        "4px 10px",
                borderRadius:   6,
                whiteSpace:     "nowrap",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--c-primary)" }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--c-dim)" }}
            >
              {label}
            </Link>
          </span>
        )
      })}

      {/* Contact dropdown */}
      <div ref={contactRef} style={{ position: "relative", zIndex: 1 }}>
        <button
          onClick={() => { playClick(); setContactOpen(o => !o) }}
          style={{
            display:        "block",
            fontFamily:     "var(--font-sans)",
            fontSize:       "0.875rem",
            fontWeight:     500,
            letterSpacing:  "-0.01em",
            color:          contactOpen ? "var(--c-primary)" : "var(--c-dim)",
            transition:     "color 0.18s ease",
            background:     contactOpen ? "var(--surface)" : "none",
            border:         "none",
            padding:        "4px 10px",
            borderRadius:   6,
            cursor:         "pointer",
            whiteSpace:     "nowrap",
          }}
          onMouseEnter={e => { if (!contactOpen) (e.currentTarget as HTMLElement).style.color = "var(--c-primary)" }}
          onMouseLeave={e => { if (!contactOpen) (e.currentTarget as HTMLElement).style.color = "var(--c-dim)" }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            Contact
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
              style={{
                transition: "transform 0.18s ease",
                transform: contactOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}>
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>

        {contactOpen && (
          <div style={{
            position:        "absolute",
            top:             "calc(100% + 8px)",
            right:           0,
            zIndex:          200,
            background:      "var(--surface)",
            border:          "1px solid var(--divider)",
            borderRadius:    10,
            padding:         "4px",
            minWidth:        160,
            boxShadow:       "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
            animation:       "fadeSlideDown 0.18s cubic-bezier(0.22,1,0.36,1)",
          }}>
            <style>{`
              @keyframes fadeSlideDown {
                from { opacity: 0; transform: translateY(-6px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            {[
              { label: "Email",    href: "mailto:bryanwinata112@gmail.com" },
              { label: "LinkedIn", href: "https://linkedin.com/in/gbryanw" },
              { label: "Twitter",  href: "https://twitter.com/gbryanwt" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={() => setContactOpen(false)}
                style={{
                  display:        "block",
                  fontFamily:     "var(--font-sans)",
                  fontSize:       "0.8125rem",
                  fontWeight:     400,
                  color:          "var(--c-secondary)",
                  letterSpacing:  "-0.01em",
                  textDecoration: "none",
                  padding:        "7px 12px",
                  borderRadius:   7,
                  transition:     "background 0.12s ease, color 0.12s ease",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-hover, rgba(128,128,128,0.1))"
                  ;(e.currentTarget as HTMLElement).style.color = "var(--c-primary)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent"
                  ;(e.currentTarget as HTMLElement).style.color = "var(--c-secondary)"
                }}
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
