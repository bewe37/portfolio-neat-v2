"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import ProjectCards, { type Project } from "@/components/ProjectCards"
import CaseStudySheet from "@/components/CaseStudySheet"
import CharacterAvatar from "@/components/CharacterAvatar"
import { SocialLinkGroup } from "@/components/SocialLinkGroup"
import { CASE_STUDIES, CaseStudyNavContext } from "@/lib/case-studies"
import { COLOR, SPACING, RADIUS, TYPE, withAlpha } from "@/lib/v2-tokens"
import { playV2Click, playV2Select } from "@/lib/v2-sound"

const PROJECTS = [
  {
    title: "Rethinking the Overlay as a Control Surface",
    category: "Feature Integration",
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
    category: "Feature Integration",
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

// Inline company credit — a rounded pill background, a shade darker on
// hover. Opens the real company site in a new tab. Negative margin cancels
// the padding visually so the word still sits inline with surrounding text
// at the same baseline rhythm, just with a highlight behind it.
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
        display: "inline-block",
        margin: "0 -1px",
        padding: "0px 4px",
        borderRadius: 4,
        fontWeight: 500,
        color: hovered ? COLOR.textPrimary : "inherit",
        textDecoration: "none",
        background: hovered ? COLOR.border : "#EDEDED",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      {children}
    </a>
  )
}

// Same pill treatment as CompanyLink, but not a link — hovering turns the
// word into the character avatar's continuously hue-rotating rainbow, and
// also forces the actual mascot in the bio header to spin via
// onHoverChange, so both animate together.
function RainbowWord({ children, onHoverChange }: { children: React.ReactNode; onHoverChange: (hovered: boolean) => void }) {
  const [hovered, setHovered] = useState(false)

  function setHover(v: boolean) {
    setHovered(v)
    onHoverChange(v)
  }

  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={hovered ? "v2-rainbow-word-active" : undefined}
      style={{
        display: "inline-block",
        margin: "0 -1px",
        padding: "0px 4px",
        borderRadius: 4,
        fontWeight: 500,
        color: "inherit",
        cursor: "default",
        background: hovered ? COLOR.border : "#EDEDED",
        transition: hovered ? undefined : "background 0.15s ease",
      }}
    >
      {children}
    </span>
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
            // Same 3-layer shadow formula as the project card cover image.
            boxShadow: "0 0 0 1px rgba(25,28,33,0.04), 0 1px 2px 1px rgba(25,28,33,0.04), 0 0 2px 0 rgba(0,0,0,0.08)",
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

  .v2-btn-secondary { transition: transform 0.16s cubic-bezier(0.23,1,0.32,1), filter 0.15s ease; }
  .v2-btn-secondary:hover { filter: brightness(0.96); }
  .v2-btn-secondary:active { transform: scale(0.97); }

  .v2-social-link:hover { color: ${COLOR.textSecondary} !important; }

  @keyframes v2-rainbow-word-spin {
    from { color: #5451D9; filter: hue-rotate(0deg) saturate(1.4); }
    to { color: #5451D9; filter: hue-rotate(360deg) saturate(1.4); }
  }
  .v2-rainbow-word-active {
    animation: v2-rainbow-word-spin 2.5s linear infinite;
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

  // Drives the homepage's own recede-behind-the-sheet animation.
  // Deliberately separate from openProject: that only goes back to null
  // once the sheet has fully faded out (see closeCaseStudy/onClose), so
  // gating the recede transform on it directly meant the page sat scaled
  // down for the sheet's whole closing fade before finally animating back
  // — sluggish. This flips false the instant a close is *requested*
  // (onRequestClose, fired synchronously from the sheet's own close
  // handlers) and true whenever a project opens, so the two motions start
  // together in both directions.
  const [sheetRecede, setSheetRecede] = useState(false)
  useEffect(() => {
    if (openProject) setSheetRecede(true)
  }, [openProject])

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

  // Lets a case study's own body content (e.g. the "Oh, and there's more"
  // cross-link at the end of one case study, pointing at another) swap the
  // open sheet in place — same effect as openCaseStudy, just looked up by
  // href since the content only knows the target path, not the Project
  // object itself. Provided to lib/case-studies.tsx via CaseStudyNavContext.
  const openCaseStudyByHref = useCallback((href: string) => {
    const project = PROJECTS.find(p => p.href === href)
    if (project) openCaseStudy(project)
  }, [openCaseStudy])

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
        // Recedes behind the case study sheet while it's open — same
        // "card stack" effect as iOS's presented-sheet transition. Driven
        // by sheetRecede (see above), not openProject directly, so closing
        // animates back immediately rather than waiting for the sheet's
        // own fade-out to finish first.
        // transformOrigin center-top (not the scale default of center) so
        // the top edge recedes straight down from the viewport top instead
        // of scaling in from the middle — the translateY then pulls it
        // down a further 10px so a sliver of backdrop shows above it too,
        // not just at the sides/bottom.
        transform: sheetRecede ? "scale(0.94) translateY(10px)" : "scale(1) translateY(0)",
        transformOrigin: "center top",
        borderRadius: sheetRecede ? 20 : 0,
        transition: "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          gridTemplateAreas: `"bio content" "footer content"`,
          gridTemplateRows: "1fr auto",
          alignItems: "stretch",
          // Scales past the base 56px as the viewport grows, so the bio
          // column doesn't feel oddly close to the content grid on very
          // wide screens.
          gap: "clamp(56px, 4.5vw, 104px)",
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
            width: 340,
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
                I&apos;m a product designer based in Toronto. Most of what I obsess over is how software feels to use, the small stuff that turns something functional into something people actually <RainbowWord onHoverChange={setEnjoyHovered}>enjoy</RainbowWord>
              </p>
              <p style={{ margin: 0, fontFamily: TYPE.fontFamily, fontSize: TYPE.size.body, letterSpacing: TYPE.letterSpacing, lineHeight: "170%", color: COLOR.textSecondary }}>
                Previously worked on AI integration at <CompanyLink href="https://www.amd.com">AMD</CompanyLink> and&nbsp;streamlined a data integration platform at <CompanyLink href="https://www.safe.com">Safe&nbsp;Software</CompanyLink>
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
                  // Same 3-layer shadow formula as the project cards (ring +
                  // downward drop + soft blur), retinted from neutral
                  // gray/black to the button's own purple (accentTo) since a
                  // gray-tinted shadow read muddy against this saturated a
                  // background.
                  boxShadow: "0 0 0 1px rgba(69,72,199,0.25), 0 1px 2px 1px rgba(69,72,199,0.2), 0 0 3px 0 rgba(69,72,199,0.35), 0 -4px 3px rgba(202,202,202,0) inset",
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
                  // Higher-contrast 3-layer shadow, same formula as the
                  // close button — its own 1px ring layer replaces the old
                  // solid border.
                  boxShadow: "0 2px 2px -1px rgba(0,0,0,0.06), 0 4px 4px -2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.1)",
                  textDecoration: "none",
                  fontFamily: TYPE.fontFamily,
                  fontSize: TYPE.size.label,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  color: COLOR.textPrimary,
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
                  background: "linear-gradient(180deg, #F1F1F1 0%, #E4E4E4 100%)",
                  // Softly recessed groove — a light top inset (as if the
                  // surface curves down away from the light) and a dark
                  // bottom inset for depth, like the track is pressed in.
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06), inset 0 -1px 1px rgba(255,255,255,0.4)",
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
                  titleColor="#575757"
                  titleColorHover="#575757"
                  onCardOpen={openCaseStudy}
                  onClickSound={playV2Select}
                />
              </div>
            ) : (
              <div key="playground" role="tabpanel" aria-label="Playground" style={{ width: "100%" }}>
                <ProjectCards
                  projects={VIBE_PROJECTS}
                  gap={SPACING.lg}
                  rowGap={24}
                  cardGap={SPACING.sm}
                  titleColor="#575757"
                  titleColorHover="#575757"
                  onClickSound={playV2Select}
                  showCategoryBadge={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <V2ResponsiveStyles />

      {activeCaseStudy && (
        <CaseStudyNavContext.Provider value={openCaseStudyByHref}>
          <CaseStudySheet content={activeCaseStudy} onClose={closeCaseStudy} onRequestClose={() => setSheetRecede(false)} />
        </CaseStudyNavContext.Provider>
      )}

      {children}
    </div>
  )
}
