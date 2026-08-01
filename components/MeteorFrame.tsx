"use client"

import { useEffect, useState } from "react"

interface Meteor {
  id: number
  top: number
  delay: number
  duration: number
  width: number
}

export default function MeteorFrame() {
  const [meteors, setMeteors] = useState<Meteor[]>([])

  useEffect(() => {
    const initial: Meteor[] = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      top: Math.random() * 200 - 50,
      delay: Math.random() * 8,
      duration: 4 + Math.random() * 4,
      width: 80 + Math.random() * 40,
    }))
    setMeteors(initial)
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {meteors.map((m) => (
        <div
          key={m.id}
          style={{
            position: "absolute",
            top: m.top,
            left: 0,
            width: m.width,
            height: 1,
            background: "linear-gradient(90deg, transparent, var(--c-ghost), transparent)",
            transform: "rotate(22.6deg)",
            opacity: 0,
            animation: `shimmerSlide ${m.duration}s ease-in-out ${m.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
