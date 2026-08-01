"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { useRouter } from "next/navigation"

// ─── Theme helpers ────────────────────────────────────────────────────────────

type Theme = "light" | "dark" | "sunset"

function applyTheme(theme: Theme) {
  const body = document.body
  body.classList.add("theme-switching")
  requestAnimationFrame(() => {
    body.classList.remove("dark", "sunset")
    if (theme !== "light") body.classList.add(theme)
    setTimeout(() => body.classList.remove("theme-switching"), 600)
  })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="6.5" cy="6.5" r="5" stroke="var(--c-dim)" strokeWidth="1.6" />
    <path d="M10.5 10.5L14 14" stroke="var(--c-dim)" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const col = (active: boolean) => active ? "rgb(255,107,48)" : "var(--c-secondary)"

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M1.5 6.5L7 2l5.5 4.5V12.5H9V9.5H5v3H1.5V6.5Z"
      stroke={col(active)} strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
)

const WorkIcon = ({ active }: { active: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="3.5" width="11" height="8" rx="1.5" stroke={col(active)} strokeWidth="1.3" />
    <path d="M5 3.5V2.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" stroke={col(active)} strokeWidth="1.3" />
    <path d="M1.5 7h11" stroke={col(active)} strokeWidth="1.3" />
  </svg>
)

const AboutIcon = ({ active }: { active: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="4.5" r="2.5" stroke={col(active)} strokeWidth="1.3" />
    <path d="M1.5 13c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke={col(active)} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const SunIcon = ({ active }: { active: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="7.5" r="3" stroke={col(active)} strokeWidth="1.3"/>
    <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.05 3.05l1.06 1.06M10.89 10.89l1.06 1.06M10.89 4.11l1.06-1.06M3.05 11.95l1.06-1.06"
      stroke={col(active)} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const MoonIcon = ({ active }: { active: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
    <path d="M12.5 9.5A5.5 5.5 0 0 1 5.5 2.5a5.5 5.5 0 1 0 7 7z"
      stroke={col(active)} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SunsetIcon = ({ active }: { active: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
    <path d="M1 11h13M4 11a3.5 3.5 0 0 1 7 0M7.5 2v1.5M1.5 5.5l1 1M13.5 5.5l-1 1"
      stroke={col(active)} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const MailIcon = ({ active }: { active: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke={col(active)} strokeWidth="1.3" />
    <path d="M1.5 4.5l5.5 4 5.5-4" stroke={col(active)} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const LinkIcon = ({ active }: { active: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M5.5 8.5a3.18 3.18 0 0 0 4.5 0l1.5-1.5a3.18 3.18 0 0 0-4.5-4.5L6 3.5"
      stroke={col(active)} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M8.5 5.5a3.18 3.18 0 0 0-4.5 0L2.5 7a3.18 3.18 0 0 0 4.5 4.5L8 10.5"
      stroke={col(active)} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface Command {
  id: string
  label: string
  shortcut?: string[]
  icon: (active: boolean) => React.ReactNode
  action: () => void
}

interface Group {
  name: string
  commands: Command[]
}

// ─── KbdBadge ─────────────────────────────────────────────────────────────────

const KBD_BG_ACTIVE   = "linear-gradient(in oklab 180deg, oklab(24.4% 0 0) 0%, oklab(21.3% 0 0) 100%)"
const KBD_BG_INACTIVE = "linear-gradient(in oklab 180deg, oklab(23.5% 0 0) 0%, oklab(20.9% 0 0) 100%)"
const KBD_SHADOW_ACTIVE   = "#FFFFFF1A 0px 1px 0px inset, #00000080 0px 2px 4px, #FFFFFF0D 0px 0px 0px 1px"
const KBD_SHADOW_INACTIVE = "#FFFFFF14 0px 1px 0px inset, #00000073 0px 2px 4px, #FFFFFF0A 0px 0px 0px 1px"

function KbdBadge({ label, active, small = false }: { label: string; active: boolean; small?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: small ? 18 : 20,
      minWidth: small ? 18 : 20,
      paddingInline: small ? 5 : 6,
      borderRadius: small ? 3 : 4,
      backgroundImage: active ? KBD_BG_ACTIVE : KBD_BG_INACTIVE,
      boxShadow: active ? KBD_SHADOW_ACTIVE : KBD_SHADOW_INACTIVE,
      fontFamily: "var(--font-sans)",
      fontSize: small ? 10 : 11,
      fontWeight: 500,
      color: active ? "rgb(255,107,48)" : "#686868",
      transition: "color 160ms ease, box-shadow 160ms ease",
    }}>
      {label}
    </div>
  )
}

// ─── CommandRow ───────────────────────────────────────────────────────────────

const ACTIVE_ROW_BG     = "linear-gradient(180deg, #2B2B2B 0%, #1F1F1F 100%)"
const ACTIVE_ROW_SHADOW = "#FFFFFF1C 0px 1px 0.5px inset, #FFFFFF24 0px 1px 2px inset, #00000070 0px 4px 10px -2px, #00000050 0px 1px 3px 0px"
const DIVIDER_BG = "linear-gradient(in oklab 90deg, oklab(0% 0 0 / 0%) 0%, oklab(34.4% 0 0) 50%, oklab(0% 0 0 / 0%) 100%)"

function CommandRow({ command, active, index, onHover, onClick }: {
  command: Command
  active: boolean
  index: number
  onHover: () => void
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.024, duration: 0.14, ease: "easeOut" }}
      style={{ flexShrink: 0 }}
    >
      <div
        onMouseEnter={onHover}
        onClick={onClick}
        style={{
          display: "flex", alignItems: "center",
          gap: 10, height: 36, paddingInline: 10,
          borderRadius: 7, cursor: "pointer",
          background: active ? ACTIVE_ROW_BG : "transparent",
          boxShadow: active ? ACTIVE_ROW_SHADOW : "none",
          transition: "box-shadow 160ms ease",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div style={{ width: 13, height: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {command.icon(active)}
        </div>
        <div style={{
          flex: 1,
          fontFamily: "var(--font-sans)",
          fontSize: "0.8125rem", letterSpacing: "-0.01em", lineHeight: "18px",
          color: active ? "rgb(255,107,48)" : "#8F8D8D",
          transition: "color 160ms ease",
        }}>
          {command.label}
        </div>
        {command.shortcut && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {command.shortcut.map((key) => (
              <KbdBadge key={key} label={key} active={active} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── CommandPalette ───────────────────────────────────────────────────────────

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [navFlash, setNavFlash] = useState<"up" | "down" | null>(null)
  const navFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reduced = useReducedMotion()

  const navigate = useCallback((href: string) => {
    onClose()
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener noreferrer")
    } else {
      router.push(href)
    }
  }, [onClose, router])

  const setTheme = useCallback((theme: Theme) => {
    applyTheme(theme)
    localStorage.setItem("theme", theme)
    onClose()
  }, [onClose])

  const ALL_GROUPS: Group[] = [
    {
      name: "Navigate",
      commands: [
        { id: "home",   label: "Home",         shortcut: ["G", "H"], icon: (a) => <HomeIcon active={a} />,  action: () => navigate("/") },
        { id: "work",   label: "Selected Work", icon: (a) => <WorkIcon active={a} />,  action: () => navigate("/#work") },
        { id: "about",  label: "About",         icon: (a) => <AboutIcon active={a} />, action: () => navigate("/about") },
      ],
    },
    {
      name: "Case Studies",
      commands: [
        { id: "amd-ai",    label: "AMD AI Overlay",       icon: (a) => <WorkIcon active={a} />, action: () => navigate("/amd_ai_project") },
        { id: "amd-ds",    label: "AMD Design System",    icon: (a) => <WorkIcon active={a} />, action: () => navigate("/amd_project") },
        { id: "fme",       label: "FME Annotation",       icon: (a) => <WorkIcon active={a} />, action: () => navigate("/fme_annotation_project") },
        { id: "blueprint", label: "Blueprint Dashboard",  icon: (a) => <WorkIcon active={a} />, action: () => navigate("/blueprint") },
      ],
    },
    {
      name: "Theme",
      commands: [
        { id: "theme-light",  label: "Light Mode",  icon: (a) => <SunIcon active={a} />,    action: () => setTheme("light") },
        { id: "theme-dark",   label: "Dark Mode",   icon: (a) => <MoonIcon active={a} />,   action: () => setTheme("dark") },
        { id: "theme-sunset", label: "Sunset Mode", icon: (a) => <SunsetIcon active={a} />, action: () => setTheme("sunset") },
      ],
    },
    {
      name: "Connect",
      commands: [
        { id: "email",    label: "Send an Email",     icon: (a) => <MailIcon active={a} />, action: () => navigate("mailto:bryanwinata112@gmail.com") },
        { id: "linkedin", label: "LinkedIn",          icon: (a) => <LinkIcon active={a} />, action: () => navigate("https://linkedin.com/in/georgius-bryan") },
      ],
    },
  ]

  const flashNav = (dir: "up" | "down") => {
    setNavFlash(dir)
    if (navFlashTimer.current) clearTimeout(navFlashTimer.current)
    navFlashTimer.current = setTimeout(() => setNavFlash(null), 600)
  }

  const filteredGroups = ALL_GROUPS
    .map((g) => ({ ...g, commands: g.commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())) }))
    .filter((g) => g.commands.length > 0)

  const flat = filteredGroups.flatMap((g) => g.commands)

  useEffect(() => {
    if (!flat.some((c) => c.id === activeId)) setActiveId(flat[0]?.id ?? null)
  }, [query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40)
      setQuery("")
      setActiveId(ALL_GROUPS[0].commands[0].id)
    }
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return }
    const idx = flat.findIndex((c) => c.id === activeId)
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveId(flat[(idx + 1) % flat.length]?.id ?? null); flashNav("down") }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveId(flat[(idx - 1 + flat.length) % flat.length]?.id ?? null); flashNav("up") }
    if (e.key === "Enter" && flat[idx]) { flat[idx].action(); }
  }, [flat, activeId, onClose])

  const spring = { type: "spring", stiffness: 440, damping: 32 } as const
  let rowIdx = 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 999,
              backgroundColor: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(2px)",
            }}
          />

          {/* Palette */}
          <motion.div
            key="palette"
            initial={{ opacity: 0, scale: reduced ? 1 : 0.95, y: reduced ? 0 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: spring }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : -6, transition: { duration: 0.14, ease: "easeIn" } }}
            style={{
              position: "fixed",
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              width: "min(560px, calc(100vw - 32px))",
              backgroundColor: "#181818",
              borderRadius: 14,
              boxShadow: "#FFFFFF24 0px 1px 0.5px inset, #FFFFFF4D 0px 1px 2px inset, #00000060 0px 30px 60px -20px, #FFFFFF03 0px 0px 0px 1px",
              display: "flex", flexDirection: "column", gap: 12,
              paddingBlock: 8, paddingInline: 8,
              overflow: "clip",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            }}
          >
            {/* Search well */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", height: 40,
              backgroundColor: "#080808", borderRadius: 8,
              paddingInline: 10, boxSizing: "border-box",
              boxShadow: "#000000B3 0px 3px 8px inset, #FFFFFF47 0px 0.5px 0px",
              flexShrink: 0,
            }}>
              <SearchIcon />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search…"
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem", fontWeight: 400,
                  color: "#c8c4bc", letterSpacing: "-0.01em",
                  caretColor: "rgb(255,107,48)",
                }}
              />
              <KbdBadge label="⌘K" active={false} small />
            </div>

            {/* Results */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
              {flat.length === 0 ? (
                <div style={{
                  padding: "20px 10px", textAlign: "center",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem", color: "#474747",
                }}>
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : (
                filteredGroups.map((group, gi) => (
                  <div key={group.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{
                      paddingInline: 10, paddingTop: gi === 0 ? 0 : 2,
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.6875rem", fontWeight: 500, lineHeight: 1, letterSpacing: "0.02em",
                      color: "#4a4a4a", textTransform: "uppercase",
                    }}>
                      {group.name}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {group.commands.map((cmd) => (
                        <CommandRow
                          key={cmd.id}
                          command={cmd}
                          active={activeId === cmd.id}
                          index={rowIdx++}
                          onHover={() => setActiveId(cmd.id)}
                          onClick={() => { cmd.action() }}
                        />
                      ))}
                    </div>
                    {gi < filteredGroups.length - 1 && (
                      <div style={{ height: 1, margin: "2px 0", backgroundImage: DIVIDER_BG }} />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer divider */}
            <div style={{ height: 1, backgroundImage: DIVIDER_BG, flexShrink: 0, marginTop: -4 }} />

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingInline: 10, paddingBottom: 2, marginTop: -4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ display: "flex", gap: 3 }}>
                  <KbdBadge label="↑" active={navFlash === "up"}   small />
                  <KbdBadge label="↓" active={navFlash === "down"} small />
                </div>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.6875rem", color: "#5B5B5B", letterSpacing: "0.01em" }}>Navigate</span>
              </div>
              {[{ keys: ["↵"], label: "Select" }, { keys: ["Esc"], label: "Dismiss" }].map(({ keys, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {keys.map((k) => <KbdBadge key={k} label={k} active={false} small />)}
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.6875rem", color: "#5B5B5B", letterSpacing: "0.01em" }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Provider (wraps the whole app) ──────────────────────────────────────────

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      {children}
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  )
}
