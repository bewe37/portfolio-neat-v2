import {
    useRef,
    useEffect,
    useCallback,
    useState,
    startTransition,
} from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DitherAlgorithm = "floyd-steinberg" | "bayer" | "blue-noise"

interface DitherOpts {
    threshold: number
    serpentine: boolean
    errorStrength: number
}

interface ProcessedImage {
    grayscale: Uint8Array
    alpha: Uint8Array
    width: number
    height: number
}

interface Shockwave {
    x: number
    y: number
    start: number
}

interface DotSystem {
    count: number
    baseX: Float32Array
    baseY: Float32Array
    dx: Float32Array
    dy: Float32Array
    brightness: Float32Array
    tint: Float32Array
    size: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// prettier-ignore
const BAYER_8X8 = [
     0, 32,  8, 40,  2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44,  4, 36, 14, 46,  6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
     3, 35, 11, 43,  1, 33,  9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47,  7, 39, 13, 45,  5, 37,
    63, 31, 55, 23, 61, 29, 53, 21,
]

const SHOCKWAVE_SPEED = 225
const SHOCKWAVE_WIDTH = 37
const SHOCKWAVE_STRENGTH = 20
const SHOCKWAVE_DURATION = 675
const MOUSE_RADIUS = 100
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS
const MOUSE_FORCE_PEAK = 40
const EASING = 0.12
const SNAP_THRESHOLD = 0.01

// ---------------------------------------------------------------------------
// Dither algorithms
// ---------------------------------------------------------------------------

function floydSteinberg(
    grayscale: Uint8Array,
    width: number,
    height: number,
    opts: DitherOpts,
    alpha?: Uint8Array
): Float32Array {
    const errors = new Float32Array(width * height)
    for (let i = 0; i < grayscale.length; i++) errors[i] = grayscale[i]

    const positions: number[] = []
    const strength = opts.errorStrength
    const hasAlpha = alpha && alpha.length === grayscale.length

    for (let y = 0; y < height; y++) {
        const leftToRight = !opts.serpentine || y % 2 === 0
        const startX = leftToRight ? 0 : width - 1
        const endX = leftToRight ? width : -1
        const step = leftToRight ? 1 : -1

        for (let x = startX; x !== endX; x += step) {
            const idx = y * width + x
            if (hasAlpha && alpha[idx] < 128) continue

            const oldVal = errors[idx]
            const newVal = oldVal > opts.threshold ? 255 : 0
            const err = (oldVal - newVal) * strength

            if (newVal > 0) positions.push(x, y)

            const diffuse = (nx: number, ny: number, w: number) => {
                if (nx < 0 || nx >= width || ny >= height) return
                const ni = ny * width + nx
                if (hasAlpha && alpha[ni] < 128) return
                errors[ni] += err * w
            }

            diffuse(x + step, y, 7 / 16)
            diffuse(x - step, y + 1, 3 / 16)
            diffuse(x, y + 1, 5 / 16)
            diffuse(x + step, y + 1, 1 / 16)
        }
    }

    return new Float32Array(positions)
}

function bayerDither(
    grayscale: Uint8Array,
    width: number,
    height: number,
    opts: DitherOpts,
    alpha?: Uint8Array
): Float32Array {
    const positions: number[] = []
    const bias = (opts.threshold - 128) / 255
    const hasAlpha = alpha && alpha.length === grayscale.length

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            if (hasAlpha && alpha[idx] < 128) continue
            const luma = grayscale[idx] / 255
            const bayerVal = (BAYER_8X8[(y & 7) * 8 + (x & 7)] + 1) / 65
            if (luma + bias > bayerVal) positions.push(x, y)
        }
    }

    return new Float32Array(positions)
}

function blueNoiseDither(
    grayscale: Uint8Array,
    width: number,
    height: number,
    noiseData: Uint8Array,
    noiseSize: number,
    opts: DitherOpts,
    alpha?: Uint8Array
): Float32Array {
    const positions: number[] = []
    const bias = (opts.threshold - 128) / 255
    const hasAlpha = alpha && alpha.length === grayscale.length

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            if (hasAlpha && alpha[idx] < 128) continue
            const luma = grayscale[idx] / 255
            const nx = x % noiseSize
            const ny = y % noiseSize
            const noiseVal = noiseData[ny * noiseSize + nx] / 255
            if (luma + bias > noiseVal) positions.push(x, y)
        }
    }

    return new Float32Array(positions)
}

function generateBlueNoise(size: number): Uint8Array {
    const data = new Uint8Array(size * size)
    for (let i = 0; i < data.length; i++)
        data[i] = Math.floor(Math.random() * 256)

    for (let pass = 0; pass < 3; pass++) {
        const blurred = new Float32Array(data.length)
        const r = 2
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let sum = 0
                let count = 0
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        sum += data[((y + dy + size) % size) * size + ((x + dx + size) % size)]
                        count++
                    }
                }
                blurred[y * size + x] = sum / count
            }
        }
        for (let i = 0; i < data.length; i++) {
            const diff = data[i] - blurred[i]
            data[i] = Math.max(0, Math.min(255, Math.round(data[i] + diff * 0.5)))
        }
    }

    return data
}

function roundedSquareMask(
    w: number,
    h: number,
    radiusPct = 0.22
): Set<number> {
    const r = Math.round(radiusPct * Math.min(w, h))
    const mask = new Set<number>()

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let inside = false
            if (x >= r && x < w - r) {
                inside = y >= 0 && y < h
            } else if (y >= r && y < h - r) {
                inside = x >= 0 && x < w
            } else {
                const cx = x < r ? r : w - r - 1
                const cy = y < r ? r : h - r - 1
                const dx = x - cx
                const dy = y - cy
                inside = dx * dx + dy * dy <= r * r
            }
            if (inside) mask.add(y * w + x)
        }
    }

    return mask
}

function invertWithMask(
    positions: Float32Array,
    gridW: number,
    gridH: number,
    radiusPct = 0.22,
    alpha?: Uint8Array
): Float32Array {
    const mask = roundedSquareMask(gridW, gridH, radiusPct)
    const logoSet = new Set<number>()
    for (let i = 0; i < positions.length; i += 2) {
        logoSet.add(
            Math.round(positions[i + 1]) * gridW + Math.round(positions[i])
        )
    }

    const inverted: number[] = []
    for (const idx of mask) {
        if (!logoSet.has(idx)) {
            if (alpha && alpha[idx] < 128) continue
            inverted.push(idx % gridW, Math.floor(idx / gridW))
        }
    }

    return new Float32Array(inverted)
}

// ---------------------------------------------------------------------------
// Image processing
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

function processImage(
    img: HTMLImageElement,
    maxDimension: number,
    scale: number,
    contrast: number,
    gamma: number,
    blur: number,
    highlightsCompression = 0
): ProcessedImage {
    const aspect = img.naturalWidth / img.naturalHeight
    let outW: number, outH: number
    if (aspect >= 1) {
        outW = maxDimension
        outH = Math.round(maxDimension / aspect)
    } else {
        outH = maxDimension
        outW = Math.round(maxDimension * aspect)
    }

    const srcW = img.naturalWidth
    const srcH = img.naturalHeight

    const alphaCanvas = document.createElement("canvas")
    alphaCanvas.width = outW
    alphaCanvas.height = outH
    const alphaCtx = alphaCanvas.getContext("2d")!
    alphaCtx.imageSmoothingEnabled = true
    alphaCtx.imageSmoothingQuality = "high"
    alphaCtx.drawImage(img, 0, 0, outW, outH)
    const alphaData = alphaCtx.getImageData(0, 0, outW, outH).data

    const pad = Math.ceil(blur * 3)
    const srcCanvas = document.createElement("canvas")
    srcCanvas.width = srcW + pad * 2
    srcCanvas.height = srcH + pad * 2
    const srcCtx = srcCanvas.getContext("2d")!

    if (blur > 0) srcCtx.filter = `blur(${blur}px)`
    srcCtx.drawImage(img, pad, pad, srcW, srcH)
    srcCtx.filter = "none"

    const canvas = document.createElement("canvas")
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext("2d")!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(srcCanvas, pad, pad, srcW, srcH, 0, 0, outW, outH)

    const imageData = ctx.getImageData(0, 0, outW, outH)
    const pixels = imageData.data

    const sampledW = Math.ceil(outW / scale)
    const sampledH = Math.ceil(outH / scale)
    const grayscale = new Uint8Array(sampledW * sampledH)
    const alpha = new Uint8Array(sampledW * sampledH)
    const contrastFactor =
        (259 * (contrast + 255)) / (255 * (259 - contrast))

    for (let sy = 0; sy < sampledH; sy++) {
        for (let sx = 0; sx < sampledW; sx++) {
            const px = Math.min(Math.round(sx * scale), outW - 1)
            const py = Math.min(Math.round(sy * scale), outH - 1)
            const idx = (py * outW + px) * 4

            const r = pixels[idx]
            const g = pixels[idx + 1]
            const b = pixels[idx + 2]
            const blurredAlpha = pixels[idx + 3] / 255

            alpha[sy * sampledW + sx] = alphaData[idx + 3]

            let luma: number
            if (blurredAlpha > 0.01) {
                luma = (0.299 * r + 0.587 * g + 0.114 * b) / blurredAlpha
            } else {
                luma = 0
            }

            if (contrast !== 0) {
                luma = contrastFactor * (luma - 128) + 128
            }

            if (gamma !== 1.0) {
                luma = 255 * Math.pow(Math.max(0, luma / 255), 1 / gamma)
            }

            if (highlightsCompression > 0) {
                const norm = luma / 255
                const compressed =
                    norm < 0.5
                        ? norm
                        : 0.5 + (norm - 0.5) * (1 - highlightsCompression)
                luma = compressed * 255
            }

            grayscale[sy * sampledW + sx] = Math.max(
                0,
                Math.min(255, Math.round(luma))
            )
        }
    }

    return { grayscale, alpha, width: sampledW, height: sampledH }
}

// ---------------------------------------------------------------------------
// Particle system
// ---------------------------------------------------------------------------

function createDotSystem(
    points: Float32Array,
    scaleFactor: number,
    dotScale: number,
    offsetX: number,
    offsetY: number
): DotSystem {
    const count = points.length / 2
    const baseX = new Float32Array(count)
    const baseY = new Float32Array(count)
    const dx = new Float32Array(count)
    const dy = new Float32Array(count)
    const brightness = new Float32Array(count)
    const tint = new Float32Array(count)

    for (let i = 0; i < count; i++) {
        baseX[i] = offsetX + points[i * 2] * scaleFactor
        baseY[i] = offsetY + points[i * 2 + 1] * scaleFactor
        brightness[i] = 1
        tint[i] = 1
    }

    return {
        count,
        baseX,
        baseY,
        dx,
        dy,
        brightness,
        tint,
        size: scaleFactor * dotScale,
    }
}

function updateDots(
    sys: DotSystem,
    mouseX: number,
    mouseY: number,
    mouseActive: boolean,
    shockwaves: Shockwave[],
    now: number
): boolean {
    const { count, baseX, baseY, dx, dy } = sys

    let numActive = shockwaves.length
    for (let k = shockwaves.length - 1; k >= 0; k--) {
        if (now - shockwaves[k].start >= SHOCKWAVE_DURATION) {
            shockwaves.splice(k, 1)
            numActive--
        }
    }

    const shockMultiplier = numActive > 0 ? 1 + 0.5 * (numActive - 1) : 0
    let hasMotion = false

    for (let i = 0; i < count; i++) {
        let targetFx = 0
        let targetFy = 0

        if (mouseActive) {
            const vx = baseX[i] + dx[i] - mouseX
            const vy = baseY[i] + dy[i] - mouseY
            const dist2 = vx * vx + vy * vy

            if (dist2 > 0.1 && dist2 < MOUSE_RADIUS_SQ) {
                const dist = Math.sqrt(dist2)
                const falloff = 1 - dist / MOUSE_RADIUS
                const force =
                    falloff * falloff * falloff * MOUSE_FORCE_PEAK
                targetFx += (vx / dist) * force
                targetFy += (vy / dist) * force
            }
        }

        for (let k = 0; k < shockwaves.length; k++) {
            const sw = shockwaves[k]
            const elapsed = now - sw.start
            const radius = (elapsed / 1000) * SHOCKWAVE_SPEED
            const life = 1 - elapsed / SHOCKWAVE_DURATION

            const sx = baseX[i] - sw.x
            const sy = baseY[i] - sw.y
            const dist = Math.sqrt(sx * sx + sy * sy)

            if (dist >= 0.1) {
                const band = Math.abs(dist - radius)
                if (band < SHOCKWAVE_WIDTH) {
                    const waveForce =
                        (1 - band / SHOCKWAVE_WIDTH) *
                        life *
                        SHOCKWAVE_STRENGTH *
                        shockMultiplier
                    targetFx += (sx / dist) * waveForce
                    targetFy += (sy / dist) * waveForce
                }
            }
        }

        dx[i] += (targetFx - dx[i]) * EASING
        dy[i] += (targetFy - dy[i]) * EASING

        if (Math.abs(dx[i]) < SNAP_THRESHOLD) dx[i] = 0
        if (Math.abs(dy[i]) < SNAP_THRESHOLD) dy[i] = 0

        if (dx[i] !== 0 || dy[i] !== 0) hasMotion = true
    }

    return hasMotion || shockwaves.length > 0 || mouseActive
}

function renderDots(
    ctx: CanvasRenderingContext2D,
    sys: DotSystem,
    colorR: number,
    colorG: number,
    colorB: number,
    canvasW: number,
    canvasH: number,
    dpr: number
): void {
    ctx.clearRect(0, 0, canvasW * dpr, canvasH * dpr)

    const buckets: number[][] = new Array(126)
    for (let z = 0; z < 126; z++) buckets[z] = []

    for (let i = 0; i < sys.count; i++) {
        const bucket =
            6 * Math.round(20 * sys.brightness[i]) +
            Math.round(5 * sys.tint[i])
        buckets[Math.max(0, Math.min(125, bucket))].push(i)
    }

    const size = sys.size * dpr
    const pad = 0.25 * dpr
    const padSize = 0.5 * dpr

    for (let z = 0; z < 126; z++) {
        const ids = buckets[z]
        if (ids.length === 0) continue

        const a = Math.floor(z / 6) / 20
        ctx.fillStyle = `rgba(${colorR},${colorG},${colorB},${a})`

        for (let j = 0; j < ids.length; j++) {
            const i = ids[j]
            const rx = (sys.baseX[i] + sys.dx[i]) * dpr
            const ry = (sys.baseY[i] + sys.dy[i]) * dpr
            ctx.fillRect(rx - pad, ry - pad, size + padSize, size + padSize)
        }
    }
}

// ---------------------------------------------------------------------------
// Color parsing — cached, handles hex / rgb / rgba / CSS named colors
// ---------------------------------------------------------------------------

const _colorCache = new Map<string, { r: number; g: number; b: number }>()

function parseColor(css: string): { r: number; g: number; b: number } {
    const hit = _colorCache.get(css)
    if (hit) return hit

    let m = css.match(/^#([0-9a-f]{3,8})$/i)
    if (m) {
        let h = m[1]
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
        const out = {
            r: parseInt(h.slice(0, 2), 16),
            g: parseInt(h.slice(2, 4), 16),
            b: parseInt(h.slice(4, 6), 16),
        }
        _colorCache.set(css, out)
        return out
    }

    m = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (m) {
        const out = {
            r: parseInt(m[1]),
            g: parseInt(m[2]),
            b: parseInt(m[3]),
        }
        _colorCache.set(css, out)
        return out
    }

    if (typeof document !== "undefined") {
        const ctx = document.createElement("canvas").getContext("2d")!
        ctx.fillStyle = css
        const resolved = ctx.fillStyle
        if (resolved.startsWith("#")) {
            const out = parseColor(resolved)
            _colorCache.set(css, out)
            return out
        }
    }

    const fallback = { r: 0, g: 0, b: 0 }
    _colorCache.set(css, fallback)
    return fallback
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DitherEffectProps {
    style?: React.CSSProperties
    image?: string
    algorithm: DitherAlgorithm
    invert: boolean
    scale: number
    dotScale: number
    dotColor: string
    backgroundColor: string
    errorStrength: number
    serpentine: boolean
    cornerRadius: number
    imageProcessing: {
        threshold: number
        contrast: number
        gamma: number
        blur: number
        highlightsCompression: number
    }
    interaction: {
        mouseRepulsion: boolean
        clickShockwave: boolean
    }
    gridResolution: number
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function DitherEffect(props: DitherEffectProps) {
    const {
        style,
        image,
        algorithm = "floyd-steinberg",
        invert = true,
        scale = 0.35,
        dotScale = 1,
        dotColor = "rgba(0,0,0,1)",
        backgroundColor = "#ffffff",
        errorStrength = 1.0,
        serpentine = true,
        cornerRadius = 0.28,
        imageProcessing = {
            threshold: 181,
            contrast: 0,
            gamma: 1.03,
            blur: 3.75,
            highlightsCompression: 0,
        },
        interaction = {
            mouseRepulsion: true,
            clickShockwave: true,
        },
        gridResolution = 205,
    } = props

    const [isClient, setIsClient] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const systemRef = useRef<DotSystem | null>(null)
    const mouseRef = useRef({ x: 0, y: 0, active: false })
    const shockwavesRef = useRef<Shockwave[]>([])
    const animFrameRef = useRef(0)
    const runningRef = useRef(false)
    const blueNoiseRef = useRef<Uint8Array | null>(null)
    const prevConfigRef = useRef("")

    const dotRGBRef = useRef(parseColor(dotColor))
    dotRGBRef.current = parseColor(dotColor)

    const interactionRef = useRef(interaction)
    interactionRef.current = interaction

    useEffect(() => {
        startTransition(() => setIsClient(true))
    }, [])

    const isOnCanvas =
        typeof RenderTarget !== "undefined" &&
        RenderTarget.current() === RenderTarget.canvas

    // Stable animation loop — reads everything from refs
    const startLoop = useCallback(() => {
        if (runningRef.current) return
        runningRef.current = true

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")!
        const dpr = window.devicePixelRatio || 1

        const tick = () => {
            const sys = systemRef.current
            if (!sys) {
                runningRef.current = false
                return
            }

            const rect = canvas.getBoundingClientRect()
            const needsMore = updateDots(
                sys,
                mouseRef.current.x,
                mouseRef.current.y,
                mouseRef.current.active,
                shockwavesRef.current,
                performance.now()
            )

            const { r, g, b } = dotRGBRef.current
            renderDots(ctx, sys, r, g, b, rect.width, rect.height, dpr)

            if (needsMore) {
                animFrameRef.current = requestAnimationFrame(tick)
            } else {
                runningRef.current = false
            }
        }

        animFrameRef.current = requestAnimationFrame(tick)
    }, [])

    const rebuildParticles = useCallback(
        async (src: string) => {
            const canvas = canvasRef.current
            if (!canvas) return

            const rect = canvas.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) return

            let positions: Float32Array

            const img = await loadImage(src)
            const processed = processImage(
                img,
                gridResolution,
                1,
                imageProcessing.contrast,
                imageProcessing.gamma,
                imageProcessing.blur,
                imageProcessing.highlightsCompression
            )

            const gw = processed.width
            const gh = processed.height
            const opts: DitherOpts = {
                threshold: imageProcessing.threshold,
                serpentine,
                errorStrength,
            }

            switch (algorithm) {
                case "floyd-steinberg":
                    positions = floydSteinberg(
                        processed.grayscale,
                        gw,
                        gh,
                        opts,
                        processed.alpha
                    )
                    break
                case "bayer":
                    positions = bayerDither(
                        processed.grayscale,
                        gw,
                        gh,
                        opts,
                        processed.alpha
                    )
                    break
                case "blue-noise": {
                    if (!blueNoiseRef.current)
                        blueNoiseRef.current = generateBlueNoise(256)
                    positions = blueNoiseDither(
                        processed.grayscale,
                        gw,
                        gh,
                        blueNoiseRef.current,
                        256,
                        opts,
                        processed.alpha
                    )
                    break
                }
            }

            if (invert) {
                positions = invertWithMask(
                    positions,
                    gw,
                    gh,
                    cornerRadius,
                    processed.alpha
                )
            }

            const s = Math.max(
                0.5,
                (Math.min(rect.width, rect.height) * scale) / Math.max(gw, gh)
            )
            const ox = Math.round((rect.width - gw * s) / 2)
            const oy = Math.round((rect.height - gh * s) / 2)

            systemRef.current = createDotSystem(positions, s, dotScale, ox, oy)
            startLoop()
        },
        [
            algorithm,
            scale,
            dotScale,
            imageProcessing.contrast,
            imageProcessing.gamma,
            imageProcessing.blur,
            imageProcessing.threshold,
            imageProcessing.highlightsCompression,
            errorStrength,
            serpentine,
            cornerRadius,
            invert,
            gridResolution,
            startLoop,
        ]
    )

    // Rebuild when config changes
    useEffect(() => {
        if (!isClient || !image) return

        const configKey = JSON.stringify([
            image,
            algorithm,
            scale,
            dotScale,
            imageProcessing,
            errorStrength,
            serpentine,
            cornerRadius,
            invert,
            gridResolution,
        ])
        if (configKey === prevConfigRef.current) return
        prevConfigRef.current = configKey

        rebuildParticles(image)
    }, [
        isClient,
        image,
        algorithm,
        scale,
        dotScale,
        imageProcessing,
        errorStrength,
        serpentine,
        cornerRadius,
        invert,
        gridResolution,
        rebuildParticles,
    ])

    // Re-render immediately when dot color changes (no full rebuild)
    useEffect(() => {
        if (!isClient) return
        const canvas = canvasRef.current
        const sys = systemRef.current
        if (!canvas || !sys) return

        const ctx = canvas.getContext("2d")!
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        const { r, g, b } = parseColor(dotColor)
        renderDots(ctx, sys, r, g, b, rect.width, rect.height, dpr)
    }, [isClient, dotColor])

    // Canvas sizing, resize observer, pointer events
    useEffect(() => {
        if (!isClient) return
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")!
        const dpr = window.devicePixelRatio || 1

        let resizeTimer: number | null = null
        let lastW = 0
        let lastH = 0

        const handleResize = () => {
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr

            const sys = systemRef.current
            if (sys) {
                const { r, g, b } = dotRGBRef.current
                renderDots(ctx, sys, r, g, b, rect.width, rect.height, dpr)
            }

            const w = Math.round(rect.width)
            const h = Math.round(rect.height)
            if (lastW !== 0 && (w !== lastW || h !== lastH)) {
                if (resizeTimer) clearTimeout(resizeTimer)
                resizeTimer = window.setTimeout(() => {
                    if (image) rebuildParticles(image)
                }, 200)
            }
            lastW = w
            lastH = h
        }

        handleResize()
        const ro = new ResizeObserver(handleResize)
        ro.observe(canvas)

        const onPointerMove = (e: PointerEvent) => {
            if (!interactionRef.current.mouseRepulsion) return
            const rect = canvas.getBoundingClientRect()
            mouseRef.current.x = e.clientX - rect.left
            mouseRef.current.y = e.clientY - rect.top
            mouseRef.current.active = true
            startLoop()
        }

        const onPointerLeave = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            mouseRef.current.active = false
            startLoop()
        }

        const onPointerCancel = () => {
            mouseRef.current.active = false
            startLoop()
        }

        const onPointerUp = (e: PointerEvent) => {
            if (!interactionRef.current.clickShockwave) return
            const rect = canvas.getBoundingClientRect()
            shockwavesRef.current.push({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                start: performance.now(),
            })
            if (e.pointerType !== "mouse") mouseRef.current.active = false
            startLoop()
        }

        if (!isOnCanvas) {
            canvas.addEventListener("pointermove", onPointerMove)
            canvas.addEventListener("pointerleave", onPointerLeave)
            canvas.addEventListener("pointercancel", onPointerCancel)
            canvas.addEventListener("pointerup", onPointerUp)
        }

        return () => {
            cancelAnimationFrame(animFrameRef.current)
            runningRef.current = false
            if (resizeTimer) clearTimeout(resizeTimer)
            ro.disconnect()
            canvas.removeEventListener("pointermove", onPointerMove)
            canvas.removeEventListener("pointerleave", onPointerLeave)
            canvas.removeEventListener("pointercancel", onPointerCancel)
            canvas.removeEventListener("pointerup", onPointerUp)
        }
    }, [isClient, isOnCanvas, image, startLoop, rebuildParticles])

    if (!isClient) {
        return (
            <div
                style={{
                    ...style,
                    background: backgroundColor,
                    width: "100%",
                    height: "100%",
                }}
            />
        )
    }

    return (
        <div style={{ ...style, overflow: "hidden" }}>
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    touchAction: "none",
                    cursor: "default",
                    background: backgroundColor,
                }}
            />
        </div>
    )
}

DitherEffect.displayName = "Dither Effect"

DitherEffect.defaultProps = {
    algorithm: "floyd-steinberg",
    invert: true,
    scale: 0.35,
    dotScale: 1,
    dotColor: "rgba(0,0,0,1)",
    backgroundColor: "#ffffff",
    errorStrength: 1.0,
    serpentine: true,
    cornerRadius: 0.28,
    imageProcessing: {
        threshold: 181,
        contrast: 0,
        gamma: 1.03,
        blur: 3.75,
        highlightsCompression: 0,
    },
    interaction: {
        mouseRepulsion: true,
        clickShockwave: true,
    },
    gridResolution: 205,
}

addPropertyControls(DitherEffect, {
    image: {
        type: ControlType.Image,
        title: "Image",
    },
    algorithm: {
        type: ControlType.Enum,
        title: "Algorithm",
        defaultValue: "floyd-steinberg",
        options: ["floyd-steinberg", "bayer", "blue-noise"],
        optionTitles: ["Floyd-Steinberg", "Bayer", "Blue Noise"],
        displaySegmentedControl: true,
    },
    invert: {
        type: ControlType.Boolean,
        title: "Invert",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 0.35,
        min: 0.1,
        max: 2.0,
        step: 0.05,
    },
    dotScale: {
        type: ControlType.Number,
        title: "Dot Scale",
        defaultValue: 1,
        min: 0.5,
        max: 10,
        step: 0.5,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "rgba(0,0,0,1)",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
    errorStrength: {
        type: ControlType.Number,
        title: "Error Strength",
        defaultValue: 1.0,
        min: 0,
        max: 2.0,
        step: 0.01,
        hidden: (props) => props.algorithm !== "floyd-steinberg",
    },
    serpentine: {
        type: ControlType.Boolean,
        title: "Serpentine",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.algorithm !== "floyd-steinberg",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 0.28,
        min: 0,
        max: 0.5,
        step: 0.01,
        hidden: (props) => !props.invert,
    },
    imageProcessing: {
        type: ControlType.Object,
        title: "Image Processing",
        icon: "effect",
        controls: {
            threshold: {
                type: ControlType.Number,
                title: "Threshold",
                defaultValue: 181,
                min: 0,
                max: 255,
                step: 1,
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                defaultValue: 0,
                min: -100,
                max: 100,
                step: 1,
            },
            gamma: {
                type: ControlType.Number,
                title: "Gamma",
                defaultValue: 1.03,
                min: 0.1,
                max: 3.0,
                step: 0.01,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 3.75,
                min: 0,
                max: 20,
                step: 0.25,
            },
            highlightsCompression: {
                type: ControlType.Number,
                title: "Highlights",
                defaultValue: 0,
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        icon: "interaction",
        controls: {
            mouseRepulsion: {
                type: ControlType.Boolean,
                title: "Mouse Repulsion",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            clickShockwave: {
                type: ControlType.Boolean,
                title: "Click Shockwave",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },
    gridResolution: {
        type: ControlType.Number,
        title: "Grid Resolution",
        defaultValue: 205,
        min: 50,
        max: 500,
        step: 5,
        description:
            "Max grid dimension in cells. Higher = more dots, slower processing.",
    },
})
