"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"

const GalleryCanvas = dynamic(
  () => import("@/components/InfiniteGallery").then(m => m.GalleryCanvas),
  { ssr: false }
)

export default function GalleryPage() {
  useEffect(() => {
    document.body.style.background = "rgb(22,22,22)"
    document.body.style.overflow = "hidden"
    document.body.classList.add("gallery-open")
    return () => {
      document.body.style.background = ""
      document.body.style.overflow = ""
      document.body.classList.remove("gallery-open")
    }
  }, [])

  return (
    <div style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "rgb(22,22,22)" }}>
      <GalleryCanvas fullPage showFilters showClose />
    </div>
  )
}
