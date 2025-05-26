"use client"

import type React from "react"

interface ShimmerTextProps {
  children: React.ReactNode
  isGenerating?: boolean
  className?: string
}

export function ShimmerText({ children, isGenerating = false, className = "" }: ShimmerTextProps) {
  if (!isGenerating) {
    return <span className={className}>{children}</span>
  }

  return (
    <span className={`relative inline-block overflow-hidden ${className}`}>
      {children}

      {/* Shimmer overlay */}
      <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-text"></div>

      <style jsx>{`
        @keyframes shimmer-text {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }

        .animate-shimmer-text {
          animation: shimmer-text 1.5s ease-in-out infinite;
        }
      `}</style>
    </span>
  )
}
