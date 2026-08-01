"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"

interface LinkItem { label: string; link: string }

const DEFAULT_LINKS: LinkItem[] = [
  { label: "Work", link: "/" },
  { label: "About", link: "/about" },
  { label: "Stack", link: "/stack" },
  { label: "Bookmarks", link: "/bookmarks" },
]

function FooterLink({ label, href, dimmedColor, hoverColor }: {
  label: string; href: string; dimmedColor: string; hoverColor: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 500,
        letterSpacing: "-0.01em", textDecoration: "none",
        color: hovered ? hoverColor : dimmedColor,
        transition: "color 0.15s ease", whiteSpace: "nowrap",
      }}
    >
      {label}
    </Link>
  )
}

function BackToTop({ dimmedColor, hoverColor }: { dimmedColor: string; hoverColor: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      animate={{ y: hovered ? -2 : 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "none", border: "none", cursor: "pointer", padding: 0,
        display: "inline-flex", alignItems: "center", gap: 5,
        color: hovered ? hoverColor : dimmedColor,
        fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 500,
        letterSpacing: "-0.01em", transition: "color 0.15s ease",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6"
          stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back to top
    </motion.button>
  )
}

export default function SimpleFooter({
  name = "Georgius",
  tagline = "Built with attention to detail and way too much matcha.",
  links = DEFAULT_LINKS,
  showBackToTop = true,
  textColor = "rgba(0,0,0,0.55)",
  dimmedColor = "rgba(0,0,0,0.3)",
  hoverColor = "rgba(0,0,0,0.7)",
}: {
  name?: string; tagline?: string; links?: LinkItem[]
  showBackToTop?: boolean; textColor?: string; dimmedColor?: string; hoverColor?: string
}) {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        width: "100%",
        borderTop: "1px solid rgba(0,0,0,0.07)",
        padding: "32px 0",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 500, letterSpacing: "-0.01em", color: textColor, whiteSpace: "nowrap" }}>
          © {year} {name}. All rights reserved.
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 500, letterSpacing: "-0.01em", color: dimmedColor }}>
          {tagline}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
        {links.map((l, i) => (
          <FooterLink key={i} label={l.label} href={l.link} dimmedColor={dimmedColor} hoverColor={hoverColor} />
        ))}
        {showBackToTop && (
          <>
            <span style={{ width: 1, height: 12, backgroundColor: "rgba(0,0,0,0.1)", flexShrink: 0 }} />
            <BackToTop dimmedColor={dimmedColor} hoverColor={hoverColor} />
          </>
        )}
      </div>
    </footer>
  )
}
