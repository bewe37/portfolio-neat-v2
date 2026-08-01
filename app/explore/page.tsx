"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLazyVideo } from "@/lib/use-lazy-video"

const PROJECTS = [
  {
    title: "Rethinking the Overlay as a Control Surface",
    meta: "Product Design · Shipped 2025",
    href: "/amd_ai_project",
    cover: "/AMDThumbnailNew.mp4",
    area: "wide",
  },
  {
    title: "The Design System That Kept AMD's Team Aligned",
    meta: "Design System · Shipped 2025",
    href: "/amd_project",
    cover: "/DSThumbnailVid.mp4",
    area: "top-right-a",
  },
  {
    title: "Reducing Clutter Without Losing Context",
    meta: "Product Design · Shipped 2024",
    href: "/fme_annotation_project",
    cover: "/AnnotationVid.mp4",
    area: "top-right-b",
  },
  {
    title: "Simplifying Donation Tracking at Scale",
    meta: "Product Design · In progress",
    href: "/blueprint",
    cover: "/BlueprintThumb.png",
    area: "bottom-a",
  },
  {
    title: "This Portfolio, Built From Scratch",
    meta: "Vibe Coded · Next.js & Motion",
    href: "/",
    cover: "/PortfolioThumbnail.mp4",
    area: "bottom-b",
  },
] as const

function ProjectTile({ project }: { project: (typeof PROJECTS)[number] }) {
  const isVideo = project.cover.endsWith(".mp4")
  const videoRef = useRef<HTMLVideoElement>(null)
  useLazyVideo(videoRef)

  return (
    <Link
      href={project.href}
      style={{
        gridArea: project.area,
        position: "relative",
        display: "block",
        width: "100%",
        height: "100%",
        borderRadius: 14,
        overflow: "hidden",
        background: "rgb(22,22,22)",
        border: "1px solid rgba(255,255,255,0.08)",
        textDecoration: "none",
      }}
      className="explore-tile"
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={project.cover}
          loop
          muted
          playsInline
          preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <Image
          src={project.cover}
          alt={project.title}
          fill
          quality={90}
          sizes="(max-width: 768px) 100vw, 34vw"
          style={{ objectFit: "cover" }}
        />
      )}

      {/* Caption overlay — hidden until hover, keeps the grid visual-first */}
      <div
        className="explore-tile-caption"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "28px 16px 14px",
          background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.75) 100%)",
          opacity: 0,
          transform: "translateY(4px)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "rgba(255,255,255,0.95)",
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          {project.title}
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            fontWeight: 400,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "-0.01em",
            margin: "2px 0 0",
          }}
        >
          {project.meta}
        </p>
      </div>
    </Link>
  )
}

export default function ExplorePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: "rgb(14,13,12)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          width: "100%",
          maxWidth: 1600,
          margin: "0 auto",
          padding: "clamp(80px, 10vw, 120px) clamp(24px, 4vw, 48px) 48px",
          gap: "clamp(32px, 6vw, 96px)",
        }}
        className="rsp-explore-row"
      >
        {/* Left — bio column */}
        <div
          style={{
            flex: "0 0 auto",
            width: "clamp(260px, 26vw, 340px)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.0625rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Georgius Bryan
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              Product Designer
            </p>
          </div>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              fontWeight: 400,
              lineHeight: 1.7,
              letterSpacing: "-0.01em",
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            I work on complicated tools and dense software, the kind people depend on every day but rarely
            feel good to use. Making those feel human is what I do.
          </p>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              fontWeight: 400,
              lineHeight: 1.7,
              letterSpacing: "-0.01em",
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            Currently leading design at{" "}
            <Link href="/blueprint" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "underline" }}>
              YU Blueprint
            </Link>
            . Previously at{" "}
            <Link href="/amd_project" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "underline" }}>
              AMD
            </Link>{" "}
            and{" "}
            <Link href="/fme_annotation_project" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "underline" }}>
              Safe Software
            </Link>
            .
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <a
              href="mailto:bryanwinata112@gmail.com"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "rgb(14,13,12)",
                background: "rgba(255,255,255,0.95)",
                padding: "9px 16px",
                borderRadius: 8,
                textDecoration: "none",
                letterSpacing: "-0.01em",
              }}
            >
              Get in touch
            </a>
            <Link
              href="/about"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "rgba(255,255,255,0.85)",
                background: "rgba(255,255,255,0.08)",
                padding: "9px 16px",
                borderRadius: 8,
                textDecoration: "none",
                letterSpacing: "-0.01em",
              }}
            >
              More about me
            </Link>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            <a
              href="https://twitter.com/gbryanwt"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}
            >
              X
            </a>
            <a
              href="https://linkedin.com/in/gbryanw"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* Right — bento grid */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr 1fr",
            gridTemplateAreas: `
              "wide top-right-a top-right-a"
              "wide top-right-b top-right-b"
              "bottom-a bottom-b bottom-b"
            `,
            gap: 16,
            aspectRatio: "16/10",
          }}
          className="rsp-explore-grid"
        >
          {PROJECTS.map((p) => (
            <ProjectTile key={p.href} project={p} />
          ))}
        </div>
      </div>
    </div>
  )
}
