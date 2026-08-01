"use client"

import { useState, useEffect } from "react"

function torontoTime() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "America/Toronto",
    hour:     "numeric",
    minute:   "2-digit",
    hour12:   true,
  })
}

export default function MarqueeFooter() {
  const year = new Date().getFullYear()
  const [time, setTime] = useState("")

  useEffect(() => {
    setTime(torontoTime())
    const tick = setInterval(() => setTime(torontoTime()), 1000)
    return () => clearInterval(tick)
  }, [])

  const label: React.CSSProperties = {
    fontFamily:     "var(--font-sans)",
    fontSize:       "0.8125rem",
    fontWeight:     400,
    letterSpacing:  "-0.01em",
    color:          "var(--c-secondary)",
    textDecoration: "none",
    display:        "block",
    transition:     "color 0.15s ease",
    lineHeight:     1.8,
  }

  return (
    <footer style={{
      background: "var(--bg)",
      padding:    "clamp(32px, 4vw, 48px) clamp(20px, 4vw, 48px)",
      marginTop:  "auto",
    }}>
      <div className="rsp-footer-grid" style={{
        maxWidth:       1340,
        margin:         "0 auto",
        display:        "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap:            24,
        alignItems:     "end",
      }}>

        {/* Col 1 — tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ ...label, color: "var(--c-secondary)" }}>
            Sleep is a design constraint.
          </span>
          <span style={{ ...label, color: "var(--c-dim)" }}>
            Available for hire if you catch me awake.
          </span>
        </div>

        {/* Col 2 — location + copyright, centered */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          <span style={label}>Toronto · {time}</span>
          <span style={{ ...label, color: "var(--c-dim)" }}>
            © {year} Georgius Bryan
          </span>
        </div>

        {/* Col 3 — links, right-aligned */}
        <div style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
          <a href="mailto:bryanwinata112@gmail.com" style={label}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--c-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--c-secondary)")}
          >Email</a>
          <a href="https://linkedin.com/in/gbryanw" target="_blank" rel="noopener noreferrer" style={label}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--c-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--c-secondary)")}
          >LinkedIn</a>
          <a href="https://twitter.com/gbryanwt" target="_blank" rel="noopener noreferrer" style={label}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--c-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--c-secondary)")}
          >Twitter</a>
        </div>

      </div>
    </footer>
  )
}
