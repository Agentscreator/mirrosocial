// app/authenticated/layout.tsx
import type React from "react"
import { Navigation } from "@/components/navigation"
import { StreamChatProvider } from '@/components/stream-chat-provider'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StreamChatProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Navigation />
        <main className="flex-1 pb-20 md:ml-16 md:pb-0 pt-safe-top px-safe-left px-safe-right">
          <div className="mx-auto max-w-4xl px-4 py-4 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </StreamChatProvider>
  )
}