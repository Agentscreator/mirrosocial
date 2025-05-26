"use client"

import { useEffect, useState } from "react"

interface TypingAnimationProps {
  dots?: number
  speed?: number
}

export function TypingAnimation({ dots = 3, speed = 500 }: TypingAnimationProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => (prev + 1) % (dots + 1))
    }, speed)

    return () => clearInterval(interval)
  }, [dots, speed])

  return (
    <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-sky-50/80 to-sky-100/80 backdrop-blur-xl rounded-2xl border border-sky-200/30 shadow-lg shadow-sky-100/50">
      {/* Futuristic thinking icon */}
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-500 rounded-full flex items-center justify-center shadow-lg shadow-sky-200/50">
          <div className="w-4 h-4 bg-white/90 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        {/* Orbital rings */}
        <div
          className="absolute inset-0 border-2 border-sky-300/30 rounded-full animate-spin"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute inset-1 border border-sky-400/20 rounded-full animate-spin"
          style={{ animationDuration: "2s", animationDirection: "reverse" }}
        ></div>
      </div>

      {/* Enhanced text */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-light text-sky-900 tracking-wide">Thinking</span>

        {/* Modern dot animation */}
        <div className="flex items-center gap-1">
          {Array.from({ length: dots }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < count
                  ? "bg-gradient-to-r from-sky-400 to-sky-500 shadow-lg shadow-sky-200/50 scale-110"
                  : "bg-sky-200/50 scale-75"
              }`}
              style={{
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-100/20 to-sky-200/20 rounded-2xl blur-xl -z-10"></div>
    </div>
  )
}
