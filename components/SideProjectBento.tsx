"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight } from "@phosphor-icons/react"
import Link from "next/link"

interface SideProject {
  title: string
  description: string
  tags: string[]
  href: string
  year: string
}

const SPANS: number[] = [2, 1, 1, 2]

function BentoCard({
  project,
  span,
  index,
}: {
  project: SideProject
  span: number
  index: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      style={{ gridColumn: `span ${span}` }}
    >
      <Link
        href={project.href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display:        "flex",
          flexDirection:  "column",
          justifyContent: "space-between",
          height:         "100%",
          minHeight:      160,
          padding:        "22px 24px",
          borderRadius:   14,
          border:         "1px solid rgba(0,0,0,0.07)",
          backgroundColor: hovered ? "rgba(0,0,0,0.02)" : "#fff",
          textDecoration: "none",
          color:          "inherit",
          transition:     "background-color 0.18s ease, box-shadow 0.18s ease",
          boxShadow:      hovered
            ? "0 8px 28px rgba(0,0,0,0.07)"
            : "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {project.tags.map(tag => (
              <span key={tag} style={{
                fontFamily:      "var(--font-sans)",
                fontSize:        "0.625rem",
                fontWeight:      600,
                letterSpacing:   "0.04em",
                color:           "rgba(0,0,0,0.35)",
                backgroundColor: "rgba(0,0,0,0.04)",
                border:          "1px solid rgba(0,0,0,0.07)",
                borderRadius:    5,
                padding:         "2px 7px",
              }}>
                {tag}
              </span>
            ))}
          </div>
          <ArrowUpRight
            size={16}
            color={hovered ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.18)"}
            style={{
              flexShrink: 0,
              transform:  hovered ? "translate(2px,-2px)" : "translate(0,0)",
              transition: "transform 0.18s ease, color 0.18s ease",
            }}
          />
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 20 }}>
          <span style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.875rem",
            fontWeight:    700,
            color:         hovered ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.72)",
            letterSpacing: "-0.02em",
            lineHeight:    1.3,
            transition:    "color 0.18s ease",
          }}>
            {project.title}
          </span>
          <span style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.75rem",
            fontWeight:    500,
            color:         "rgba(0,0,0,0.35)",
            letterSpacing: "-0.01em",
            lineHeight:    1.5,
          }}>
            {project.description}
          </span>
          <span style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.6875rem",
            fontWeight:    500,
            color:         "rgba(0,0,0,0.2)",
            letterSpacing: "-0.01em",
            marginTop:     2,
          }}>
            {project.year}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

export default function SideProjectBento({ projects }: { projects: SideProject[] }) {
  return (
    <div style={{
      display:             "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap:                 12,
    }}>
      {projects.map((p, i) => (
        <BentoCard key={p.href} project={p} span={SPANS[i] ?? 1} index={i} />
      ))}
    </div>
  )
}
