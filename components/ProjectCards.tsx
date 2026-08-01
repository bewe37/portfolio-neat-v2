"use client"

import Link from "next/link"
import Image from "next/image"
import { memo, useEffect, useState, useRef } from "react"
import { playClick } from "@/lib/click-sound"
import { useLazyVideo } from "@/lib/use-lazy-video"

export interface Project {
  title: string
  category: string
  date: string
  description: string
  href: string
  cover: string
  comingSoon?: boolean
  lightbox?: boolean
  coverNode?: React.ReactNode
  coverFit?: "cover" | "contain"
  coverBg?: string
  coverPadding?: number | string
  coverBorder?: string
  carousel?: string[]
  badge?: string
  badgeSize?: number
  // When true (and onCardOpen is provided to ProjectCards), clicking this
  // card calls onCardOpen instead of navigating. Projects without this flag
  // always navigate normally, even if onCardOpen is passed.
  sheet?: boolean
}

const coverStyle = (hovered: boolean, fit: "cover" | "contain" = "cover"): React.CSSProperties => ({
  width: "100%", height: "100%", objectFit: fit, display: "block",
  // Baseline is a hair over 1 (not exactly 1) so the video's rasterized
  // edge always sits just past the parent's overflow:hidden + border-radius
  // clip boundary — otherwise a 1px anti-aliasing seam can show along the
  // rounded corners where the clip mask and the video edge line up exactly.
  transform: hovered ? "scale(1.02)" : "scale(1.008)",
  transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
  willChange: "transform",
})

const carouselBtnStyle: React.CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  width: 28, height: 28, borderRadius: "50%",
  background: "rgba(0,0,0,0.45)", border: "none",
  color: "#fff", cursor: "pointer", zIndex: 2,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "0.75rem", backdropFilter: "blur(4px)",
  transition: "background 0.15s ease",
}

function CarouselCover({ videos, hovered }: { videos: string[]; hovered: boolean }) {
  const [active, setActive] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const go = (next: number) => {
    videoRefs.current[active]?.pause()
    setActive(next)
    // play after state update
    setTimeout(() => videoRefs.current[next]?.play(), 0)
  }

  const prev = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); go((active - 1 + videos.length) % videos.length) }
  const next = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); go((active + 1) % videos.length) }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {videos.map((src, i) => (
        <video
          key={src}
          ref={el => { videoRefs.current[i] = el }}
          src={src}
          autoPlay={i === 0}
          loop
          muted
          playsInline
          preload="metadata"
          style={{
            ...coverStyle(hovered),
            position: i === 0 ? "relative" : "absolute",
            inset: 0,
            opacity: active === i ? 1 : 0,
            transition: "opacity 0.35s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
            pointerEvents: active === i ? "auto" : "none",
          }}
        />
      ))}
      <button onClick={prev} className="carousel-btn" style={{ ...carouselBtnStyle, left: 10 }}>‹</button>
      <button onClick={next} className="carousel-btn" style={{ ...carouselBtnStyle, right: 10 }}>›</button>
    </div>
  )
}

function ProjectCard({
  project,
  onLightbox,
  onCardOpen,
  cardGap = 10,
  titleColor,
  titleColorHover,
  dateColor,
  onClickSound = playClick,
  revealDelay,
}: {
  project: Project
  onLightbox?: () => void
  onCardOpen?: (project: Project) => void
  cardGap?: number
  titleColor?: string
  titleColorHover?: string
  dateColor?: string
  onClickSound?: () => void
  // When set, the cover reveals via a bottom-to-top clip-path wipe on first
  // mount, delayed by this many ms — used to stagger cards in the same row.
  // Undefined (the default) skips the reveal entirely: existing callers see
  // no behavior change.
  revealDelay?: number
}) {
  const badgeSize = project.badgeSize ?? 20
  const [hovered, setHovered] = useState(false)
  const [revealed, setRevealed] = useState(revealDelay === undefined)
  const isVideo = project.cover.endsWith(".mp4") || project.cover.endsWith(".webm")
  const fit = project.coverFit ?? "cover"
  const bg = project.coverBg ?? "var(--surface)"
  const coverPadding = project.coverPadding ?? 0
  const coverBorder = project.coverBorder ?? undefined
  const coverVideoRef = useRef<HTMLVideoElement>(null)
  useLazyVideo(coverVideoRef)

  useEffect(() => {
    if (revealDelay === undefined) return
    const t = setTimeout(() => setRevealed(true), revealDelay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inner = (
    <>
      <div style={{
        width: "100%", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", backgroundColor: bg,
        position: "relative", border: coverBorder, padding: coverPadding, boxSizing: "border-box",
        transform: "translateZ(0)", isolation: "isolate",
        clipPath: revealed ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
        transition: revealDelay === undefined ? undefined : "clip-path 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {project.carousel ? (
          <CarouselCover videos={project.carousel} hovered={hovered} />
        ) : project.coverNode ? project.coverNode : isVideo ? (
          <video ref={coverVideoRef} src={project.cover} loop muted playsInline preload="metadata" style={coverStyle(hovered, fit)} />
        ) : (
          <Image
            src={project.cover}
            alt={project.title}
            fill
            quality={90}
            sizes="(max-width: 768px) 100vw, 50vw"
            draggable={false}
            style={{ ...coverStyle(hovered, fit), objectFit: fit }}
          />
        )}
        {project.badge && (
          <div className="project-badge" style={{
            position:   "absolute",
            bottom:     12,
            right:      12,
            opacity:    hovered ? 1 : 0,
            transform:  hovered ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
            pointerEvents: "none",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.badge} alt="" className="project-badge-img" style={{ height: badgeSize, width: "auto", display: "block" }} />
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 500,
          color: hovered ? (titleColorHover ?? "var(--c-mid)") : (titleColor ?? "var(--c-faint)"),
          letterSpacing: "-0.01em", margin: 0, transition: "color 0.2s ease",
        }}>
          {project.title}
        </p>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 400, color: dateColor ?? "var(--c-faint)", letterSpacing: "-0.01em", flexShrink: 0 }}>
          {project.date}
        </span>
      </div>
    </>
  )

  if (project.comingSoon) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ display: "flex", flexDirection: "column", gap: cardGap, cursor: "default" }}
      >
        {inner}
      </div>
    )
  }

  if (project.lightbox && onLightbox) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => { onClickSound(); onLightbox() }}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { onClickSound(); onLightbox() } }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: cardGap, cursor: "pointer" }}
      >
        {inner}
      </div>
    )
  }

  const isExternal = project.href.startsWith("http")

  // When a sheet handler is provided, internal (non-external) cards open the
  // sheet in place instead of navigating — external links still go straight out.
  if (onCardOpen && project.sheet && !isExternal) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => { onClickSound(); onCardOpen(project) }}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { onClickSound(); onCardOpen(project) } }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: cardGap, cursor: "pointer" }}
      >
        {inner}
      </div>
    )
  }

  return (
    <Link
      href={project.href}
      onClick={() => onClickSound()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: cardGap }}
    >
      {inner}
    </Link>
  )
}

// Memoized: this is a shared ancestor of every project card's <video>, and
// parents that hold unrelated state (e.g. V2Layout's open-case-study state)
// re-render on every change to that state. Without memo, every card —
// video included — would re-render each time a case study sheet opens or
// closes, even though none of these props actually changed.
const ProjectCards = memo(function ProjectCards({
  projects,
  onLightbox,
  onCardOpen,
  gap = 24,
  rowGap,
  cardGap,
  titleColor,
  titleColorHover,
  dateColor,
  onClickSound,
  revealOnMount = false,
}: {
  projects: Project[]
  onLightbox?: () => void
  onCardOpen?: (project: Project) => void
  gap?: number
  rowGap?: number
  cardGap?: number
  titleColor?: string
  titleColorHover?: string
  dateColor?: string
  onClickSound?: () => void
  // Covers wipe in on first mount, staggered 60ms per column across the
  // fixed 2-column grid — off by default so existing callers are unaffected.
  revealOnMount?: boolean
}) {
  return (
    <div className="rsp-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: gap, rowGap: rowGap ?? gap }}>
      {projects.map((p, i) => (
        <ProjectCard
          key={p.href || p.title || i}
          project={p}
          onLightbox={p.lightbox ? onLightbox : undefined}
          onCardOpen={onCardOpen}
          cardGap={cardGap}
          titleColor={titleColor}
          titleColorHover={titleColorHover}
          dateColor={dateColor}
          revealDelay={revealOnMount ? (i % 2) * 60 : undefined}
          {...(onClickSound ? { onClickSound } : {})}
        />
      ))}
    </div>
  )
})

export default ProjectCards
