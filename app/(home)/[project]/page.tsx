// All UI lives in the sibling layout.tsx, which renders the homepage once
// and shows a case study as a sheet on top. This page exists only so
// /v2/<project> is a real, shareable URL; it renders nothing itself.
//
// generateStaticParams prerenders the four known case-study URLs at build
// time. Without it this segment is dynamic (server-rendered per request),
// so a direct hit on /v2/amd_ai_project would wait on the server before
// painting. These are a fixed, known set — there's no reason for that.
export function generateStaticParams() {
  return [
    { project: "amd_ai_project" },
    { project: "amd_project" },
    { project: "fme_annotation_project" },
    { project: "blueprint" },
  ]
}

export default function V2ProjectPage() {
  return null
}
