import { useEffect, RefObject } from "react"

// `src` stays on the element from the start (not withheld) so the browser
// can fetch metadata (preload="metadata" — cheap, header-only) and report
// real dimensions immediately, avoiding a layout-shift where the video
// collapses to zero height until a source is assigned.
//
// What must NOT happen is the `autoPlay` HTML attribute — that starts real
// playback (decode of actual frames, not just metadata) synchronously on
// mount, before any useEffect runs, so a later pause() doesn't undo the
// decode work that already happened. With several videos mounting in the
// same commit (a case-study sheet with 3 near the top), that's several
// concurrent decode pipelines competing with the sheet's opening spring
// for the same frames. So: no autoPlay in JSX, .pause() defensively on
// mount, and playback only ever starts via this hook's own .play() call
// once the element is intersecting and `enabled`.
export function useLazyVideo(ref: RefObject<HTMLVideoElement | null>, rootMargin = "200px", enabled = true) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    // enabled=false means "hands off" — leave whatever native autoPlay/
    // manual playback state the caller set up alone, rather than forcing a
    // pause with nothing left to ever call play() again.
    if (!enabled) return

    el.pause()

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { rootMargin, threshold: 0.01 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin, enabled])
}
