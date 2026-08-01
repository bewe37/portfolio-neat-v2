"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

const PARTICLE_COUNT = 18000

// Vertex shader — each particle rides a sum of sine waves, drifts gently in idle
const VERT = `
uniform float uTime;
uniform float uHover;   // 0 = idle, 1 = wave formed
uniform float uDpr;

attribute float aWaveX;    // 0..1 x position along wave
attribute float aWaveLayer;// which wave layer (0..3)
attribute float aWaveOff;  // vertical gaussian offset within band
attribute vec3  aHomePos;  // idle scatter position

// Per-layer wave params packed as vec4: yBase, amp, freq, speed
uniform vec4 uWave0;
uniform vec4 uWave1;
uniform vec4 uWave2;
uniform vec4 uWave3;
uniform vec4 uSwell0;  // swell amp, swellFreq, swellSpeed, spread
uniform vec4 uSwell1;
uniform vec4 uSwell2;
uniform vec4 uSwell3;

varying float vAlpha;
varying float vDist;

vec4 getWave(int layer) {
  if (layer == 0) return uWave0;
  if (layer == 1) return uWave1;
  if (layer == 2) return uWave2;
  return uWave3;
}
vec4 getSwell(int layer) {
  if (layer == 0) return uSwell0;
  if (layer == 1) return uSwell1;
  if (layer == 2) return uSwell2;
  return uSwell3;
}

void main() {
  int layer = int(aWaveLayer);
  vec4 w  = getWave(layer);
  vec4 sw = getSwell(layer);

  float yBase  = w.x;
  float amp    = w.y;
  float freq   = w.z;
  float speed  = w.w;
  float swAmp  = sw.x;
  float swFreq = sw.y;
  float swSpd  = sw.z;
  float spread = sw.w;

  float phase     = aWaveX * 6.2831853 * freq + uTime * speed;
  float swPhase   = aWaveX * 6.2831853 * swFreq + uTime * swSpd;
  float crestY    = yBase + sin(phase) * amp + sin(swPhase) * swAmp;

  // Wave target position (NDC-like, mapped in JS to screen)
  vec3 wavePos = vec3(aWaveX, crestY + aWaveOff * spread, 0.0);

  // Mix between idle home and wave
  vec3 pos = mix(aHomePos, wavePos, uHover);

  vDist = length(pos.xy - vec2(0.5, 0.5));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  // Bigger points at crest (low waveOff), smaller at edges
  float crestWeight = 1.0 - abs(aWaveOff);
  float baseSize = mix(1.5, 3.5, crestWeight) * uDpr;
  gl_PointSize = mix(baseSize * 0.6, baseSize, uHover);

  vAlpha = mix(0.3 + 0.5 * crestWeight, 0.6 + 0.4 * crestWeight, uHover);
}
`

const FRAG = `
uniform vec3 uColor;
varying float vAlpha;
varying float vDist;

void main() {
  // Soft round point
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  if (r > 0.5) discard;
  float soft = 1.0 - smoothstep(0.2, 0.5, r);
  gl_FragColor = vec4(uColor, vAlpha * soft);
}
`

function getCSSColor(varName: string): THREE.Color {
  const raw = getComputedStyle(document.body).getPropertyValue(varName).trim()
  try { return new THREE.Color(raw) } catch { return new THREE.Color(0.9, 0.9, 0.88) }
}

export default function HeroWaveGL({ hovered }: { hovered: boolean }) {
  const mountRef  = useRef<HTMLDivElement>(null)
  const hoveredRef = useRef(false)

  useEffect(() => { hoveredRef.current = hovered }, [hovered])

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    const W = el.clientWidth
    const H = el.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // Scene / camera — orthographic so coords map cleanly to 0..1
    const scene  = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1)

    // Wave definitions: [yBase, amp(normalised), freq, speed]
    // amp/yBase are in 0..1 space (fraction of height)
    const waveDefs = [
      { yBase: 0.22, amp: 0.09, freq: 0.9,  speed:  0.32, swAmp: 0.04, swFreq: 0.22, swSpd: 0.14, spread: 0.06 },
      { yBase: 0.40, amp: 0.07, freq: 1.3,  speed: -0.44, swAmp: 0.03, swFreq: 0.31, swSpd: 0.18, spread: 0.05 },
      { yBase: 0.58, amp: 0.10, freq: 0.75, speed:  0.38, swAmp: 0.05, swFreq: 0.19, swSpd: 0.12, spread: 0.07 },
      { yBase: 0.74, amp: 0.06, freq: 1.1,  speed: -0.29, swAmp: 0.02, swFreq: 0.27, swSpd: 0.16, spread: 0.04 },
    ]

    // Build geometry
    const positions  = new Float32Array(PARTICLE_COUNT * 3)
    const aWaveX     = new Float32Array(PARTICLE_COUNT)
    const aWaveLayer = new Float32Array(PARTICLE_COUNT)
    const aWaveOff   = new Float32Array(PARTICLE_COUNT)
    const aHomePos   = new Float32Array(PARTICLE_COUNT * 3)

    // Box-Muller gaussian
    const gauss = () => {
      const u = Math.max(1e-10, Math.random())
      const v = Math.random()
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const layer = Math.floor(Math.random() * 4)
      const wx    = Math.random()
      const woff  = Math.max(-1, Math.min(1, gauss() * 0.45))

      aWaveX[i]     = wx
      aWaveLayer[i] = layer
      aWaveOff[i]   = woff

      // Initial = idle home (random spread)
      const hx = Math.random()
      const hy = Math.random()
      aHomePos[i * 3]     = hx
      aHomePos[i * 3 + 1] = hy
      aHomePos[i * 3 + 2] = 0

      positions[i * 3]     = hx
      positions[i * 3 + 1] = hy
      positions[i * 3 + 2] = 0
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position",   new THREE.BufferAttribute(positions,  3))
    geo.setAttribute("aWaveX",     new THREE.BufferAttribute(aWaveX,     1))
    geo.setAttribute("aWaveLayer", new THREE.BufferAttribute(aWaveLayer, 1))
    geo.setAttribute("aWaveOff",   new THREE.BufferAttribute(aWaveOff,   1))
    geo.setAttribute("aHomePos",   new THREE.BufferAttribute(aHomePos,   3))

    const mat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite:  false,
      uniforms: {
        uTime:  { value: 0 },
        uHover: { value: 0 },
        uDpr:   { value: dpr },
        uColor: { value: getCSSColor("--c-primary") },
        uWave0: { value: new THREE.Vector4(waveDefs[0].yBase, waveDefs[0].amp, waveDefs[0].freq, waveDefs[0].speed) },
        uWave1: { value: new THREE.Vector4(waveDefs[1].yBase, waveDefs[1].amp, waveDefs[1].freq, waveDefs[1].speed) },
        uWave2: { value: new THREE.Vector4(waveDefs[2].yBase, waveDefs[2].amp, waveDefs[2].freq, waveDefs[2].speed) },
        uWave3: { value: new THREE.Vector4(waveDefs[3].yBase, waveDefs[3].amp, waveDefs[3].freq, waveDefs[3].speed) },
        uSwell0: { value: new THREE.Vector4(waveDefs[0].swAmp, waveDefs[0].swFreq, waveDefs[0].swSpd, waveDefs[0].spread) },
        uSwell1: { value: new THREE.Vector4(waveDefs[1].swAmp, waveDefs[1].swFreq, waveDefs[1].swSpd, waveDefs[1].spread) },
        uSwell2: { value: new THREE.Vector4(waveDefs[2].swAmp, waveDefs[2].swFreq, waveDefs[2].swSpd, waveDefs[2].spread) },
        uSwell3: { value: new THREE.Vector4(waveDefs[3].swAmp, waveDefs[3].swFreq, waveDefs[3].swSpd, waveDefs[3].spread) },
      },
    })

    const points = new THREE.Points(geo, mat)
    scene.add(points)

    // Resize handler
    const onResize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    let hoverT = 0
    let rafId  = 0
    let lastTs = 0

    function loop(ts: number) {
      rafId = requestAnimationFrame(loop)
      const dt = Math.min((ts - lastTs) / 1000, 0.05)
      lastTs = ts

      hoverT += ((hoveredRef.current ? 1 : 0) - hoverT) * 0.055
      mat.uniforms.uTime.value  += dt
      mat.uniforms.uHover.value  = hoverT
      mat.uniforms.uColor.value  = getCSSColor("--c-primary")

      renderer.render(scene, camera)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  )
}
