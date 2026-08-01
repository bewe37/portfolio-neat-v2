"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { House, User, ChatCircle, EnvelopeSimple, LinkedinLogo, XLogo } from "@phosphor-icons/react"
import { playClick } from "@/lib/click-sound"
import Link from "next/link"

/* ── Types ── */
type Theme = "light" | "dark" | "sunset"
const CYCLE: Record<Theme, Theme> = { light: "dark", dark: "sunset", sunset: "light" }

/* ── Theme icons ── */
function SunIcon()    { return <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.05 3.05l1.06 1.06M10.89 10.89l1.06 1.06M10.89 4.11l1.06-1.06M3.05 11.95l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function MoonIcon()   { return <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M12.5 9.5A5.5 5.5 0 0 1 5.5 2.5a5.5 5.5 0 1 0 7 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SunsetIcon() { return <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M1 11h13M4 11a3.5 3.5 0 0 1 7 0M7.5 2v1.5M1.5 5.5l1 1M13.5 5.5l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
const THEME_ICONS: Record<Theme, React.ReactNode> = { light: <SunIcon />, dark: <MoonIcon />, sunset: <SunsetIcon /> }

function applyTheme(theme: Theme) {
  const body = document.body
  body.classList.add("theme-switching")
  requestAnimationFrame(() => {
    body.classList.remove("dark", "sunset")
    if (theme !== "light") body.classList.add(theme)
    setTimeout(() => body.classList.remove("theme-switching"), 600)
  })
}

const CONTACTS = [
  { Icon: EnvelopeSimple, label: "Email",    href: "mailto:bryanwinata112@gmail.com" },
  { Icon: LinkedinLogo,   label: "LinkedIn", href: "https://www.linkedin.com/in/gbryanw/" },
  { Icon: XLogo,          label: "Twitter",   href: "https://x.com/gbryanwt" },
]

/* ── Divider ── */
function Divider() {
  return <span style={{ width: 1, height: 16, backgroundColor: "var(--border-mid)", flexShrink: 0, alignSelf: "center" }} />
}

/* ── Nav item ── */
function NavItem({ href, active, Icon, label, onClick }: {
  href?: string
  active: boolean
  Icon: React.ElementType
  label: string
  onClick?: () => void
}) {
  const inner = (
    <button
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer",
        height: 44, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 6,
        padding: active ? "0 16px" : "0 14px",
        color: active ? "var(--c-primary)" : "var(--c-dim)",
        transition: "color 0.2s ease, padding 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 500,
        letterSpacing: "-0.01em", whiteSpace: "nowrap",
      }}
    >
      <span style={{ display: "inline-flex", flexShrink: 0 }}>
        <Icon size={15} weight={active ? "fill" : "regular"} />
      </span>
      <motion.span
        initial={false}
        animate={{ width: active ? "auto" : 0, opacity: active ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ overflow: "hidden", display: "inline-block", whiteSpace: "nowrap" }}
      >
        {label}
      </motion.span>
    </button>
  )
  if (href) return <Link href={href} style={{ display: "contents", textDecoration: "none" }}>{inner}</Link>
  return inner
}

/* ── Inner nav — re-renders on pathname change, but pill shell does not ── */
function NavInner({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const activePath = usePathname()
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <>
      <NavItem href="/" active={activePath === "/"} label="Work" Icon={House} />
      <Divider />
      <NavItem href="/about" active={activePath === "/about"} label="About" Icon={User} />
      <Divider />
      <button
        onClick={() => { playClick(); setContactOpen(o => !o) }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          height: 44, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 14px",
          color: contactOpen ? "var(--c-primary)" : "var(--c-dim)",
          transition: "color 0.2s ease",
        }}
      >
        <ChatCircle size={15} weight={contactOpen ? "fill" : "regular"} />
      </button>

      <AnimatePresence initial={false}>
        {contactOpen && CONTACTS.map(({ Icon, label, href }, i) => (
          <motion.div
            key={label}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1], delay: i * 0.04 }}
            style={{ display: "flex", alignItems: "stretch", overflow: "hidden", flexShrink: 0 }}
          >
            <Divider />
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { playClick(); setContactOpen(false) }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "0 14px", height: 44,
                color: "var(--c-dim)", textDecoration: "none",
                fontFamily: "var(--font-sans)", fontSize: "0.8125rem", fontWeight: 500,
                letterSpacing: "-0.01em", whiteSpace: "nowrap",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--c-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--c-dim)")}
            >
              <Icon size={15} />
              <span>{label}</span>
            </a>
          </motion.div>
        ))}
      </AnimatePresence>

      <Divider />

      <button
        onClick={toggleTheme}
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "0 14px", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--c-dim)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ opacity: 0, rotate: -20, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 20, scale: 0.7 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "inline-flex" }}
          >
            {THEME_ICONS[theme]}
          </motion.span>
        </AnimatePresence>
      </button>
    </>
  )
}

/* ── Hamburger / X icon ── */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={open ? "x" : "menu"}
        initial={{ opacity: 0, rotate: open ? -45 : 45, scale: 0.7 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: open ? 45 : -45, scale: 0.7 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: "inline-flex" }}
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        )}
      </motion.span>
    </AnimatePresence>
  )
}

const NAV_STYLE: React.CSSProperties = {
  pointerEvents: "auto",
  height: 44,
  display: "flex", alignItems: "stretch",
  backgroundColor: "var(--bg)",
  border: "1px solid var(--border-mid)",
  borderRadius: 99,
  boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  overflow: "hidden",
}

/* ── Shell — never re-renders after mount ── */
export default function FloatingNav() {
  const [theme, setTheme] = useState<Theme>("light")
  const [atBottom, setAtBottom] = useState(false)
  const didAnimate = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null
    const initial: Theme = saved ?? "light"
    setTheme(initial)
    document.body.classList.remove("dark", "sunset")
    if (initial !== "light") document.body.classList.add(initial)
  }, [])

  useEffect(() => {
    function onScroll() {
      const distFromBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight
      setAtBottom(distFromBottom < 120)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function toggleTheme() {
    const next = CYCLE[theme]
    setTheme(next)
    applyTheme(next)
    localStorage.setItem("theme", next)
    playClick()
  }

  return (
    <div style={{
      position: "fixed", bottom: 24, left: 0, right: 0,
      display: "flex", justifyContent: "center",
      zIndex: 9999, pointerEvents: "none",
    }}>
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: atBottom ? 80 : 0, opacity: atBottom ? 0 : 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: didAnimate.current ? 0 : 0.1 }}
        onAnimationComplete={() => { didAnimate.current = true }}
        style={NAV_STYLE}
      >
        <NavInner theme={theme} toggleTheme={toggleTheme} />
      </motion.nav>
    </div>
  )
}
