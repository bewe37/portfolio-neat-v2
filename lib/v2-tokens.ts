// Design tokens for the homepage design language — a standalone,
// fixed light-mode layout that does not participate in the site's
// dark/light theme switcher (see globals.css --c-* variables for that
// system). Any future page built in this same visual style should import
// from here rather than hardcoding hex/px values, so the two stay in sync.

export const COLOR = {
  // Surfaces
  bg: "#F9F9F9",
  surface: "#F5F5F5",
  surfaceRaised: "#FFFFFF",

  // Text — consolidated from what were 3 near-black and 2 near-grey
  // one-off values scattered across the page.
  textPrimary: "#1A1A1A", // names, active tab, hovered card title
  textSecondary: "#575757", // bio copy, default card title, "Product Designer"
  textTertiary: "#888888", // dates, footer line, social links
  textFaint: "#B7B7B7", // copyright line

  // Borders
  border: "#E0E0E0",
  borderHover: "#D4D4D4",

  // Accent (the one deliberate brand color — everything else stays neutral)
  accentFrom: "#5A5DE0",
  accentTo: "#4548C7",
  accentOutline: "#5F62FF",

  // Secondary button gradient — sits between surface and surfaceRaised.
  buttonSurfaceFrom: "#F2F2F2",
  buttonSurfaceTo: "#E8E8E8",
  buttonSurfaceHoverFrom: "#FAFAFA",
  buttonSurfaceHoverTo: "#EFEFEF",
} as const

// hex → rgba string, so every "textPrimary at N% opacity" usage (inactive
// tab color, sheet backdrop) derives from the token instead of being
// eyeballed as a standalone literal that can drift out of sync.
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 48,
} as const

export const RADIUS = {
  sm: 8, // buttons, tab buttons, cards
  md: 10, // tab pill track / container-level chrome
  lg: 12, // larger media containers (gallery box, case-study covers)
} as const

export const TYPE = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  // Two real sizes covered nearly everything already — kept as the scale.
  size: {
    label: 13, // dates, footer, social links, secondary button
    body: 14, // bio copy, card titles, tab labels, name/title
  },
  letterSpacing: "-0.01em",
} as const
