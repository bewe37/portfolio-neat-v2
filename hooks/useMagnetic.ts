"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

export function useMagnetic(strength = 0.35, radius = 80) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < radius) {
        const pull = (1 - dist / radius) * strength
        gsap.to(el, {
          x: dx * pull * 2.5,
          y: dy * pull * 2.5,
          duration: 0.4,
          ease: "power2.out",
          overwrite: true,
        })
      } else {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.4)",
          overwrite: true,
        })
      }
    }

    function onLeave() {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.35)",
        overwrite: true,
      })
    }

    window.addEventListener("mousemove", onMove)
    el.addEventListener("mouseleave", onLeave)

    return () => {
      window.removeEventListener("mousemove", onMove)
      el.removeEventListener("mouseleave", onLeave)
      gsap.killTweensOf(el)
    }
  }, [strength, radius])

  return ref
}
