"use client"

interface FadeUpProps {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
  className?: string
}

export default function FadeUp({ children, delay = 0, style, className }: FadeUpProps) {
  return (
    <div
      className={`fade-up ${className ?? ""}`}
      style={{ animationDelay: `${delay}s`, width: "100%", ...style }}
    >
      {children}
    </div>
  )
}
