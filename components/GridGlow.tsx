"use client"

import { useEffect, useRef } from "react"

const CELL = 40

export default function GridGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  // per-cell glow intensity (0–1)
  const glowRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Size canvas to parent (the hero-grid div)
    const parent = container.parentElement
    if (!parent) return

    function resize() {
      if (!canvas || !parent) return
      canvas.width = parent.offsetWidth
      canvas.height = parent.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    function onMouseMove(e: MouseEvent) {
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    function onMouseLeave() {
      mouseRef.current = null
    }

    parent.addEventListener("mousemove", onMouseMove)
    parent.addEventListener("mouseleave", onMouseLeave)

    function draw() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const mouse = mouseRef.current
      const cols = Math.ceil(canvas.width / CELL)
      const rows = Math.ceil(canvas.height / CELL)

      // Determine which cell the mouse is in
      const activeCellCol = mouse ? Math.floor(mouse.x / CELL) : -1
      const activeCellRow = mouse ? Math.floor(mouse.y / CELL) : -1

      // Decay all glows, boost active cell
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = `${c},${r}`
          const current = glowRef.current.get(key) ?? 0
          const isActive = c === activeCellCol && r === activeCellRow
          const target = isActive ? 1 : 0
          const next = current + (target - current) * (isActive ? 0.18 : 0.06)
          if (next < 0.002) {
            glowRef.current.delete(key)
          } else {
            glowRef.current.set(key, next)
          }
        }
      }

      // Draw glowing cells
      glowRef.current.forEach((intensity, key) => {
        const [c, r] = key.split(",").map(Number)
        const x = c * CELL
        const y = r * CELL

        // Warm amber glow to match the portfolio palette
        ctx.fillStyle = `rgba(255, 107, 48, ${intensity * 0.12})`
        ctx.fillRect(x + 1, y + 1, CELL - 1, CELL - 1)
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      ro.disconnect()
      parent.removeEventListener("mousemove", onMouseMove)
      parent.removeEventListener("mouseleave", onMouseLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    </div>
  )
}
