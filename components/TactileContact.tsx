"use client"

import { useState, useEffect } from "react"
import { EnvelopeSimple, LinkedinLogo, GithubLogo, FileText } from "@phosphor-icons/react"

const LINKS = [
  { label: "Resume",   href: "https://drive.google.com/file/d/183_FgYoQBjhv5QLawsPr_fUt_K5gf6hi/view?usp=drive_link", Icon: FileText },
  { label: "Email",    href: "mailto:bryanwinata112@gmail.com",      Icon: EnvelopeSimple },
  { label: "GitHub",   href: "https://github.com/bewe37",            Icon: GithubLogo     },
  { label: "LinkedIn", href: "https://linkedin.com/in/georgius",     Icon: LinkedinLogo   },
]

function useClock() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("en-CA", { hour12: false, timeZone: "America/Toronto" }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function TactileButton({ label, href, Icon }: typeof LINKS[number]) {
  const [pressed, setPressed] = useState(false)

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        gap:             4,
        width:           36,
        height:          36,
        borderRadius:    6,
        textDecoration:  "none",
        cursor:          "pointer",
        userSelect:      "none",
        backgroundColor: pressed ? "rgb(218,215,208)" : "rgb(234,231,224)",
        transform:       pressed ? "translateY(1px)" : "translateY(0)",
        transition:      "transform 0.08s ease, box-shadow 0.08s ease, background-color 0.08s ease",
        boxShadow: pressed
          ? [
              "0 1px 1px rgba(0,0,0,0.18)",
              "inset 0 2px 4px rgba(0,0,0,0.14)",
            ].join(", ")
          : [
              "0 3px 0px rgba(0,0,0,0.20)",
              "0 4px 8px rgba(0,0,0,0.10)",
              "inset 0 1px 0 rgba(255,255,255,0.75)",
              "inset 0 -1px 0 rgba(0,0,0,0.08)",
            ].join(", "),
      }}
    >
      <Icon size={11} weight="regular" color={pressed ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.45)"} />
      <span style={{
        fontFamily:    "var(--font-sans)",
        fontSize:      7,
        fontWeight:    700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color:         "rgba(0,0,0,0.35)",
      }}>
        {label}
      </span>
    </a>
  )
}

export default function TactileContact() {
  const time = useClock()

  return (
    <div style={{
      display:         "inline-flex",
      flexDirection:   "column",
      gap:             0,
      borderRadius:    14,
      backgroundColor: "rgb(228,225,218)",
      padding:         "8px 8px 9px",
      boxShadow: [
        "0 2px 0 rgba(255,255,255,0.82) inset",
        "0 -1px 0 rgba(0,0,0,0.10) inset",
        "2px 0 0 rgba(255,255,255,0.5) inset",
        "-2px 0 0 rgba(0,0,0,0.06) inset",
        "0 8px 32px rgba(0,0,0,0.12)",
        "0 2px 6px rgba(0,0,0,0.08)",
      ].join(", "),
    }}>

      {/* Screen */}
      <div style={{
        borderRadius:    8,
        backgroundColor: "rgb(14,18,14)",
        padding:         "7px 10px 6px",
        boxShadow: [
          "inset 0 2px 8px rgba(0,0,0,0.6)",
          "inset 0 1px 3px rgba(0,0,0,0.4)",
          "0 1px 0 rgba(255,255,255,0.4)",
        ].join(", "),
        marginBottom:    6,
        position:        "relative",
        overflow:        "hidden",
      }}>
        {/* Scanline overlay */}
        <div style={{
          position:        "absolute",
          inset:           0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
          pointerEvents:   "none",
          borderRadius:    8,
        }} />

        <p style={{
          fontFamily:    "DM Mono, monospace",
          fontSize:       7,
          fontWeight:     500,
          color:          "rgba(80,220,100,0.55)",
          letterSpacing:  "0.18em",
          margin:         "0 0 4px",
          textTransform:  "uppercase",
        }}>
          TOR · LOCAL
        </p>
        <p style={{
          fontFamily:    "DM Mono, monospace",
          fontSize:       "1.125rem",
          fontWeight:     400,
          color:          "rgb(80,220,100)",
          letterSpacing:  "0.06em",
          margin:         0,
          lineHeight:     1,
          textShadow:     "0 0 12px rgba(80,220,100,0.55), 0 0 4px rgba(80,220,100,0.4)",
          minWidth:       "7ch",
        }}>
          {time}
        </p>
      </div>

      {/* 2×2 button grid */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "36px 36px",
        gap:                 5,
      }}>
        {LINKS.map(link => (
          <TactileButton key={link.label} {...link} />
        ))}
      </div>
    </div>
  )
}
