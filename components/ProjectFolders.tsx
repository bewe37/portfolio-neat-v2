"use client"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { playClick } from "@/lib/click-sound"

interface Project {
  title: string
  category: string
  date: string
  href: string
  image?: string
  folder?: string
  chip?: string
  chipSize?: number
  papers?: string[]
  peekPapers?: boolean
  locked?: boolean
  paperCount?: number
  paperCfg?: ImagePaper[]
  rotation?: number
  folderTransform?: string
  comingSoon?: boolean
  hideMobile?: boolean
}

interface PlainPaper {
  dx: number; color: string; defaultR: number; hoverR: number; defaultY: number; hoverY: number
}
interface ImagePaper extends PlainPaper {
  pw: number; zIndex: number; noPad?: boolean; cropH?: number
}
type PaperCfg = PlainPaper | ImagePaper
function isImagePaper(p: PaperCfg): p is ImagePaper { return "pw" in p }

const FOLDER_W = 220
const FOLDER_H = 275
const PAPER_W  = 80
const PAPER_H  = 110
const CW = FOLDER_H + 32   // 307 — item width
const CH = FOLDER_W + 130  // 350 — item height

// Headroom for papers to fan up without being clipped
const PAPER_HEADROOM = 150

const PAPERS: PlainPaper[] = [
  { dx: -18, color: "#ede9e2", defaultR: -7,  hoverR: -16, defaultY: 54, hoverY: -48 },
  { dx:   0, color: "#ffffff", defaultR:  1,  hoverR:   2, defaultY: 54, hoverY: -64 },
  { dx:  16, color: "#f2efe9", defaultR:  6,  hoverR:  14, defaultY: 54, hoverY: -54 },
]

// Peek mode — main image is the base, portrait cards sit on top left/right
const PEEK_PAPERS: ImagePaper[] = [
  { pw: 248, dx:   0, color: "#ffffff", defaultR:   0, hoverR:   0, defaultY: 38, hoverY: -10, zIndex: 0 },
  { pw: 128, dx: -70, color: "#ede9e2", defaultR:  -6, hoverR: -12, defaultY:  4, hoverY: -18, zIndex: 2 },
  { pw: 128, dx:  70, color: "#f2efe9", defaultR:   5, hoverR:  10, defaultY:  4, hoverY: -14, zIndex: 1 },
]

// AMD AI — amdMainImage front, Pinned Widgets + Now Playing behind
export const AMD_AI_PAPERS: ImagePaper[] = [
  { pw: 248, dx:   0, color: "#ffffff", defaultR:  0, hoverR:  0, defaultY: 54, hoverY:  -6, zIndex: 3 },
  { pw: 110, dx: -58, color: "#f0eff8", defaultR: -8, hoverR:-18, defaultY: 28, hoverY: -22, zIndex: 1 },
  { pw: 120, dx:  62, color: "#f0eff8", defaultR:  6, hoverR: 15, defaultY:-18, hoverY: -54, zIndex: 0 },
]

// AMD — DSHighlight main + 2 comp images peeking behind
export const AMD_PAPERS: ImagePaper[] = [
  { pw: 248, dx:   0, color: "#ffffff", defaultR:  0, hoverR:  0, defaultY: 54, hoverY:  -8, zIndex: 3 },
  { pw: 128, dx: -62, color: "#ede9e2", defaultR: -6, hoverR:-14, defaultY:-26, hoverY: -54, zIndex: 0 },
  { pw:  98, dx:  62, color: "#f2efe9", defaultR:  5, hoverR: 12, defaultY:-26, hoverY: -48, zIndex: 1 },
]

// FME — annotation window behind folder, AnnotationsExample in front of it but behind folder
export const FME_PAPERS: ImagePaper[] = [
  { pw: 220, dx:   0, color: "#ffffff", defaultR:  0, hoverR:  0, defaultY: 42, hoverY: 12, zIndex: 1, cropH: 160 },
  { pw: 168, dx:  54, color: "#ffffff", defaultR:  5, hoverR:  8, defaultY: 18, hoverY:-18, zIndex: 2 },
]

// papers[0] = landscape main (front), papers[1] & [2] = portraits peeking above from behind
const IMG_PAPERS: ImagePaper[] = [
  { pw: 248, dx:   0, color: "#ffffff", defaultR:  0, hoverR:  0, defaultY: 54, hoverY:  -8, zIndex: 3 },
  { pw: 128, dx: -62, color: "#ede9e2", defaultR: -6, hoverR:-14, defaultY:-26, hoverY: -54, zIndex: 0 },
  { pw:  98, dx:  62, color: "#f2efe9", defaultR:  5, hoverR: 12, defaultY:-26, hoverY: -48, zIndex: 1 },
]

const SCATTER: number[] = [-2, 1, -3, 2, -1]
const SPRING = { type: "spring" as const, stiffness: 300, damping: 26 }

function FolderItem({ project, index }: { project: Project; index: number }) {
  const [hovered, setHovered] = useState(false)
  const scatter = project.rotation ?? SCATTER[index % SCATTER.length]
  const paperBottom = FOLDER_W - 36
  const hasImages = (project.papers?.length ?? 0) > 0
  const paperCfg: PaperCfg[] = project.paperCfg ?? (hasImages ? (project.peekPapers ? PEEK_PAPERS : IMG_PAPERS) : PAPERS)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: CW, flexShrink: 0 }}
    >
      <motion.div
        animate={{ rotate: hovered ? 0 : scatter, y: hovered ? -8 : 0, scale: hovered ? 1.04 : 1 }}
        transition={SPRING}
        style={{
          position: "relative", width: CW, height: CH, cursor: "pointer",
          filter:     hovered
            ? "drop-shadow(0 16px 28px rgba(0,0,0,0.22))"
            : "drop-shadow(0 4px 12px rgba(0,0,0,0.12))",
          transition: "filter 0.22s ease",
        }}
      >
        {project.comingSoon ? (
          <motion.div
            animate={{
              y:      hovered ? -38 : 0,
              scale:  hovered ? 1.18 : 0.88,
              rotate: hovered ? -3 : 0,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
            style={{
              position:       "absolute",
              bottom:         paperBottom + 8,
              left:           "50%",
              x:              "-50%",
              zIndex:         2,
              pointerEvents:  "none",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}
          >
            <motion.span
              animate={{ opacity: hovered ? 1 : 0.72 }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily:    "var(--font-sans)",
                fontSize:      "0.6875rem",
                fontWeight:    700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color:         hovered ? "var(--c-primary)" : "var(--c-secondary)",
                padding:       "5px 14px",
                borderRadius:  99,
                border:        "1px solid var(--border-mid)",
                background:    "var(--bg)",
                whiteSpace:    "nowrap",
                boxShadow:     hovered
                  ? "0 6px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)"
                  : "0 2px 8px rgba(0,0,0,0.07)",
                transition:    "box-shadow 0.22s ease, color 0.22s ease",
                display:       "flex",
                alignItems:    "center",
                gap:           6,
              }}
            >
              <motion.span
                animate={{ rotate: hovered ? [0, -12, 10, -6, 4, 0] : 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ display: "inline-block", fontSize: "0.75rem" }}
              >
                ✦
              </motion.span>
              Coming soon
            </motion.span>
          </motion.div>
        ) : paperCfg.slice(0, project.paperCount ?? paperCfg.length).map((p, i) => {
          const imgSrc = project.papers?.[i]
          const ip = isImagePaper(p) ? p : null
          const pw = ip ? ip.pw : PAPER_W
          return (
            <motion.div
              key={i}
              animate={{ rotate: hovered ? p.hoverR : p.defaultR, y: hovered ? p.hoverY : p.defaultY }}
              transition={{ ...SPRING, delay: i * 0.025 }}
              style={{
                position:        "absolute",
                bottom:          paperBottom,
                left:            Math.round(CW / 2 - pw / 2 + p.dx),
                width:           pw,
                ...(ip ? {} : { height: PAPER_H }),
                borderRadius:    10,
                backgroundColor: p.color,
                boxShadow:       "0 4px 16px rgba(0,0,0,0.11), 0 1px 3px rgba(0,0,0,0.07)",
                zIndex:          ip ? ip.zIndex : i,
                transformOrigin: "bottom center",
                willChange:      "transform",
                padding:         hasImages && !(ip?.noPad) ? 6 : 0,
              }}
            >
              {imgSrc && (
                <div style={{
                  overflow:     "hidden",
                  borderRadius: ip?.noPad ? 10 : 4,
                  height:       ip?.cropH ?? "auto",
                  boxShadow:    "inset 0 0 0 1px rgba(0,0,0,0.10)",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt=""
                    draggable={false}
                    style={{
                      width:         "100%",
                      height:        "auto",
                      display:       "block",
                      pointerEvents: "none",
                      userSelect:    "none",
                    }}
                  />
                </div>
              )}
            </motion.div>
          )
        })}

        <Link
          href={project.href}
          onClick={() => playClick()}
          style={{
            display:    "block",
            position:   "absolute",
            bottom:     0,
            left:       "50%",
            width:      FOLDER_H,
            height:     FOLDER_W,
            transform:  "translateX(-50%)",
            zIndex:     3,
            outline:    "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.folder ?? "/chequereds.svg"}
            alt={project.title}
            draggable={false}
            style={project.folderTransform != null ? {
              position:      "absolute",
              display:       "block",
              width:         FOLDER_H,
              height:        FOLDER_W,
              top:           0,
              left:          0,
              objectFit:     "fill",
              pointerEvents: "none",
              userSelect:    "none",
            } : {
              position:      "absolute",
              display:       "block",
              width:         FOLDER_W,
              height:        FOLDER_H,
              top:           (FOLDER_W - FOLDER_H) / 2,
              left:          (FOLDER_H - FOLDER_W) / 2,
              transform:     "rotate(-90deg)",
              objectFit:     "fill",
              pointerEvents: "none",
              userSelect:    "none",
            }}
          />
          {project.chip && (
            <motion.div
              animate={{
                opacity: hovered ? 1 : 0,
                scale:   hovered ? 1 : 0.62,
              }}
              transition={{
                duration: 0.22,
                delay:    hovered ? 0.14 : 0,
                ease:     [0.34, 1.56, 0.64, 1],
              }}
              style={{
                position:      "absolute",
                bottom:        28,
                right:         22,
                zIndex:        1,
                pointerEvents: "none",
                transformOrigin: "bottom right",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.chip}
                alt=""
                draggable={false}
                style={{ width: project.chipSize ?? 80, height: "auto", display: "block", userSelect: "none" }}
              />
            </motion.div>
          )}
        </Link>

      </motion.div>

      <div style={{ textAlign: "start", width: "100%" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 600, color: "var(--c-faint)", letterSpacing: "-0.02em", margin: "12px 16px 5px" }}>
          {project.category}
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 600, color: "var(--c-mid)", letterSpacing: "-0.02em", lineHeight: 1.35, margin: " 0 16px 0" }}>
          {project.title}
        </p>
      </div>
    </motion.div>
  )
}

function ArrowButton({ dir, onClick, disabled }: { dir: "left" | "right"; onClick: () => void; disabled: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.button
      onClick={() => { playClick(); onClick() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      animate={{ opacity: disabled ? 0.18 : hov ? 1 : 0.55 }}
      transition={{ duration: 0.15 }}
      disabled={disabled}
      style={{
        position:        "absolute",
        top:             "50%",
        transform:       "translateY(-50%)",
        [dir === "left" ? "left" : "right"]: 6,
        width:           34,
        height:          34,
        borderRadius:    "50%",
        border:          "1px solid var(--border-mid)",
        backgroundColor: "var(--bg)",
        boxShadow:       "0 2px 8px rgba(0,0,0,0.09)",
        cursor:          disabled ? "default" : "pointer",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         0,
        pointerEvents:   "auto",
        zIndex:          10,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        {dir === "left"
          ? <path d="M8.5 2.5L4.5 7L8.5 11.5" stroke="var(--c-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M5.5 2.5L9.5 7L5.5 11.5" stroke="var(--c-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        }
      </svg>
    </motion.button>
  )
}


function MobilePapers({ project }: { project: Project }) {
  const hasImages = (project.papers?.length ?? 0) > 0
  const paperCfg: PaperCfg[] = project.paperCfg ?? (hasImages ? (project.peekPapers ? PEEK_PAPERS : IMG_PAPERS) : PAPERS)
  const cfgs = project.comingSoon ? [] : paperCfg.slice(0, project.paperCount ?? paperCfg.length)
  const paperBottom = FOLDER_W - 36

  return (
    <>
      {project.comingSoon && (
        <div style={{
          position:      "absolute",
          bottom:        paperBottom + 8,
          left:          "50%",
          transform:     "translateX(-50%)",
          zIndex:        2,
          display:       "flex",
          alignItems:    "center",
          gap:           6,
          fontFamily:    "var(--font-sans)",
          fontSize:      "0.6875rem",
          fontWeight:    700,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color:         "var(--c-secondary)",
          padding:       "5px 14px",
          borderRadius:  99,
          border:        "1px solid var(--border-mid)",
          background:    "var(--bg)",
          whiteSpace:    "nowrap" as const,
          boxShadow:     "0 2px 8px rgba(0,0,0,0.07)",
        }}>
          ✦ Coming soon
        </div>
      )}
      {cfgs.map((p, i) => {
        const imgSrc = project.papers?.[i]
        const ip = isImagePaper(p) ? p : null
        const pw = ip ? ip.pw : PAPER_W
        return (
          <div
            key={i}
            style={{
              position:        "absolute",
              bottom:          paperBottom,
              left:            Math.round(CW / 2 - pw / 2 + p.dx),
              width:           pw,
              ...(ip ? {} : { height: PAPER_H }),
              borderRadius:    10,
              backgroundColor: p.color,
              boxShadow:       "0 4px 16px rgba(0,0,0,0.11), 0 1px 3px rgba(0,0,0,0.07)",
              zIndex:          ip ? ip.zIndex : i,
              transform:       `rotate(${p.hoverR}deg) translateY(${p.hoverY}px)`,
              transformOrigin: "bottom center",
              padding:         hasImages && !(ip?.noPad) ? 6 : 0,
            }}
          >
            {imgSrc && (
              <div style={{ overflow: "hidden", borderRadius: ip?.noPad ? 10 : 4, height: ip?.cropH ?? "auto", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.10)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt="" draggable={false} style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }} />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const folderSrc = project.folder ?? "/chequereds.svg"
  const cardRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ["start end", "end start"] })
  const arrowX = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [-10, 0, 0, 10])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.42, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      style={{ width: "100%" }}
    >
      <Link href={project.href} onClick={() => playClick()} style={{ textDecoration: "none", display: "block" }}>
        <div className="rsp-project-card-bg" style={{
          borderRadius:    20,
          backgroundColor: "var(--surface)",
          backgroundImage: "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)",
          backgroundSize:  "18px 18px",
          display:         "flex",
          flexDirection:   "column",
          alignItems:      "center",
          paddingTop:      PAPER_HEADROOM + 24,
          paddingBottom:   32,
          width:           "100%",
        }}>
          <div className="rsp-folder-stage" style={{ position: "relative", width: CW, height: CH, filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.13))" }}>
            <MobilePapers project={project} />
            <div style={{ position: "absolute", bottom: 0, left: "50%", width: FOLDER_H, height: FOLDER_W, transform: "translateX(-50%)", zIndex: 3 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={folderSrc}
                alt={project.title}
                draggable={false}
                style={project.folderTransform != null ? {
                  position: "absolute", display: "block", width: FOLDER_H, height: FOLDER_W, top: 0, left: 0, objectFit: "fill", pointerEvents: "none",
                } : {
                  position: "absolute", display: "block", width: FOLDER_W, height: FOLDER_H,
                  top: (FOLDER_W - FOLDER_H) / 2, left: (FOLDER_H - FOLDER_W) / 2,
                  transform: "rotate(-90deg)", objectFit: "fill", pointerEvents: "none",
                }}
              />
              {project.chip && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.chip} alt="" draggable={false} style={{ position: "absolute", bottom: 28, right: 22, width: project.chipSize ?? 80, height: "auto", display: "block", zIndex: 4 }} />
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 4px 4px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--c-faint)", letterSpacing: "-0.01em", margin: "0 0 4px" }}>{project.category}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9375rem", fontWeight: 600, color: "var(--c-mid)", letterSpacing: "-0.02em", lineHeight: 1.35, margin: 0 }}>{project.title}</p>
          </div>
          <motion.div
            className="rsp-folder-arrow"
            style={{ display: "none", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 2, x: arrowX }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="var(--c-mid)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function ProjectFolders({ projects }: { projects: Project[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" })
  }

  return (
    <>
      {/* ── Desktop: folder carousel ── */}
      <div className="rsp-hide-mobile" style={{ position: "relative" }}>
        <div style={{
          position:      "absolute",
          top:           PAPER_HEADROOM,
          bottom:        0,
          left:          0,
          right:         0,
          pointerEvents: "none",
        }}>
          <ArrowButton dir="left"  disabled={false} onClick={() => scroll("left")}  />
          <ArrowButton dir="right" disabled={false} onClick={() => scroll("right")} />
        </div>

        <div
          ref={scrollRef}
          className="hide-scrollbar"
          style={{
            display:        "flex",
            gap:            40,
            overflowX:      "auto",
            paddingTop:     PAPER_HEADROOM,
            paddingBottom:  52,
            paddingLeft:    40,
            paddingRight:   40,
            marginLeft:     -40,
            marginRight:    -40,
            scrollbarWidth: "none",
          }}
        >
          {projects.map((p, i) => (
            <FolderItem key={p.href} project={p} index={i} />
          ))}
        </div>
      </div>

      {/* ── Mobile: stacked folder cards ── */}
      <div className="rsp-show-mobile" style={{ display: "none", flexDirection: "column", gap: 10, padding: "24px 0 28px" }}>
        {projects.filter(p => !p.hideMobile).map((p, i) => (
          <ProjectCard key={p.href} project={p} index={i} />
        ))}
      </div>
    </>
  )
}
