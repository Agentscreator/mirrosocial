"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Info,
  Volume2,
  Archive,
  Trash2,
  Pin,
  Paperclip,
  Send,
} from "lucide-react"
import { Channel, MessageList, Thread, Window, useChatContext } from "stream-chat-react"
import { useStreamContext } from "@/components/providers/StreamProvider"
import type { Channel as StreamChannel } from "stream-chat"
import "stream-chat-react/dist/css/v2/index.css"

export const dynamic = "force-dynamic"

interface User {
  id: string
  username: string
  nickname?: string
  image?: string
  profileImage?: string
  about?: string
  metro_area?: string
  created_at?: string
  isFollowing?: boolean
}

interface ApiResponse {
  success?: boolean
  error?: string
  id?: string
  username?: string
  nickname?: string
  image?: string
  profileImage?: string
  about?: string
  metro_area?: string
  created_at?: string
  isFollowing?: boolean
}

// Function to generate a valid channel ID with length <= 64 characters
const generateChannelId = (currentUserId: string, targetUserId: string): string => {
  // Sort IDs to ensure consistent channel ID regardless of who initiates
  const sortedIds = [currentUserId, targetUserId].sort()
  const channelId = `dm_${sortedIds[0]}_${sortedIds[1]}`

  // If the channel ID is too long, use a hash-based approach
  if (channelId.length > 64) {
    // Create a shorter ID using first 8 chars of each ID
    const shortId1 = sortedIds[0].substring(0, 8)
    const shortId2 = sortedIds[1].substring(0, 8)
    return `dm_${shortId1}_${shortId2}_${Date.now().toString(36)}`
  }

  return channelId
}

// Improved user data extraction function that matches your API response format
const extractUserData = (data: ApiResponse): User | null => {
  console.log("Extracting user data from API response:", JSON.stringify(data, null, 2))

  // Check if the response indicates an error
  if (data.error) {
    console.error("API returned error:", data.error)
    throw new Error(data.error)
  }

  // Check if response indicates success but has no data
  if (data.success === false) {
    console.error("API request was not successful")
    throw new Error("User data request failed")
  }

  // Validate required fields based on your API response structure
  if (!data.id) {
    console.error("No user ID found in response:", data)
    throw new Error("Invalid user data: missing ID")
  }

  if (!data.username) {
    console.error("No username found in response:", data)
    throw new Error("Invalid user data: missing username")
  }

  // Build user object from the API response
  const user: User = {
    id: data.id,
    username: data.username,
    nickname: data.nickname || undefined,
    // Use profileImage first, then fall back to image (matching your API logic)
    image: data.profileImage || data.image || undefined,
    profileImage: data.profileImage || undefined,
    about: data.about || undefined,
    metro_area: data.metro_area || undefined,
    created_at: data.created_at || undefined,
    isFollowing: data.isFollowing || false,
  }

  console.log("Successfully extracted user:", user)
  return user
}

// Custom Message Input Component
const CustomMessageInput: React.FC = () => {
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { channel } = useChatContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !channel || isSubmitting) return

    try {
      setIsSubmitting(true)
      await channel.sendMessage({
        text: text.trim(),
      })
      setText("")

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      // You might want to show a toast notification here
    } finally {
      setIsSubmitting(false)
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
    <div className="p-3 sm:p-4 lg:p-6 bg-white/95 backdrop-blur-xl border-t border-sky-100/50">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3 lg:gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="p-2 sm:p-3 mb-1 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200 flex-shrink-0"
        >
          <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isSubmitting}
            className="w-full resize-none border-0 rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-3 sm:py-4 text-sm bg-sky-50/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 focus:bg-white/80 max-h-[120px] placeholder:text-sky-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
        </div>

        <Button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white p-3 sm:p-4 rounded-full mb-1 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-sky-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-300/50 hover:scale-105 disabled:hover:scale-100 flex-shrink-0"
        >
          {isSubmitting ? (
            <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
      </form>
    </div>
  )
}

// NextJS 15 compatible page component
interface PageProps {
  params: Promise<{ userId: string }>
}

export default function SingleConversationPage({ params }: PageProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [channel, setChannel] = useState<StreamChannel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { client, isReady, error: streamError } = useStreamContext()

  // Handle async params in NextJS 15
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        console.log("Resolved params:", resolvedParams)

        if (!resolvedParams.userId || resolvedParams.userId === "undefined" || resolvedParams.userId === "null") {
          throw new Error("Invalid user ID in URL parameters")
        }

        setUserId(resolvedParams.userId)
      } catch (error) {
        console.error("Failed to resolve params:", error)
        setError("Invalid URL parameters")
        setLoading(false)
      }
    }

    resolveParams()
  }, [params])

  // Fetch user data function
  const fetchUserData = async (targetUserId: string): Promise<User> => {
    console.log("Fetching user data for ID:", targetUserId)

    // Try the primary endpoint first (matches your fixed API)
    const response = await fetch(`/api/users/${targetUserId}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      // Handle specific HTTP status codes
      switch (response.status) {
        case 401:
          throw new Error("You need to be logged in to view this conversation")
        case 404:
          throw new Error("User not found")
        case 403:
          throw new Error("You do not have permission to view this user")
        case 500:
          throw new Error("Server error occurred while fetching user data")
        default:
          throw new Error(`Failed to fetch user data (Status: ${response.status})`)
      }
    }

    let userData: ApiResponse
    try {
      userData = await response.json()
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError)
      throw new Error("Invalid response format from server")
    }

    console.log("Received user data:", userData)

    // Extract and validate user data
    const user = extractUserData(userData)
    if (!user) {
      throw new Error("Failed to process user data")
    }

    return user
  }

  useEffect(() => {
    const initializeChat = async () => {
      if (!client || !isReady || !userId) {
        if (streamError) {
          setError("Chat service is currently unavailable")
        }
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log("Initializing chat for userId:", userId)

        // Fetch user information
        const userInfo = await fetchUserData(userId)
        console.log("Successfully fetched user info:", userInfo)
        setUser(userInfo)

        // Get current user ID from Stream client
        const currentUser = client.userID
        if (!currentUser) {
          throw new Error("Current user not authenticated with Stream")
        }

        // Generate a valid channel ID
        const channelId = generateChannelId(currentUser, userInfo.id)
        console.log("Generated channel ID:", channelId, `(${channelId.length} characters)`)

        // Create or get existing channel directly with Stream client
        console.log("Creating/getting channel for user:", userInfo.id)

        // Try to create the channel directly with the Stream client first
        let streamChannel: StreamChannel

        try {
          // Create the channel with both users as members
          streamChannel = client.channel("messaging", channelId, {
            members: [currentUser, userInfo.id],
            created_by_id: currentUser,
          })

          // Watch the channel (this will create it if it doesn't exist)
          await streamChannel.watch()
          console.log("Channel connected successfully:", channelId)
        } catch (streamError) {
          console.log("Direct Stream channel creation failed, trying API fallback:", streamError)

          // Fallback to API approach if direct creation fails
          const channelResponse = await fetch("/api/stream/channel", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              recipientId: userInfo.id,
              channelId: channelId, // Pass our generated channel ID
            }),
          })

          if (!channelResponse.ok) {
            let errorMessage = `Failed to create channel (Status: ${channelResponse.status})`

            try {
              const errorData = await channelResponse.json()
              errorMessage = errorData.error || errorMessage
            } catch {
              // If we can't parse the error response, use the default message
            }

            throw new Error(errorMessage)
          }

          const channelData = await channelResponse.json()
          console.log("Channel data received from API:", channelData)

          const finalChannelId = channelData.channelId || channelId
          console.log("Using final channel ID:", finalChannelId)

          // Connect to the channel
          streamChannel = client.channel("messaging", finalChannelId)
          await streamChannel.watch()
          console.log("Channel connected via API fallback:", finalChannelId)
        }

        setChannel(streamChannel)
        console.log("Chat initialization completed successfully")
      } catch (err) {
        console.error("Chat initialization error:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load conversation"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    // Only initialize chat when userId is available
    if (userId) {
      initializeChat()
    }
  }, [client, isReady, userId, streamError])

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50 p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-100 border-t-sky-400 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200/20 to-sky-400/20 animate-pulse"></div>
          </div>
          <p className="text-sky-600 font-medium">Loading conversation...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50 p-4">
        <div className="text-center max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-100/50 border border-sky-100/50">
          <h2 className="text-lg sm:text-xl font-semibold text-sky-700 mb-3">Unable to Load Conversation</h2>
          <p className="text-sky-600 mb-6 text-sm sm:text-base">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white shadow-lg shadow-sky-200/50 hover:shadow-xl hover:shadow-sky-300/50 transition-all duration-300"
              onClick={() => router.push("/messages")}
            >
              Back to Messages
            </Button>
            <Button
              variant="outline"
              className="border-sky-200 text-sky-600 hover:bg-sky-50 transition-all duration-300"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Not ready state
  if (!channel || !user || !client || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50 p-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-100/50 border border-sky-100/50">
          <h2 className="text-lg sm:text-xl font-semibold text-sky-600 mb-3">Setting up chat...</h2>
          <p className="text-sky-500 text-sm sm:text-base">Please wait while we prepare your conversation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-sky-50/30 via-white to-sky-50/30">
      {/* Custom Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 bg-white/95 backdrop-blur-xl border-b border-sky-100/50 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 sm:p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200 flex-shrink-0"
            onClick={() => router.push("/messages")}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-sky-100 ring-offset-2 flex-shrink-0">
            <AvatarImage src={user.image || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white font-semibold">
              {user.username?.[0]?.toUpperCase() || user.nickname?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sky-900 text-base sm:text-lg truncate">
              {user.nickname || user.username}
            </h3>
            {user.metro_area && <p className="text-xs sm:text-sm text-sky-500 truncate">{user.metro_area}</p>}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></div>
              <p className="text-xs sm:text-sm text-emerald-500 font-medium">Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 sm:p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
          >
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 sm:p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
          >
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 sm:p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
              >
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
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

      {/* Stream Chat Integration */}
      <div className="flex-1 flex min-h-0">
        <Channel channel={channel}>
          <Window>
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                <MessageList />
              </div>
              <CustomMessageInput />
            </div>
          </Window>
          <Thread />
        </Channel>
      </div>

      {/* Custom Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .str-chat__main-panel {
              height: 100%;
              background: linear-gradient(135deg, rgba(240, 249, 255, 0.3) 0%, rgba(255, 255, 255, 1) 50%, rgba(240, 249, 255, 0.3) 100%);
            }
           
            .str-chat__message-list {
              padding: 1rem;
              background: transparent;
            }

            @media (min-width: 640px) {
              .str-chat__message-list {
                padding: 1.5rem;
              }
            }

            @media (min-width: 1024px) {
              .str-chat__message-list {
                padding: 2rem;
              }
            }
           
            .str-chat__message-list-scroll {
              height: 100%;
            }
           
            .str-chat__message-simple {
              margin-bottom: 1rem;
            }

            @media (min-width: 640px) {
              .str-chat__message-simple {
                margin-bottom: 1.5rem;
              }
            }
           
            .str-chat__message-simple__content {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(14, 165, 233, 0.1);
              border-radius: 1rem;
              padding: 0.75rem 1rem;
              box-shadow: 0 4px 20px rgba(14, 165, 233, 0.08), 0 1px 4px rgba(14, 165, 233, 0.05);
              max-width: 85%;
              transition: all 0.3s ease;
            }

            @media (min-width: 640px) {
              .str-chat__message-simple__content {
                border-radius: 1.5rem;
                padding: 1rem 1.25rem;
                max-width: 75%;
              }
            }

            @media (min-width: 1024px) {
              .str-chat__message-simple__content {
                max-width: 70%;
              }
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
              font-size: 0.875rem;
              line-height: 1.4;
              margin: 0;
              font-weight: 400;
            }

            @media (min-width: 640px) {
              .str-chat__message-simple__text {
                font-size: 0.9rem;
              }
            }
           
            .str-chat__avatar {
              width: 2rem;
              height: 2rem;
              margin-right: 0.5rem;
              border: 2px solid rgba(14, 165, 233, 0.1);
            }

            @media (min-width: 640px) {
              .str-chat__avatar {
                width: 2.5rem;
                height: 2.5rem;
                margin-right: 0.75rem;
              }
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
          `,
        }}
      />
    </div>
  )
}
