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

// Simplex-style smooth noise via value noise + smooth interpolation
const FRAG = /* glsl */`
  precision highp float;

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

  // Hash for value noise
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Smooth value noise
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
      u.y
    );
  }

  // Layered noise (fbm-like) for organic blobs
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p  = p * 2.1 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;

    // Aspect-corrected uv for noise sampling
    vec2 nuv = vec2(uv.x * aspect, uv.y);

    // Slow drift
    vec2 drift = vec2(uTime * 0.032, uTime * 0.018);

    // Two layered noise fields offset in time for organic movement
    float n1 = fbm(nuv * 1.6 + drift);
    float n2 = fbm(nuv * 1.2 - drift * 0.7 + vec2(4.2, 1.8));
    float base = n1 * 0.6 + n2 * 0.4;

    // Mouse repulsion — blobs part around cursor
    vec2 mouseUv = uMouse / uResolution;
    mouseUv.y = 1.0 - mouseUv.y;
    float mouseDist = length((uv - mouseUv) * vec2(aspect, 1.0));
    float mouseInfluence = smoothstep(0.28, 0.0, mouseDist) * 0.55;
    base = max(0.0, base - mouseInfluence);

    // Soft vignette — darken edges very slightly
    float vignette = 1.0 - smoothstep(0.3, 1.1, length((uv - 0.5) * vec2(aspect, 1.0)) * 1.2);
    base *= (0.7 + 0.3 * vignette);

    // Dither
    vec2 pixelCoord = floor(uv * uResolution / uPixelSize);
    float threshold = bayer8(pixelCoord);
    float dithered = step(threshold, base);

    // Palette: warm cream bg, dark warm blobs
    vec3 bgCol   = vec3(0.980, 0.970, 0.955); // near-white warm cream
    vec3 blobCol = vec3(0.155, 0.130, 0.105); // warm near-black

    vec3 col = mix(bgCol, blobCol, dithered);

    gl_FragColor = vec4(col, 1.0);
  }
`

export default function HeroDither() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(1)
    el.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const uniforms = {
      uResolution: { value: new THREE.Vector2() },
      uMouse:      { value: new THREE.Vector2(-9999, -9999) },
      uTime:       { value: 0 },
      uPixelSize:  { value: 3.5 },
    }

    const geo  = new THREE.PlaneGeometry(2, 2)
    const mat  = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    scene.add(new THREE.Mesh(geo, mat))

    function resize() {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h, false)
      uniforms.uResolution.value.set(w, h)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    function onMouseMove(e: MouseEvent) {
      const rect = el.getBoundingClientRect()
      uniforms.uMouse.value.set(e.clientX - rect.left, e.clientY - rect.top)
    }
    function onMouseLeave() {
      uniforms.uMouse.value.set(-9999, -9999)
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseleave", onMouseLeave)

    let rafId: number
    const startTime = performance.now()
    function animate() {
      rafId = requestAnimationFrame(animate)
      uniforms.uTime.value = (performance.now() - startTime) / 1000
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseleave", onMouseLeave)
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
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  )
}
