"use client"

import { useState, useEffect } from "react"

export default function AdminPage() {
  const [secret,     setSecret]     = useState("")
  const [authed,     setAuthed]     = useState(false)
  const [companions, setCompanions] = useState<string[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState("")

  async function login() {
    setLoading(true); setError("")
    const res = await fetch("/api/companions")
    if (!res.ok) { setError("Failed to connect"); setLoading(false); return }
    // Verify secret by attempting a no-op delete
    const check = await fetch("/api/companions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ url: "__ping__" }),
    })
    if (check.status === 401) { setError("Wrong password"); setLoading(false); return }
    const data = await res.json()
    setCompanions(data.companions ?? [])
    setAuthed(true)
    setLoading(false)
  }

  async function remove(url: string) {
    await fetch("/api/companions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ url }),
    })
    setCompanions(prev => prev.filter(c => c !== url))
  }

  async function refresh() {
    setLoading(true)
    const res  = await fetch("/api/companions")
    const data = await res.json()
    setCompanions(data.companions ?? [])
    setLoading(false)
  }

  if (!authed) return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0e0d0c", fontFamily: "var(--font-sans)",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 280 }}>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8125rem", fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
          Admin — Companion Moderation
        </p>
        <input
          type="password"
          placeholder="Admin password"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          style={{
            padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "0.875rem",
            fontFamily: "var(--font-sans)", outline: "none",
          }}
        />
        {error && <p style={{ color: "#ff6b6b", fontSize: "0.75rem", margin: 0 }}>{error}</p>}
        <button
          onClick={login}
          disabled={loading || !secret}
          style={{
            padding: "10px 0", borderRadius: 10, border: "none",
            background: loading ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)",
            color: "#0e0d0c", fontSize: "0.8125rem", fontWeight: 700, cursor: loading ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          {loading ? "Checking..." : "Enter"}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100dvh", background: "#0e0d0c", fontFamily: "var(--font-sans)", padding: "40px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <p style={{ color: "#fff", fontSize: "1rem", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              Companion Moderation
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8125rem", margin: 0 }}>
              {companions.length} drawing{companions.length !== 1 ? "s" : ""} stored
            </p>
          </div>
          <button
            onClick={refresh}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "0.75rem",
              fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            Refresh
          </button>
        </div>

        {companions.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem" }}>No drawings yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12 }}>
            {companions.map((url, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{
                  background: "#f0ece4", borderRadius: 8, padding: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  aspectRatio: "1",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" style={{ width: "100%", imageRendering: "pixelated", display: "block" }} />
                </div>
                <button
                  onClick={() => remove(url)}
                  style={{
                    padding: "5px 0", borderRadius: 6, border: "1px solid rgba(255,80,80,0.3)",
                    background: "rgba(255,80,80,0.08)", color: "rgba(255,100,100,0.8)",
                    fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
                    letterSpacing: "0.04em",
                  }}
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
