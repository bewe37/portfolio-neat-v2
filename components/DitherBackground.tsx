"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */`
  precision mediump float;

  varying vec2 vUv;
  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform float uTime;
  uniform float uPixelSize;

  // Bayer 8x8 dither matrix
  float bayer8(vec2 p) {
    int x = int(mod(p.x, 8.0));
    int y = int(mod(p.y, 8.0));
    int idx = y * 8 + x;
    float table[64];
    table[0]=0.0;  table[1]=32.0; table[2]=8.0;  table[3]=40.0; table[4]=2.0;  table[5]=34.0; table[6]=10.0; table[7]=42.0;
    table[8]=48.0; table[9]=16.0; table[10]=56.0;table[11]=24.0;table[12]=50.0;table[13]=18.0;table[14]=58.0;table[15]=26.0;
    table[16]=12.0;table[17]=44.0;table[18]=4.0; table[19]=36.0;table[20]=14.0;table[21]=46.0;table[22]=6.0; table[23]=38.0;
    table[24]=60.0;table[25]=28.0;table[26]=52.0;table[27]=20.0;table[28]=62.0;table[29]=30.0;table[30]=54.0;table[31]=22.0;
    table[32]=3.0; table[33]=35.0;table[34]=11.0;table[35]=43.0;table[36]=1.0; table[37]=33.0;table[38]=9.0; table[39]=41.0;
    table[40]=51.0;table[41]=19.0;table[42]=59.0;table[43]=27.0;table[44]=49.0;table[45]=17.0;table[46]=57.0;table[47]=25.0;
    table[48]=15.0;table[49]=47.0;table[50]=7.0; table[51]=39.0;table[52]=13.0;table[53]=45.0;table[54]=5.0; table[55]=37.0;
    table[56]=63.0;table[57]=31.0;table[58]=55.0;table[59]=23.0;table[60]=61.0;table[61]=29.0;table[62]=53.0;table[63]=21.0;
    return table[idx] / 64.0;
  }

  void main() {
    vec2 uv = vUv;

    // Mouse influence — warm glow trails where cursor moves
    vec2 mouseUv = uMouse / uResolution;
    mouseUv.y = 1.0 - mouseUv.y;
    float mouseDist = length(uv - mouseUv);
    float mouseGlow = smoothstep(0.45, 0.0, mouseDist);

    // Animated gradient base — slow drift
    float wave1 = sin(uv.x * 2.8 + uTime * 0.18) * 0.5 + 0.5;
    float wave2 = cos(uv.y * 2.2 - uTime * 0.12) * 0.5 + 0.5;
    float base = mix(wave1, wave2, 0.5);

    // Vignette — darker at edges
    float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5) * 1.6);

    float brightness = base * 0.55 * vignette + mouseGlow * 0.35;

    // Dither
    vec2 pixelCoord = floor(uv * uResolution / uPixelSize);
    float threshold = bayer8(pixelCoord);
    float dithered = step(threshold, brightness);

    // Color palette — light bg with warm orange dots
    vec3 dark  = vec3(0.96, 0.94, 0.91);
    vec3 light = vec3(0.82, 0.42, 0.12);

    // Mouse area gets a brighter orange highlight
    vec3 highlight = vec3(0.95, 0.50, 0.10);
    vec3 col = mix(dark, mix(light, highlight, mouseGlow * 0.6), dithered);

    gl_FragColor = vec4(col, 1.0);
  }
`

export default function DitherBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(1) // intentionally 1 — pixelated is the point
    el.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const uniforms = {
      uResolution: { value: new THREE.Vector2() },
      uMouse:      { value: new THREE.Vector2(-9999, -9999) },
      uTime:       { value: 0 },
      uPixelSize:  { value: 6.0 },
    }

    const geo  = new THREE.PlaneGeometry(2, 2)
    const mat  = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    // Resize
    function resize() {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h, false)
      uniforms.uResolution.value.set(w, h)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    // Mouse
    function onMouseMove(e: MouseEvent) {
      const rect = el.getBoundingClientRect()
      uniforms.uMouse.value.set(e.clientX - rect.left, e.clientY - rect.top)
    }
    function onMouseLeave() {
      uniforms.uMouse.value.set(-9999, -9999)
    }
    el.addEventListener("mousemove", onMouseMove)
    el.addEventListener("mouseleave", onMouseLeave)

    // Render loop
    let rafId: number
    let startTime = performance.now()
    function animate() {
      rafId = requestAnimationFrame(animate)
      uniforms.uTime.value = (performance.now() - startTime) / 1000
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      el.removeEventListener("mousemove", onMouseMove)
      el.removeEventListener("mouseleave", onMouseLeave)
      renderer.dispose()
      mat.dispose()
      geo.dispose()
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position:  "absolute",
        inset:     0,
        width:     "100%",
        height:    "100%",
        zIndex:    0,
        pointerEvents: "none",
      }}
    />
  )
}
