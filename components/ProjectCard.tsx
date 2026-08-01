"use client"

import { useState } from "react"
import { ArrowUpRight } from "@phosphor-icons/react"
import Link from "next/link"

interface ProjectCardProps {
  title: string
  category: string
  date: string
  href: string
  image?: string
}

export default function ProjectCard({ title, category, href, image }: ProjectCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      data-cursor="View"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 10,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        gap: 14,
      }}
    >
      {/* Image */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 10",
          backgroundColor: "rgb(232,231,228)",
          borderRadius: 10,
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transform: hovered ? "scale(1.03)" : "scale(1)",
              transition: "transform 0.5s cubic-bezier(0.25,0.1,0.25,1)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(160deg, rgb(228,227,224) 0%, rgb(218,217,214) 100%)",
            }}
          />
        )}
      </div>

      {/* Text row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          paddingBottom: 4,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: hovered ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.7)",
              letterSpacing: "-0.01em",
              lineHeight: 1.45,
              margin: 0,
              transition: "color 0.2s ease",
            }}
          >
            {title}
          </p>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "rgba(0,0,0,0.3)",
              letterSpacing: "-0.01em",
            }}
          >
            {category}
          </span>
        </div>

        <ArrowUpRight
          size={16}
          weight="regular"
          style={{
            flexShrink: 0,
            marginTop: 2,
            color: hovered ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.2)",
            transform: hovered ? "translate(2px,-2px)" : "translate(0,0)",
            transition: "transform 0.2s ease, color 0.2s ease",
          }}
        />
      </div>
    </Link>
  )
}
