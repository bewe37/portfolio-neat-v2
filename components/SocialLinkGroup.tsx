"use client"

import { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { COLOR, SPACING, TYPE } from "@/lib/v2-tokens"

// A short delay (200ms) before the tooltip first appears prevents flashing
// on a quick pass-over. Once shown, it stays mounted for the whole group —
// moving from Email to X doesn't exit/re-enter a new tooltip, it just
// repositions and re-labels in place, so the transition reads as one
// tooltip following the cursor rather than a new one spawning each time.
const TOOLTIP_DELAY_MS = 200

export interface SocialLinkItem {
  href: string
  label: string
  tooltip: string
  external?: boolean
}

// Minimum gap the tooltip must keep from the viewport edge.
const TOOLTIP_EDGE_MARGIN = 12
// Rough width estimate used only to decide whether centering would clip —
// the tooltip's real width can vary per label, but erring a little wide
// here just means it clamps slightly earlier than strictly necessary,
// never later.
const TOOLTIP_MAX_WIDTH_ESTIMATE = 220

export function SocialLinkGroup({ items }: { items: SocialLinkItem[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [pos, setPos] = useState(0)
  const [align, setAlign] = useState<"center" | "left" | "right">("center")
  const containerRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function measure(i: number) {
    const container = containerRef.current
    const link = linkRefs.current[i]
    if (!container || !link) return
    const containerBox = container.getBoundingClientRect()
    const linkBox = link.getBoundingClientRect()
    const linkCenter = linkBox.left + linkBox.width / 2

    // Would a centered tooltip clip past either viewport edge? If so, pin
    // it to whichever side of the trigger stays fully on-screen instead —
    // anchored to that edge of the trigger itself, not its center, so a
    // left-pinned tooltip actually starts at the trigger's left edge.
    const halfWidth = TOOLTIP_MAX_WIDTH_ESTIMATE / 2
    if (linkCenter - halfWidth < TOOLTIP_EDGE_MARGIN) {
      setAlign("left")
      setPos(linkBox.left - containerBox.left)
    } else if (linkCenter + halfWidth > window.innerWidth - TOOLTIP_EDGE_MARGIN) {
      setAlign("right")
      setPos(linkBox.right - containerBox.left)
    } else {
      setAlign("center")
      setPos(linkBox.left - containerBox.left + linkBox.width / 2)
    }
  }

  function handleEnter(i: number) {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (activeIdx !== null) {
      // Group already active — reposition instantly, no delay.
      measure(i)
      setActiveIdx(i)
      return
    }
    timerRef.current = setTimeout(() => {
      measure(i)
      setActiveIdx(i)
    }, TOOLTIP_DELAY_MS)
  }

  function handleLeave() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setActiveIdx(null)
  }

  const active = activeIdx !== null ? items[activeIdx] : null

  return (
    // Negative margin cancels the extra padding visually while keeping the
    // hoverable area contiguous — the gap between links is no longer dead
    // space, so the cursor can cross from one trigger straight into the
    // next without a mouseleave/mouseenter gap breaking the group's active
    // window mid-transition.
    <div ref={containerRef} style={{ position: "relative", display: "flex", alignItems: "center", margin: `-${SPACING.xs}px -${SPACING.sm}px` }}>
      {items.map((item, i) => (
        <a
          key={item.href}
          ref={el => { linkRefs.current[i] = el }}
          href={item.href}
          target={item.external === false ? undefined : "_blank"}
          rel={item.external === false ? undefined : "noopener noreferrer"}
          className="v2-social-link"
          onMouseEnter={() => handleEnter(i)}
          onMouseLeave={handleLeave}
          style={{
            padding: `${SPACING.xs}px ${SPACING.sm}px`,
            fontFamily: TYPE.fontFamily,
            fontSize: TYPE.size.label,
            letterSpacing: TYPE.letterSpacing,
            color: COLOR.textTertiary,
            textDecoration: "none",
            transition: "color 0.15s ease",
          }}
        >
          {item.label}
        </a>
      ))}

      <AnimatePresence>
        {active && (
          <motion.span
            layout="size"
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              left: pos,
              x: align === "center" ? "-50%" : align === "left" ? "0%" : "-100%",
            }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{
              opacity: { duration: 0.15, ease: [0.23, 1, 0.32, 1] },
              scale: { duration: 0.15, ease: [0.23, 1, 0.32, 1] },
              y: { duration: 0.15, ease: [0.23, 1, 0.32, 1] },
              left: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
              x: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
              // The box itself (width/height) morphs on this same curve when
              // the incoming label is a different length than the outgoing
              // one, instead of snapping to the new size.
              layout: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
            }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              transformOrigin: align === "center" ? "bottom center" : align === "left" ? "bottom left" : "bottom right",
              whiteSpace: "nowrap",
              padding: "5px 9px",
              borderRadius: 6,
              background: COLOR.textPrimary,
              color: COLOR.surfaceRaised,
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: TYPE.letterSpacing,
              pointerEvents: "none",
              boxShadow: "0 4px 12px -2px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            {/* Slot-machine roll: the outgoing label slides up and out while
                the incoming one slides up and in from below, keyed by the
                tooltip text itself so AnimatePresence swaps on change. */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={active.tooltip}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                style={{ display: "block" }}
              >
                {active.tooltip}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
