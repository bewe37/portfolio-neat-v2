"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import ProjectCards, { type Project } from "@/components/ProjectCards"
import CaseStudySheet from "@/components/CaseStudySheet"
import CharacterAvatar from "@/components/CharacterAvatar"
import { CASE_STUDIES } from "@/lib/case-studies"
import { COLOR, SPACING, RADIUS, TYPE, withAlpha } from "@/lib/v2-tokens"
import { playV2Click } from "@/lib/v2-sound"

const PROJECTS = [
  {
    title: "Rethinking the Overlay as a Control Surface",
    category: "Product Design",
    date: "May - Dec 2025",
    description: "Designing a conversational AI assistant embedded in AMD's Adrenalin software for millions of gamers.",
    href: "/amd_ai_project",
    cover: "/AMDThumbnailNew.mp4",
    badge: "/amdchip.svg",
    sheet: true,
  },
  {
    title: "The Design System That Kept AMD's Team Aligned",
    category: "Design System",
    date: "May – Dec 2025",
    description: "Building a scalable component library that unified design and engineering across AMD's product suite.",
    href: "/amd_project",
    cover: "/DSThumbnailVid.mp4",
    badge: "/amdchip.svg",
    sheet: true,
  },
  {
    title: "Reducing Clutter Without Losing Context",
    category: "Product Design",
    date: "April – August 2024",
    description: "Streamlining FME's annotation workflow so users can focus on insight, not interface noise.",
    href: "/fme_annotation_project",
    cover: "/AnnotationVid.mp4",
    badge: "/safechip.svg",
    sheet: true,
  },
  {
    title: "Simplifying Donation Tracking at Scale",
    category: "Product Design",
    date: "February 2026 – Now",
    description: "Designing a clear, humane dashboard for nonprofits to manage donor relationships at scale.",
    href: "/blueprint",
    cover: "/BlueprintThumb.png",
    badge: "/bpLogo.svg",
    sheet: true,
  },
]

// "Built on Vibes" — ported from the homepage's VIBE_PROJECTS.
const VIBE_PROJECTS = [
  {
    title: "An Archive of Toronto's Painted Utility Boxes",
    category: "Photography",
    date: "Check em out →",
    description: "A self-initiated archive of every painted utility box found across Toronto, documenting the street artists turning infrastructure into canvas.",
    href: "https://outside-the-box-tau.vercel.app/gallery",
    cover: "/OTBThumbnailNew.mp4",
    coverFit: "contain" as const,
    coverBg: "#ffffff",
    coverPadding: 20,
  },
  {
    title: "An On/Off Toggle, But Traffic Light",
    category: "Vibe Coded",
    date: "",
    description: "A tactile power switch that glows red when it's off, the kind of small detail that makes a toggle feel like it's actually doing something.",
    href: "https://github.com/bewe37",
    cover: "/ToggleSkeuo.mp4",
    comingSoon: true,
  },
  {
    title: "My Unhealthy Obsession Over Skeuomorphic Design",
    category: "Vibe Coded",
    date: "",
    description: "A skeuomorphic command palette: brushed metal, tactile keys, real physics. Built because flat design took something away.",
    href: "https://github.com/bewe37",
    cover: "/skeuomorphicCommand.mp4",
    carousel: ["/skeuomorphicCommand.mp4", "/SkeuomorphicCalendarShort.mp4"],
    comingSoon: true,
  },
  {
    title: "Subscription Plan Component",
    category: "Vibe Coded",
    date: "",
    description: "A multi-step subscription flow with animated billing toggle, payment form, and success state, built from a static design.",
    href: "/subscription_plan",
    cover: "/SubThumb.mp4",
    comingSoon: true,
  },
  // Hidden for now.
  // {
  //   title: "CRT Portfolio Website",
  //   category: "Vibe Coded",
  //   date: "Check em out →",
  //   description: "This portfolio — designed and built from scratch with Next.js, framer-motion stickers, and a lot of obsessing over details.",
  //   href: "https://gbryanwt.com/",
  //   cover: "/PortfolioThumbnail.mp4",
  // },
]

type Tab = "work" | "playground"

// Inline company credit — a thin underline sits at rest in a subtle tone;
// on hover a second line fills in left-to-right like a progress bar,
// scaling from the anchor's left edge into the primary text color. Opens
// the real company site in a new tab.
function CompanyLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => playV2Click()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "inline-block",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      {children}
      <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: withAlpha(COLOR.textPrimary, 0.1) }} />
      <motion.span
        initial={false}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: COLOR.textPrimary, transformOrigin: "left", scaleX: 0 }}
      />
    </a>
  )
}

// Same underline treatment as CompanyLink, but not a link — hovering turns
// the word (and its underline) into the character avatar's continuously
// hue-rotating rainbow, and also forces the actual mascot in the bio header
// to spin via onHoverChange, so both animate together.
function RainbowWord({ children, onHoverChange }: { children: React.ReactNode; onHoverChange: (hovered: boolean) => void }) {
  const [hovered, setHovered] = useState(false)

  function setHover(v: boolean) {
    setHovered(v)
    onHoverChange(v)
  }

  return (
    // inline-block (matching CompanyLink) so the absolutely-positioned
    // underline lines position correctly. Any trailing punctuation is
    // passed in as part of children (not left outside the span) so the
    // line-breaking algorithm can't orphan it from the word.
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={hovered ? "v2-rainbow-word-active" : undefined}
      style={{
        position: "relative",
        display: "inline-block",
        color: "inherit",
        cursor: "default",
      }}
    >
      {children}
      <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: withAlpha(COLOR.textPrimary, 0.1) }} />
      <motion.span
        initial={false}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={hovered ? "v2-rainbow-word-active-line" : undefined}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: COLOR.textPrimary, transformOrigin: "left", scaleX: 0 }}
      />
    </span>
  )
}

// A short delay (200ms) before the tooltip first appears prevents flashing
// on a quick pass-over. Once shown, it stays mounted for the whole group —
// moving from Email to X doesn't exit/re-enter a new tooltip, it just
// repositions and re-labels in place, so the transition reads as one
// tooltip following the cursor rather than a new one spawning each time.
const TOOLTIP_DELAY_MS = 200

interface SocialLinkItem {
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

function SocialLinkGroup({ items }: { items: SocialLinkItem[] }) {
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

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  const [hovered, setHovered] = useState(false)
  // Hovering an inactive tab brightens it partway toward the active color,
  // same as the background.
  const color = active ? COLOR.textPrimary : withAlpha(COLOR.textPrimary, hovered ? 0.8 : 0.6)
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rsp-v2-tab-btn"
      style={{
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACING.xs,
        height: "calc(100% - 1px)",
        padding: `${SPACING.xs}px ${SPACING.md}px`,
        borderRadius: 8,
        border: "1px solid transparent",
        position: "relative",
        cursor: "pointer",
        fontFamily: TYPE.fontFamily,
        whiteSpace: "nowrap",
        background: "transparent",
      }}
    >
      {active && (
        <motion.div
          layoutId="v2-tab-pill"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            background: "linear-gradient(180deg, #FFFFFF 0%, #FBFBFB 100%)",
            border: "1px solid rgba(255,255,255,0.8)",
            // Lifted, embossed pill: a bright inner top edge (light catching
            // the raised surface) plus a soft outer drop shadow to lift it
            // off the darker, recessed track underneath.
            boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px -1px rgba(0,0,0,0.1)",
          }}
        />
      )}
      <span
        style={{
          position: "relative",
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: TYPE.letterSpacing,
          color,
          whiteSpace: "nowrap",
          transition: "color 0.15s ease",
        }}
      >
        {label}
      </span>
    </button>
  )
}

// Lives in a (home) route group so it wraps only / and /[project] —
// /about is a sibling outside the group and must not inherit this UI.
//
// This layout renders the whole homepage once and never unmounts it. Case
// studies open as a sheet on top, driven purely by local state; the URL is
// updated with the History API rather than the Next router precisely so
// that opening/closing never triggers a navigation (see openCaseStudy).
function projectFromPathname(pathname: string): Project | null {
  if (pathname === "/") return null
  return PROJECTS.find(p => p.href === pathname) ?? null
}

// Built once at module scope, not inline in V2Layout's JSX — every value
// interpolated into it (SPACING, COLOR) is a static constant, so the string
// never actually changes across renders. Left inline, this ~60-line
// template literal was rebuilt and re-diffed into a <style> tag on every
// render of V2Layout, including the open-case-study state change that
// changes nothing this stylesheet depends on — a needless style
// recalculation right as the sheet's slide animation is trying to run.
const V2_RESPONSIVE_STYLES = `
  @media (max-width: 900px) {
    .rsp-v2-page { height: auto !important; overflow: visible !important; }
    /* Single column, in explicit reading order: bio intro, then the
       project grid, then the sleep/socials footer last — the footer
       sits directly under the bio on desktop (same grid column) but
       reads better after the projects once everything stacks. */
    .rsp-v2-row {
      display: flex !important;
      flex-direction: column !important;
      height: auto !important;
      overflow: visible !important;
      gap: 0 !important;
    }
    .rsp-v2-bio { order: 1; }
    .rsp-v2-content-wrap { order: 2; }
    .rsp-v2-footer { order: 3; }
    .rsp-v2-row > div { height: auto !important; overflow: visible !important; width: 100% !important; }
    /* Both stacked sections get matching left/right padding once the
       two-column desktop layout collapses — the left-only /
       right-only insets built for sitting side by side otherwise
       leave one edge flush and the other padded when stacked. */
    .rsp-v2-bio, .rsp-v2-content { padding: ${SPACING.lg}px ${SPACING.lg}px 0 ${SPACING.lg}px !important; }
    .rsp-v2-content { padding-bottom: ${SPACING.xxxl}px !important; }
    .rsp-v2-footer { padding: ${SPACING.lg}px ${SPACING.lg}px ${SPACING.xxxl}px ${SPACING.lg}px !important; }
    /* More breathing room above the tab bar so it doesn't crowd the
       buttons right above it, and stretch it full-width (each tab
       sharing the row equally) instead of a small flush-left pill —
       both read as leftover desktop sizing on a narrow screen. */
    .rsp-v2-tabbar-row { padding-top: ${SPACING.xl}px !important; }
    .rsp-v2-tabbar { width: 100% !important; }
    .rsp-v2-tab-btn { flex: 1 1 0 !important; }
  }

  .v2-btn-primary { transition: transform 0.16s cubic-bezier(0.23,1,0.32,1), box-shadow 0.15s ease, filter 0.15s ease; }
  .v2-btn-primary:hover { box-shadow: 0 4px 10px -4px ${withAlpha(COLOR.accentTo, 0.5)}; filter: brightness(1.15); }
  .v2-btn-primary:active { transform: scale(0.97); filter: brightness(0.97); }

  .v2-btn-secondary { transition: transform 0.16s cubic-bezier(0.23,1,0.32,1), background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
  .v2-btn-secondary:hover { background: ${COLOR.border}; border-color: ${COLOR.borderHover}; color: ${COLOR.textPrimary} !important; }
  .v2-btn-secondary:active { transform: scale(0.97); }

  .v2-social-link:hover { color: ${COLOR.textSecondary} !important; }

  @keyframes v2-rainbow-word-spin {
    from { color: #5451D9; filter: hue-rotate(0deg) saturate(1.4); }
    to { color: #5451D9; filter: hue-rotate(360deg) saturate(1.4); }
  }
  .v2-rainbow-word-active {
    animation: v2-rainbow-word-spin 2.5s linear infinite;
  }
  @keyframes v2-rainbow-line-spin {
    from { background: #5451D9; filter: hue-rotate(0deg) saturate(1.4); }
    to { background: #5451D9; filter: hue-rotate(360deg) saturate(1.4); }
  }
  .v2-rainbow-word-active-line {
    animation: v2-rainbow-line-spin 2.5s linear infinite;
  }
`

function V2ResponsiveStyles() {
  return <style>{V2_RESPONSIVE_STYLES}</style>
}

export default function V2Layout({ children }: { children?: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("work")

  // Opening/closing a case study is a purely local state change — it must
  // NOT go through the Next router. router.push()/router.back() trigger a
  // real App Router navigation: React re-renders this whole layout subtree,
  // effects re-run, and the route segment is re-requested. Doing that on
  // the exact frame the sheet's open/close animation starts is what made
  // everything flicker and stutter — the animation was competing with a
  // full navigation every single time.
  //
  // window.history.pushState/replaceState updates the URL with no
  // navigation, no re-render, no refetch. Next explicitly supports this and
  // keeps usePathname in sync (see
  // node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md
  // → "Native History API"). The URL stays shareable and the back button
  // still works (see the popstate listener below), but nothing re-renders
  // except this one piece of state.
  const [openProject, setOpenProject] = useState<Project | null>(() =>
    typeof window === "undefined" ? null : projectFromPathname(window.location.pathname)
  )
  const activeCaseStudy = openProject ? CASE_STUDIES[openProject.href] : undefined

  // Back/forward buttons are the only thing that can change the URL out
  // from under us now, so popstate is the only sync we need. It fires
  // without a navigation, so this is just a state update.
  useEffect(() => {
    function onPopState() {
      setOpenProject(projectFromPathname(window.location.pathname))
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  // Hovering "enjoy" in the bio forces the actual mascot avatar to
  // rainbow-spin too, so both animate together.
  const [enjoyHovered, setEnjoyHovered] = useState(false)

  // useCallback so identity is stable across renders — ProjectCards is
  // memoized and takes this as a prop; a new function identity every render
  // would defeat that memoization and re-render every card (each with its
  // own <video>) on every keystroke/hover/tab-switch in this layout, not
  // just on open/close.
  const openCaseStudy = useCallback((project: Project) => {
    setOpenProject(project)
    window.history.pushState(null, "", project.href)
  }, [])

  const closeCaseStudy = useCallback(() => {
    setOpenProject(null)
    window.history.pushState(null, "", "/")
  }, [])

  return (
    <div
      className="rsp-v2-page"
      style={{
        height: "100dvh",
        width: "100%",
        background: COLOR.bg,
        display: "flex",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gridTemplateAreas: `"bio content" "footer content"`,
          gridTemplateRows: "1fr auto",
          alignItems: "stretch",
          // Scales past the base 48px as the viewport grows, so the bio
          // column doesn't feel oddly close to the content grid on very
          // wide screens.
          gap: "clamp(48px, 4vw, 96px)",
          width: "100%",
          height: "100%",
        }}
        className="rsp-v2-row"
      >
        {/* Left — bio column, fixed height, never scrolls */}
        <div
          className="rsp-v2-bio"
          style={{
            gridArea: "bio",
            width: 320,
            display: "flex",
            flexDirection: "column",
            gap: SPACING.xl,
            minHeight: 0,
            padding: `${SPACING.xl}px 0 0 ${SPACING.xl}px`,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: SPACING.sm, marginBottom: -SPACING.xs }}>
            <CharacterAvatar size={32} forceRainbow={enjoyHovered} />
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING.xxs }}>
              <p style={{ margin: 0, fontFamily: TYPE.fontFamily, fontSize: TYPE.size.body, fontWeight: 500, letterSpacing: TYPE.letterSpacing, color: COLOR.textPrimary }}>
                Georgius Bryan
              </p>
              <p style={{ margin: 0, fontFamily: TYPE.fontFamily, fontSize: TYPE.size.body, letterSpacing: TYPE.letterSpacing, color: COLOR.textSecondary }}>
                Product Designer
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: SPACING.md, width: "fit-content" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING.xl }}>
              <p style={{ margin: 0, fontFamily: TYPE.fontFamily, fontSize: TYPE.size.body, letterSpacing: TYPE.letterSpacing, lineHeight: "170%", color: COLOR.textSecondary }}>
                I&apos;m a product designer based in Toronto. Most of what I obsess over is how software feels to use, the small stuff that turns something functional into something people actually <RainbowWord onHoverChange={setEnjoyHovered}>enjoy.</RainbowWord>
              </p>
              <p style={{ margin: 0, fontFamily: TYPE.fontFamily, fontSize: TYPE.size.body, letterSpacing: TYPE.letterSpacing, lineHeight: "170%", color: COLOR.textSecondary }}>
                Previously worked on AI integration at <CompanyLink href="https://www.amd.com">AMD</CompanyLink>, and streamlined a data integration platform at <CompanyLink href="https://www.safe.com">Safe Software</CompanyLink>.
              </p>
            </div>

            <div style={{ display: "flex", gap: SPACING.sm, marginTop: SPACING.sm }}>
              <a
                href="mailto:bryanwinata112@gmail.com"
                onClick={() => playV2Click()}
                className="v2-btn-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 32,
                  padding: `${SPACING.xs + 2}px ${SPACING.md}px`,
                  borderRadius: RADIUS.sm,
                  background: `linear-gradient(180deg, ${COLOR.accentFrom} 0%, ${COLOR.accentTo} 100%)`,
                  boxShadow: "0 -4px 3px rgba(202,202,202,0) inset",
                  outline: `1px solid ${COLOR.accentOutline}`,
                  textDecoration: "none",
                  fontFamily: TYPE.fontFamily,
                  fontSize: TYPE.size.label,
                  fontWeight: 500,
                  letterSpacing: TYPE.letterSpacing,
                  color: COLOR.surfaceRaised,
                }}
              >
                Get in touch
              </a>
              <a
                href="/about"
                onClick={() => playV2Click()}
                className="v2-btn-secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 32,
                  padding: `${SPACING.xs + 2}px ${SPACING.md}px`,
                  borderRadius: RADIUS.sm,
                  background: `linear-gradient(180deg, ${COLOR.buttonSurfaceFrom} 0%, ${COLOR.buttonSurfaceTo} 100%)`,
                  border: `1px solid ${COLOR.border}`,
                  textDecoration: "none",
                  fontFamily: TYPE.fontFamily,
                  fontSize: TYPE.size.label,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  color: COLOR.textSecondary,
                }}
              >
                More about me
              </a>
            </div>
          </div>
        </div>

        {/* Footer — sleep line + socials. A grid sibling of the bio column
            (not nested inside it), placed in its own grid area so it can
            be repositioned independently once the layout stacks on
            mobile: desktop keeps it under the bio column (its own row in
            that column), mobile moves it to the very end, after the
            project grid. */}
        <div
          className="rsp-v2-footer"
          style={{
            gridArea: "footer",
            display: "flex",
            flexDirection: "column",
            gap: SPACING.xs,
            padding: `0 0 ${SPACING.xl}px ${SPACING.xl}px`,
            boxSizing: "border-box",
          }}
        >
          <p style={{ margin: 0, fontFamily: TYPE.fontFamily, fontSize: TYPE.size.label, letterSpacing: TYPE.letterSpacing, lineHeight: "170%", color: COLOR.textTertiary }}>
            Sleep is a design constraint. Available for hire if you catch me awake.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: SPACING.xxl, marginTop: SPACING.xs, alignSelf: "stretch" }}>
            <SocialLinkGroup
              items={[
                { href: "https://twitter.com/gbryanwt", label: "X", tooltip: "@gbryanwt" },
                { href: "https://linkedin.com/in/gbryanw", label: "LinkedIn", tooltip: "/in/gbryanw" },
                { href: "mailto:bryanwinata112@gmail.com", label: "Email", tooltip: "bryanwinata112@gmail.com", external: false },
              ]}
            />
            <p style={{ margin: 0, flex: 1, fontFamily: TYPE.fontFamily, fontSize: TYPE.size.label, letterSpacing: TYPE.letterSpacing, color: COLOR.textFaint }}>
              © 2026 Georgius Bryan
            </p>
          </div>
        </div>

        {/* Right — tab switcher + grid. Only this column scrolls, and the
            scrollbar sits flush at the real viewport edge (no horizontal
            padding on the scroll container itself — padding lives on the
            content inside it instead). */}
        <div
          className="rsp-v2-content-wrap"
          style={{
            gridArea: "content",
            minWidth: 0,
            minHeight: 0,
            height: "100%",
            overflowY: "auto",
          }}
        >
          <div
            className="rsp-v2-content"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: `${SPACING.xl}px ${SPACING.xl}px ${SPACING.xl}px 0`,
              boxSizing: "border-box",
            }}
          >
            <div
              className="rsp-v2-tabbar-row"
              style={{
                width: "100%",
                flexShrink: 0,
                background: COLOR.bg,
                paddingBottom: SPACING.lg,
              }}
            >
              <div
                role="tablist"
                aria-label="Project category"
                className="rsp-v2-tabbar"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "fit-content",
                  height: 36,
                  padding: 3,
                  borderRadius: 10,
                  background: "linear-gradient(180deg, #E9E9E9 0%, #DCDCDC 100%)",
                  // Softly recessed groove — a light top inset (as if the
                  // surface curves down away from the light) and a dark
                  // bottom inset for depth, like the track is pressed in.
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1), inset 0 -1px 1px rgba(255,255,255,0.6)",
                }}
              >
                <TabButton
                  active={tab === "work"}
                  onClick={() => { playV2Click(); setTab("work") }}
                  label="Selected Work"
                />
                <TabButton
                  active={tab === "playground"}
                  onClick={() => { playV2Click(); setTab("playground") }}
                  label="Playground"
                />
              </div>
            </div>

            {tab === "work" ? (
              <div key="work" role="tabpanel" aria-label="Selected Work" style={{ width: "100%" }}>
                <ProjectCards
                  projects={PROJECTS}
                  gap={SPACING.lg}
                  rowGap={24}
                  cardGap={SPACING.sm}
                  titleColor={COLOR.textSecondary}
                  titleColorHover={COLOR.textPrimary}
                  dateColor={COLOR.textTertiary}
                  onCardOpen={openCaseStudy}
                  onClickSound={playV2Click}
                />
              </div>
            ) : (
              <div key="playground" role="tabpanel" aria-label="Playground" style={{ width: "100%" }}>
                <ProjectCards
                  projects={VIBE_PROJECTS}
                  gap={SPACING.lg}
                  rowGap={24}
                  cardGap={SPACING.sm}
                  titleColor={COLOR.textSecondary}
                  titleColorHover={COLOR.textPrimary}
                  dateColor={COLOR.textTertiary}
                  onClickSound={playV2Click}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <V2ResponsiveStyles />

      {activeCaseStudy && (
        <CaseStudySheet content={activeCaseStudy} onClose={closeCaseStudy} />
      )}

      {children}
    </div>
  )
}
