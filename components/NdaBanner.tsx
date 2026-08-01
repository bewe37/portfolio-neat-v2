"use client"

import { MagnifyingGlass } from "@phosphor-icons/react"

export default function NdaBanner() {
  return (
    <div style={{
      display:         "flex",
      alignItems:      "flex-start",
      gap:             14,
      backgroundColor: "var(--surface)",
      border:          "1px solid var(--border)",
      borderRadius:    14,
      padding:         "16px 20px",
    }}>
      <div style={{
        width:           34,
        height:          34,
        borderRadius:    "50%",
        backgroundColor: "var(--hover-bg)",
        border:          "1px solid var(--border-mid)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        flexShrink:      0,
        marginTop:       1,
      }}>
        <MagnifyingGlass size={16} weight="bold" color="var(--c-mid)" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "0.8125rem",
          fontWeight:    700,
          color:         "var(--c-high)",
          letterSpacing: "-0.01em",
        }}>
          Some details are filed away
        </span>
        <span style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "0.8125rem",
          fontWeight:    500,
          color:         "var(--c-dim)",
          letterSpacing: "-0.01em",
          lineHeight:    1.6,
        }}>
          Portions of this project are covered by NDA. What's shown here reflects work I can share — reach out if you'd like to see more.
        </span>
      </div>
    </div>
  )
}
