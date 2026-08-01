"use client"

import { useEffect, useRef } from "react"

const SAMPLE_W  = 600
const SAMPLE_H  = 600
const MAX_PTS_MOBILE  = 8000
const MAX_PTS_DESKTOP = 18000
const DARKNESS_THRESHOLD = 4
const BAYER = [
   0,32, 8,40, 2,34,10,42,
  48,16,56,24,50,18,58,26,
  12,44, 4,36,14,46, 6,38,
  60,28,52,20,62,30,54,22,
   3,35,11,43, 1,33, 9,41,
  51,19,59,27,49,17,57,25,
  15,47, 7,39,13,45, 5,37,
  63,31,55,23,61,29,53,21,
]

function rand32(seed: number) {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// Smooth value noise — two octaves for organic drift
function smoothNoise(x: number, y: number, t: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const hash = (a: number, b: number, c: number) => {
    let h = ((a * 1619 + b * 31337 + c * 6271) ^ 0xdeadbeef) >>> 0
    h ^= h >> 16; h = Math.imul(h, 0x45d9f3b); h ^= h >> 16
    return (h >>> 0) / 0xffffffff
  }
  const n00 = hash(ix,   iy,   Math.floor(t))
  const n10 = hash(ix+1, iy,   Math.floor(t))
  const n01 = hash(ix,   iy+1, Math.floor(t))
  const n11 = hash(ix+1, iy+1, Math.floor(t))
  return (n00*(1-ux) + n10*ux) * (1-uy) + (n01*(1-ux) + n11*ux) * uy
}

function sampleFlower(img: HTMLImageElement): [number, number][] {
  if (!img.naturalWidth || !img.naturalHeight) return []
  const off = document.createElement("canvas")
  off.width  = SAMPLE_W
  off.height = SAMPLE_H
  const ctx = off.getContext("2d", { willReadFrequently: true })!
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, SAMPLE_W, SAMPLE_H)
  const ar = img.naturalWidth / img.naturalHeight
  let dw = SAMPLE_W * 0.9, dh = SAMPLE_H * 0.9
  if (ar > dw / dh) { dh = dw / ar } else { dw = dh * ar }
  const ddx = (SAMPLE_W - dw) / 2
  const ddy = (SAMPLE_H - dh) / 2
  ctx.drawImage(img, ddx, ddy, dw, dh)
  const data = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data
  const pts: [number, number][] = []
  for (let y = 0; y < SAMPLE_H; y++) {
    for (let x = 0; x < SAMPLE_W; x++) {
      const i   = (y * SAMPLE_W + x) * 4
      const lum = 0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2]
      const darkness = 255 - lum
      if (darkness < DARKNESS_THRESHOLD) continue
      const thr = (BAYER[(y % 8) * 8 + (x % 8)] / 63) * 255
      if (darkness * 2.2 > thr) pts.push([x / SAMPLE_W, y / SAMPLE_H])
    }
  }
  const maxPts = typeof window !== "undefined" && window.innerWidth >= 768 ? MAX_PTS_DESKTOP : MAX_PTS_MOBILE
  if (pts.length <= maxPts) return pts
  const step = pts.length / maxPts
  return Array.from({ length: maxPts }, (_, i) => pts[Math.floor(i * step)])
}

interface Particle {
  homeX: number; homeY: number
  x: number; y: number
  vx: number; vy: number
  // idle drift
  noiseOffX: number   // unique noise coords per particle
  noiseOffY: number
  orbitPhase: number
  orbitSpeed: number
  // flower target (normalised)
  roseTX: number; roseTY: number
  swayPhase: number
  swayAmt: number
  size:  number
  alpha: number
  ringDist: number   // distance from center, updated each frame for falloff
  scrollDelay: number // 0=sucked first (outer), 1=sucked last (inner)
}

// module-level cache — keyed by resolution so desktop/mobile get their own sample
const cachedRosePoints: Record<string, [number, number][]> = {}
let roseImgPromise: Promise<HTMLImageElement> | null = null

function loadRosePoints(): Promise<[number, number][]> {
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768
  const key = isDesktop ? "desktop" : "mobile"
  if (cachedRosePoints[key]) return Promise.resolve(cachedRosePoints[key])
  const imgPromise = roseImgPromise ?? (roseImgPromise = (async () => {
    const img = new Image()
    img.src = "/roses.png"
    try { await img.decode() } catch { /* fallback to onload */ await new Promise(r => { img.onload = r; img.onerror = r }) }
    return img
  })())
  return imgPromise.then(img => {
    const pts = sampleFlower(img)
    cachedRosePoints[key] = pts
    return pts
  })
}

export default function HeroParticles({ hovered, scrollProgress = 0 }: { hovered: boolean; scrollProgress?: number }) {
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const hoveredRef      = useRef(false)
  const rafRef          = useRef(0)
  const visibleRef      = useRef(true)
  const ptsRef          = useRef<Particle[]>([])
  const transRef        = useRef(0)
  const timeRef         = useRef(0)
  const lastTRef        = useRef<number | null>(null)
  const mouseRef        = useRef<{ x: number; y: number } | null>(null)
  const scrollRef       = useRef(0)
  const smoothScrollRef = useRef(0)
  const roseMapRef      = useRef<{
    cx: number; cy: number; scale: number
    minX: number; minY: number; spanX: number; spanY: number
  } | null>(null)

  useEffect(() => { hoveredRef.current = hovered }, [hovered])
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return
    scrollRef.current = scrollProgress
  }, [scrollProgress])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const dpr = window.devicePixelRatio || 1
    let W = 0, H = 0

    function buildParticles(raw: [number, number][], w: number, h: number) {
      const rng = rand32(42)
      let minX = 1, maxX = 0, minY = 1, maxY = 0
      for (const [nx, ny] of raw) {
        if (nx < minX) minX = nx; if (nx > maxX) maxX = nx
        if (ny < minY) minY = ny; if (ny > maxY) maxY = ny
      }
      const spanX = maxX - minX || 1
      const spanY = maxY - minY || 1
      const fitSize = Math.min(w, h) * 0.65
      const scale   = Math.min(fitSize / spanX, fitSize / spanY)
      roseMapRef.current = { cx: w / 2, cy: h / 2, scale, minX, minY, spanX, spanY }

      ptsRef.current = raw.map(([nx, ny]) => {
        const gauss = () => {
          const u = Math.max(1e-10, rng()), v = rng()
          return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
        }
        const spread = Math.min(w, h) * 0.17
        const homeX = w / 2 + gauss() * spread
        const homeY = h / 2 + gauss() * spread

        // Sway amount: particles near the top of the flower sway more (pendulum effect)
        // ny is 0=top, 1=bottom — top petals swing wider
        const swayAmt = Math.max(0, 1 - ny) * 12 + 3

        // Particles farther from center get sucked first (0 = first, 1 = last)
        const distFromCenter = Math.hypot(homeX - w / 2, homeY - h / 2) / (Math.min(w, h) * 0.5)
        const scrollDelay = Math.max(0, Math.min(1, 1 - distFromCenter + rng() * 0.15))

        return {
          homeX, homeY,
          x: homeX, y: homeY,
          vx: 0, vy: 0,
          noiseOffX: rng() * 100,
          noiseOffY: rng() * 100,
          orbitPhase: rng() * Math.PI * 2,
          orbitSpeed: (0.008 + rng() * 0.014) * (rng() > 0.5 ? 1 : -1),
          roseTX: nx, roseTY: ny,
          swayPhase: rng() * Math.PI * 2,
          swayAmt,
          size:  rng() > 0.72 ? 2 : 1,
          alpha: 0.35 + rng() * 0.5,
          ringDist: 0,
          scrollDelay,
        }
      })
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    function resize(widthChanged: boolean) {
      const rect = canvas!.getBoundingClientRect()
      const newW = Math.round(rect.width)
      const newH = Math.round(rect.height)
      if (newW === W && newH === H) return
      const prevW = W
      W = newW; H = newH
      canvas!.width  = W * dpr
      canvas!.height = H * dpr
      // only rebuild particles if width changed — height-only changes are mobile chrome bar showing/hiding
      if (widthChanged || newW !== prevW) {
        loadRosePoints().then(pts => buildParticles(pts, W, H))
      }
    }
    function debouncedResize() {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => resize(false), 250)
    }
    resize(true)
    const ro = new ResizeObserver(debouncedResize)
    ro.observe(canvas)

    let cachedColor = getComputedStyle(document.body).getPropertyValue("--particle-color").trim() || "rgba(22,22,22,0.88)"

    function loop(ts: number) {
      if (!visibleRef.current) { rafRef.current = 0; return }
      rafRef.current = requestAnimationFrame(loop)

      if (lastTRef.current === null) lastTRef.current = ts
      const dt = Math.min((ts - lastTRef.current) / 1000, 0.05)
      lastTRef.current = ts
      timeRef.current += dt
      const t = timeRef.current

      transRef.current += ((hoveredRef.current ? 1 : 0) - transRef.current) * 0.045
      const tr      = transRef.current
      const pts     = ptsRef.current
      const roseMap = roseMapRef.current
      // Smooth the scroll value so return is gradual, not a snap
      smoothScrollRef.current += (scrollRef.current - smoothScrollRef.current) * 0.12
      const scroll = smoothScrollRef.current

      // Global wind — slow primary + faster wobble for organic feel
      const windSway  = Math.sin(t * 0.32) * 1.0 + Math.sin(t * 0.87) * 0.45 + Math.sin(t * 1.7) * 0.15
      const windDrift = Math.sin(t * 0.19) * 0.6 + Math.sin(t * 0.53) * 0.2

      // Read color every 30 frames — cheap theme awareness without per-frame cost
      if (Math.round(t * 60) % 30 === 0) {
        cachedColor = getComputedStyle(document.body).getPropertyValue("--particle-color").trim() || "rgba(22,22,22,0.88)"
      }
      ctx.clearRect(0, 0, W * dpr, H * dpr)
      ctx.fillStyle = cachedColor

      for (const p of pts) {
        // Per-particle staged scroll — outer particles activate first
        const suctionStart = p.scrollDelay * 0.5
        const localScroll  = Math.max(0, Math.min(1, (scroll - suctionStart) / Math.max(0.001, 1 - suctionStart)))

        if (localScroll > 0) {
          // Suction toward bottom-center vanishing point
          const vpX  = W / 2
          const vpY  = H * 1.1
          const dx   = vpX - p.x
          const dy   = vpY - p.y
          const dist = Math.hypot(dx, dy) || 1
          const pull = localScroll * localScroll * 22
          p.vx = (p.vx + (dx / dist) * pull) * 0.78
          p.vy = (p.vy + (dy / dist) * pull) * 0.80
          p.x += p.vx
          p.y += p.vy
        } else {
          // Normal idle / hover physics — only runs when scroll = 0
          if (tr > 0.01 && roseMap) {
            const { cx, cy, scale, minX, minY, spanX, spanY } = roseMap
            let tx = cx + (p.roseTX - (minX + spanX / 2)) * scale
            let ty = cy + (p.roseTY - (minY + spanY / 2)) * scale
            const sway    = windSway  * p.swayAmt * 2.2 * tr
            const breathe = windDrift * (p.swayAmt * 0.5) * tr
            tx += sway
            ty += breathe
            p.vx = (p.vx + (tx - p.x) * 0.012) * 0.88
            p.vy = (p.vy + (ty - p.y) * 0.012) * 0.88
            p.x += p.vx
            p.y += p.vy
          } else {
            const nx  = smoothNoise(p.noiseOffX + t * 0.12, p.noiseOffY, 0)
            const ny  = smoothNoise(p.noiseOffX, p.noiseOffY + t * 0.10, 1)
            const nx2 = smoothNoise(p.noiseOffX * 2.1 + t * 0.07, p.noiseOffY * 2.1, 2) * 0.4
            const ny2 = smoothNoise(p.noiseOffX * 2.1, p.noiseOffY * 2.1 + t * 0.09, 3) * 0.4
            const driftX = (nx + nx2 - 0.7) * 80
            const driftY = (ny + ny2 - 0.7) * 80
            let idleX = p.homeX + driftX
            let idleY = p.homeY + driftY

            const textPx = Math.min(Math.max(W * 0.016, 16), 22)
            const textW  = textPx * 22
            const repelR = Math.max(textW * 0.75, Math.min(W, H) * 0.14)
            const tdx    = idleX - W / 2
            const tdy    = idleY - H / 2
            const tdist  = Math.hypot(tdx, tdy) || 1
            if (tdist < repelR) {
              const push = Math.pow((repelR - tdist) / repelR, 1.6) * 0.42
              idleX += (tdx / tdist) * push * repelR
              idleY += (tdy / tdist) * push * repelR
            }
            p.ringDist = tdist

            const mouse = mouseRef.current
            if (mouse) {
              const mdx   = idleX - mouse.x
              const mdy   = idleY - mouse.y
              const mdist = Math.hypot(mdx, mdy) || 1
              const mR    = 90
              if (mdist < mR) {
                const push = Math.pow((mR - mdist) / mR, 2) * 60
                idleX += (mdx / mdist) * push
                idleY += (mdy / mdist) * push
              }
            }

            // Lerp back toward idle — faster in first 2s so particles settle quickly on load
            p.vx = 0
            p.vy = 0
            const lerpSpeed = t < 2 ? 0.06 - t * 0.026 : 0.008
            p.x += (idleX - p.x) * lerpSpeed
            p.y += (idleY - p.y) * lerpSpeed
          }
        }

        // Fade: staged per-particle, tied to its own localScroll
        const pulse     = tr < 0.5 ? 0.82 + 0.18 * Math.sin(t * 0.8 + p.swayPhase) : 1
        const baseAlpha = tr > 0.5 ? p.alpha * tr : p.alpha * 0.8 * pulse
        const alpha     = baseAlpha * Math.max(0, 1 - localScroll * 2)

        if (alpha <= 0) continue

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
        const sz = p.size * dpr
        ctx.fillRect(Math.round(p.x * dpr), Math.round(p.y * dpr), sz, sz)
      }

      ctx.globalAlpha = 1
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        mouseRef.current = { x, y }
      } else {
        mouseRef.current = null
      }
    }
    function onMouseLeave() { mouseRef.current = null }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseleave", onMouseLeave)

    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting
      if (e.isIntersecting && !rafRef.current) {
        lastTRef.current = null
        rafRef.current = requestAnimationFrame(loop)
      }
    }, { threshold: 0 })
    io.observe(canvas)

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect(); io.disconnect()
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseleave", onMouseLeave)
      if (resizeTimer) clearTimeout(resizeTimer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", touchAction: "pan-y", pointerEvents: "none" }}
    />
  )
}
