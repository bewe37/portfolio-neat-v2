import TamagotchiWidget from "@/components/TamagotchiWidget"

export default function AboutSection() {
  return (
    <section style={{ padding: "48px 0 72px", display: "flex", flexDirection: "column", gap: 32 }}>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "1.0625rem", fontWeight: 500, color: "var(--c-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          About Me
        </p>
      </div>

      <div className="rsp-stack" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "1.25rem", fontWeight: 500, color: "var(--c-mid)", letterSpacing: "-0.01em", lineHeight: 1.55, margin: 0 }}>
            I came to design through a habit of needing to understand how things work before touching them.
          </p>
          <div className="rsp-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 56px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", fontWeight: 500, color: "var(--c-mid)", letterSpacing: "-0.01em", lineHeight: 1.5, margin: 0 }}>
                What got me here?
              </p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9375rem", fontWeight: 400, color: "var(--c-secondary)", letterSpacing: "-0.01em", lineHeight: 1.8, margin: 0 }}>
                Growing up, my dad and I would fix whatever broke around the house — electrical gadgets, wiring, anything that stopped working. I was mostly handing him tools, but always watching, always curious about what was underneath. That habit of needing to understand how something works before touching it never really left me.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", fontWeight: 600, color: "var(--c-mid)", letterSpacing: "-0.01em", lineHeight: 1.5, margin: 0 }}>
                What is product design to me?
              </p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9375rem", fontWeight: 400, color: "var(--c-secondary)", letterSpacing: "-0.01em", lineHeight: 1.8, margin: 0 }}>
                Making things feel obvious. Not by simplifying everything, but by structuring complexity so people don't have to think about it. I'm drawn to systems with many moving parts where clarity, hierarchy, and flow matter more than decoration. I care about the decisions behind the interface.
              </p>
            </div>
          </div>
        </div>

        <div className="rsp-tama rsp-tama-top" style={{ flexShrink: 0 }}>
          <TamagotchiWidget />
        </div>
      </div>

    </section>
  )
}
