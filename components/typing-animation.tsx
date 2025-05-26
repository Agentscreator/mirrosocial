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
        {/* Main content */}
        <div className="relative z-10 text-center">
          {/* Thinking text with shimmer effect */}
          <div className="mb-8">
            <h2 className="text-6xl font-light text-sky-900/80 tracking-wide mb-4 relative overflow-hidden">
              <span className="relative inline-block">
                Thinking
                {Array(count)
                  .fill(".")
                  .map((dot, i) => (
                    <span
                      key={i}
                      className="inline-block ml-1 text-sky-500"
                      style={{
                        opacity: 1,
                      }}
                    >
                      {dot}
                    </span>
                  ))}
                {/* Shimmer overlay */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </span>
            </h2>
          </div>

          {/* Central element with shimmer */}
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-sky-100/60 to-sky-200/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-sky-200/30 shadow-xl shadow-sky-100/50 relative overflow-hidden">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-200/40 to-sky-300/40 rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="w-3 h-3 bg-sky-400 rounded-full"></div>

              {/* Shimmer effect on the circle */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
            </div>

            {/* Outer shimmer */}
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-slower"></div>
          </div>
        </div>
      </div>

      {/* Custom shimmer animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }

        @keyframes shimmer-slow {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }

        @keyframes shimmer-slower {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        .animate-shimmer-slow {
          animation: shimmer-slow 3s ease-in-out infinite;
        }

        .animate-shimmer-slower {
          animation: shimmer-slower 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
