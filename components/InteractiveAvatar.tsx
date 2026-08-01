"use client"

import { useState, useRef, useCallback } from "react"

const DEFAULT_IMAGE = "/my-notion-face-portrait.png"

export default function InteractiveAvatar({
  imageUrl = DEFAULT_IMAGE,
  size = 56,
}: {
  imageUrl?: string
  size?: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [magnetic, setMagnetic] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const wiggleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const maxTilt = 18
    setTilt({
      x: -(dy / (rect.height / 2)) * maxTilt,
      y: (dx / (rect.width / 2)) * maxTilt,
    })
    const mag = 8
    setMagnetic({ x: (dx / rect.width) * mag, y: (dy / rect.height) * mag })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setTilt({ x: 0, y: 0 })
    setMagnetic({ x: 0, y: 0 })
  }, [])

  const handleClick = useCallback(() => {
    if (wiggleTimeout.current) clearTimeout(wiggleTimeout.current)
    setIsClicked(true)
    wiggleTimeout.current = setTimeout(() => setIsClicked(false), 600)
  }, [])

  const ringColor = "rgba(0,0,0,0.25)"
  const glowColor = "rgba(0,0,0,0.06)"
  const borderColor = "rgba(0,0,0,0.25)"

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{
        width: size,
        height: size,
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transform: `translate(${magnetic.x}px, ${magnetic.y}px)`,
        transition: isHovered
          ? "transform 0.15s cubic-bezier(0.23,1,0.32,1)"
          : "transform 0.4s cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      {/* Spinning conic ring */}
      <div
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: size * 0.3,
          background: `conic-gradient(from 0deg, ${ringColor}, transparent 55%, ${ringColor})`,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.3s ease",
          animation: isHovered ? "avatarSpin 2s linear infinite" : "none",
        }}
      />
      {/* Glow bloom */}
      <div
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: size * 0.4,
          background: glowColor,
          opacity: isHovered ? 1 : 0,
          filter: "blur(10px)",
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
      />
      {/* Avatar */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
          transform: `perspective(300px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.07 : 1})`,
          transition: isHovered
            ? "transform 0.15s cubic-bezier(0.23,1,0.32,1)"
            : "transform 0.4s cubic-bezier(0.23,1,0.32,1)",
          animation: isClicked ? "avatarWiggle 0.55s ease" : "none",
          boxShadow: isHovered
            ? `0 8px 20px rgba(0,0,0,0.4), 0 0 0 1.5px ${borderColor}`
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Profile"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          draggable={false}
        />
      </div>

      {/* Click ripple */}
      {isClicked && (
        <div
          key={Date.now()}
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 14,
            border: `1.5px solid ${borderColor}`,
            animation: "avatarRipple 0.55s ease-out forwards",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      )}
    </div>
  )
}
