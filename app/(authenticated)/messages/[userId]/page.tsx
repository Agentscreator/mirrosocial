"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Info,
  Volume2,
  Pin,
  Archive,
  Trash2,
  Paperclip,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Chat, Channel, MessageList, Thread, Window, useChannelStateContext } from "stream-chat-react"
import { useStreamContext } from "@/components/providers/StreamProvider"
import type { Channel as StreamChannel } from "stream-chat"
import "stream-chat-react/dist/css/v2/index.css"

// Simple hash function to create deterministic short IDs
const createChannelId = (userId1: string, userId2: string): string => {
  // Sort user IDs to ensure consistency regardless of order
  const sortedIds = [userId1, userId2].sort()
  const combined = sortedIds.join("")

  // Simple hash function
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Convert to positive hex string and ensure it's within 64 chars
  const hashStr = Math.abs(hash).toString(36)
  return `dm_${hashStr}`
}

// Custom Channel Header for DM
const DMChannelHeader = ({ otherUser, onBack }: { otherUser: any; onBack: () => void }) => {
  return (
    <div className="flex items-center justify-between p-4 md:p-6 bg-white/95 backdrop-blur-xl border-b border-sky-100/50 shadow-sm">
      <div className="flex items-center gap-3 md:gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-sky-100 ring-offset-2">
          <AvatarImage src={otherUser?.image || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white font-semibold">
            {otherUser?.name?.[0]?.toUpperCase() || otherUser?.username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-sky-900 text-base md:text-lg">
            {otherUser?.name || otherUser?.username || "Unknown User"}
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <p className="text-xs md:text-sm text-emerald-500 font-medium">Online</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="p-2 md:p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
        >
          <Phone className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 md:p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
        >
          <Video className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 md:p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
            >
              <MoreVertical className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-sky-100/50 shadow-xl">
            <DropdownMenuItem className="text-sky-700 hover:bg-sky-50">
              <Info className="h-4 w-4 mr-3" />
              Contact Info
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sky-700 hover:bg-sky-50">
              <Volume2 className="h-4 w-4 mr-3" />
              Mute Notifications
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sky-700 hover:bg-sky-50">
              <Pin className="h-4 w-4 mr-3" />
              Pin Chat
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sky-700 hover:bg-sky-50">
              <Archive className="h-4 w-4 mr-3" />
              Archive Chat
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-3" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Custom Message Input for DM
const DMMessageInput = () => {
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { channel } = useChannelStateContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !channel) return

    try {
      await channel.sendMessage({
        text: text.trim(),
      })
      setText("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [text])

  return (
    <div className="p-3 md:p-6 bg-white/95 backdrop-blur-xl border-t border-sky-100/50 safe-area-inset-bottom">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-4 min-h-[60px]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="p-2 md:p-3 mb-1 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200 flex-shrink-0"
        >
          <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
        </Button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full resize-none border-0 rounded-2xl md:rounded-3xl px-3 md:px-6 py-2 md:py-4 text-sm bg-sky-50/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 focus:bg-white/80 max-h-[120px] placeholder:text-sky-400 transition-all duration-300"
            rows={1}
          />
        </div>

        <Button
          type="submit"
          disabled={!text.trim()}
          className="bg-sky-500 hover:bg-sky-600 text-white p-2 md:p-4 rounded-full mb-1 disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex-shrink-0"
        >
          <Send className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </form>
    </div>
  )
}

// Loading Component
const LoadingState = () => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-100 border-t-sky-400 mx-auto"></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200/20 to-sky-400/20 animate-pulse"></div>
      </div>
      <p className="text-sky-600 font-medium">Loading conversation...</p>
    </div>
  </div>
)

// Error Component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50">
    <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-sky-100/50 border border-sky-100/50">
      <h2 className="text-xl font-semibold text-red-500 mb-3">Unable to Load Conversation</h2>
      <p className="text-sky-600 mb-6">{error}</p>
      <Button
        onClick={onRetry}
        className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white"
      >
        Try Again
      </Button>
    </div>
  </div>
)

// Main DM Page Component
export default function DirectMessagePage() {
  const { client, isReady, error: streamError } = useStreamContext()
  const [channel, setChannel] = useState<StreamChannel | null>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  // Debug logging for URL params
  console.log("DirectMessagePage - URL params:", params)
  console.log("DirectMessagePage - Target userId:", userId)

  // Initialize or get existing channel

  useEffect(() => {
    const initializeChannel = async () => {
      if (!client || !isReady || !userId) {
        console.log("Missing dependencies:", { client: !!client, isReady, userId })
        return
      }

      try {
        setLoading(true)
        setError(null)

        const currentUser = client.user
        if (!currentUser?.id) {
          throw new Error("Current user not found")
        }

        console.log("Current user:", currentUser.id)
        console.log("Target user:", userId)

        // Ensure we're not trying to message ourselves
        if (currentUser.id === userId) {
          console.error("ERROR: Trying to message self!", { currentUserId: currentUser.id, targetUserId: userId })
          throw new Error("Cannot message yourself")
        }

        // Create a short, deterministic channel ID
        const channelId = createChannelId(currentUser.id, userId)

        console.log("Creating channel with ID:", channelId, "Length:", channelId.length)
        console.log("Channel members will be:", [currentUser.id, userId])

        // Try to get or create the channel
        const dmChannel = client.channel("messaging", channelId, {
          members: [currentUser.id, userId],
        })

        // Watch the channel to get real-time updates
        await dmChannel.watch()

        console.log("Channel state after watch:", dmChannel.state)
        console.log("Channel members:", dmChannel.state.members)

        // Get the other user's information
        const members = Object.values(dmChannel.state.members || {})
        console.log("All members:", members)

        const otherMember = members.find((member) => member.user?.id !== currentUser.id)
        console.log("Other member found:", otherMember)

        if (otherMember?.user) {
          // Extract username from the name field if it follows the "User {id}" pattern
          let displayName = otherMember.user.name || otherMember.user.username || otherMember.user.id
          let username = otherMember.user.username || otherMember.user.name || otherMember.user.id

          // If the name follows the "User {uuid}" pattern, try to get the actual username
          if (displayName.startsWith("User ") && displayName.length > 40) {
            // This might be a UUID, try to fetch the actual username from your database
            // For now, we'll use the userId to construct a more readable name
            username = `User_${userId.slice(-8)}` // Use last 8 characters of UUID
            displayName = username
          }

          setOtherUser({
            ...otherMember.user,
            name: displayName,
            username: username,
            displayName: username, // Add this for consistent display
          })
        } else {
          // If user info is not available from channel members, try to fetch it
          console.log("No other member found, trying to fetch user info for:", userId)

          try {
            // Try to get user info from Stream
            const userResponse = await client.queryUsers({ id: userId })
            if (userResponse.users && userResponse.users.length > 0) {
              const user = userResponse.users[0]
              let displayName = user.name || user.username || user.id
              let username = user.username || user.name || user.id

              // Handle the "User {uuid}" pattern
              if (displayName.startsWith("User ") && displayName.length > 40) {
                username = `User_${userId.slice(-8)}`
                displayName = username
              }

              setOtherUser({
                ...user,
                name: displayName,
                username: username,
                displayName: username,
              })
            } else {
              // Create a more user-friendly placeholder
              const shortId = userId.slice(-8)
              setOtherUser({
                id: userId,
                name: `User_${shortId}`,
                username: `User_${shortId}`,
                displayName: `User_${shortId}`,
              })
            }
          } catch (queryError) {
            console.log("Could not query user, using placeholder")
            // Create a more user-friendly placeholder
            const shortId = userId.slice(-8)
            setOtherUser({
              id: userId,
              name: `User_${shortId}`,
              username: `User_${shortId}`,
              displayName: `User_${shortId}`,
            })
          }
        }

        setChannel(dmChannel)
        console.log("Channel initialization successful")
      } catch (err) {
        console.error("Error initializing channel:", err)
        setError(err instanceof Error ? err.message : "Failed to load conversation")
      } finally {
        setLoading(false)
      }
    }

    initializeChannel()
  }, [client, isReady, userId])

  // Handle back navigation
  const handleBack = () => {
    router.push("/messages")
  }

  // Handle retry
  const handleRetry = () => {
    window.location.reload()
  }

  // Show error if Stream is not available
  if (streamError) {
    return <ErrorState error={streamError} onRetry={handleRetry} />
  }

  // Show loading if client is not ready
  if (!client || !isReady || loading) {
    return <LoadingState />
  }

  // Show error if there's an initialization error
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />
  }

  // Show error if channel or user is not found
  if (!channel || !otherUser) {
    return <ErrorState error="Unable to load conversation" onRetry={handleRetry} />
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-sky-50/30 via-white to-sky-50/30 overflow-hidden">
      <Chat client={client}>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Channel channel={channel}>
            <Window>
              <DMChannelHeader otherUser={otherUser} onBack={handleBack} />
              <div className="flex-1 min-h-0 overflow-hidden">
                <MessageList />
              </div>
              <div className="flex-shrink-0 sticky bottom-0">
                <DMMessageInput />
              </div>
            </Window>
            <Thread />
          </Channel>
        </div>
      </Chat>

      {/* Custom Styles - Same as the main messages page */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .str-chat__main-panel {
              height: 100%;
              background: linear-gradient(135deg, rgba(240, 249, 255, 0.3) 0%, rgba(255, 255, 255, 1) 50%, rgba(240, 249, 255, 0.3) 100%);
            }
            
            .str-chat__message-list {
              padding: 2rem;
              background: transparent;
            }
            
            .str-chat__message-list-scroll {
              height: 100%;
            }
            
            .str-chat__message-simple {
              margin-bottom: 1.5rem;
            }
            
            .str-chat__message-simple__content {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(14, 165, 233, 0.1);
              border-radius: 1.5rem;
              padding: 1rem 1.25rem;
              box-shadow: 0 4px 20px rgba(14, 165, 233, 0.08), 0 1px 4px rgba(14, 165, 233, 0.05);
              max-width: 70%;
              transition: all 0.3s ease;
            }

            .str-chat__message-simple__content:hover {
              transform: translateY(-1px);
              box-shadow: 0 8px 30px rgba(14, 165, 233, 0.12), 0 2px 8px rgba(14, 165, 233, 0.08);
            }
            
            .str-chat__message-simple--me .str-chat__message-simple__content {
              background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 4px 20px rgba(14, 165, 233, 0.25), 0 1px 4px rgba(14, 165, 233, 0.15);
            }

            .str-chat__message-simple--me .str-chat__message-simple__content:hover {
              box-shadow: 0 8px 30px rgba(14, 165, 233, 0.35), 0 2px 8px rgba(14, 165, 233, 0.25);
            }
            
            .str-chat__message-simple__text {
              font-size: 0.9rem;
              line-height: 1.4;
              margin: 0;
              font-weight: 400;
            }
            
            .str-chat__avatar {
              width: 2.5rem;
              height: 2.5rem;
              margin-right: 0.75rem;
              border: 2px solid rgba(14, 165, 233, 0.1);
            }
            
            .str-chat__message-simple__actions {
              display: none;
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border-radius: 0.75rem;
              padding: 0.25rem;
              box-shadow: 0 4px 20px rgba(14, 165, 233, 0.1);
            }
            
            .str-chat__message-simple:hover .str-chat__message-simple__actions {
              display: flex;
            }
            
            .str-chat__message-timestamp {
              font-size: 0.75rem;
              color: #0ea5e9;
              margin-top: 0.5rem;
              font-weight: 500;
            }
            
            .str-chat__message-simple__status {
              margin-top: 0.5rem;
            }
            
            .str-chat__message-simple__status svg {
              width: 1rem;
              height: 1rem;
              color: #0ea5e9;
            }
            
            .str-chat__thread {
              border-left: 1px solid rgba(14, 165, 233, 0.1);
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
            }
            
            .str-chat__message-list-scroll {
              scroll-behavior: smooth;
            }
            
            .str-chat__message-list-scroll::-webkit-scrollbar {
              width: 6px;
            }
            
            .str-chat__message-list-scroll::-webkit-scrollbar-track {
              background: rgba(240, 249, 255, 0.5);
              border-radius: 3px;
            }
            
            .str-chat__message-list-scroll::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, #0ea5e9, #0284c7);
              border-radius: 3px;
            }
            
            .str-chat__message-list-scroll::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(135deg, #0284c7, #0369a1);
            }
            
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            
            .str-chat__message-simple {
              animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            .str-chat__message-list {
              animation: fadeIn 0.6s ease-out;
            }
            
            @media (max-width: 768px) {
              .str-chat__message-simple__content {
                max-width: 85%;
              }
              
              .str-chat__message-list {
                padding: 1rem;
              }
            }
          `,
        }}
      />
    </div>
  )
}
