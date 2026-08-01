export function getTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark"
  return (localStorage.getItem("theme") as "dark" | "light") ?? "dark"
}

export function setTheme(theme: "dark" | "light") {
  localStorage.setItem("theme", theme)
  if (theme === "dark") {
    document.body.classList.add("dark")
  } else {
    document.body.classList.remove("dark")
  }
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark"
  setTheme(next)
  return next
}
