"use client"

import { useRef, useEffect, useState } from "react"

const PEELBACK_HOVER = "30%"
const PEELBACK_ACTIVE = "60%"
const PAD = "10px"
const START = `calc(-1 * ${PAD})`
const END = `calc(100% + ${PAD})`

const PEEL_EASING = `2s linear(0,0.002 0.4%,0.008 0.9%,0.02 1.4%,0.035 1.9%,0.055 2.4%,0.083 3%,0.11 3.5%,0.146 4.1%,0.214 5.1%,0.297 6.2%,0.624 10.2%,0.756 11.9%,0.821 12.8%,0.874 13.6%,0.93 14.5%,0.975 15.3%,1.016 16.1%,1.053 16.9%,1.085 17.7%,1.116 18.6%,1.139 19.4%,1.16 20.3%,1.176 21.2%,1.187 22.1%,1.195 23.2%,1.197 24.4%,1.193 25.6%,1.183 26.9%,1.17 28.1%,1.153 29.4%,1.055 35.6%,1.031 37.3%,1.012 38.8%,0.994 40.6%,0.98 42.3%,0.97 44.1%,0.964 45.9%,0.961 48.3%,0.964 51.1%,0.97 53.7%,0.997 62.7%,1.003 66%,1.007 69.3%,1.007 74.4%,1 89.2%,1)`

const HOVER_EASING = `1s linear(0,0.008 1.1%,0.031 2.2%,0.129 4.8%,0.257 7.2%,0.671 14.2%,0.789 16.5%,0.881 18.6%,0.957 20.7%,1.019 22.9%,1.063 25.1%,1.094 27.4%,1.114 30.7%,1.112 34.5%,1.018 49.9%,0.99 59.1%,1)`

// Inline SVG of a small "G" monogram sticker
const STICKER_SVG = `data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='60' cy='60' r='54' fill='%23FF6B30' stroke='white' stroke-width='6'/%3E%3Ctext x='60' y='78' text-anchor='middle' font-family='Georgia%2C serif' font-size='62' font-weight='700' fill='white'%3EG%3C%2Ftext%3E%3C%2Fsvg%3E`

export default function HeroSticker({ imageSrc = STICKER_SVG, size = 100, rotate = 15 }: {
  imageSrc?: string
  size?: number
  rotate?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const draggableRef = useRef<HTMLDivElement>(null)
  const pointLightRef = useRef<SVGFEPointLightElement>(null)
  const pointLightFlippedRef = useRef<SVGFEPointLightElement>(null)

  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Update light position on mouse move
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const el = containerRef.current
      const pl = pointLightRef.current
      const plf = pointLightFlippedRef.current
      if (!el || !pl || !plf) return
      const rect = el.getBoundingClientRect()
      const rx = e.clientX - rect.left
      const ry = e.clientY - rect.top
      pl.setAttribute("x", String(rx))
      pl.setAttribute("y", String(ry))
      plf.setAttribute("x", String(rx))
      plf.setAttribute("y", String(rect.height - ry))

      if (isDragging.current && draggableRef.current) {
        draggableRef.current.style.left = (e.clientX - dragOffset.current.x) + "px"
        draggableRef.current.style.top  = (e.clientY - dragOffset.current.y) + "px"
      }
    }
    function onMouseUp() { isDragging.current = false }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  function onMouseDown(e: React.MouseEvent) {
    if (!draggableRef.current) return
    isDragging.current = true
    const rect = draggableRef.current.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    draggableRef.current.style.position = "fixed"
    draggableRef.current.style.left = rect.left + "px"
    draggableRef.current.style.top  = rect.top  + "px"
  }

  const mainClip = active
    ? `polygon(${START} ${PEELBACK_ACTIVE}, ${END} ${PEELBACK_ACTIVE}, ${END} ${END}, ${START} ${END})`
    : hovered
    ? `polygon(${START} ${PEELBACK_HOVER}, ${END} ${PEELBACK_HOVER}, ${END} ${END}, ${START} ${END})`
    : `polygon(${START} ${START}, ${END} ${START}, ${END} ${END}, ${START} ${END})`

  const flapClip = active
    ? `polygon(${START} ${START}, ${END} ${START}, ${END} ${PEELBACK_ACTIVE}, ${START} ${PEELBACK_ACTIVE})`
    : hovered
    ? `polygon(${START} ${START}, ${END} ${START}, ${END} ${PEELBACK_HOVER}, ${START} ${PEELBACK_HOVER})`
    : `polygon(${START} ${START}, ${END} ${START}, ${END} ${START}, ${START} ${START})`

  const flapTop = active
    ? `calc(-100% + 2 * ${PEELBACK_ACTIVE} - 1px)`
    : hovered
    ? `calc(-100% + 2 * ${PEELBACK_HOVER} - 1px)`
    : `calc(-100% - ${PAD} - ${PAD})`

  const transition = active ? `all ${PEEL_EASING}` : `all ${HOVER_EASING}`

  return (
    <>
      {/* SVG filter defs — hidden */}
      <svg height="0" width="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="stickerPointLight">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant="0.1" lightingColor="white">
              <fePointLight ref={pointLightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" operator="screen" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id="stickerPointLightFlipped">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant="0.7" lightingColor="white">
              <fePointLight ref={pointLightFlippedRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" operator="screen" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id="stickerDropShadow">
            <feDropShadow dx="1" dy="2" stdDeviation="4" floodColor="black" floodOpacity="0.18" />
          </filter>
          <filter id="stickerExpandFill">
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(179,179,179)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
        </defs>
      </svg>

      {/* Draggable sticker */}
      <div
        ref={draggableRef}
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          top: "60px",
          right: "40px",
          cursor: "grab",
          zIndex: 20,
          userSelect: "none",
        }}
      >
        <div
          ref={containerRef}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); setActive(false) }}
          onMouseDown={() => setActive(true)}
          onMouseUp={() => setActive(false)}
          style={{ position: "relative" }}
        >
          {/* Main sticker body */}
          <div style={{
            clipPath: mainClip,
            transition,
            filter: "url(#stickerDropShadow)",
            willChange: "clip-path",
          }}>
            <div style={{ filter: "url(#stickerPointLight)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt="sticker" draggable={false}
                style={{ width: size, display: "block", transform: `rotate(${rotate}deg)` }} />
            </div>
          </div>

          {/* Shadow */}
          <div style={{
            position: "absolute", top: "0.8rem", left: "0.4rem",
            width: "100%", height: "100%",
            filter: "brightness(0) blur(10px)", opacity: 0.15,
            pointerEvents: "none",
          }}>
            <div style={{ filter: "url(#stickerExpandFill)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt="" draggable={false}
                style={{ width: size, display: "block", transform: `rotate(${rotate}deg)` }} />
            </div>
          </div>

          {/* Flap (peeled-back part) */}
          <div style={{
            position: "absolute", width: "100%", height: "100%",
            left: 0, top: flapTop,
            clipPath: flapClip,
            transform: "scaleY(-1)",
            transition,
            willChange: "clip-path, top",
            pointerEvents: "none",
          }}>
            <div style={{ filter: "url(#stickerPointLightFlipped)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt="" draggable={false}
                style={{ width: 100, display: "block", transform: "rotate(15deg)",
                  filter: "url(#stickerExpandFill)" }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
