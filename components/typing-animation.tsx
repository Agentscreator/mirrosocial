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
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-sky-50/30 via-white to-sky-50/30 z-50">
      <div className="relative">
        {/* Animated wave background */}
        <div className="absolute inset-0 -m-20">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Wave 1 */}
            <path
              d="M50 200 Q 100 150, 150 200 T 250 200 T 350 200"
              stroke="url(#gradient1)"
              strokeWidth="2"
              fill="none"
              className="animate-pulse"
              style={{
                animation: "wave1 3s ease-in-out infinite",
              }}
            />
            {/* Wave 2 */}
            <path
              d="M50 220 Q 100 170, 150 220 T 250 220 T 350 220"
              stroke="url(#gradient2)"
              strokeWidth="2"
              fill="none"
              style={{
                animation: "wave2 3s ease-in-out infinite 0.5s",
              }}
            />
            {/* Wave 3 */}
            <path
              d="M50 180 Q 100 130, 150 180 T 250 180 T 350 180"
              stroke="url(#gradient3)"
              strokeWidth="2"
              fill="none"
              style={{
                animation: "wave3 3s ease-in-out infinite 1s",
              }}
            />

            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(14 165 233 / 0.3)" />
                <stop offset="50%" stopColor="rgb(14 165 233 / 0.6)" />
                <stop offset="100%" stopColor="rgb(14 165 233 / 0.3)" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(56 189 248 / 0.2)" />
                <stop offset="50%" stopColor="rgb(56 189 248 / 0.5)" />
                <stop offset="100%" stopColor="rgb(56 189 248 / 0.2)" />
              </linearGradient>
              <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(125 211 252 / 0.2)" />
                <stop offset="50%" stopColor="rgb(125 211 252 / 0.4)" />
                <stop offset="100%" stopColor="rgb(125 211 252 / 0.2)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center">
          {/* Thinking text with enhanced styling */}
          <div className="mb-8">
            <h2 className="text-6xl font-light text-sky-900/80 tracking-wide mb-4">
              Thinking
              {Array(count)
                .fill(".")
                .map((dot, i) => (
                  <span
                    key={i}
                    className="inline-block ml-1 text-sky-500 animate-bounce"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                    }}
                  >
                    {dot}
                  </span>
                ))}
            </h2>
          </div>

          {/* Floating orbs */}
          <div className="absolute -top-16 -left-16 w-8 h-8 bg-gradient-to-r from-sky-300/40 to-sky-400/40 rounded-full blur-sm"></div>
          <div className="absolute -bottom-12 -right-12 w-6 h-6 bg-gradient-to-r from-sky-200/40 to-sky-300/40 rounded-full blur-sm"></div>
          <div className="absolute top-8 -right-20 w-4 h-4 bg-gradient-to-r from-sky-400/40 to-sky-500/40 rounded-full blur-sm"></div>

          {/* Pulsing center element */}
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-sky-100/60 to-sky-200/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-sky-200/30 shadow-xl shadow-sky-100/50">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-200/40 to-sky-300/40 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-sky-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes wave1 {
          0%,
          100% {
            d: path("M50 200 Q 100 150, 150 200 T 250 200 T 350 200");
          }
          50% {
            d: path("M50 200 Q 100 180, 150 200 T 250 200 T 350 200");
          }
        }

        @keyframes wave2 {
          0%,
          100% {
            d: path("M50 220 Q 100 170, 150 220 T 250 220 T 350 220");
          }
          50% {
            d: path("M50 220 Q 100 200, 150 220 T 250 220 T 350 220");
          }
        }

        @keyframes wave3 {
          0%,
          100% {
            d: path("M50 180 Q 100 130, 150 180 T 250 180 T 350 180");
          }
          50% {
            d: path("M50 180 Q 100 160, 150 180 T 250 180 T 350 180");
          }
        }
      `}</style>
    </div>
  )
}
