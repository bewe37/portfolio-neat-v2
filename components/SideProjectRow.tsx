"use client"

import { useState } from "react"
import { ArrowUpRight } from "@phosphor-icons/react"
import Link from "next/link"

interface SideProjectRowProps {
  title: string
  description: string
  tags: string[]
  href: string
  year: string
  isLast?: boolean
}

export default function SideProjectRow({
  title, description, tags, href, year, isLast = false,
}: SideProjectRowProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      data-cursor="Open"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: 24,
        padding: "22px 0",
        borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.06)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 600,
            letterSpacing: "-0.01em",
            color: hovered ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.65)",
            transition: "color 0.15s ease", lineHeight: 1.4,
          }}>
            {title}
          </span>
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            {tags.map((tag) => (
              <span key={tag} style={{
                fontFamily: "var(--font-sans)", fontSize: "0.6875rem", fontWeight: 500,
                letterSpacing: "0.02em", color: "rgba(0,0,0,0.3)",
                backgroundColor: "rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 5, padding: "2px 7px",
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <span style={{
          fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 500,
          letterSpacing: "-0.01em", color: "rgba(0,0,0,0.3)", lineHeight: 1.5,
        }}>
          {description}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <span style={{
          fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 500,
          color: "rgba(0,0,0,0.2)", letterSpacing: "-0.01em",
        }}>
          {year}
        </span>
        <ArrowUpRight
          size={15} weight="regular"
          color={hovered ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.18)"}
          style={{
            transform: hovered ? "translate(2px,-2px)" : "translate(0,0)",
            transition: "transform 0.2s ease",
          }}
        />
      </div>
    </Link>
  )
}
