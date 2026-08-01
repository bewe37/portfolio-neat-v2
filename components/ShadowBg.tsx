"use client"

export default function ShadowBg() {
  return (
    <div
      aria-hidden
      className="shadow-bg"
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        0,
        pointerEvents: "none",
        overflow:      "hidden",
      }}
    >
      <video
        src="/shadow_bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        style={{
          position:     "absolute",
          inset:        0,
          width:        "100%",
          height:       "100%",
          objectFit:    "cover",
          opacity:      0.20,
          mixBlendMode: "multiply",
          filter:       "grayscale(1) contrast(1.05)",
        }}
      />
    </div>
  )
}
