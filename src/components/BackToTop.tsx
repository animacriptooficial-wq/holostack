"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-accent text-black shadow-lg shadow-accent/30 flex items-center justify-center transition-all hover:scale-110 hover:shadow-accent/50 active:scale-95"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
