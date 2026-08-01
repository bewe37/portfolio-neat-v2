"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { BUDDIES, getBuddy, type BuddyDef } from "@/lib/buddies"
import { SpriteView } from "@/components/SpriteBuddy"

const DEFAULT_BUDDY = BUDDIES.find(b => b.id === "fox")!
const SCALE = 3

const LINES = [
  "psst. click me.",
  "i follow you around. it's fine.",
  "i won't judge your scroll speed.",
  "free companion. no strings.",
  "i sit. i vibe. i judge fonts.",
  "pick me. or the cat. but pick me.",
  "i have 6 animations. very impressive.",
  "legally distinct from a pet.",
  "i've been sitting here for days.",
  "click. you know you want to.",
]

export default function CompanionThumbnail() {
  const [lineIdx, setLineIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const [buddy, setBuddy] = useState<BuddyDef>(DEFAULT_BUDDY)

  useEffect(() => {
    function load() {
      const id = localStorage.getItem("buddyId")
      if (id && id !== "none" && id !== "custom") {
        const found = getBuddy(id)
        if (found) setBuddy(found)
      } else {
        setBuddy(DEFAULT_BUDDY)
      }
    }
    load()
    window.addEventListener("buddySelected", load)
    return () => window.removeEventListener("buddySelected", load)
  }, [])

  useEffect(() => {
    const initial = setTimeout(() => {
      setVisible(true)
      const interval = setInterval(() => {
        setVisible(false)
        setTimeout(() => {
          setLineIdx(i => (i + 1) % LINES.length)
          setVisible(true)
        }, 400)
      }, 3500)
      return () => clearInterval(interval)
    }, 1200)
    return () => clearTimeout(initial)
  }, [])

  return (
    <div style={{
      width: "100%", height: "100%",
      backgroundImage: "url('/companionBG.png')",
      backgroundSize: "cover",
      backgroundPosition: "left",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Anchor point — percentage based so creature stays fixed on the grass */}
      <div style={{
        position: "absolute",
        bottom: "22%",
        right: "5%",
      }}>
        {/* Speech bubble — positioned relative to creature anchor */}
        <AnimatePresence>
          {visible && (
            <motion.div
              key={lineIdx}
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                position: "absolute",
                bottom: "60%",
                right: 0,
                marginBottom: 0,
                background: "#ffffff",
                border: "1px solid #e8e8e8",
                borderRadius: 10,
                padding: "7px 11px",
                fontSize: "0.6875rem",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                color: "#222222",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              {LINES[lineIdx]}
              <div style={{
                position: "absolute",
                bottom: -5, right: 18,
                width: 8, height: 8,
                background: "#ffffff",
                border: "1px solid #e8e8e8",
                borderTop: "none", borderLeft: "none",
                transform: "rotate(45deg)",
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ lineHeight: 0 }}>
          <SpriteView buddy={buddy} animKey={buddy.idleAnim} scale={SCALE} />
        </div>
      </div>
    </div>
  )
}
