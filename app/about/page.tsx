"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { COLOR, RADIUS, SPACING, TYPE } from "@/lib/v2-tokens"
import { playV2Click } from "@/lib/v2-sound"
import { SocialLinkGroup } from "@/components/SocialLinkGroup"

const GalleryCanvas = dynamic(
  () => import("@/components/InfiniteGallery").then(m => m.GalleryCanvas),
  { ssr: false }
)

const EXPERIENCE = [
  { company: "YU Blueprint", role: "Design Lead", period: "2026" },
  { company: "AMD", role: "Product Design Intern", period: "2025" },
  { company: "Safe Software", role: "Product Design Intern", period: "2024" },
  { company: "Vosyn", role: "Product Design Intern", period: "2023" },
]

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: 0, fontFamily: TYPE.fontFamily, fontSize: TYPE.size.label, fontWeight: 500, color: COLOR.textPrimary, letterSpacing: TYPE.letterSpacing }}>
      {children}
    </p>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: 0, fontFamily: TYPE.fontFamily, fontSize: TYPE.size.body, fontWeight: 400, color: COLOR.textSecondary, letterSpacing: TYPE.letterSpacing, lineHeight: 1.7 }}>
      {children}
    </p>
  )
}

export default function V2AboutPage() {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [expanded])

  useEffect(() => {
    if (!expanded) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setExpanded(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded])

  // Fullscreen is an instant swap, not an animated resize — a live WebGL
  // canvas fighting a framer-motion layout animation for its own sizing
  // kept producing rendering bugs (stretching, blank frames). Simpler and
  // reliable: mount a second, separate GalleryCanvas only when expanded,
  // same as the original /gallery page, just without the navigation.
  if (expanded) {
    return (
      <div style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "rgb(22,22,22)" }}>
        <GalleryCanvas fullPage showFilters showClose filterVariant="v2" disableFlip onSound={playV2Click} onClose={() => setExpanded(false)} />
      </div>
    )
  }

  return (
    <div
      className="rsp-v2-about-page"
      style={{
        height: "100dvh",
        width: "100%",
        background: COLOR.bg,
        display: "flex",
        overflow: "hidden",
      }}
    >
      <div
        className="rsp-v2-about-row"
        style={{
          display: "flex",
          alignItems: "stretch",
          // Matches the homepage's bio-to-content gap so the split sits at
          // the same place on screen when navigating between / and /about.
          gap: "clamp(56px, 4.5vw, 104px)",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Left — bio, ported from the current /about page. Width matches
            the homepage's bio column (340px) so the layout doesn't shift
            when navigating between /v2 and /v2/about. This column scrolls
            internally (the bio is taller than the viewport) while the
            gallery on the right stays fixed full-height, mirroring the
            homepage's split-scroll pattern. */}
        <div
          className="rsp-v2-about-bio-col"
          style={{
            width: 340,
            flexShrink: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
        <div
          className="rsp-v2-about-bio"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: SPACING.xxxl,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: `${SPACING.xl}px 0 ${SPACING.xl}px ${SPACING.xl}px`,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: SPACING.lg }}>
            <Link
              href="/"
              onClick={() => playV2Click()}
              className="v2-about-back-link"
              style={{
                display: "flex",
                alignItems: "center",
                gap: SPACING.xs,
                fontFamily: TYPE.fontFamily,
                fontSize: TYPE.size.label,
                letterSpacing: TYPE.letterSpacing,
                color: COLOR.textTertiary,
                textDecoration: "none",
                width: "fit-content",
                transition: "color 0.15s ease",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </Link>

            {/* About */}
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING.md }}>
              <Label>About</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: SPACING.lg }}>
                <Body>
                  Hey, I&apos;m Bryan, a product designer based in Toronto. Being outside, staying present, that&apos;s how I stay sharp. It forces me to pay attention differently, and that same eye is what I bring back to the screen.
                </Body>
              </div>
            </div>
          </div>

          {/* What I Believe */}
          <div style={{ display: "flex", flexDirection: "column", gap: SPACING.md }}>
            <Label>What I believe</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING.lg }}>
              <Body>
                Good design doesn&apos;t announce itself. The best interfaces feel inevitable. Complexity is real, I design through it, not away from it. The details are where trust is built or lost. And taste is everything, the thing that tells you something is right before you can explain why.
              </Body>
            </div>
          </div>

          {/* Experience */}
          <div style={{ display: "flex", flexDirection: "column", gap: SPACING.md }}>
            <Label>Experience</Label>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {EXPERIENCE.map((exp, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: SPACING.md,
                    padding: `${SPACING.sm}px 0`,
                    borderBottom: i < EXPERIENCE.length - 1 ? `1px solid ${COLOR.border}` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: SPACING.sm, minWidth: 0 }}>
                    <span style={{ fontFamily: TYPE.fontFamily, fontSize: TYPE.size.label, fontWeight: 500, color: COLOR.textPrimary, letterSpacing: TYPE.letterSpacing, whiteSpace: "nowrap" }}>
                      {exp.company}
                    </span>
                    <span style={{ fontFamily: TYPE.fontFamily, fontSize: TYPE.size.label, fontWeight: 400, color: COLOR.textTertiary, letterSpacing: TYPE.letterSpacing, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {exp.role}
                    </span>
                  </div>
                  <span style={{ fontFamily: TYPE.fontFamily, fontSize: TYPE.size.label, fontWeight: 400, color: COLOR.textFaint, letterSpacing: TYPE.letterSpacing, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {exp.period}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — sleep line + socials, pinned to the bottom of the bio
            column (not part of the scrollable area above), same content as
            the homepage's. Stays nested in bio-col on desktop (so it sits
            under the bio, sharing its 340px column); on mobile, bio-col
            switches to display:contents so this becomes a direct flex item
            of the row and can be reordered after the gallery on its own
            (see .rsp-v2-about-footer order below). */}
        <div
          className="rsp-v2-about-footer"
          style={{
            flexShrink: 0,
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
        </div>

        {/* Right — infinite photo gallery, fixed full-height. This
            container's own height is static (100% of the page's 100dvh,
            which itself never animates or resizes except on real window
            resize) — unlike the earlier framer-motion layout-animation
            case, there's no continuous mid-transition resize here for
            ResizeObserver to race against, so a container-relative
            canvas height is safe. */}
        <div
          className="rsp-v2-about-gallery"
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            padding: `${SPACING.xl}px ${SPACING.xl}px ${SPACING.xl}px 0`,
            boxSizing: "border-box",
          }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: RADIUS.lg, overflow: "hidden" }}>
            <GalleryCanvas fillParent onSound={playV2Click} onExpand={() => setExpanded(true)} />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          /* The desktop layout is a fixed 100dvh split-scroll (bio scrolls
             internally, gallery stays pinned full-height). Stacked on
             mobile, that no longer makes sense — the whole page scrolls
             naturally instead, like /v2's own mobile fallback. */
          .rsp-v2-about-page { height: auto !important; overflow: visible !important; }
          .rsp-v2-about-row { flex-direction: column !important; height: auto !important; gap: 0 !important; }
          .rsp-v2-about-row > div, .rsp-v2-about-row .rsp-v2-about-bio, .rsp-v2-about-row .rsp-v2-about-footer { width: 100% !important; height: auto !important; overflow: visible !important; }
          /* bio-col unwraps into the row so its two children (bio, footer)
             become independently orderable flex items alongside gallery —
             gallery reads first on mobile, footer last. display:contents
             keeps bio-col in the DOM (so > div here still selects it, which
             is why the wider selector above is needed for its children) but
             removes it from the box tree, so bio/footer/gallery all
             actually flex-lay-out as if bio-col weren't there. */
          .rsp-v2-about-bio-col { display: contents !important; }
          /* Both stacked sections get matching left/right padding once the
             two-column layout collapses. */
          .rsp-v2-about-bio { order: 1; overflow-y: visible !important; padding: ${SPACING.lg}px ${SPACING.lg}px 0 ${SPACING.lg}px !important; }
          .rsp-v2-about-gallery { order: 2; padding: ${SPACING.xl}px ${SPACING.lg}px ${SPACING.xxxl}px ${SPACING.lg}px !important; height: 70vh !important; }
          .rsp-v2-about-footer { order: 3; padding: ${SPACING.xl}px ${SPACING.lg}px ${SPACING.xxxl}px ${SPACING.lg}px !important; }
        }

        .v2-about-back-link:hover { color: ${COLOR.textSecondary} !important; }
        .v2-social-link:hover { color: ${COLOR.textSecondary} !important; }
      `}</style>
    </div>
  )
}
