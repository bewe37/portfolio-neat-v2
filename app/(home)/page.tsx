// All UI lives in the sibling layout.tsx, which renders the homepage once
// and never unmounts it. Case studies open as a sheet on top, driven by
// local state in that layout — this page renders nothing itself.
export default function V2Page() {
  return null
}
