"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion, useAnimation, useDragControls } from "framer-motion"
import { COLOR, RADIUS, withAlpha } from "@/lib/v2-tokens"
import { playV2Click } from "@/lib/v2-sound"
import type { CaseStudyContent } from "@/lib/case-studies"

interface CaseStudySheetProps {
  content: CaseStudyContent
  onClose: () => void
}

// Partial-height bottom sheet: dark backdrop above the page, rounded top
// corners, a drag handle. Content scrolls inside the sheet's fixed height —
// the sheet itself never resizes to fit content.
//
// Open/close is one plain CSS transition driven by a single `open` boolean —
// the backdrop's opacity and the sheet's transform animate together, on the
// same trigger, so they can never desync. This intentionally avoids Framer
// Motion for the open/close move: Motion computes a spring's value every
// frame via requestAnimationFrame on the main thread, which competes with
// whatever else is happening there (mounting a large case-study body,
// video decode, React re-renders) — a CSS transition is handed to the
// compositor once triggered and keeps running regardless of main-thread
// load. Motion is used for exactly one thing: drag-to-dismiss, a genuinely
// interactive gesture with release velocity that CSS can't express — and
// it's only enabled once the open transition has already finished, so the
// two never fight over the same transform at the same time.
export default function CaseStudySheet({ content, onClose }: CaseStudySheetProps) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  // True once the opening slide has finished. Gates the two things that
  // must not run during the animation: the expensive backdrop blur, and
  // Motion's drag handling (which would otherwise contest the transform).
  const [settled, setSettled] = useState(false)
  // True only while an actual drag-to-dismiss gesture is in progress (not
  // just while drag is armed via `settled`). A press-and-move on the handle
  // that dips down over the body text can otherwise still register as a
  // native text-selection drag on whatever's underneath — this disables
  // selection on the whole sheet for the gesture's duration and restores it
  // the moment the drag ends, so normal text selection is unaffected
  // everywhere else.
  const [dragging, setDragging] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)
  const springBack = useAnimation()
  // Starts the drag manually, only from the handle's onPointerDown below
  // (dragListener={false} on the sheet) — without this, `drag="y"` listens
  // on the whole sheet, and its pointerdown handler intercepts the same
  // press-and-hold gesture a browser uses for text selection, so nothing in
  // the scrollable body could be selected once the sheet had settled.
  const dragControls = useDragControls()
  // Not `transition: none` — handleTransitionEnd below drives `settled`/
  // onClose off a real transitionend firing on opacity, so removing the
  // transition entirely would mean that event never fires and the sheet
  // gets stuck mid-state. A near-instant duration keeps the same
  // event-driven flow while skipping the actual motion.
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Two nested rAFs, not one: `mounted` flipping true and this effect
  // re-running both happen before the browser's next paint, so a single rAF
  // still fires before the closed position (translateY(100%), opacity 0)
  // has ever been painted — the browser coalesces closed and open into one
  // frame and the transition has nothing to animate from. The first rAF
  // waits for that paint to actually happen; the second, scheduled from
  // inside it, is what flips to open.
  useEffect(() => {
    if (!mounted) return
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setOpen(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [mounted])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  // Pause every video outside the sheet while it's open. They're fully
  // covered by the backdrop, so nothing is lost — but IntersectionObserver
  // (used by useLazyVideo for these cards) only checks geometric position
  // in the viewport, not occlusion, so they'd otherwise keep playing
  // underneath. Resuming on close just hands control back to each video's
  // own observer; anything still in view restarts on its own.
  useEffect(() => {
    const videos = Array.from(document.querySelectorAll("video")).filter(
      v => !v.closest("[data-cs-sheet]")
    )
    videos.forEach(v => v.pause())
    return () => { videos.forEach(v => v.play().catch(() => {})) }
  }, [])

  function requestClose() {
    setSettled(false)
    setOpen(false)
  }

  // Only the opacity transition is used as the open/close signal — the
  // backdrop also transitions backdrop-filter, and transitionend fires
  // once per property, so without this check onClose() would run twice.
  function handleTransitionEnd(e: React.TransitionEvent) {
    if (e.target !== e.currentTarget || e.propertyName !== "opacity") return
    if (open) {
      setSettled(true)
    } else {
      onClose()
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") requestClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Focus moves into the sheet on open (so screen reader/keyboard users
  // land inside the dialog instead of it opening silently behind them),
  // and returns to whatever triggered it on close — the element that
  // opens the sheet is otherwise left behind with no way back to it.
  useEffect(() => {
    triggerRef.current = document.activeElement
    sheetRef.current?.focus()
    return () => {
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus()
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      data-cs-sheet
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1020,
        background: withAlpha(COLOR.textPrimary, 0.55),
        // The blur is deliberately cheap while the sheet is moving.
        // backdrop-filter on a full-viewport element forces the browser to
        // re-sample and blur everything behind it on every single frame —
        // by far the most expensive thing on screen during the slide. Its
        // transition is keyed off `open` (not `settled`) with a delay, so it
        // starts fading in during the last third of the slide instead of
        // waiting for the slide to fully stop — one continuous motion
        // instead of a blur that visibly kicks in after the fact. `settled`
        // still gates drag separately (see below): that one has to wait for
        // the real transitionend, not just "mostly done".
        backdropFilter: open ? "blur(4px)" : "none",
        transition: reducedMotion
          ? "opacity 0.01s linear"
          : open
          ? "opacity 0.38s cubic-bezier(0.32, 0.72, 0, 1), backdrop-filter 0.32s cubic-bezier(0.32, 0.72, 0, 1) 0.16s"
          : "opacity 0.32s cubic-bezier(0.4, 0, 1, 1), backdrop-filter 0.15s ease",
        opacity: open ? 1 : 0,
        willChange: "opacity, backdrop-filter",
      }}
      onClick={requestClose}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "96dvh",
          width: "100%",
          transform: open ? "translateY(0)" : "translateY(100%)",
          // Open decelerates in (iOS sheet curve: fast start, soft landing).
          // Close is its own accelerating curve rather than the same curve
          // run in reverse — reusing the decelerate curve on the way out
          // makes the sheet crawl for the first frames then suddenly drop,
          // which reads as a stutter. Accelerating out matches how the
          // backdrop fade (also asymmetric now, see above) leaves together
          // with it as one motion.
          transition: reducedMotion
            ? "transform 0.01s linear"
            : open
            ? "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)"
            : "transform 0.32s cubic-bezier(0.4, 0, 1, 1)",
          // Promote to its own compositor layer so the slide is a pure GPU
          // transform — no re-rasterizing the sheet's contents per frame.
          willChange: "transform",
        }}
      >
        <motion.div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Case study"
          tabIndex={-1}
          animate={springBack}
          drag={settled ? "y" : false}
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragStart={() => setDragging(true)}
          onDragEnd={(_e, info) => {
            setDragging(false)
            if (info.offset.y > 120 || info.velocity.y > 500) {
              requestClose()
            } else {
              // Didn't drag far/fast enough to dismiss — spring back to
              // rest. This is the one legitimate use of a Motion spring
              // here: it needs to carry the release velocity, which a CSS
              // transition can't do.
              springBack.start({ y: 0, transition: { type: "spring", stiffness: 500, damping: 40 } })
            }
          }}
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%",
            height: "100%",
            background: COLOR.bg,
            userSelect: dragging ? "none" : "auto",
            WebkitUserSelect: dragging ? "none" : "auto",
            borderRadius: `${RADIUS.md + 8}px ${RADIUS.md + 8}px 0 0`,
            boxShadow: "0 -20px 60px rgba(0,0,0,0.35)",
            overflow: "hidden",
          }}
        >
          {/* Scrollable content — runs edge-to-edge from the very top of the
              sheet; the handle floats over it rather than reserving its own
              row, so there's no separate flush bar above the content. No
              touchAction override here: this area needs the browser's
              normal scroll and text-selection gestures, which is exactly
              why drag-to-dismiss is only ever started from the handle
              below, not from anywhere in this div. */}
          <div
            style={{
              height: "100%",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <content.Body />
          </div>

          {/* Drag handle — floats over the content with no background of its
              own, grows slightly on hover as a static affordance that it's
              grabbable. The row itself (not just the visible pill) is the hit
              area, sized to the 44px touch-target minimum. This is the only
              place that starts the sheet's drag gesture (dragControls.start
              below) — touchAction: none is scoped to just this row so it
              doesn't swallow scroll/selection gestures anywhere else in the
              sheet. */}
          <div
            className="cs-drag-handle-row"
            onPointerDown={e => { if (settled) dragControls.start(e) }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
              touchAction: "none",
              zIndex: 10,
            }}
          >
            <div className="cs-drag-handle" style={{ width: 36, height: 4, borderRadius: 2, background: COLOR.border, transition: "transform 0.15s ease" }} />
          </div>

          {/* Explicit close button — the drag handle and backdrop-click both
              already close the sheet, but neither is obvious as a "close"
              affordance on sight, especially on desktop where there's
              nothing to drag with a mouse in the first place. Sits above
              the drag handle's own z-index so it stays clickable even
              though it's within the handle row's height. */}
          <button
            onClick={() => { playV2Click(); requestClose() }}
            aria-label="Close case study"
            className="cs-close-btn"
            style={{
              position: "absolute",
              top: 16,
              right: 20,
              zIndex: 11,
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: withAlpha(COLOR.textPrimary, 0.06),
              backdropFilter: "blur(8px)",
              color: COLOR.textTertiary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s ease",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </motion.div>
      </div>

      <style>{`
        .cs-drag-handle-row:hover .cs-drag-handle { transform: scaleX(1.15) scaleY(1.5); }
        .cs-close-btn:hover { background: ${withAlpha(COLOR.textPrimary, 0.12)}; }
      `}</style>
    </div>,
    document.body
  )
}
