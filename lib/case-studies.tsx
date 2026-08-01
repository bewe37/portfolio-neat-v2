"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { COLOR, TYPE } from "@/lib/v2-tokens"
import { playV2Click } from "@/lib/v2-sound"
import { useLazyVideo } from "@/lib/use-lazy-video"

export interface CaseStudyContent {
  Body: () => React.ReactElement
}

// Clean, quiet rendition: no boxed media chrome, no medium/semibold text
// weights, small restrained type scale throughout — everything sits at
// regular (400) weight, letting whitespace and hierarchy of size do the work.

const mediaFrame: React.CSSProperties = {
  borderRadius: 8,
  overflow: "hidden",
}

function Img({ src, alt = "" }: { src: string; alt?: string }) {
  return (
    <div style={mediaFrame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={encodeURI(src)} alt={alt} style={{ width: "100%", display: "block" }} />
    </div>
  )
}

const videoBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: "50%",
  backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
  border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#fff", padding: 0,
}

function Video({ src, zoom, alt = "", priority = false }: { src: string; zoom?: number; alt?: string; priority?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)
  const [playing, setPlaying] = useState(true)
  // Only videos near the viewport actually play; the rest stay paused
  // until scrolled to. `priority` skips this entirely for a video that's
  // visible the instant its container mounts (the case-study header's
  // cover, right at the top of a freshly-opened sheet) — waiting for an
  // IntersectionObserver callback plus a metadata-only preload to resolve
  // before real video data even starts fetching made that first video
  // visibly slow to appear. A priority video fetches real data immediately
  // and autoplays as soon as it can, same as a normal <video autoPlay>.
  useLazyVideo(videoRef, undefined, !priority)

  function togglePlay(e: React.MouseEvent) {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}) } else { v.pause() }
  }

  function replay(e: React.MouseEvent) {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play().catch(() => {})
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Matches the sheet's own background. A <video> with no decoded
      // frame yet paints as browser-default black, not transparent — a
      // priority video's first-ever load (no cache yet) has a real gap
      // between mount and first decoded frame, which without this shows as
      // a black flash against the sheet. Cached reopens skip the gap
      // entirely, which is why it was only ever visible the first time.
      style={{ ...mediaFrame, lineHeight: 0, position: "relative", backgroundColor: COLOR.bg }}
    >
      <video
        ref={videoRef}
        src={encodeURI(src)}
        aria-label={alt || undefined}
        autoPlay={priority}
        loop
        muted
        playsInline
        preload={priority ? "auto" : "metadata"}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        style={{
          width: "100%",
          display: "block",
          backgroundColor: COLOR.bg,
          transform: zoom ? `scale(${1 + zoom / 100})` : undefined,
          transformOrigin: "center bottom",
        }}
      />
      <div style={{
        position: "absolute", top: 8, right: 8, display: "flex", gap: 6,
        opacity: hovered ? 1 : 0, transition: "opacity 0.15s ease",
        pointerEvents: hovered ? "auto" : "none",
      }}>
        <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} style={videoBtnStyle}>
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
        <button onClick={replay} aria-label="Replay" style={videoBtnStyle}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M11.5 7A4.5 4.5 0 1 1 9.7 3.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M9.2 1.6l.6 2.1-2.1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function Media({ src, zoom, alt, priority }: { src: string; zoom?: number; alt?: string; priority?: boolean }) {
  return src.endsWith(".mp4") ? <Video src={src} zoom={zoom} alt={alt} priority={priority} /> : <Img src={src} alt={alt} />
}

function MediaGrid({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((src) => <Media key={src} src={src} />)}
    </div>
  )
}

function LabeledMediaGrid({ items, labels, stack }: { items: string[]; labels?: string[]; stack?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: stack ? "1fr" : `repeat(${items.length}, 1fr)`, gap: 16 }}>
      {items.map((src, i) => (
        <div key={src} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Media src={src} alt={labels?.[i]} />
          {labels?.[i] && (
            <p style={{ fontFamily: TYPE.fontFamily, fontSize: 13, fontWeight: 400, color: COLOR.textTertiary, letterSpacing: "-0.02em", lineHeight: 1.5, margin: 0, textAlign: "center" }}>
              {labels[i]}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ fontFamily: TYPE.fontFamily, fontSize: 14, fontWeight: 400, color: COLOR.textTertiary, letterSpacing: "-0.02em" }}>{text}</span>
    </div>
  )
}

function SectionTitle({ children, marginBottom }: { children: React.ReactNode; marginBottom: number }) {
  return (
    <h2 style={{ fontFamily: TYPE.fontFamily, fontSize: 17, fontWeight: 500, color: COLOR.textPrimary, letterSpacing: "-0.02em", lineHeight: 1.35, margin: `0 0 ${marginBottom}px`, textWrap: "balance" }}>
      {children}
    </h2>
  )
}

function SectionBody({ children, marginBottom = 0 }: { children: React.ReactNode; marginBottom?: number }) {
  return (
    <p style={{ fontFamily: TYPE.fontFamily, fontSize: 15, fontWeight: 400, color: COLOR.textSecondary, letterSpacing: "-0.01em", lineHeight: 1.7, margin: `0 0 ${marginBottom}px`, whiteSpace: "pre-line", textWrap: "pretty" }}>
      {children}
    </p>
  )
}

function HmwCallout({ text }: { text: string }) {
  return (
    <div style={{ borderLeft: `2px solid ${COLOR.accentOutline}`, paddingLeft: 20, margin: "28px 0" }}>
      <p style={{ fontFamily: TYPE.fontFamily, fontSize: 18, fontWeight: 400, fontStyle: "italic", color: COLOR.textPrimary, letterSpacing: "-0.01em", lineHeight: 1.55, margin: 0 }}>
        {text}
      </p>
    </div>
  )
}

function Divider({ text }: { text?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "48px 0" }}>
      <div style={{ flex: 1, height: 1, background: COLOR.border }} />
      {text && <span style={{ fontFamily: TYPE.fontFamily, fontSize: 13, fontWeight: 400, color: COLOR.textTertiary, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{text}</span>}
      <div style={{ flex: 1, height: 1, background: COLOR.border }} />
    </div>
  )
}

// "Accordion" content rows — stacked vertically: media on top, title and
// body below. `media` accepts a single src or an array (e.g. a token
// definition table paired with a real component annotated against those
// same tokens) — rendered as a stack of full-width images either way.
function AccordionRow({ title, body, media }: { title?: string; body?: string; media?: string | string[] }) {
  const mediaItems = media ? (Array.isArray(media) ? media : [media]) : []
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {title && <p style={{ fontFamily: TYPE.fontFamily, fontSize: 17, fontWeight: 500, color: COLOR.textPrimary, letterSpacing: "-0.02em", lineHeight: 1.35, margin: 0 }}>{title}</p>}
        {body && <p style={{ fontFamily: TYPE.fontFamily, fontSize: 15, fontWeight: 400, color: COLOR.textSecondary, lineHeight: 1.7, letterSpacing: "-0.01em", margin: 0 }}>{body}</p>}
      </div>
      {mediaItems.length > 0 && <MediaGrid items={mediaItems} />}
    </div>
  )
}

function Accordion({ items }: { items: { title: string; body: string; media?: string | string[] }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {items.map((item) => (
        <AccordionRow key={item.title} {...item} />
      ))}
    </div>
  )
}

// "Highlight + minimal" card — icon/title/body, no image. Used for pillar
// rows (Design Direction, Outcome).
const ICONS: Record<string, React.ReactElement> = {
  stack: (
    <>
      <rect x="2" y="11" width="14" height="4" rx="1" stroke={COLOR.textPrimary} strokeWidth={1.5} />
      <rect x="4" y="6.5" width="10" height="3.5" rx="1" stroke={COLOR.textPrimary} strokeWidth={1.5} />
      <rect x="6" y="3" width="6" height="3" rx="1" stroke={COLOR.textPrimary} strokeWidth={1.5} />
    </>
  ),
  compass: (
    <>
      <circle cx="9" cy="9" r="7.5" stroke={COLOR.textPrimary} strokeWidth={1.5} />
      <path d="M11.5 6.5L10 10L6.5 11.5L8 8L11.5 6.5Z" stroke={COLOR.textPrimary} strokeWidth={1.5} strokeLinejoin="round" />
    </>
  ),
  layers: (
    <>
      <rect x="2" y="6" width="14" height="9" rx="1.5" stroke={COLOR.textPrimary} strokeWidth={1.5} />
      <path d="M5 6V4.5A1.5 1.5 0 0 1 6.5 3h5A1.5 1.5 0 0 1 13 4.5V6" stroke={COLOR.textPrimary} strokeWidth={1.5} />
    </>
  ),
  zap: (
    <path d="M10.5 2L4 10h5.5L7.5 16L14 8H8.5L10.5 2Z" stroke={COLOR.textPrimary} strokeWidth={1.5} strokeLinejoin="round" />
  ),
  expand: (
    <path d="M11 2h5v5M7 16H2v-5M16 7l-5 5M2 11l5-5" stroke={COLOR.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  ),
}

function HighlightCard({ icon, title, body, image }: { icon?: string; title: string; body?: string; image?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && ICONS[icon] && (
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>{ICONS[icon]}</svg>
          )}
          <p style={{ fontFamily: TYPE.fontFamily, fontSize: 14, fontWeight: 400, color: COLOR.textPrimary, letterSpacing: "-0.01em", lineHeight: 1.4, margin: 0 }}>{title}</p>
        </div>
        {body && <p style={{ fontFamily: TYPE.fontFamily, fontSize: 14, fontWeight: 400, color: COLOR.textSecondary, letterSpacing: "-0.01em", lineHeight: 1.65, margin: 0 }}>{body}</p>}
      </div>
      {image && <Img src={image} alt={title} />}
    </div>
  )
}

function HighlightRow({ items, marginTop }: { items: { icon?: string; title: string; body?: string; image?: string }[]; marginTop: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 16, alignItems: "stretch", gridAutoRows: "1fr", marginTop }}>
      {items.map((item) => <HighlightCard key={item.title} {...item} />)}
    </div>
  )
}

// Scrubber highlight — deliberately orange rather than /v2's purple
// accentOutline, to read as a distinct "playhead" cue against the brand color.
const SCRUBBER_ACCENT = "#E8792E"

function ChapterVideo({ src, chapters }: { src: string; chapters: { time: number; label: string }[] }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(0)
  const [time, setTime]         = useState(0)
  const [playing, setPlaying]   = useState(true)
  const [dragging, setDragging] = useState(false)
  useLazyVideo(videoRef)

  // timeupdate only fires ~4x/sec, which makes the progress bar visibly
  // step. Drive it off rAF instead, reading the video element's own paused
  // state each frame rather than trusting React's `playing` state — that
  // state can lag a beat behind the lazy-video IntersectionObserver's
  // play()/pause() calls, which was leaving the bar stuck.
  useEffect(() => {
    if (dragging) return
    let raf = 0
    const tick = () => {
      const v = videoRef.current
      if (v && !v.paused) setTime(v.currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [dragging])

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

  // Map a clientX onto the equal-width segments: which segment the pointer
  // is in decides the chapter, the position inside it decides the time within.
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ ...mediaFrame, position: "relative" }}>
        <video
          ref={videoRef}
          src={encodeURI(src)}
          muted
          loop
          playsInline
          // "metadata" only fetches the header, not frame data — fine for a
          // video that only ever plays forward from 0, but this one is
          // scrubbable to an arbitrary chapter. Seeking into a position
          // that was never buffered forces a fresh range request, and
          // .play() called right after can sit there waiting on data with
          // nothing visibly advancing — dragging to a spot and having it
          // "just stop" was exactly that stall, not a state bug. "auto"
          // buffers the whole clip up front so any scrub target is already
          // available.
          preload="auto"
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
            width: 48, height: 48, borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="white">
              <path d="M5.5 3.3v13.4a.8.8 0 0 0 1.2.7l10.6-6.7a.8.8 0 0 0 0-1.4L6.7 2.6a.8.8 0 0 0-1.2.7Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Equal-width chapter segments, stories-style per-segment fill —
          desktop only, same as the live case study pages: five draggable
          segments don't work as a mobile pattern, so the video just
          autoplays/loops there. */}
      <div
        className="rsp-hide-mobile"
        ref={trackRef}
        onPointerDown={e => {
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          playV2Click()
          setDragging(true)
          seekToClientX(e.clientX)
        }}
        onPointerMove={e => { if (dragging) seekToClientX(e.clientX) }}
        onPointerUp={() => {
          setDragging(false)
          // Resume exactly once, after the scrub settles — not from inside
          // seek() on every pointermove. Calling .play() mid-drag while
          // currentTime is also being reassigned dozens of times a second
          // made the browser restart its decode pipeline on every frame,
          // which is what showed up as the scrubber stuttering/flickering
          // during a drag instead of tracking the pointer smoothly.
          videoRef.current?.play().catch(() => {})
        }}
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
                flex: 1, minWidth: 0, height: 32, position: "relative",
                borderRadius: 6, overflow: "hidden",
                backgroundColor: COLOR.surface,
                border: `1px solid ${COLOR.border}`,
                display: "flex", alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: `${fill}%`,
                backgroundColor: SCRUBBER_ACCENT,
                opacity: isActive ? 0.3 : 0.12,
                transition: dragging ? "none" : "width 0.08s linear",
              }} />
              {/* Bright leading edge so the playhead position is unmistakable */}
              {isActive && fill > 0 && fill < 100 && (
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: `${fill}%`,
                  width: 2, backgroundColor: SCRUBBER_ACCENT, opacity: 0.9,
                  transform: "translateX(-100%)",
                  transition: dragging ? "none" : "left 0.08s linear",
                }} />
              )}
              <span
                style={{
                  position: "relative", padding: "0 10px",
                  fontFamily: TYPE.fontFamily, fontSize: 12,
                  fontWeight: isActive ? 500 : 400, letterSpacing: "-0.02em",
                  color: isActive ? COLOR.textPrimary : fill > 0 ? COLOR.textSecondary : COLOR.textFaint,
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

function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: TYPE.fontFamily, fontSize: 13, fontWeight: 400, color: COLOR.textFaint, letterSpacing: "-0.02em", lineHeight: 1.6, margin: "16px 0 0" }}>
      {children}
    </p>
  )
}

// One case-study "section" — label, optional title/body, optional media/
// accordion/highlight row/chapter video/footnote — matching SectionBlock's
// composition order and 56px vertical rhythm.
function Section({
  id,
  label,
  title,
  body,
  media,
  mediaLabels,
  stackMedia,
  accordion,
  highlights,
  hmw,
  chapterVideo,
  footnote,
  dividerBefore,
  dividerText,
  trailingMedia,
  trailingMediaLabels,
  trailingMediaSideBySide,
}: {
  id?: string
  label: string
  title?: string
  body?: string
  media?: string[]
  mediaLabels?: string[]
  stackMedia?: boolean
  accordion?: { title: string; body: string; media?: string | string[] }[]
  highlights?: { icon?: string; title: string; body?: string; image?: string }[]
  hmw?: string
  chapterVideo?: { src: string; chapters: { time: number; label: string }[] }
  footnote?: string
  dividerBefore?: boolean
  dividerText?: string
  // A second media block that follows the accordion/highlights content,
  // for sections whose live-page source has more than one media beat
  // (e.g. Contextual Chat's two response screenshots after its lead item).
  trailingMedia?: string[]
  trailingMediaLabels?: string[]
  // Render trailingMedia as a row instead of stacked.
  trailingMediaSideBySide?: boolean
}) {
  const hasMedia = !!media?.length
  const hasTrailingMedia = !!trailingMedia?.length
  const hasBelow = hasMedia || !!accordion || !!highlights || !!chapterVideo
  return (
    <>
      {dividerBefore && <Divider text={dividerText} />}
      <div id={id} style={{ paddingTop: 44, paddingBottom: 44 }}>
        <SectionLabel text={label} />
        {title && <SectionTitle marginBottom={body ? 14 : hasBelow ? 24 : 0}>{title}</SectionTitle>}
        {body && <SectionBody marginBottom={hasMedia || highlights ? 24 : 0}>{body}</SectionBody>}
        {hmw && <HmwCallout text={hmw} />}
        {chapterVideo && <div style={{ marginTop: 24 }}><ChapterVideo {...chapterVideo} /></div>}
        {hasMedia && !mediaLabels && <MediaGrid items={media!} />}
        {hasMedia && mediaLabels && <LabeledMediaGrid items={media!} labels={mediaLabels} stack={stackMedia} />}
        {accordion && <div style={{ marginTop: body || hasMedia ? 24 : 0 }}><Accordion items={accordion} /></div>}
        {highlights && <HighlightRow items={highlights} marginTop={body || hasMedia ? 24 : 0} />}
        {hasTrailingMedia && (
          <div style={{ marginTop: 24 }}>
            {trailingMediaSideBySide || trailingMediaLabels
              ? <LabeledMediaGrid items={trailingMedia!} labels={trailingMediaLabels} />
              : <MediaGrid items={trailingMedia!} />}
          </div>
        )}
        {footnote && <Footnote>{footnote}</Footnote>}
      </div>
    </>
  )
}

function Header({ title, cover, specs, intro }: { title: string; cover: string; specs: { label: string; value: string }[]; intro?: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 24 }}>
        {/* The cover is the first thing visible the instant a case-study
            sheet opens — it can't wait on the usual lazy-load gate. */}
        <Media src={cover} zoom={2} alt={title} priority />
      </div>
      <h1 style={{ fontFamily: TYPE.fontFamily, fontSize: 20, fontWeight: 500, color: COLOR.textPrimary, letterSpacing: "-0.02em", lineHeight: 1.3, margin: "0 0 12px", textWrap: "balance" }}>
        {title}
      </h1>
      {intro && <SectionBody marginBottom={20}>{intro}</SectionBody>}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px 40px" }}>
        {specs.map((s) => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: TYPE.fontFamily, fontSize: 13, fontWeight: 400, color: COLOR.textTertiary, letterSpacing: "-0.02em" }}>
              {s.label}
            </span>
            <span style={{ fontFamily: TYPE.fontFamily, fontSize: 15, fontWeight: 400, color: COLOR.textSecondary, letterSpacing: "-0.01em" }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface TocItem {
  id: string
  label: string
}

// Sticky sidebar TOC with scroll-spy: highlights whichever section is
// nearest the top of the viewport as the reader scrolls, using
// IntersectionObserver rather than a window/container scroll listener so
// it works regardless of which ancestor actually owns the scrollbar (the
// sheet's own scroll container, or the page itself when used standalone).
const ROW_HEIGHT = 32
const DOT_LEFT = 140
const DOT_ARC_RADIUS = 16
const DOT_ARC_DURATION = 0.4
const ARC_STEPS = 12

// Precomputed semicircle offsets (bulging right, out and back) sampled at a
// fixed step count — the same shape every time, independent of how far the
// dot travels vertically, since only `top` is interpolated by distance and
// `x` always traces this identical half-circle.
const ARC_KEYFRAMES = Array.from({ length: ARC_STEPS + 1 }, (_, i) => {
  const t = i / ARC_STEPS
  return Math.sin(t * Math.PI) * DOT_ARC_RADIUS
})
const ARC_TIMES = ARC_KEYFRAMES.map((_, i) => i / ARC_STEPS)

function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "")

  useEffect(() => {
    const els = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id).join(",")])

  const activeIndex = Math.max(0, items.findIndex((i) => i.id === activeId))
  const activeTop = activeIndex * ROW_HEIGHT + ROW_HEIGHT / 2 - 3

  return (
    <div style={{ position: "relative" }}>
      <motion.span
        initial={false}
        animate={{ top: activeTop, x: ARC_KEYFRAMES }}
        // Both axes share the same linear timing on purpose: x's keyframes
        // are pre-sampled from a sine curve at evenly-spaced `times`, so the
        // curve shape already lives in the keyframe values themselves —
        // top previously eased in/out while x advanced linearly through
        // those points, so the two axes reached the same fraction of the
        // trip at different moments and the dot's actual path warped away
        // from the intended semicircle mid-transition instead of tracing it.
        transition={{
          top: { duration: DOT_ARC_DURATION, ease: "linear" },
          x: { duration: DOT_ARC_DURATION, ease: "linear", times: ARC_TIMES },
        }}
        style={{
          position: "absolute",
          left: DOT_LEFT,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: COLOR.textPrimary,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                playV2Click()
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              style={{
                display: "flex",
                alignItems: "center",
                height: ROW_HEIGHT,
                fontFamily: TYPE.fontFamily,
                fontSize: 14,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                color: active ? COLOR.textPrimary : COLOR.textTertiary,
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              {item.label}
            </a>
          )
        })}
      </div>
    </div>
  )
}

// Static — no interpolated values — so it's built once here rather than as
// an inline template literal inside Page, which would otherwise reconstruct
// this string on every render of every case-study section using Page.
const PAGE_RESPONSIVE_STYLES = `
  @media (max-width: 700px) {
    .cs-page { padding: 24px 20px 64px !important; }
    .cs-page-toc { grid-template-columns: 1fr !important; gap: 0 !important; }
    .cs-toc-rail { display: none !important; }
  }
`

function Page({ children, tocItems }: { children: React.ReactNode; tocItems?: TocItem[] }) {
  if (!tocItems) {
    return (
      <div className="cs-page" style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: "40px 48px 48px", boxSizing: "border-box" }}>
        {children}
      </div>
    )
  }
  return (
    <div
      className="cs-page cs-page-toc"
      style={{
        width: "100%",
        margin: "0 auto",
        padding: "40px 48px 48px",
        boxSizing: "border-box",
        display: "grid",
        // Mirrored 180px rail on the right (empty) balances the TOC on the
        // left, so the center track — where content lives — is truly
        // centered in the full width, not just centered in what's left
        // over after the TOC.
        gridTemplateColumns: "180px minmax(0, 900px) 180px",
        justifyContent: "center",
        gap: 40,
        alignItems: "start",
      }}
    >
      <div className="cs-toc-rail" style={{ position: "sticky", top: 40 }}>
        <TableOfContents items={tocItems} />
      </div>
      <div style={{ minWidth: 0 }}>{children}</div>
      <div aria-hidden className="cs-toc-rail" />

      <style>{PAGE_RESPONSIVE_STYLES}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// AMD AI Overlay — /amd_ai_project
// ─────────────────────────────────────────────────────────────────────────
const AMD_AI_TOC: TocItem[] = [
  { id: "toc-context", label: "Context" },
  { id: "toc-the-problem", label: "The Problem" },
  { id: "toc-highlights", label: "Highlights" },
  { id: "toc-research", label: "Research" },
  { id: "toc-design-direction", label: "Design Direction" },
  { id: "toc-outcome", label: "Outcome" },
]

function AmdAiOverlayBody() {
  return (
    <Page tocItems={AMD_AI_TOC}>
      <Header
        title="Rethinking the Overlay as a Control Surface"
        cover="/AMDThumbnailNew.mp4"
        specs={[
          { label: "Role", value: "Product Design Intern" },
          { label: "Scope", value: "Feature Design (AI Integration)" },
          { label: "Duration", value: "May – December 2025" },
        ]}
        intro="In the summer of 2025, I joined AMD as a Product Design Intern on one of the largest redesigns AMD Software Adrenalin Edition had seen in years. Adrenalin is AMD's all-in-one hub for tuning, monitoring, and recording on Radeon graphics, used by millions of gamers to squeeze the most out of their hardware. Of everything on the table, I chose to focus on the Overlay View."
      />

      <Section
        id="toc-context"
        label="Context"
        title="A lightweight panel for quick, in-session control"
        body="The Overlay View is a lightweight panel that floats above any game or app, summoned with a single hotkey mid-session. Rather than alt-tabbing out to the Full Application, it's meant to be the fast path: check on your hardware, tweak a setting, or capture a clip without ever losing sight of what you're doing."
        media={["/FullOverlayView.png"]}
        footnote="This case study covers the In-Session Overlay. The Full Application was developed in parallel by a separate workstream."
      />

      <Section
        id="toc-the-problem"
        label="The Problem"
        title="A passive display in a product that needed action"
        body="The latest software update had stripped the Overlay View down to a metrics dashboard. It could show your GPU temperature or frame rate, but it couldn't act on any of it. To change a setting, users had to leave their session entirely and open the full application."
        media={["/MetricsIssue.png"]}
        mediaLabels={["Current version, metrics only"]}
      />

      <Section
        id="toc-highlights"
        label="Highlights"
        title="An overlay you can finally act on"
        body="I redesigned the overlay from a passive metrics display into a surface users could actually control, with an AI chat that reads live hardware data, a pinnable widget panel, and a dedicated in-session mode built for the pace of the moment."
        media={["/AMDThumbnailTop.png"]}
        trailingMedia={["/ChatDemoTop.mp4", "/InGameDemoTop.mp4"]}
        trailingMediaLabels={["AI chat", "In-session mode"]}
        trailingMediaSideBySide
      />

      <Section
        label="Usability Sessions"
        dividerBefore
        dividerText="Research"
        title="Settings only experts could parse"
        body="The overlay alone didn't tell the full story. To understand the depth of the problems the team was dealing with, I ran moderated usability sessions with 6 users, not just to evaluate the overlay, but to map out where the entire software experience was breaking down. As more features moved into the full application, settings became more numerous and granular. Users consistently struggled to know what each option did or how it would affect their system without prior technical knowledge."
        media={["/TechnicalTerms.png"]}
      />

      <Section
        id="toc-research"
        label="Research"
        title="What this pointed to"
        body="Across almost every session, the same thing kept surfacing: even when users found the right setting, they didn't have the knowledge to act on it. That became the focus."
        hmw="How might we help users understand a setting well enough to act on it, without needing prior technical knowledge?"
      />

      <Section
        id="toc-design-direction"
        label="Design Direction"
        title="Direct control first, AI second"
        body="This overlay opens mid-activity, when attention is already split. There's no room to parse an unfamiliar setting, so the interaction has to ask almost nothing: see the control, understand it, tap it, get back to what you were doing. Direct, one-tap controls became the foundation, with AI in reserve for when someone doesn't know what to change. From there, I proposed three components to the team."
        highlights={[
          { title: "Contextual Chat", image: "/CardChat.png" },
          { title: "Pinned Widgets", image: "/CardPin.png" },
          { title: "Manual Discovery", image: "/CardManual.png" },
        ]}
      />

      <Section
        label="Contextual Chat"
        title="Not just text. A response built around what you need"
        body="I built the chat around one principle: don't make users think. Describe what's wrong, and the AI reads live hardware data to find the cause, then surfaces the relevant metrics in the chat or gives you a one-tap action to fix it on the spot. No navigation, no settings hunting."
        media={["/Metrics.png", "/Features.png"]}
        mediaLabels={["Hardware metrics response", "Feature suggestion with action"]}
      />

      <Section
        label="Pinning"
        title="Save the answer, not just the moment"
        body="I made every AI response pinnable as a widget. Instead of asking the same question next session, the control is already waiting. The chat stays focused on one-off queries while the panel builds up over time into something personal."
        media={["/ChatPinVid.mp4"]}
      />

      <Section
        label="Manual Discovery"
        title="Understand a setting by browsing it, not asking about it"
        body="Not everyone wants to describe their problem to get an answer. I designed a browse path where every widget in the library is labeled and organized by category, so users can read what a setting does, compare it against others, and add it straight to their panel, without needing the AI to explain it first."
        media={["/ManuallyPin.mp4"]}
      />

      <Section
        label="Notifications"
        title="A home for everything the system wants to tell you"
        body="I added a dedicated notification page where system messages, driver updates, and performance warnings collect in one place, each one actionable on the spot, without digging through settings."
        media={["/DedicatedNotif.mp4"]}
      />

      <Section
        label="In-Session Mode"
        title="Designed for the pace of the moment"
        body="In-session moments move fast. Mid-activity, you need the most common controls immediately, not buried in a panel. I designed a dedicated in-session mode with its own modal, purpose-built for this context. One click surfaces the controls and features users reach for most, without breaking focus."
        media={["/In-Game Widgets.png"]}
        accordion={[
          { title: "Tune performance without touching settings.", body: "Every system is different, and figuring out which settings actually help takes time most people don't want to spend mid-activity. I designed a simplified slider that lets users tune between performance and quality on the fly, without touching a single advanced setting.", media: "/GraphicOptimization.mp4" },
          { title: "Start recording without leaving the moment.", body: "Screen recording is one of AMD Software's most-used features, but getting to it meant leaving the session entirely. I brought it directly into the in-session mode so users can start capturing with a single tap, right from the overlay.", media: "/RecordInGame.mp4" },
        ]}
      />

      <Section
        label="Final Design"
        title="Where it all came together"
        body="Two modes, one overlay. Direct controls, pinned widgets, and AMD Chat live together in a single panel, everything one tap away, without leaving the session."
        chapterVideo={{
          src: "/FinalVid.mp4",
          chapters: [
            { time: 0, label: "Graphic Optimization" },
            { time: 5, label: "Screen Recording" },
            { time: 13, label: "Chat Interaction" },
            { time: 22, label: "Pinning" },
            { time: 25, label: "Manually Add Widget" },
          ],
        }}
      />

      <Section
        id="toc-outcome"
        label="Outcome"
        title="From exploration to direction"
        body="The designs earned support to move forward. But the bigger shift wasn't in the product. It was in how the team thought about AI. The process kept coming back to the same point: AI only works when the basics work first. By the end, that framing had stuck."
        highlights={[
          { icon: "stack", title: "AI as a layer, not the foundation.", body: "The process made one thing clear: direct control has to come first. AI works best when it sits on top of that, not as a replacement for it." },
          { icon: "compass", title: "Navigation became the primary factor.", body: "That thinking carried into the Full View, shifting the question from surfacing everything through AI to helping users always know where they are." },
        ]}
      />

      <Section
        label="Oh, and there's more"
        title="The Design System That Kept AMD's Team Aligned"
        body="Another big part of this internship was building the design system from the ground up, the foundation that made the entire redesign possible."
        media={["/DSHighlight.png"]}
      />
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// AMD Design System — /amd_project
// ─────────────────────────────────────────────────────────────────────────
const AMD_DS_TOC: TocItem[] = [
  { id: "toc-ds-audit", label: "Audit" },
  { id: "toc-ds-goals", label: "Goals" },
  { id: "toc-ds-foundation", label: "Design Foundation" },
  { id: "toc-ds-components", label: "Component Library" },
  { id: "toc-ds-documentation", label: "Documentation" },
  { id: "toc-ds-outcome", label: "Outcome" },
]

function AmdDesignSystemBody() {
  return (
    <Page tocItems={AMD_DS_TOC}>
      <Header
        title="The Design System That Kept AMD's Team Aligned"
        cover="/AMDCaseStudy.png"
        specs={[
          { label: "Role", value: "Design System Designer" },
          { label: "Scope", value: "Design System" },
          { label: "Duration", value: "May – December 2025" },
        ]}
        intro="When I joined AMD's UX team, the product didn't have a shared design foundation. Designers organized files differently, colors were applied inconsistently, and components varied from screen to screen. The team was also preparing for a full software redesign, which meant the inconsistency wasn't just a current problem. So, I took on building the design system from the ground up, not as a cleanup effort, but as the structural layer the redesign would be built on top of."
      />

      <Section
        id="toc-ds-audit"
        label="Audit"
        title="Auditing the existing product before building anything"
        body={"Before building anything new, I audited the product. Two issues surfaced immediately:\n\n1. Colors had no source of truth, so the same UI state used different shades depending on who built it.\n2. Components drifted. Buttons alone varied in corner radius, spacing, and weight.\n\nWithout a governance layer, the product drifted further from consistency with each new screen."}
        media={["/colorMismatch.png", "/inconsistentStyling.png"]}
        mediaLabels={["Inconsistent color application", "Inconsistent component styling"]}
        stackMedia
      />

      <Section
        id="toc-ds-goals"
        label="Goals"
        title="Three things it had to solve"
        body="The audit made the priorities clear. I set three goals for the design system:"
        highlights={[
          { icon: "layers", title: "A consistent design foundation.", body: "Standardize components and bring visual consistency across the product." },
          { icon: "zap", title: "Faster design-to-dev handover.", body: "Reduce back-and-forth with a shared system both sides can reference." },
          { icon: "expand", title: "Built to scale.", body: "Support the upcoming redesign without needing to be rebuilt from scratch." },
        ]}
      />

      <Section
        id="toc-ds-foundation"
        label="Design Foundation"
        accordion={[
          { title: "Primitive and semantic color tokens.", body: "To create a better design foundation, I defined primitive tokens as the raw color palette, then mapped them to semantic tokens named by purpose or state. Components reference those role-based values instead of hardcoded hex codes, so a single update propagates everywhere it matters.", media: "/Tokenization.png" },
          { title: "", body: "That structure is what let a single view like a search bar stay consistent by construction: the outer shell sits on \"surface/default,\" while the input field and content nested inside step up through \"surface/elevated/primary\" and \"surface/elevated/secondary.\" Each layer is a semantic token, not a specific color, so the whole hierarchy restyles correctly the moment any of those tokens change.", media: "/ColorStructure.png" },
          { title: "A spacing and radius token system.", body: "I introduced numeric tokens for spacing and radius built on a 4-point scale. Layout decisions became consistent across the board, and adjustments no longer required guesswork: every component references the same scale, down to which radius applies at which nesting level.", media: ["/radius_spacingtokens.png", "/ApplyFoundationalDesignTokens.png"] },
          { title: "A unified typography scale.", body: "Text styling was scattered across different parts of the interface with no shared structure. To solve this, I consolidated everything into a single scale with clear header and body levels, so type decisions were predictable and easy to apply consistently.", media: "/TextStyling.png" },
        ]}
      />

      <Section
        id="toc-ds-components"
        label="Component Library"
        accordion={[
          { title: "Starting with the essentials.", body: "I began with the most-used components (buttons, navigation, inputs) and built outward as designs got stakeholder approval. Starting small kept the system manageable and let me validate the token layer before scaling.", media: "/CommonComponents.png" },
          { title: "Where the basics stopped being enough.", body: "Complex panels like a command palette combined several patterns at once, more than the basic set could cover as one component. I broke them down into their anatomy and rebuilt them from smaller, reusable parts, so the same pieces could recombine into other views instead of every one being a one-off.", media: "/ComponentAnatomy.png" },
          { title: "Slots instead of endless variants.", body: "Rather than creating a new variant for every content combination, I used slots as flexible placeholders. Components stay consistent in structure while adapting their content without multiplying the variant count.", media: "/Slots.jpg" },
        ]}
      />

      <Section
        id="toc-ds-documentation"
        label="Documentation"
        title="Closing the gap between design and development"
        body={"Wrote usage and behavior guidelines for each component. The goal was simple: designers and developers shouldn't have to chase each other down to figure out how something is supposed to work.\n\nFor spacing and radius, that meant documenting which token applied at which nesting level: how much space sits between a component's edge and its content versus between two siblings, which radius steps down as elements nest inside each other. For behavior, it meant spelling out every state a component could be in (default, hovered, pressed, disabled) and what changes between them."}
        media={["/guides.png", "/DesignGuides.png"]}
      />

      <Section
        id="toc-ds-outcome"
        label="Outcome"
        title="Built it. Then got the team to actually use it"
        body={"By the end of the internship, the team had a working system they could actually build with. Updates propagated cleanly across mockups, designers stopped guessing at spacing values, and the redesign had a consistent foundation to grow from.\n\nBeyond building the system, I took on getting the team to actually use it. That meant running walkthroughs, answering questions during handoff, and making sure designers felt confident reaching for the system instead of going off on their own. Adoption was the real measure of whether the work landed."}
        media={["/DesignSystemImpact.png", "/DesignSpecs.png"]}
      />

      <Section
        label="Oh, and there's more"
        title="Rethinking the Overlay as a Control Surface"
        body="The design system was built to support this major redesign initiative! A full redesign of the AMD Software overlay, turning a read-only metrics display into something users could actually act on."
        media={["/DSHighlight.png"]}
      />
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// FME Annotation — /fme_annotation_project
// ─────────────────────────────────────────────────────────────────────────
const FME_TOC: TocItem[] = [
  { id: "toc-fme-context", label: "Context" },
  { id: "toc-fme-problem", label: "Problem Space" },
  { id: "toc-fme-research", label: "User Research" },
  { id: "toc-fme-direction", label: "Project Direction" },
  { id: "toc-fme-decisions", label: "Design Decisions" },
  { id: "toc-fme-shipping", label: "Shipping" },
]

function FmeAnnotationBody() {
  return (
    <Page tocItems={FME_TOC}>
      <Header
        title="Reducing Clutter Without Losing Context"
        cover="/AnnotationVid.mp4"
        specs={[
          { label: "Role", value: "Product Design Intern" },
          { label: "Team", value: "4 Members" },
          { label: "Duration", value: "April – August 2024" },
        ]}
        intro="During my internship at Safe Software, I led the end-to-end redesign of the annotation experience in FME Form, a visual, no-code platform for building data integration and spatial workflows. Users build workflows by dragging and connecting transformers on a canvas, each one a step like reading, filtering, or reshaping data, and a single workflow can grow to hundreds of transformers deep. Of everything on the table, I chose to focus on annotation: the notes users rely on to keep that complexity legible."
      />

      <Section
        id="toc-fme-context"
        label="Context"
        title="What is annotation in FME Form"
        body="Annotations are notes users can place directly on the canvas to add context, explain decisions, or document logic within a workflow. They come in two forms:"
        highlights={[
          { title: "Custom Annotations.", body: "Created manually by users, with full control over the content. Used to document logic, explain decisions, or add context.", image: "/Custom.png" },
          { title: "Summary Annotations.", body: "Auto-generated by the software. Contents are predefined and describe what an object does.", image: "/Summary.png" },
        ]}
      />

      <Section
        id="toc-fme-problem"
        label="Problem Space"
        title="No visibility controls"
        body="Annotations were essential for adding context, but as workflows grew larger they became a source of clutter. Users had no way to hide or collapse them, so the more documentation a workflow had, the harder it became to read."
        media={["/NoVisibility.png"]}
        accordion={[
          { title: "And when they were visible, they still weren't enough.", body: "Summary annotations describe what an object does, but not why it's configured a certain way. Users had to write their own custom annotations just to fill in the gaps, adding more to a canvas that was already overloaded.", media: "/NoContextAnnotation.mp4" },
        ]}
      />

      <Section
        id="toc-fme-research"
        label="User Research"
        title="What the FME Community told us"
        body="We pulled feedback from the FME Community platform and conducted user interviews to understand the scope. A recurring theme emerged: users wanted annotations to be collapsible and available directly inside the parameter dialog, so context stays visible exactly where configuration decisions are made."
        media={["/WhatUserSaid.png"]}
        accordion={[
          { title: "The workaround told us everything.", body: "We found users tucking annotations into bookmarks just to collapse and hide them. It kept things tidier but added friction and stripped away context. It was a clear signal: the need for visibility control was real, and users were paying a cost every time they worked around it.", media: "/WorkaroundAnnotation.mp4" },
        ]}
      />

      <Section
        id="toc-fme-direction"
        label="Project Direction"
        title="Creating a more comprehensive annotation experience"
        body="Following our research, the team identified two potential solutions."
        highlights={[
          { icon: "layers", title: "Dynamic Visibility.", body: "Let users toggle annotations between expanded and minimized states directly on the canvas." },
          { icon: "zap", title: "Annotation in Parameter Dialog.", body: "Bring notes into the parameter editor, so context lives right where configuration decisions are made." },
        ]}
      />

      <Section
        label="Audit"
        title="Where does a collapsed annotation live?"
        body="We mapped the current canvas object layout and found the right side of the object header was the only viable spot. The left was already reserved for alert and warning indicators."
        media={["/Visibility Control Audit.png"]}
        accordion={[
          { title: "Where does an inline annotation fit?", body: "For the parameter dialog, we placed the annotation option inside the existing dropdown area where users already define parameter logic. It fit naturally into a workflow they already understood.", media: "/AnnotationDialogAudit.png" },
        ]}
      />

      <Section
        id="toc-fme-decisions"
        label="Design Decisions"
        title="Annotations can now be collapsed"
        body="Users can minimize any annotation into an icon on the object header, keeping the canvas clean without losing access to the context."
        media={["/HiddenAnnotation.mp4"]}
        accordion={[
          { title: "A single place for all annotations.", body: "I grouped all annotations under a single side panel, giving users a way to navigate between them quickly without having to hunt through the canvas. Each annotation is color coded to show whether it's custom or summary, and which object it's attached to.", media: "/AnnotationWindow.mp4" },
          { title: "Context lives where decisions are made.", body: "Users were constantly switching between the canvas and parameter dialogs to reference their notes. Bringing annotations directly into the dialog closed that loop entirely.", media: "/InLineAnnotation.mp4" },
        ]}
      />

      <Section
        label="Stakeholder Review"
        title="Design evaluation and stakeholder feedback"
        body="We used storyboarding to walk PMs and engineers through the proposed flow and interactions, gathering feedback and opportunities to improve before moving to higher fidelity."
        media={["/storyboarding1.png"]}
      />

      <Section
        label="Iteration"
        title="Showing annotation on a different level"
        body="Annotations inside the parameter dialog weren't getting enough visibility on their own. We explored surfacing them at both the group and canvas levels using icons and formatted text as indicators, and brought them into the navigator so users could locate annotations quickly without digging through the canvas."
        media={["/AnnotationCanvas.png", "/AnnotationNavigator.png"]}
      />

      <Section
        label="Usability Testing"
        title="Putting the design in front of real users"
        body="We ran qualitative usability tests with four customer success team members experienced in FME Workbench. Using detailed test plans and an interactive prototype, we gathered feedback on usability and functionality.

Participants completed 96% of the required tasks and indicated that the feature would provide meaningful value in their day-to-day workflows."
        media={["/UsabilityTestingFME.png"]}
      />

      <Section
        id="toc-fme-shipping"
        label="Shipping"
        title="57% reduction in visible canvas clutter"
        body="Post-launch, users navigated and read complex workflows more efficiently. For the first time, they could add context exactly where configuration decisions are made, without it spilling onto the canvas. The response from the community reflected that."
        media={["/linkedInComments.png"]}
        footnote="User reactions on LinkedIn following the release."
      />
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Blueprint — /blueprint
// ─────────────────────────────────────────────────────────────────────────
function BlueprintBody() {
  return (
    <Page>
      <Header
        title="Simplifying Donation Tracking at Scale"
        cover="/BlueprintThumb.png"
        specs={[
          { label: "Role", value: "Lead Designer" },
          { label: "Scope", value: "End-to-end Product Development" },
          { label: "Duration", value: "February 2026 – Now" },
        ]}
        intro="Fix the 6ix is a Toronto-based non-profit community that distributes gift cards to people who need them most. But keeping track of those cards has always been a manual process: volunteers submit spreadsheets, coordinators piece together the data, and figuring out what's been used, donated, or sitting idle takes more effort than it should.

ReGiftCard is the dashboard built to fix that. It gives the Fix the 6ix team a single place to monitor unused gift cards, follow how each one moves through spending or donation, and spot the gaps before they become problems. Less time wrestling with files, more time focused on the people they're actually trying to help."
      />

      <Section
        label="Sneak Peek"
        title="ReGiftCard is still in development"
        body="Here are some sneak peeks at where things are heading."
        media={["/HomePageHighlight.png", "/HighlightV2.png", "/VibeAnimationTest.mp4"]}
      />
    </Page>
  )
}

export const CASE_STUDIES: Record<string, CaseStudyContent> = {
  "/amd_ai_project": { Body: AmdAiOverlayBody },
  "/amd_project": { Body: AmdDesignSystemBody },
  "/fme_annotation_project": { Body: FmeAnnotationBody },
  "/blueprint": { Body: BlueprintBody },
}
