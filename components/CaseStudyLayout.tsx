"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect, useContext, createContext, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import MarqueeFooter from "@/components/MarqueeFooter"
import FloatingNav from "@/components/FloatingNav"
import { playClick } from "@/lib/click-sound"
import { useLazyVideo } from "@/lib/use-lazy-video"
import { IMAGE_DIMENSIONS } from "@/lib/image-dims"

interface Spec       { label: string; value: string | string[] }
interface Contact    { platform: string; handle: string; href: string }
interface Experience { company: string; role: string; period: string }

interface BentoItem {
  video?: string
  image?: string
  label?: string
  span?: number
}

interface ContentBlock {
  image?: string
  images?: string[]
  videos?: string[]
  title?: string
  body?: string
  highlight?: boolean
  minimal?: boolean
  icon?: string
  imageLabels?: string[]
  stackImages?: boolean
  note?: string
  insight?: string
  insightTitle?: string
  objectPosition?: string
}

interface StatBlock { value: string; label: string; body?: string }
interface CardItem  { icon?: string; title: string; body: string }

interface Section {
  label: string
  tocLabel?: string
  title?: string
  href?: string
  body?: string
  hmw?: string
  image?: string
  images?: string[]
  videos?: string[]
  contents?: ContentBlock[]
  experience?: Experience[]
  contacts?: Contact[]
  stat?: StatBlock
  cards?: CardItem[]
  bento?: BentoItem[]
  accordion?: boolean
  footnote?: string
  beforeAfter?: [string, string]
  tabs?: { label: string; image: string }[]
  chapterVideo?: { src: string; chapters: { time: number; label: string }[] }
  imageLabels?: string[]
  stackImages?: boolean
  hideToc?: boolean
  dividerAfter?: boolean
  dividerBefore?: boolean
  dividerText?: string
  lineBefore?: boolean
}

interface NextProject { label: string; title: string; href: string }

interface Props {
  title: string
  category?: string
  year?: string
  role: string
  team?: string
  overview: string
  specs: Spec[]
  cover?: string
  sections: Section[]
  lockedSections?: Section[]
  password?: string
  passwordDesc?: string
  backHref?: string
  banner?: React.ReactNode
  nextProject?: NextProject
}

const FADE     = { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }
const VIEWPORT = { once: true, margin: "-48px" }

// ── Lightbox ──────────────────────────────────────────────────────────────────

interface LightboxItem { src: string; video: boolean }

const LightboxContext = createContext<(item: LightboxItem) => void>(() => {})

function Lightbox({ item, onClose }: { item: LightboxItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="lb-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={onClose}
        style={{
          position:        "fixed",
          inset:           0,
          zIndex:          9999,
          backgroundColor: "rgba(0,0,0,0.85)",
          backdropFilter:  "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          padding:         24,
        }}
      >
        <motion.div
          key="lb-media"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            borderRadius: 12,
            overflow:     "hidden",
            boxShadow:    "0 32px 80px rgba(0,0,0,0.6)",
            position:     "relative",
            display:      "flex",
            lineHeight:   0,
            backgroundColor: item.video ? "#000" : "transparent",
          }}
        >
          {item.video
            ? <VideoWithControls
                src={item.src}
                videoStyle={{ maxWidth: "min(1100px, 90vw)", maxHeight: "85vh", objectFit: "contain" }}
              />
            /* eslint-disable-next-line @next/next/no-img-element */
            : <img
                src={item.src}
                alt=""
                style={{ display: "block", maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain" }}
              />
          }
        </motion.div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position:        "fixed",
            top:             20,
            right:           20,
            width:           36,
            height:          36,
            borderRadius:    "50%",
            border:          "none",
            backgroundColor: "rgba(255,255,255,0.12)",
            color:           "white",
            cursor:          "pointer",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            backdropFilter:  "blur(8px)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
        </button>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────

// Autoplaying video with a floating pause/replay control pair, top-right —
// for standalone video moments (cover, lightbox), not thumbnails that already
// open into the lightbox on click.
function VideoWithControls({
  src,
  style,
  videoStyle,
}: {
  src: string
  style?: React.CSSProperties
  videoStyle?: React.CSSProperties
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(true)

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}) } else { v.pause() }
  }, [])

  const replay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play().catch(() => {})
  }, [])

  const btnStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", padding: 0,
  }

  return (
    <div style={{ position: "relative", lineHeight: 0, ...style }}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop={false}
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        style={{ width: "100%", display: "block", ...videoStyle }}
      />
      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          style={btnStyle}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="3" y="2" width="3" height="10" rx="1" />
              <rect x="8" y="2" width="3" height="10" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3.5 2.3v9.4a.6.6 0 0 0 .9.5l7.4-4.7a.6.6 0 0 0 0-1L4.4 1.8a.6.6 0 0 0-.9.5Z" />
            </svg>
          )}
        </button>
        <button
          onClick={replay}
          aria-label="Replay"
          style={btnStyle}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11.5 7A4.5 4.5 0 1 1 9.7 3.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M9.2 1.6l.6 2.1-2.1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{
        fontFamily: "var(--font-sans)",
        fontSize:   "0.875rem",
        fontWeight: 400,
        color:      "var(--c-secondary)",
      }}>
        {text}
      </span>
    </div>
  )
}

// Renders a case-study image via next/image when its real dimensions are
// known (so the browser gets responsive, correctly-sized variants instead of
// full source resolution), falling back to a plain <img> otherwise so an
// uncatalogued path never breaks — width/height only affects srcset
// selection here since CSS still governs the rendered box size.
function CaseStudyImage({
  src,
  alt,
  style,
  draggable,
  quality = 90,
  priority,
  sizes = "(max-width: 900px) 100vw, 1264px",
}: {
  src: string
  alt: string
  style?: React.CSSProperties
  draggable?: boolean
  quality?: number
  priority?: boolean
  sizes?: string
}) {
  const dims = IMAGE_DIMENSIONS[src]
  if (!dims) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} draggable={draggable} style={style} />
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={dims.width}
      height={dims.height}
      quality={quality}
      priority={priority}
      sizes={sizes}
      draggable={draggable}
      style={{ ...style, width: style?.width ?? "100%", height: style?.height ?? "auto" }}
    />
  )
}

function MediaBox({ src, video }: { src: string; video?: boolean }) {
  const openLightbox = useContext(LightboxContext)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)
  const [playing, setPlaying] = useState(true)
  useLazyVideo(videoRef)

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}) } else { v.pause() }
  }, [])

  const replay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play().catch(() => {})
  }, [])

  const btnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", padding: 0,
  }

  return (
    <div
      onClick={() => openLightbox({ src, video: !!video })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 8, overflow: "hidden",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        cursor: "zoom-in",
      }}
    >
      {video
        ? <video ref={videoRef} src={src} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{ width: "100%", display: "block" }} />
        /* eslint-disable-next-line @next/next/no-img-element */
        : <CaseStudyImage src={src} alt="" draggable={false} style={{ width: "100%", display: "block" }} />
      }
      {video && (
        <div style={{
          position: "absolute", top: 8, right: 8, display: "flex", gap: 6,
          opacity: hovered ? 1 : 0, transition: "opacity 0.15s ease",
          pointerEvents: hovered ? "auto" : "none",
        }}>
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} style={btnStyle}>
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                <rect x="3" y="2" width="3" height="10" rx="1" />
                <rect x="8" y="2" width="3" height="10" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3.5 2.3v9.4a.6.6 0 0 0 .9.5l7.4-4.7a.6.6 0 0 0 0-1L4.4 1.8a.6.6 0 0 0-.9.5Z" />
              </svg>
            )}
          </button>
          <button onClick={replay} aria-label="Replay" style={btnStyle}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M11.5 7A4.5 4.5 0 1 1 9.7 3.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M9.2 1.6l.6 2.1-2.1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// Image variant of MediaBox for a section that links elsewhere (sec.href) —
// the image itself becomes the click target instead of only the title text
// above it, with a "Click me!" tooltip on hover so it doesn't read as inert.
function LinkedMediaBox({ src, href }: { src: string; href: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onClick={() => playClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "block",
        borderRadius: 8,
        overflow: "visible",
        cursor: "pointer",
      }}
    >
      <div style={{
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        transform: hovered ? "scale(1.01)" : "scale(1)",
        transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <CaseStudyImage src={src} alt="" draggable={false} style={{ width: "100%", display: "block" }} />
      </div>
      <div style={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: `translate(-50%, ${hovered ? "0" : "6px"})`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.15s ease, transform 0.15s ease",
        pointerEvents: "none",
        padding: "6px 12px",
        borderRadius: 100,
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        color: "#fff",
        fontFamily: "var(--font-sans)",
        fontSize: "0.8125rem",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
      }}>
        Click me!
      </div>
    </Link>
  )
}

function MediaGrid({ srcs, videos }: { srcs?: string[]; videos?: string[] }) {
  if (!srcs?.length && !videos?.length) return null
  const allMedia = [
    ...(srcs   ?? []).map(s => ({ src: s, video: false })),
    ...(videos ?? []).map(s => ({ src: s, video: true  })),
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {allMedia.map(({ src, video }, i) => <MediaBox key={i} src={src} video={video} />)}
    </div>
  )
}

// 16:10 cropped tile with a caption below — used for side-by-side labeled
// comparisons. Hover reveals pause/replay for video tiles.
function LabeledMediaTile({ src, video }: { src: string; video?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)
  const [playing, setPlaying] = useState(true)
  useLazyVideo(videoRef)

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}) } else { v.pause() }
  }, [])

  const replay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play().catch(() => {})
  }, [])

  const btnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", padding: 0,
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:        "relative",
        borderRadius:    8,
        overflow:        "hidden",
        backgroundColor: "var(--surface)",
        border:          "1px solid var(--border)",
        aspectRatio:     "16/10",
        cursor:          "zoom-in",
      }}
    >
      {video
        ? <video ref={videoRef} src={src} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
        /* eslint-disable-next-line @next/next/no-img-element */
        : <CaseStudyImage src={src} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      }
      {video && (
        <div style={{
          position: "absolute", top: 8, right: 8, display: "flex", gap: 6,
          opacity: hovered ? 1 : 0, transition: "opacity 0.15s ease",
          pointerEvents: hovered ? "auto" : "none",
        }}>
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} style={btnStyle}>
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                <rect x="3" y="2" width="3" height="10" rx="1" />
                <rect x="8" y="2" width="3" height="10" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3.5 2.3v9.4a.6.6 0 0 0 .9.5l7.4-4.7a.6.6 0 0 0 0-1L4.4 1.8a.6.6 0 0 0-.9.5Z" />
              </svg>
            )}
          </button>
          <button onClick={replay} aria-label="Replay" style={btnStyle}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M11.5 7A4.5 4.5 0 1 1 9.7 3.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M9.2 1.6l.6 2.1-2.1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function BentoTile({ item }: { item: BentoItem }) {
  const openLightbox = useContext(LightboxContext)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)
  const [playing, setPlaying] = useState(true)
  const mediaSrc = item.video ?? item.image
  const isVideo  = !!item.video
  useLazyVideo(videoRef)

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}) } else { v.pause() }
  }, [])

  const replay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play().catch(() => {})
  }, [])

  const btnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", padding: 0,
  }

  return (
    <div
      onClick={() => mediaSrc && openLightbox({ src: mediaSrc, video: isVideo })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:        "relative",
        gridColumn:      item.span === 2 ? "span 2" : "span 1",
        borderRadius:    8,
        overflow:        "hidden",
        border:          "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        cursor:          mediaSrc ? "zoom-in" : undefined,
      }}
    >
      {item.video && (
        <video ref={videoRef} src={item.video} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{ width: "100%", display: "block" }} />
      )}
      {item.image && <CaseStudyImage src={item.image} alt={item.label ?? ""} draggable={false} style={{ width: "100%", display: "block" }} />}
      {item.video && (
        <div style={{
          position: "absolute", top: 8, right: 8, display: "flex", gap: 6,
          opacity: hovered ? 1 : 0, transition: "opacity 0.15s ease",
          pointerEvents: hovered ? "auto" : "none",
        }}>
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} style={btnStyle}>
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                <rect x="3" y="2" width="3" height="10" rx="1" />
                <rect x="8" y="2" width="3" height="10" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3.5 2.3v9.4a.6.6 0 0 0 .9.5l7.4-4.7a.6.6 0 0 0 0-1L4.4 1.8a.6.6 0 0 0-.9.5Z" />
              </svg>
            )}
          </button>
          <button onClick={replay} aria-label="Replay" style={btnStyle}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M11.5 7A4.5 4.5 0 1 1 9.7 3.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M9.2 1.6l.6 2.1-2.1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
      {item.label && (
        <div style={{ padding: "6px 12px", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-faint)" }}>
          {item.label}
        </div>
      )}
    </div>
  )
}

function Bento({ items }: { items: BentoItem[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {items.map((item, i) => <BentoTile key={i} item={item} />)}
    </div>
  )
}

function StatCallout({ stat }: { stat: StatBlock }) {
  return (
    <div style={{
      padding:         "32px 36px",
      borderRadius:    10,
      marginBottom:    28,
      border:          "1px solid var(--border)",
      backgroundColor: "var(--surface)",
      display:         "flex",
      flexDirection:   "column",
      width:           "100%",
    }}>
      <span style={{
        fontFamily:    "var(--font-sans)",
        fontSize:      "clamp(48px, 11vw, 88px)",
        fontWeight:    800,
        color:         "var(--c-primary)",
        letterSpacing: "-0.04em",
        lineHeight:    1,
        display:       "block",
      }}>
        {stat.value}
      </span>
      <div style={{ width: 40, height: 2, backgroundColor: "var(--border)", margin: "20px 0 16px" }} />
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9375rem", fontWeight: 500, color: "var(--c-mid)", margin: 0, letterSpacing: "-0.01em" }}>
        {stat.label}
      </p>
      {stat.body && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 400, color: "var(--c-body)", margin: "8px 0 0", lineHeight: 1.7 }}>
          {stat.body}
        </p>
      )}
    </div>
  )
}

function Cards({ cards }: { cards: CardItem[] }) {
  return (
    <div className="rsp-stack" style={{
      display:             "grid",
      gridTemplateColumns: `repeat(${Math.min(cards.length, 2)}, 1fr)`,
      gap:                 14,
      marginTop:           16,
    }}>
      {cards.map((card, i) => (
        <div key={i} style={{
          padding:         "22px 26px",
          borderRadius:    10,
          border:          "1px solid var(--border)",
          backgroundColor: "var(--surface)",
        }}>
          {card.icon && (
            <span style={{ fontSize: "1.125rem", display: "block", marginBottom: 12 }}>{card.icon}</span>
          )}
          <h4 style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.875rem",
            fontWeight:    500,
            color:         "var(--c-high)",
            letterSpacing: "-0.01em",
            margin:        "0 0 8px",
          }}>
            {card.title}
          </h4>
          <p style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.875rem",
            fontWeight:    400,
            color:         "var(--c-body)",
            margin:        0,
            lineHeight:    1.7,
            letterSpacing: "-0.01em",
          }}>
            {card.body}
          </p>
        </div>
      ))}
    </div>
  )
}

function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pct, setPct] = useState(50)
  const [containerW, setContainerW] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const update = (clientX: number) => {
    const el = ref.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    setPct(Math.min(100, Math.max(0, ((clientX - left) / width) * 100)))
  }

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const move = (e: MouseEvent) => update(e.clientX)
    const up   = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
  }

  const onTouchMove = (e: React.TouchEvent) => update(e.touches[0].clientX)

  return (
    <div ref={ref} style={{ position: "relative", borderRadius: 8, overflow: "hidden", cursor: "col-resize", userSelect: "none", border: "1px solid var(--border)" }}
      onMouseDown={onMouseDown} onTouchMove={onTouchMove}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="After" style={{ width: "100%", display: "block" }} />
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${pct}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="Before" style={{ position: "absolute", top: 0, left: 0, width: containerW ?? "100%", maxWidth: "none", display: "block" }} />
      </div>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pct}%`, transform: "translateX(-50%)", width: 2, backgroundColor: "white", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 32, height: 32, borderRadius: "50%", backgroundColor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2L1 6L4 10M8 2L11 6L8 10" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
      <div style={{ position: "absolute", top: 10, left: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: "rgba(0,0,0,0.4)", color: "white", fontSize: "0.5625rem", fontWeight: 500, letterSpacing: "0.06em", pointerEvents: "none" }}>BLUEPRINT</div>
      <div style={{ position: "absolute", top: 10, right: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: "rgba(0,0,0,0.4)", color: "white", fontSize: "0.5625rem", fontWeight: 500, letterSpacing: "0.06em", pointerEvents: "none" }}>FINAL DESIGN</div>
    </div>
  )
}

function ChapterVideo({ src, chapters }: { src: string; chapters: { time: number; label: string }[] }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(0)
  const [time, setTime]         = useState(0)
  const [playing, setPlaying]   = useState(true)
  const [dragging, setDragging] = useState(false)
  useLazyVideo(videoRef)

  // timeupdate only fires ~4x/sec, which makes the progress bar visibly step.
  // Drive it off rAF instead, but only while playing and not mid-drag.
  useEffect(() => {
    if (!playing || dragging) return
    let raf = 0
    const tick = () => {
      const v = videoRef.current
      if (v) setTime(v.currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, dragging])

  const activeIdx = chapters.reduce((acc, c, i) => (time >= c.time ? i : acc), 0)

  // Equal-width segments: each chapter owns 1/n of the bar regardless of its
  // duration, so labels always fit. Fill moves through the active segment
  // proportional to that chapter's own progress (stories-style).
  const segs = chapters
    .map((c, i) => ({
      label: c.label,
      start: c.time,
      end:   i < chapters.length - 1 ? chapters[i + 1].time : (duration || c.time + 1),
    }))
    .filter(s => duration === 0 || s.start < duration)
    .map(s => ({ ...s, end: duration > 0 ? Math.min(s.end, duration) : s.end }))

  const segProgress = (i: number) => {
    if (i < activeIdx) return 100
    if (i > activeIdx) return 0
    const s = segs[i]
    if (!s || s.end <= s.start) return 0
    return Math.min(100, Math.max(0, ((time - s.start) / (s.end - s.start)) * 100))
  }

  const seek = useCallback((seconds: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = seconds
    setTime(seconds)
  }, [])

  // Map a clientX onto the equal-width segments: which segment the pointer is
  // in decides the chapter, the position inside it decides the time within.
  const seekToClientX = useCallback((clientX: number) => {
    const track = trackRef.current
    const v = videoRef.current
    if (!track || !v || !v.duration || segs.length === 0) return
    const { left, width } = track.getBoundingClientRect()
    const ratio = Math.min(0.9999, Math.max(0, (clientX - left) / width))
    const segFloat = ratio * segs.length
    const idx  = Math.floor(segFloat)
    const frac = segFloat - idx
    const s = segs[idx]
    seek(Math.min(s.start + frac * (s.end - s.start), v.duration - 0.05))
  }, [seek, segs])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}) } else { v.pause() }
  }, [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ borderRadius: 8, overflow: "hidden", backgroundColor: "var(--surface)", position: "relative" }}>
        <video
          ref={videoRef}
          src={src}
          muted loop playsInline preload="metadata"
          onClick={togglePlay}
          onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          style={{ width: "100%", display: "block", cursor: "pointer" }}
        />
        {/* Pause affordance — visible only while paused */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", pointerEvents: "none",
          opacity: playing ? 0 : 1, transition: "opacity 0.2s ease",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <path d="M5.5 3.3v13.4a.8.8 0 0 0 1.2.7l10.6-6.7a.8.8 0 0 0 0-1.4L6.7 2.6a.8.8 0 0 0-1.2.7Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Equal-width chapter segments, stories-style per-segment fill — desktop only.
          Five draggable segments don't work as a mobile pattern; the video just
          autoplays/loops there like every other clip in this case study. */}
      <div
        className="rsp-hide-mobile"
        ref={trackRef}
        // Pointer capture (not window listeners): the up event is guaranteed to
        // reach this element even when released off the bar or off the window,
        // and the handlers exist from first render — no missed-pointerup race
        // that would leave `dragging` stuck and freeze the rAF-driven fill.
        onPointerDown={e => {
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          playClick()
          setDragging(true)
          seekToClientX(e.clientX)
        }}
        onPointerMove={e => { if (dragging) seekToClientX(e.clientX) }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        style={{
          display: "flex", gap: 6, cursor: "pointer",
          userSelect: "none", touchAction: "none",
        }}
      >
        {segs.map((s, i) => {
          const isActive = i === activeIdx
          const fill = segProgress(i)
          return (
            <div
              key={i}
              style={{
                flex: 1, minWidth: 0, height: 36, position: "relative",
                borderRadius: 7, overflow: "hidden",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                display: "flex", alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: `${fill}%`,
                backgroundColor: "var(--c-primary)",
                opacity: isActive ? 0.35 : 0.14,
                transition: dragging ? "none" : "width 0.08s linear",
              }} />
              {/* Bright leading edge so the playhead position is unmistakable */}
              {isActive && fill > 0 && fill < 100 && (
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: `${fill}%`,
                  width: 2, backgroundColor: "var(--c-primary)", opacity: 0.9,
                  transform: "translateX(-100%)",
                  transition: dragging ? "none" : "left 0.08s linear",
                }} />
              )}
              <span
                className={isActive ? undefined : "rsp-chapter-label-hide"}
                style={{
                  position: "relative", padding: "0 12px",
                  fontFamily: "var(--font-sans)", fontSize: "0.75rem",
                  fontWeight: isActive ? 600 : 400, letterSpacing: "-0.01em",
                  color: isActive ? "var(--c-primary)" : fill > 0 ? "var(--c-dim)" : "var(--c-faint)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  transition: "color 0.2s ease",
                }}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TabView({ tabs }: { tabs: { label: string; image: string }[] }) {
  const [active, setActive] = useState(0)
  const openLightbox = useContext(LightboxContext)
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding:         "6px 14px",
              borderRadius:    99,
              border:          `1px solid ${i === active ? "var(--c-primary)" : "var(--border)"}`,
              background:      i === active ? "var(--c-primary)" : "transparent",
              color:           i === active ? "var(--bg)" : "var(--c-secondary)",
              fontSize:        "0.75rem",
              fontWeight:      500,
              fontFamily:      "var(--font-sans)",
              letterSpacing:   "-0.01em",
              cursor:          "pointer",
              transition:      "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", cursor: "zoom-in" }}
        onClick={() => openLightbox({ src: tabs[active].image, video: false })}>
        <CaseStudyImage src={tabs[active].image} alt={tabs[active].label} style={{ width: "100%", display: "block" }} />
      </div>
    </div>
  )
}

function HighlightCarousel({ images }: { images: string[] }) {
  const [active, setActive] = useState(0)
  const openLightbox = useContext(LightboxContext)
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ overflow: "hidden", cursor: "zoom-in" }} onClick={() => openLightbox({ src: images[active], video: false })}>
        <CaseStudyImage src={images[active]} alt="" style={{ width: "100%", display: "block" }} />
      </div>
      {images.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width:           i === active ? 16 : 6,
                height:          6,
                borderRadius:    99,
                border:          "none",
                backgroundColor: i === active ? "var(--c-primary)" : "var(--border)",
                padding:         0,
                cursor:          "pointer",
                transition:      "width 0.2s ease, background-color 0.2s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function renderContentBlock(block: ContentBlock, bi: number) {
  if (block.highlight && block.minimal) {
    return (
      <motion.div
        key={bi}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ ...FADE, delay: bi * 0.05 }}
        style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: "1px solid var(--border)", paddingTop: 20, height: "100%" }}
      >
        {/* Fixed-height text block so the image below starts at the same y
            across sibling cards, regardless of how many lines the body wraps to.
            Only applied when a body exists — title-only cards sit flush above the image. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: block.body ? 108 : undefined }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {block.icon && (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
              {block.icon === "target" && <>
                <circle cx="9" cy="9" r="7.5" stroke="var(--c-primary)" strokeWidth="1.5" />
                <circle cx="9" cy="9" r="3.5" stroke="var(--c-primary)" strokeWidth="1.5" />
                <circle cx="9" cy="9" r="1.5" fill="var(--c-primary)" />
              </>}
              {block.icon === "spark" && <>
                <path d="M9 1.5L10.6 6.8H16.2L11.6 9.9L13.2 15.2L9 12.1L4.8 15.2L6.4 9.9L1.8 6.8H7.4L9 1.5Z" stroke="var(--c-primary)" strokeWidth="1.5" strokeLinejoin="round" />
              </>}
              {block.icon === "layers" && <>
                <rect x="2" y="6" width="14" height="9" rx="1.5" stroke="var(--c-primary)" strokeWidth="1.5" />
                <path d="M5 6V4.5A1.5 1.5 0 0 1 6.5 3h5A1.5 1.5 0 0 1 13 4.5V6" stroke="var(--c-primary)" strokeWidth="1.5" />
              </>}
              {block.icon === "zap" && <>
                <path d="M10.5 2L4 10h5.5L7.5 16L14 8H8.5L10.5 2Z" stroke="var(--c-primary)" strokeWidth="1.5" strokeLinejoin="round" />
              </>}
              {block.icon === "expand" && <>
                <path d="M11 2h5v5M7 16H2v-5M16 7l-5 5M2 11l5-5" stroke="var(--c-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </>}
              {block.icon === "stack" && <>
                <rect x="2" y="11" width="14" height="4" rx="1" stroke="var(--c-primary)" strokeWidth="1.5" />
                <rect x="4" y="6.5" width="10" height="3.5" rx="1" stroke="var(--c-primary)" strokeWidth="1.5" />
                <rect x="6" y="3" width="6" height="3" rx="1" stroke="var(--c-primary)" strokeWidth="1.5" />
              </>}
              {block.icon === "compass" && <>
                <circle cx="9" cy="9" r="7.5" stroke="var(--c-primary)" strokeWidth="1.5" />
                <path d="M11.5 6.5L10 10L6.5 11.5L8 8L11.5 6.5Z" stroke="var(--c-primary)" strokeWidth="1.5" strokeLinejoin="round" />
              </>}
              {block.icon === "pencil" && <>
                <path d="M11.5 2.5l4 4-9 9H2.5v-4l9-9Z" stroke="var(--c-primary)" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9.5 4.5l4 4" stroke="var(--c-primary)" strokeWidth="1.5" />
              </>}
              {block.icon === "sparkle" && <>
                <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.1 4.1l1.4 1.4M12.5 12.5l1.4 1.4M4.1 13.9l1.4-1.4M12.5 5.5l1.4-1.4" stroke="var(--c-primary)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="9" cy="9" r="2.5" stroke="var(--c-primary)" strokeWidth="1.5" />
              </>}
            </svg>
          )}
          {block.title && (
            <p style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.9375rem",
              fontWeight:    500,
              color:         "var(--c-primary)",
              letterSpacing: "-0.02em",
              lineHeight:    1.4,
              margin:        0,
            }}>
              {block.title}
            </p>
          )}
        </div>
        {block.body && (
          <p className="rsp-cs-body" style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "1rem",
            fontWeight:    400,
            color:         "var(--c-body)",
            letterSpacing: "-0.01em",
            lineHeight:    1.75,
            margin:        0,
          }}>
            {block.body}
          </p>
        )}
        </div>
        {block.images && block.images.length > 0 && (
          <div style={{ borderRadius: 8, overflow: "hidden" }}>
            <CaseStudyImage src={block.images[0]} alt="" style={{ width: "100%", display: "block" }} />
          </div>
        )}
      </motion.div>
    )
  }

  if (block.highlight) {
    const isNumbered  = block.title && /^\d+$/.test(block.title.trim())
    const hlImages    = block.images ?? (block.image ? [block.image] : [])
    return (
      <motion.div
        key={bi}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ ...FADE, delay: bi * 0.05 }}
        style={{
          padding:         isNumbered ? "24px 24px" : "24px 24px",
          borderRadius:    10,
          border:          "1px solid var(--border)",
          backgroundColor: "var(--surface)",
          textAlign:       "left",
          display:         "flex",
          flexDirection:   "column",
        }}
      >
        <div>
          {isNumbered && (
            <span style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.6875rem",
              fontWeight:    700,
              letterSpacing: "0.1em",
              color:         "var(--c-faint)",
              display:       "block",
              marginBottom:  20,
            }}>
              {block.title}
            </span>
          )}
          {!isNumbered && block.title && (
            <p style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "1rem",
              fontWeight:    500,
              color:         "var(--c-primary)",
              letterSpacing: "-0.025em",
              lineHeight:    1.45,
              margin:        0,
            }}>
              {block.title}
            </p>
          )}
          {block.body && (
            <p style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      isNumbered ? 22 : (!block.title ? 18 : 16),
              fontWeight:    isNumbered ? 400 : (!block.title ? 500 : 400),
              color:         isNumbered ? "var(--c-primary)" : (!block.title ? "var(--c-primary)" : "var(--c-body)"),
              margin:        (!isNumbered && block.title) ? "6px 0 0" : 0,
              lineHeight:    isNumbered ? 1.55 : (!block.title ? 1.5 : 1.7),
              letterSpacing: isNumbered ? "-0.025em" : (!block.title ? "-0.02em" : "0"),
            }}>
              {block.body}
            </p>
          )}
        </div>
        {hlImages.length > 0 && <HighlightCarousel images={hlImages} />}
      </motion.div>
    )
  }

  const allImages = block.image ? [block.image] : (block.images ?? [])
  const allVideos = block.videos ?? []
  const hasMedia  = allImages.length > 0 || allVideos.length > 0

  // Note variant: with image → side by side; without → standalone card
  if (block.note) {
    const noteCard = (
      <div className="sticky-note" style={{
        borderRadius: 10,
        overflow:     "hidden",
        transform:    "rotate(-0.6deg)",
        ...(block.image ? { position: "sticky", top: 80 } : {}),
      }}>
        <div className="sticky-note-tape" style={{ height: 6 }} />
        <div style={{ padding: "14px 16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {block.title && (
            <span className="sticky-note-label" style={{
              fontFamily:    "'Departure Mono', monospace",
              fontSize:      "0.5625rem",
              fontWeight:    700,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
            }}>
              {block.title}
            </span>
          )}
          <p className="sticky-note-body" style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.8125rem",
            fontWeight:    500,
            lineHeight:    1.75,
            margin:        0,
            letterSpacing: "-0.01em",
          }}>
            {block.note}
          </p>
        </div>
      </div>
    )

    return (
      <motion.div
        key={bi}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ ...FADE, delay: bi * 0.05 }}
        className={block.image ? "rsp-stack" : undefined}
        style={block.image
          ? { display: "grid", gridTemplateColumns: "1fr 212px", gap: 24, alignItems: "start" }
          : {}}
      >
        {block.image && <MediaBox src={block.image} />}
        {noteCard}
      </motion.div>
    )
  }

  return (
    <motion.div
      key={bi}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ ...FADE, delay: bi * 0.05 }}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      {(block.title || block.body) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {block.title && (
            <h3 style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "1.3rem",
              fontWeight:    500,
              color:         "var(--c-primary)",
              letterSpacing: "-0.025em",
              lineHeight:    1.2,
              margin:        0,
            }}>
              {block.title}
            </h3>
          )}
          {block.body && (
            <p className="rsp-cs-body" style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "1rem",
              fontWeight:    400,
              color:         "var(--c-body)",
              letterSpacing: "-0.01em",
              lineHeight:    1.75,
              margin:        0,
              whiteSpace:    "pre-line",
            }}>
              {block.body}
            </p>
          )}
        </div>
      )}
      {hasMedia && !block.insight && !block.imageLabels && (
        <MediaGrid srcs={allImages.length ? allImages : undefined} videos={allVideos.length ? allVideos : undefined} />
      )}
      {hasMedia && !block.insight && block.imageLabels && (() => {
        const allMedia = [
          ...allVideos.map(s => ({ src: s, video: true  })),
          ...allImages.map(s => ({ src: s, video: false })),
        ]
        return (
          <div className="rsp-stack" style={{ display: "grid", gridTemplateColumns: block.stackImages ? "1fr" : `repeat(${allMedia.length}, 1fr)`, gap: 16, alignItems: "start" }}>
            {allMedia.map(({ src, video }, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <LabeledMediaTile src={src} video={video} />
                {block.imageLabels![i] && (
                  <p style={{
                    fontFamily:    "var(--font-sans)",
                    fontSize:      "0.8125rem",
                    fontWeight:    400,
                    color:         "var(--c-secondary)",
                    letterSpacing: "-0.01em",
                    lineHeight:    1.5,
                    margin:        0,
                    textAlign:     "center",
                  }}>
                    {block.imageLabels![i]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      })()}
      {hasMedia && block.insight && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "stretch" }}>
          <MediaGrid srcs={allImages.length ? allImages : undefined} videos={allVideos.length ? allVideos : undefined} />
          <div style={{
            display:    "flex",
            flexDirection: "column",
            gap:        12,
            borderTop:  "1px solid var(--border)",
            paddingTop: 20,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="9" cy="9" r="7.5" stroke="var(--c-primary)" strokeWidth="1.5" />
              <line x1="9" y1="5" x2="9" y2="10.5" stroke="var(--c-primary)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="9" cy="13" r="1" fill="var(--c-primary)" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {block.insightTitle && (
                <p style={{
                  fontFamily:    "var(--font-sans)",
                  fontSize:      "1.3rem",
                  fontWeight:    500,
                  color:         "var(--c-primary)",
                  lineHeight:    1.2,
                  margin:        0,
                  letterSpacing: "-0.025em",
                }}>
                  {block.insightTitle}
                </p>
              )}
              <p className="rsp-cs-body" style={{
                fontFamily:    "var(--font-sans)",
                fontSize:      "1rem",
                fontWeight:    400,
                color:         "var(--c-body)",
                lineHeight:    1.75,
                margin:        0,
                letterSpacing: "-0.01em",
              }}>
                {block.insight}
              </p>
            </div>
          </div>
        </div>
      )}
      {!hasMedia && block.insight && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 8 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="9" cy="9" r="7.5" stroke="var(--c-primary)" strokeWidth="1.5" />
            <line x1="9" y1="5" x2="9" y2="10.5" stroke="var(--c-primary)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="13" r="1" fill="var(--c-primary)" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {block.insightTitle && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "1.3rem", fontWeight: 500, color: "var(--c-primary)", lineHeight: 1.2, margin: 0, letterSpacing: "-0.025em" }}>
                {block.insightTitle}
              </p>
            )}
            <p className="rsp-cs-body" style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", fontWeight: 400, color: "var(--c-body)", lineHeight: 1.75, margin: 0, letterSpacing: "-0.01em" }}>
              {block.insight}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Media tile used inside the accordion's media/text rows — hover reveals
// pause/replay for video tiles; clicking the tile body still opens the lightbox.
function AccordionMediaTile({
  src,
  video,
  objectPosition,
  onOpen,
  fill,
}: {
  src: string
  video?: boolean
  objectPosition?: string
  onOpen: () => void
  fill?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)
  const [playing, setPlaying] = useState(true)
  useLazyVideo(videoRef)

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}) } else { v.pause() }
  }, [])

  const replay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play().catch(() => {})
  }, [])

  const btnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", padding: 0,
  }

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:     "relative",
        borderRadius: fill ? 8 : 12,
        overflow:     "hidden",
        border:       "1px solid var(--border)",
        cursor:       "zoom-in",
        ...(fill ? { backgroundColor: "var(--surface)", height: "100%" } : {}),
      }}
    >
      {video
        ? <video
            ref={videoRef}
            src={src}
            muted loop playsInline preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            style={fill
              ? { width: "100%", height: "100%", objectFit: "cover", objectPosition: objectPosition ?? "center center", display: "block" }
              : { width: "100%", display: "block" }
            }
          />
        : <CaseStudyImage
            src={src}
            alt=""
            draggable={false}
            style={fill
              ? { width: "100%", height: "100%", objectFit: "cover", objectPosition: objectPosition ?? "center center" }
              : { width: "100%", display: "block" }
            }
          />
      }
      {video && (
        <div style={{
          position: "absolute", top: 8, right: 8, display: "flex", gap: 6,
          opacity: hovered ? 1 : 0, transition: "opacity 0.15s ease",
          pointerEvents: hovered ? "auto" : "none",
        }}>
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} style={btnStyle}>
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                <rect x="3" y="2" width="3" height="10" rx="1" />
                <rect x="8" y="2" width="3" height="10" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3.5 2.3v9.4a.6.6 0 0 0 .9.5l7.4-4.7a.6.6 0 0 0 0-1L4.4 1.8a.6.6 0 0 0-.9.5Z" />
              </svg>
            )}
          </button>
          <button onClick={replay} aria-label="Replay" style={btnStyle}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M11.5 7A4.5 4.5 0 1 1 9.7 3.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M9.2 1.6l.6 2.1-2.1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function AccordionContents({ contents }: { contents: ContentBlock[] }) {
  const [active, setActive] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const openLightbox = useContext(LightboxContext)

  const block = contents[active]
  const mediaSrc = block.videos?.[0]
    ? { src: block.videos[0], video: true }
    : block.image
      ? { src: block.image, video: false }
      : block.images?.[0]
        ? { src: block.images[0], video: false }
        : null
  const objectPos = block.objectPosition ?? "center center"

  const onCarouselScroll = () => {
    const el = carouselRef.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / el.offsetWidth))
  }

  const scrollToSlide = (i: number) => {
    carouselRef.current?.scrollTo({ left: i * (carouselRef.current.offsetWidth), behavior: "smooth" })
  }

  return (
    <>
      {/* Desktop: side-by-side — media left, text right */}
      <div className="rsp-accordion-desktop" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {contents.map((item, i) => {
          const src = item.videos?.[0]
            ? { src: item.videos[0], video: true }
            : item.image
              ? { src: item.image, video: false }
              : item.images?.[0]
                ? { src: item.images[0], video: false }
                : null
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ ...FADE, delay: i * 0.05 }}
              style={{
                display:             "grid",
                gridTemplateColumns: "1.7fr 1fr",
                minHeight:           360,
                gap:                 40,
                alignItems:          "end",
                paddingTop:          i === 0 ? 0 : 28,
              }}
            >
              {/* Media — full bleed, rounded */}
              {src && (
                <AccordionMediaTile src={src.src} video={src.video} onOpen={() => openLightbox(src)} />
              )}
              {/* Text */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "1.25rem", fontWeight: 500, color: "var(--c-primary)", letterSpacing: "-0.02em", lineHeight: 1.35, margin: 0, textWrap: "balance" }}>
                  {item.title}
                </p>
                {item.body && (
                  <p className="rsp-cs-body" style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", fontWeight: 400, color: "var(--c-body)", lineHeight: 1.75, letterSpacing: "-0.01em", margin: 0 }}>
                    {item.body}
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Mobile: snap-scroll carousel */}
      <div className="rsp-accordion-mobile" style={{ display: "none" }}>
        <div
          ref={carouselRef}
          onScroll={onCarouselScroll}
          style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
        >
          {contents.map((item, i) => {
            const src = item.videos?.[0]
              ? { src: item.videos[0], video: true }
              : item.image
                ? { src: item.image, video: false }
                : item.images?.[0]
                  ? { src: item.images[0], video: false }
                  : null
            const objPos = item.objectPosition ?? "center center"
            return (
              <div key={i} style={{ minWidth: "100%", maxWidth: "100%", flexShrink: 0, overflow: "hidden", scrollSnapAlign: "start", display: "flex", flexDirection: "column", gap: 16 }}>
                {src && (
                  <div style={{ height: 260 }}>
                    <AccordionMediaTile src={src.src} video={src.video} objectPosition={objPos} onOpen={() => openLightbox(src)} fill />
                  </div>
                )}
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.6875rem", fontWeight: 500, color: "var(--c-faint)", letterSpacing: "0.06em", paddingTop: 2, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "1.125rem", fontWeight: 500, color: "var(--c-primary)", letterSpacing: "-0.02em", lineHeight: 1.35 }}>
                      {item.title}
                    </span>
                    {item.body && (
                      <span className="rsp-cs-body" style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", fontWeight: 400, color: "var(--c-body)", lineHeight: 1.75, letterSpacing: "-0.01em", wordBreak: "break-word" }}>
                        {item.body}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
          {contents.map((_, i) => (
            <button
              key={i}
              onClick={() => { playClick(); scrollToSlide(i) }}
              style={{
                width:        active === i ? 16 : 6,
                height:       6,
                borderRadius: 3,
                background:   active === i ? "var(--c-primary)" : "var(--c-ghost)",
                border:       "none",
                cursor:       "pointer",
                padding:      0,
                transition:   "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function MultiHighlight({ contents, marginTop }: { contents: ContentBlock[]; marginTop: number }) {
  return (
    <div style={{ marginTop }}>
      <div className="rsp-mh-desktop" style={{ display: "grid", gridTemplateColumns: `repeat(${contents.length}, 1fr)`, gap: 16, alignItems: "stretch", gridAutoRows: "1fr" }}>
        {contents.map((block, bi) => renderContentBlock(block, bi))}
      </div>
      <div className="rsp-mh-mobile" style={{ display: "none", flexDirection: "column", gap: 12 }}>
        {contents.map((block, bi) => renderContentBlock(block, bi))}
      </div>
    </div>
  )
}


function MobileBackBar({ href }: { href: string }) {
  return (
    <Link
      href={href}
      onClick={() => playClick()}
      className="rsp-back-mobile"
      style={{
        display: "none", alignItems: "center", gap: 8,
        position: "fixed", top: 20, left: 20, zIndex: 1001,
        fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 500,
        letterSpacing: "-0.01em", color: "var(--c-primary)",
        textDecoration: "none",
        background: "var(--bg)", border: "1px solid var(--border)",
        borderRadius: 999, padding: "10px 16px",
        backdropFilter: "blur(8px)",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Back
    </Link>
  )
}

function BackButton({ href }: { href: string }) {
  const [hovered, setHovered] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.push(href)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [href, router])

  return (
    <Link
      href={href}
      onClick={() => playClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rsp-hide-mobile"
      style={{
        position:      "fixed", top: 28, left: 32, zIndex: 200,
        fontFamily:    "var(--font-sans)",
        fontSize:      "0.875rem",
        fontWeight:    500,
        letterSpacing: "-0.01em",
        color:         hovered ? "var(--c-primary)" : "var(--c-dim)",
        textDecoration: "none",
        transition:    "color 0.15s ease",
      }}
    >
      Home
    </Link>
  )
}

const RENDER_W   = 200
const DISPLAY_W  = 110
const NOODLE_SCALE = DISPLAY_W / RENDER_W
const BOT_H      = 89
const MID_H_FULL = 91
const MIN_H      = 18
const TOP_H      = 81
const WRAP_H     = 180
const TOP_DROP   = 14

function NoodleAnimation() {
  const midClipRef = useRef<HTMLDivElement>(null)
  const topImgRef  = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let rafId: number
    function tick() {
      const st  = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p   = max > 0 ? Math.min(1, Math.max(0, st / max)) : 0
      const midH = Math.max(MIN_H, Math.round(MID_H_FULL * (1 - p)))
      if (midClipRef.current) midClipRef.current.style.height = midH + "px"
      if (topImgRef.current)  topImgRef.current.style.bottom  = (BOT_H + midH - TOP_DROP) + "px"
    }
    function onScroll() {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(rafId) }
  }, [])

  return (
    <div style={{ position: "relative", width: DISPLAY_W, height: Math.round(WRAP_H * NOODLE_SCALE), flexShrink: 0, overflow: "visible" }}>
      {/* Inner div rendered at full 200px then scaled down — keeps SVG crisp */}
      <div style={{
        position:        "absolute",
        bottom:          0,
        left:            0,
        width:           RENDER_W,
        height:          WRAP_H,
        transform:       `scale(${NOODLE_SCALE})`,
        transformOrigin: "bottom left",
        overflow:        "visible",
        opacity:         0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/noodle-bottom.svg" alt="" draggable={false}
          style={{ position: "absolute", bottom: 0, left: 0, width: RENDER_W, height: BOT_H }} />

        <div ref={midClipRef}
          style={{ position: "absolute", bottom: BOT_H, left: 0, width: RENDER_W, height: MID_H_FULL, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/noodle-middle.svg" alt="" draggable={false}
            style={{ position: "absolute", bottom: 0, left: 0, width: RENDER_W, height: MID_H_FULL }} />
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={topImgRef} src="/noodle-top.svg" alt="" draggable={false}
          style={{ position: "absolute", bottom: BOT_H + MID_H_FULL - TOP_DROP, left: 0, width: RENDER_W, height: TOP_H }} />
      </div>
    </div>
  )
}

const SPARKLE_COLORS = ["#e8443a", "#e07b00", "#c9a000", "#2ba84a", "#1a8fc9", "#9b3fd4"]
const SPARKLE_COUNT  = 8

function HighlightsButton({ id, isActive, onClick, prefix }: { id: string; isActive: boolean; onClick: () => void; prefix?: string }) {
  const [burst, setBurst] = useState(false)
  const [hov, setHov]     = useState(false)

  const handleClick = () => {
    onClick()
    setBurst(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setBurst(true)))
    setTimeout(() => setBurst(false), 700)
  }

  const particles = Array.from({ length: SPARKLE_COUNT }, (_, i) => {
    const angle  = (i / SPARKLE_COUNT) * 360
    const color  = SPARKLE_COLORS[i % SPARKLE_COLORS.length]
    const dist   = 22 + Math.random() * 12
    const rad    = (angle * Math.PI) / 180
    const tx     = Math.cos(rad) * dist
    const ty     = Math.sin(rad) * dist
    return { color, tx, ty, angle, i }
  })

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "5px 0", textAlign: "left", position: "relative" }}
    >
      {burst && particles.map(({ color, tx, ty, i }) => (
        <span
          key={i}
          style={{
            position:  "absolute",
            left:      "50%",
            top:       "50%",
            width:     3,
            height:    3,
            borderRadius: "50%",
            backgroundColor: color,
            pointerEvents: "none",
            transform: `translate(-50%, -50%)`,
            animation: `toc-sparkle-${i} 0.65s cubic-bezier(0.22,1,0.36,1) forwards`,
          }}
        />
      ))}
      <style>{`
        ${particles.map(({ tx, ty, i }) => `
          @keyframes toc-sparkle-${i} {
            0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0); opacity: 0; }
          }
        `).join("")}
        @keyframes toc-hl-shimmer {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
      {prefix && (
        <span style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "0.8125rem",
          fontWeight:    isActive ? 500 : 400,
          letterSpacing: "-0.01em",
          lineHeight:    1.4,
          color:         isActive ? "var(--c-primary)" : "var(--c-dim)",
          transition:    "color 0.18s ease",
        }}>
          {prefix}
        </span>
      )}
      <span style={{
        fontFamily:    "var(--font-sans)",
        fontSize:      "0.8125rem",
        fontWeight:    isActive ? 500 : 400,
        letterSpacing: "-0.01em",
        lineHeight:    1.4,
        background:           "linear-gradient(90deg, #e8443a, #e07b00, #c9a000, #2ba84a, #1a8fc9, #9b3fd4, #e8443a)",
        backgroundSize:       "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor:  "transparent",
        backgroundClip:       "text",
        animation:            (hov || isActive) ? "toc-hl-shimmer 1s linear infinite" : "none",
        transition:           "opacity 0.15s ease",
        opacity:              (hov || isActive) ? 1 : 0.85,
      }}>
        Highlights
      </span>
    </button>
  )
}

function TableOfContents({ backHref, items, activeId, revealed }: {
  backHref: string
  items: Array<{ label: string; id: string }>
  activeId: string
  revealed: boolean
}) {
  const [hovId, setHovId] = useState<string | null>(null)
  const [hovHome, setHovHome] = useState(false)
  const [hovTheme, setHovTheme] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.body.classList.contains("dark"))
  }, [])

  const handleThemeToggle = () => {
    const next = !isDark
    setIsDark(next)
    document.body.classList.add("theme-switching")
    if (next) {
      document.body.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.body.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
    setTimeout(() => document.body.classList.remove("theme-switching"), 600)
  }

  // Stagger step shared by the header row (index 0) and every nav item
  // below it (index 1..n), so the whole sidebar cascades as one sequence
  // instead of the header snapping while only the nav list staggers.
  const STEP = 0.035
  const stagger = (i: number) => ({
    initial: false as const,
    animate: revealed ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 },
    transition: {
      type: "spring" as const, visualDuration: 0.4, bounce: 0.32,
      delay: revealed ? i * STEP : (items.length - i) * (STEP * 0.85),
    },
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", paddingTop: 56 }}>
      <motion.div {...stagger(0)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link
          href={backHref}
          onClick={() => playClick()}
          onMouseEnter={() => setHovHome(true)}
          onMouseLeave={() => setHovHome(false)}
          style={{
            fontFamily:     "var(--font-sans)",
            fontSize:       "0.8125rem",
            fontWeight:     400,
            color:          hovHome ? "var(--c-primary)" : "var(--c-dim)",
            letterSpacing:  "-0.01em",
            lineHeight:     1.4,
            textDecoration: "none",
            transition:     "color 0.18s ease",
            padding:        "5px 0",
            display:        "block",
          }}
        >
          Home
        </Link>
        <button
          onClick={handleThemeToggle}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            background: "none",
            border:     "none",
            cursor:     "pointer",
            padding:    "5px 0 5px 8px",
            color:      "var(--c-dim)",
            transition: "color 0.15s ease",
            display:    "flex",
            alignItems: "center",
            position:   "relative",
            width:      14,
            height:     14,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--c-primary)"; setHovTheme(true) }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--c-dim)"; setHovTheme(false) }}
        >
          {/* Sun */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", transition: "opacity 0.3s ease, transform 0.3s ease", opacity: isDark ? 1 : 0, transform: isDark ? "rotate(0deg) scale(1)" : "rotate(45deg) scale(0.6)" }}>
            <circle cx="12" cy="12" r="5"/>
            <g style={{ transformOrigin: "12px 12px", transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)", transform: hovTheme && isDark ? "rotate(45deg)" : "rotate(0deg)" }}>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </g>
          </svg>
          {/* Moon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", transition: "opacity 0.3s ease, transform 0.3s ease", opacity: isDark ? 0 : 1, transform: isDark ? "rotate(-45deg) scale(0.6)" : (hovTheme ? "rotate(-20deg) scale(1)" : "rotate(0deg) scale(1)") }}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </motion.div>
      <motion.div {...stagger(0)} style={{ height: 1, backgroundColor: "var(--divider)", margin: "16px 0" }} />
      <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map(({ label, id }, i) => {
          const isActive = activeId === id
          const isHov    = hovId === id
          // Header row is index 0, so nav items continue the same cascade
          // from index 1 — the whole sidebar reveals/hides as one sequence.
          const itemMotion = stagger(i + 1)

          if (label === "Highlights" || label === "Overview / Highlights") {
            return (
              <motion.div key={id} {...itemMotion}>
                <HighlightsButton
                  id={id}
                  isActive={isActive}
                  prefix={label === "Overview / Highlights" ? "Overview / " : undefined}
                  onClick={() => { playClick(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }) }}
                />
              </motion.div>
            )
          }

          return (
            <motion.button
              key={id}
              {...itemMotion}
              onClick={() => { playClick(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }) }}
              onMouseEnter={() => setHovId(id)}
              onMouseLeave={() => setHovId(null)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "5px 0", textAlign: "left" }}
            >
              <span style={{
                fontFamily:    "var(--font-sans)",
                fontSize:      "0.8125rem",
                fontWeight:    isActive ? 500 : 400,
                letterSpacing: "-0.01em",
                lineHeight:    1.4,
                transition:    "color 0.18s ease",
                color: isHov ? "var(--c-primary)" : isActive ? "var(--c-primary)" : "var(--c-dim)",
              }}>
                {label}
              </span>
            </motion.button>
          )
        })}
      </nav>

    </div>
  )
}

// ── Dither divider ─────────────────────────────────────────────────────────────
// Particle system ported from dither-main: mouse repulsion + click shockwaves.

const DD_BAYER_8X8 = [
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
]

interface DDShockwave { x: number; y: number; start: number }
interface DDSystem {
  count: number
  baseX: Float32Array; baseY: Float32Array
  dx:    Float32Array; dy:    Float32Array
  lit:   Float32Array
  dotSize: number
}

const DD_MOUSE_R      = 80
const DD_MOUSE_R_SQ   = DD_MOUSE_R * DD_MOUSE_R
const DD_MOUSE_FORCE  = 35
const DD_EASING       = 0.12
const DD_SNAP         = 0.01
const DD_SW_SPEED     = 220
const DD_SW_WIDTH     = 34
const DD_SW_STRENGTH  = 18
const DD_SW_DURATION  = 650

function ddBayerDither(gray: Uint8Array, w: number, h: number): Float32Array {
  const out: number[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const luma   = gray[y * w + x] / 255
      const bv     = (DD_BAYER_8X8[(y & 7) * 8 + (x & 7)] + 1) / 65
      if (luma > bv) out.push(x, y)
    }
  }
  return new Float32Array(out)
}

function ddBuild(positions: Float32Array, scale: number, dotScale: number, ox: number, oy: number): DDSystem {
  const count = positions.length / 2
  const baseX = new Float32Array(count)
  const baseY = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    baseX[i] = ox + positions[i * 2]     * scale
    baseY[i] = oy + positions[i * 2 + 1] * scale
  }
  return { count, baseX, baseY, dx: new Float32Array(count), dy: new Float32Array(count), lit: new Float32Array(count), dotSize: scale * dotScale }
}

function ddUpdate(sys: DDSystem, mx: number, my: number, active: boolean, sws: DDShockwave[], now: number): boolean {
  const { count, baseX, baseY, dx, dy, lit } = sys
  for (let k = sws.length - 1; k >= 0; k--) {
    if (now - sws[k].start >= DD_SW_DURATION) sws.splice(k, 1)
  }
  let motion = false
  for (let i = 0; i < count; i++) {
    let fx = 0, fy = 0
    if (active) {
      const vx = baseX[i] + dx[i] - mx
      const vy = baseY[i] + dy[i] - my
      const d2 = vx * vx + vy * vy
      if (d2 > 0.1 && d2 < DD_MOUSE_R_SQ) {
        const d = Math.sqrt(d2)
        const f = Math.pow(1 - d / DD_MOUSE_R, 3) * DD_MOUSE_FORCE
        fx += (vx / d) * f; fy += (vy / d) * f
      }
    }
    let peakLit = 0
    for (const sw of sws) {
      const elapsed = now - sw.start
      const radius  = (elapsed / 1000) * DD_SW_SPEED
      const life    = 1 - elapsed / DD_SW_DURATION
      const sx = baseX[i] - sw.x, sy = baseY[i] - sw.y
      const d  = Math.sqrt(sx * sx + sy * sy)
      if (d >= 0.1) {
        const band = Math.abs(d - radius)
        if (band < DD_SW_WIDTH) {
          const wf = (1 - band / DD_SW_WIDTH) * life * DD_SW_STRENGTH
          fx += (sx / d) * wf; fy += (sy / d) * wf
          const litVal = (1 - band / DD_SW_WIDTH) * life
          if (litVal > peakLit) peakLit = litVal
        }
      }
    }
    if (peakLit > lit[i]) lit[i] = peakLit
    else lit[i] *= 0.97
    dx[i] += (fx - dx[i]) * DD_EASING
    dy[i] += (fy - dy[i]) * DD_EASING
    if (Math.abs(dx[i]) < DD_SNAP) dx[i] = 0
    if (Math.abs(dy[i]) < DD_SNAP) dy[i] = 0
    if (dx[i] !== 0 || dy[i] !== 0) motion = true
  }
  const litDecaying = lit.some(v => v > 0.01)
  return motion || sws.length > 0 || active || litDecaying
}

function ddRender(ctx: CanvasRenderingContext2D, sys: DDSystem, color: string, dpr: number, sws?: DDShockwave[], mx?: number, my?: number, mouseActive?: boolean, linesOnly?: boolean) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const size = sys.dotSize * dpr
  const now  = performance.now()

  for (let i = 0; i < sys.count; i++) {
    const px = sys.baseX[i] + sys.dx[i]
    const py = sys.baseY[i] + sys.dy[i]

    let brightness = 1

    if (linesOnly) {
      let maxB = sys.lit[i]
      // mouse proximity glow
      if (mouseActive && mx !== undefined && my !== undefined) {
        const md = Math.sqrt((px - mx) ** 2 + (py - my) ** 2)
        const mouseB = Math.max(0, 1 - md / DD_MOUSE_R)
        if (mouseB > maxB) maxB = mouseB
      }
      brightness = 0.08 + maxB * 0.92
    }

    ctx.globalAlpha = brightness
    ctx.fillStyle   = color
    ctx.fillRect(px * dpr, py * dpr, size, size)
  }
  ctx.globalAlpha = 1
}

function DitherDivider({ text = "discovery", linesOnly = false }: { text?: string; linesOnly?: boolean }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const sysRef     = useRef<DDSystem | null>(null)
  const mouseRef   = useRef({ x: 0, y: 0, active: false })
  const swRef      = useRef<DDShockwave[]>([])
  const rafRef     = useRef(0)
  const runningRef = useRef(false)

  const startLoop = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, color: string, dpr: number, getColor?: () => string) => {
    if (runningRef.current) return
    runningRef.current = true
    const tick = () => {
      const sys = sysRef.current
      if (!sys) { runningRef.current = false; return }
      const needs = ddUpdate(sys, mouseRef.current.x, mouseRef.current.y, mouseRef.current.active, swRef.current, performance.now())
      const c = getColor ? getColor() : color
      ddRender(ctx, sys, c, dpr, swRef.current, mouseRef.current.x, mouseRef.current.y, mouseRef.current.active, linesOnly)
      if (needs) { rafRef.current = requestAnimationFrame(tick) }
      else        { runningRef.current = false }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [linesOnly])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const getPrimaryColor = () => {
      const cl = document.body.classList
      if (cl.contains("sunset")) return "rgba(20,10,0,1.0)"
      if (cl.contains("dark"))   return "rgba(255,255,255,0.95)"
      return "rgba(10,10,10,0.92)"
    }
    const getColor = () => getPrimaryColor()

    const build = () => {
      const color = getColor()
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      canvas.width  = W * dpr
      canvas.height = H * dpr

      // Render text + lines to the same offscreen canvas so all dots are interactive
      const DOT   = 2
      const gridW = Math.ceil(W / DOT)
      const gridH = Math.ceil(H / DOT)

      const off    = document.createElement("canvas")
      off.width    = gridW
      off.height   = gridH
      const offCtx = off.getContext("2d")!

      offCtx.fillStyle = "#000"
      offCtx.fillRect(0, 0, gridW, gridH)
      offCtx.fillStyle = "#fff"

      const cx = gridW / 2
      const cy = gridH / 2

      if (linesOnly) {
        // Full-width single line, no text
        offCtx.fillRect(0, Math.round(cy) - 1, gridW, 1)
      } else {
        // Measure text to know where the lines should stop
        const fs = Math.round(gridH * 0.24)
        offCtx.font          = `300 italic ${fs}px system-ui, sans-serif`
        offCtx.letterSpacing = `${Math.round(fs * 0.1)}px`
        const textW   = offCtx.measureText(text).width
        const textGap = Math.round(gridW * 0.03)

        // Left line
        offCtx.fillRect(0, Math.round(cy) - 1, Math.round(cx - textW / 2 - textGap), 1)
        // Right line
        offCtx.fillRect(Math.round(cx + textW / 2 + textGap), Math.round(cy) - 1, Math.round(gridW - (cx + textW / 2 + textGap)), 1)

        // Text on top
        offCtx.textAlign    = "center"
        offCtx.textBaseline = "middle"
        offCtx.fillText(text, cx, cy)
      }

      const px   = offCtx.getImageData(0, 0, gridW, gridH).data
      const gray = new Uint8Array(gridW * gridH)
      for (let i = 0; i < gray.length; i++) gray[i] = px[i * 4]

      const positions = ddBayerDither(gray, gridW, gridH)
      sysRef.current  = ddBuild(positions, DOT, 1, 0, 0)
      startLoop(canvas, ctx, color, dpr, getColor)
    }

    build()

    const ro = new ResizeObserver(build)
    ro.observe(canvas)

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top, active: true }
      startLoop(canvas, ctx, getColor(), dpr, getColor)
    }
    const onLeave = () => { mouseRef.current.active = false; startLoop(canvas, ctx, getColor(), dpr, getColor) }
    const onClick = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      swRef.current.push({ x: e.clientX - r.left, y: e.clientY - r.top, start: performance.now() })
      startLoop(canvas, ctx, getColor(), dpr, getColor)
    }

    const mo = new MutationObserver(build)
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] })

    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerleave", onLeave)
    canvas.addEventListener("pointerup", onClick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      runningRef.current = false
      ro.disconnect()
      mo.disconnect()
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerleave", onLeave)
      canvas.removeEventListener("pointerup", onClick)
    }
  }, [text, startLoop])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: linesOnly ? 40 : 120, margin: linesOnly ? "0" : "56px 0 0", cursor: "crosshair" }}
    />
  )
}

function SimpleDivider({ text }: { text?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      margin: "56px 0",
    }}>
      <div style={{ flex: 1, height: 1, background: "var(--border-mid)" }} />
      {text && (
        <span style={{
          fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 400,
          color: "var(--c-secondary)",
          whiteSpace: "nowrap",
        }}>
          {text}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: "var(--border-mid)" }} />
    </div>
  )
}

function HMWCallout({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={FADE}
      style={{
        borderLeft:  "2px solid var(--c-primary)",
        paddingLeft: 20,
        margin:      "28px 0",
      }}
    >
      <p style={{
        fontFamily:    "var(--font-sans)",
        fontSize:      "1.125rem",
        fontWeight:    400,
        fontStyle:     "italic",
        color:         "var(--c-primary)",
        letterSpacing: "-0.01em",
        lineHeight:    1.55,
        margin:        0,
      }}>
        {text}
      </p>
    </motion.div>
  )
}

function SectionBlock({ sec, id }: { sec: Section; id?: string }) {
  const topImages   = sec.image ? [sec.image] : (sec.images ?? [])
  const hasTopMedia = topImages.length > 0 || (sec.videos?.length ?? 0) > 0

  return (
    <>
      {sec.dividerBefore && <SimpleDivider text={sec.dividerText} />}
      {sec.lineBefore && <DitherDivider linesOnly />}
      <motion.div
        id={id}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ ...FADE, delay: 0 }}
        style={{ paddingTop: 56, paddingBottom: sec.dividerAfter ? 0 : 56 }}
      >
      <SectionLabel text={sec.label} />

      {sec.stat && <StatCallout stat={sec.stat} />}

      {sec.title && (
        <h2 style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "1.3rem",
          fontWeight:    500,
          color:         "var(--c-primary)",
          letterSpacing: "-0.03em",
          lineHeight:    1.2,
          margin:        `0 0 ${sec.body ? 16 : hasTopMedia || sec.bento || sec.accordion || sec.contents ? 32 : 0}px`,
        }}>
          {sec.href ? (
            <Link href={sec.href} onClick={() => playClick()}
              style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", gap: 10 }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.6"; (e.currentTarget.querySelector(".next-arrow") as HTMLElement).style.transform = "translateX(4px)" }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; (e.currentTarget.querySelector(".next-arrow") as HTMLElement).style.transform = "translateX(0px)" }}
            >
              {sec.title}
              <svg className="next-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ transition: "transform 0.2s ease", flexShrink: 0 }}>
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ) : sec.title}
        </h2>
      )}

      {sec.body && (
        <p className="rsp-cs-body" style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "1rem",
          fontWeight:    400,
          color:         "var(--c-body)",
          letterSpacing: "-0.01em",
          lineHeight:    1.75,
          margin:        `0 0 ${hasTopMedia || sec.cards || sec.bento ? 32 : 0}px`,
          whiteSpace:    "pre-line",
        }}>
          {sec.body}
        </p>
      )}

      {sec.hmw && <HMWCallout text={sec.hmw} />}

      {sec.bento && <Bento items={sec.bento} />}

      {sec.beforeAfter && (
        <div style={{ marginTop: 32 }}>
          <BeforeAfterSlider before={sec.beforeAfter[0]} after={sec.beforeAfter[1]} />
        </div>
      )}

      {sec.tabs && (
        <div style={{ marginTop: 32 }}>
          <TabView tabs={sec.tabs} />
        </div>
      )}

      {sec.chapterVideo && (
        <div style={{ marginTop: 32 }}>
          <ChapterVideo src={sec.chapterVideo.src} chapters={sec.chapterVideo.chapters} />
        </div>
      )}

      {!sec.beforeAfter && !sec.tabs && hasTopMedia && !sec.imageLabels && (
        sec.href && sec.image && !sec.images && !sec.videos?.length ? (
          <LinkedMediaBox src={sec.image} href={sec.href} />
        ) : (
          <MediaGrid
            srcs={topImages.length ? topImages : undefined}
            videos={sec.videos?.length ? sec.videos : undefined}
          />
        )
      )}
      {!sec.beforeAfter && !sec.tabs && hasTopMedia && sec.imageLabels && (
        <div className="rsp-stack" style={{ display: "grid", gridTemplateColumns: sec.stackImages ? "1fr" : `repeat(${topImages.length}, 1fr)`, gap: 16 }}>
          {topImages.map((src, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <MediaBox src={src} />
              {sec.imageLabels![i] && (
                <p style={{
                  fontFamily:    "var(--font-sans)",
                  fontSize:      "0.8125rem",
                  fontWeight:    400,
                  color:         "var(--c-secondary)",
                  letterSpacing: "-0.01em",
                  lineHeight:    1.5,
                  margin:        0,
                  textAlign:     "center",
                }}>
                  {sec.imageLabels![i]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {sec.cards && <Cards cards={sec.cards} />}

      {sec.contacts && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          {sec.contacts.map(c => (
            <a key={c.platform} href={c.href} target="_blank" rel="noopener noreferrer" onClick={() => playClick()} style={{
              fontFamily:      "var(--font-sans)",
              fontSize:        "0.8125rem",
              fontWeight:      500,
              color:           "var(--c-mid)",
              letterSpacing:   "-0.01em",
              textDecoration:  "none",
              padding:         "9px 20px",
              borderRadius:    99,
              border:          "1px solid var(--border-mid)",
              backgroundColor: "var(--hover-bg)",
            }}>
              {c.platform} ↗
            </a>
          ))}
        </div>
      )}

      {sec.contents && (
        sec.accordion
          ? <div style={{ marginTop: (hasTopMedia || sec.bento || sec.body) ? 32 : 0 }}>
              <AccordionContents contents={sec.contents} />
            </div>
          : (() => {
              const allHighlight   = sec.contents!.every(b => b.highlight)
              const multiHighlight = allHighlight && sec.contents!.length > 1
              const mt = (hasTopMedia || sec.bento || sec.body) ? 32 : 0
              if (multiHighlight) {
                return <MultiHighlight contents={sec.contents!} marginTop={mt} />
              }
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 40, marginTop: mt }}>
                  {sec.contents!.map((block, bi) => renderContentBlock(block, bi))}
                </div>
              )
            })()
      )}

      {sec.footnote && (
        <p style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "0.8125rem",
          fontWeight:    400,
          fontStyle:     "italic",
          color:         "var(--c-faint)",
          letterSpacing: "0.01em",
          lineHeight:    1.6,
          margin:        "20px 0 0",
        }}>
          {sec.footnote}
        </p>
      )}

      {sec.dividerAfter && <DitherDivider text={sec.dividerText} />}

      {sec.experience && (
        <div style={{ borderTop: "1px solid var(--divider)", marginTop: 8 }}>
          {sec.experience.map((exp, ei) => (
            <motion.div
              key={ei}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.4, delay: ei * 0.05 }}
              style={{
                display:             "grid",
                gridTemplateColumns: "160px 1fr 1fr",
                gap:                 24,
                padding:             "18px 0",
                borderBottom:        "1px solid var(--divider)",
              }}
            >
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 700, color: "var(--c-high)" }}>{exp.company}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 400, color: "var(--c-secondary)" }}>{exp.role}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 500, color: "var(--c-faint)", textAlign: "right" }}>{exp.period}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
    </>
  )
}

function SpecValue({ value }: { value: string | string[] }) {
  const items = Array.isArray(value) ? value : [value]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((v, i) => (
        <span key={i} style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "1rem",
          fontWeight:    400,
          color:         "var(--c-body)",
          letterSpacing: "-0.01em",
          lineHeight:    1.85,
        }}>
          {v}
        </span>
      ))}
    </div>
  )
}

export default function CaseStudyLayout({
  title, category, year: _year, role, team, overview, specs, cover,
  sections, lockedSections, password, passwordDesc,
  backHref = "/", banner, nextProject,
}: Props) {
  const [unlocked, setUnlocked] = useState(false)
  const [pwInput,  setPwInput]  = useState("")
  const [pwError,  setPwError]  = useState(false)
  const allSpecs: Spec[] = [
    { label: "Role", value: role },
    ...(team ? [{ label: "Team", value: team }] : []),
    ...specs,
  ]

  const tocItems = [
    ...(overview && (!password || !unlocked) ? [{ label: "Context", id: "sec-overview-block", hide: false }] : []),
    ...(!password || !unlocked ? sections.map((s, si) => ({ label: s.tocLabel ?? s.label, id: `sec-s${si}`, hide: s.hideToc })).filter(t => !t.hide) : []),
    ...(unlocked && lockedSections ? lockedSections.map((s, si) => ({ label: s.label, id: `sec-l${si}`, hide: s.hideToc })).filter(t => !t.hide) : []),
  ]

  const [activeId, setActiveId] = useState(tocItems[0]?.id ?? "")
  // TOC sidebar stays hidden on load and slides in once the reader has
  // actually started scrolling — keeps the hero's first impression clean.
  const [tocRevealed, setTocRevealed] = useState(false)

  const tocIds = tocItems.map(t => t.id).join(",")

  useEffect(() => {
    const ids = tocItems.map(t => t.id)
    const onScroll = () => {
      let best = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.4) best = id
      }
      setActiveId(best)
      setTocRevealed(window.scrollY > 120)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tocIds])

  const tryUnlock = () => {
    if (pwInput === password) {
      setUnlocked(true)
      setPwError(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    else setPwError(true)
  }

  const [lbItem, setLbItem] = useState<LightboxItem | null>(null)
  const openLightbox = useCallback((item: LightboxItem) => setLbItem(item), [])

  return (
    <LightboxContext.Provider value={openLightbox}>
    {lbItem && <Lightbox item={lbItem} onClose={() => setLbItem(null)} />}
    <>
    <MobileBackBar href={backHref} />
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        className="rsp-cs-grid"
        style={{
          width:               "100%",
          maxWidth:            1264 + 260,
          display:             "grid",
          gridTemplateColumns: "260px 1fr 260px",
          alignItems:          "start",
          padding:             "0 48px",
        }}
      >
        {/* TOC Sidebar — desktop only, hidden until the reader scrolls.
            No opacity here: each nav row owns its own fade so the reveal
            and the reverse-stagger exit both play out row by row. */}
        <div
          className="rsp-toc-sidebar"
          style={{
            position:      "sticky",
            top:           0,
            height:        "fit-content",
            display:       "flex",
            flexDirection: "row",
            alignItems:    "flex-start",
            gap:           16,
            paddingRight:  12,
            pointerEvents: tocRevealed ? "auto" : "none",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <TableOfContents backHref={backHref} items={tocItems} activeId={activeId} revealed={tocRevealed} />
          </div>
          <div style={{ paddingTop: 56, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <NoodleAnimation />
          </div>
        </div>

        {/* Main content */}
        <main className="rsp-cs-main" style={{ width: "100%", paddingTop: 56, paddingBottom: 40, minWidth: 0 }}>

          {/* Header */}
          <motion.div
            id="sec-overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={FADE}
            style={{
              marginBottom: 40,
            }}
          >
            {category && (
              <span style={{
                fontFamily:    "var(--font-sans)",
                fontSize:      "0.8125rem",
                fontWeight:    400,
                color:         "var(--c-secondary)",
                display:       "block",
                marginBottom:  6,
              }}>
                {category}
              </span>
            )}
            <h1 className="rsp-cs-h1" style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "1.625rem",
              fontWeight:    500,
              color:         "var(--c-primary)",
              letterSpacing: "-0.025em",
              lineHeight:    1.2,
              margin:        "0 0 24px",
            }}>
              {title}
            </h1>

            {cover && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...FADE, delay: 0.1 }}
                style={{
                  borderRadius:    8,
                  overflow:        "hidden",
                  marginBottom:    24,
                  border:          "1px solid var(--border)",
                  backgroundColor: "var(--surface)",
                }}
              >
                {cover.endsWith(".mp4") || cover.endsWith(".webm")
                  ? <VideoWithControls src={cover} videoStyle={{ objectFit: "contain" }} />
                  : <CaseStudyImage src={cover} alt={title} draggable={false} priority style={{ width: "100%", objectFit: "contain" }} />
                }
              </motion.div>
            )}

            <div className="rsp-specs" style={{
              display:             "grid",
              gridTemplateColumns: `repeat(${Math.min(allSpecs.length, 5)}, 1fr)`,
              gap:                 24,
              marginBottom:        32,
            }}>

              {allSpecs.map(s => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{
                    fontFamily: "var(--font-sans)",
                    fontSize:   "0.875rem",
                    fontWeight: 400,
                    color:      "var(--c-secondary)",
                  }}>
                    {s.label}
                  </span>
                  <SpecValue value={s.value} />
                </div>
              ))}
            </div>

          </motion.div>

          {banner && <div style={{ marginBottom: 24 }}>{banner}</div>}

          {/* Overview as a section block */}
          {overview && (!password || !unlocked) && (
            <SectionBlock sec={{ label: "Context", body: overview }} id="sec-overview-block" />
          )}

          {/* Sections — hidden once NDA content is unlocked */}
          {(!password || !unlocked) && sections.map((sec, si) => (
            <SectionBlock key={si} sec={sec} id={`sec-s${si}`} />
          ))}

          {/* Password gate */}
          {password && !unlocked && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={FADE}
              style={{ paddingTop: 56, paddingBottom: 56 }}
            >
              <SectionLabel text="NDA — Protected Content" />
              {passwordDesc && (
                <p style={{
                  fontFamily:    "var(--font-sans)",
                  fontSize:      "1rem",
                  fontWeight:    400,
                  color:         "var(--c-body)",
                  lineHeight:    1.85,
                  margin:        "0 0 32px",
                  letterSpacing: "-0.01em",
                }}>
                  {passwordDesc}
                </p>
              )}
              <div style={{
                display: "flex", gap: 0, alignItems: "stretch", maxWidth: 380,
                border: `1px solid ${pwError ? "rgb(220,60,50)" : "var(--border)"}`,
                borderRadius: 10, overflow: "hidden",
                backgroundColor: "var(--surface)",
                transition: "border-color 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}>
                <input
                  type="password"
                  value={pwInput}
                  onChange={e => { setPwInput(e.target.value); setPwError(false) }}
                  onKeyDown={e => { if (e.key === "Enter") tryUnlock() }}
                  placeholder="Enter password"
                  style={{
                    flex:            1,
                    padding:         "13px 16px",
                    border:          "none",
                    backgroundColor: "transparent",
                    fontFamily:      "var(--font-sans)",
                    fontSize:        "0.875rem",
                    color:           "var(--c-primary)",
                    outline:         "none",
                    minWidth:        0,
                  }}
                />
                <button
                  onClick={() => { playClick(); tryUnlock() }}
                  style={{
                    padding:         "13px 20px",
                    cursor:          "pointer",
                    border:          "none",
                    borderLeft:      "1px solid var(--border)",
                    backgroundColor: "transparent",
                    fontFamily:      "var(--font-sans)",
                    fontSize:        "0.8125rem",
                    fontWeight:      500,
                    letterSpacing:   "-0.01em",
                    color:           "var(--c-primary)",
                    flexShrink:      0,
                    transition:      "background 0.15s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--hover-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  Unlock
                </button>
              </div>
              {pwError && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "rgb(220,60,50)", margin: "8px 0 0" }}>
                  Incorrect password
                </p>
              )}

            </motion.div>
          )}

          {/* Locked sections */}
          {password && unlocked && lockedSections?.map((sec, si) => (
            <SectionBlock key={`locked-${si}`} sec={sec} id={`sec-l${si}`} />
          ))}

        </main>
      </div>
    </div>
    {nextProject && (
      <div style={{ borderTop: "1px solid var(--divider)", padding: "48px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1200, padding: "0 48px" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--c-primary)" }}>
            {nextProject.label}
          </span>
          <Link
            href={nextProject.href}
            onClick={() => playClick()}
            style={{ display: "block", textDecoration: "none", marginTop: 12 }}
          >
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "clamp(22px, 3vw, 36px)",
              fontWeight: 500, color: "var(--c-primary)", letterSpacing: "-0.03em",
              lineHeight: 1.2, margin: 0,
              transition: "opacity 0.15s ease",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.6")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              {nextProject.title} →
            </p>
          </Link>
        </div>
      </div>
    )}
    <div style={{ overflow: "hidden" }}><MarqueeFooter /></div>
    </>
    </LightboxContext.Provider>
  )
}
