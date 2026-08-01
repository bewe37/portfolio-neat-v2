"use client"

import { useState, useEffect } from "react"

function torontoTime() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

type Weather = { temp: number; code: number }

function weatherLabel(code: number) {
  if (code === 0) return "Sunny"
  if (code <= 2)  return "Partly cloudy"
  if (code === 3) return "Overcast"
  if (code <= 49) return "Foggy"
  if (code <= 57) return "Drizzle"
  if (code <= 67) return "Rainy"
  if (code <= 77) return "Snowy"
  if (code <= 82) return "Showers"
  if (code <= 99) return "Stormy"
  return "Cloudy"
}

export default function TorontoWord() {
  const [time, setTime] = useState(torontoTime())
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    const tick = setInterval(() => setTime(torontoTime()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832&current=temperature_2m,weathercode&timezone=America%2FToronto")
      .then(r => r.json())
      .then(d => setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weathercode }))
      .catch(() => {})
  }, [])

  return (
    <span style={{ fontWeight: 500 }}>
      Toronto
      <span style={{
        fontFamily: "var(--font-sans)",
        fontSize: "0.75rem",
        fontWeight: 400,
        color: "var(--c-faint)",
        letterSpacing: "-0.01em",
        marginLeft: 6,
      }}>
        {time}{weather ? ` · ${weather.temp}°C` : ""}
      </span>
    </span>
  )
}
