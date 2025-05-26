// app/(authenticated)/messages/[userId]/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Smile,
  Send
} from "lucide-react"
import {
  Channel,
  MessageInput,
  MessageList,
  Thread,
  Window,
  MessageInputProps,
  useChatContext
} from "stream-chat-react"
import { useStreamContext } from "@/components/providers/StreamProvider"
import type { Channel as StreamChannel } from "stream-chat"
import "stream-chat-react/dist/css/v2/index.css"

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

// Improved user data extraction function that matches your API response format
const extractUserData = (data: ApiResponse): User | null => {
  console.log('Extracting user data from API response:', JSON.stringify(data, null, 2))
  
  // Check if the response indicates an error
  if (data.error) {
    console.error('API returned error:', data.error)
    throw new Error(data.error)
  }

  // Check if response indicates success but has no data
  if (data.success === false) {
    console.error('API request was not successful')
    throw new Error('User data request failed')
  }

  // Validate required fields based on your API response structure
  if (!data.id) {
    console.error('No user ID found in response:', data)
    throw new Error('Invalid user data: missing ID')
  }

  if (!data.username) {
    console.error('No username found in response:', data)
    throw new Error('Invalid user data: missing username')
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
    isFollowing: data.isFollowing || false
  }

  console.log('Successfully extracted user:', user)
  return user
}

// Custom Message Input Component
const CustomMessageInput: React.FC<MessageInputProps> = (props) => {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { channel } = useChatContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !channel) return

    try {
      await channel.sendMessage({
        text: text.trim(),
      })
      setText('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [text])

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 p-4 border-t bg-white/80 backdrop-blur-sm">
      <Button type="button" variant="ghost" size="sm" className="p-2 mb-1 hover:bg-gray-100">
        <Paperclip className="h-5 w-5 text-gray-500" />
      </Button>
     
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full resize-none border border-gray-200 rounded-3xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-[120px] bg-white"
          rows={1}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100"
        >
          <Smile className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
     
      <Button
        type="submit"
        disabled={!text.trim()}
        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full mb-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
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
        console.log('Resolved params:', resolvedParams)
        
        if (!resolvedParams.userId || resolvedParams.userId === 'undefined' || resolvedParams.userId === 'null') {
          throw new Error('Invalid user ID in URL parameters')
        }
        
        setUserId(resolvedParams.userId)
      } catch (error) {
        console.error('Failed to resolve params:', error)
        setError('Invalid URL parameters')
        setLoading(false)
      }
    }

    resolveParams()
  }, [params])

  // Fetch user data function
  const fetchUserData = async (targetUserId: string): Promise<User> => {
    console.log('Fetching user data for ID:', targetUserId)
    
    // Try the primary endpoint first (matches your fixed API)
    const response = await fetch(`/api/users/${targetUserId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      // Handle specific HTTP status codes
      switch (response.status) {
        case 401:
          throw new Error('You need to be logged in to view this conversation')
        case 404:
          throw new Error('User not found')
        case 403:
          throw new Error('You do not have permission to view this user')
        case 500:
          throw new Error('Server error occurred while fetching user data')
        default:
          throw new Error(`Failed to fetch user data (Status: ${response.status})`)
      }
    }

    let userData: ApiResponse
    try {
      userData = await response.json()
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError)
      throw new Error('Invalid response format from server')
    }

    console.log('Received user data:', userData)
    
    // Extract and validate user data
    const user = extractUserData(userData)
    if (!user) {
      throw new Error('Failed to process user data')
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

        console.log('Initializing chat for userId:', userId)

        // Fetch user information
        const userInfo = await fetchUserData(userId)
        console.log('Successfully fetched user info:', userInfo)
        setUser(userInfo)

        // Create or get existing channel via API
        console.log('Creating/getting channel for user:', userInfo.id)
        
        const channelResponse = await fetch("/api/stream/channel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ recipientId: userInfo.id }),
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
        console.log('Channel data received:', channelData)

        if (!channelData.channelId) {
          throw new Error("No channel ID received from server")
        }

        // Connect to the channel with retry logic
        let retries = 3
        let streamChannel = null

        while (retries > 0 && !streamChannel) {
          try {
            console.log(`Attempting to connect to channel: ${channelData.channelId} (${retries} retries left)`)
            streamChannel = client.channel("messaging", channelData.channelId)
            await streamChannel.watch()
            console.log('Channel connected successfully:', channelData.channelId)
            break
          } catch (channelError) {
            console.warn(`Channel connection attempt failed:`, channelError)
            retries--
            if (retries === 0) {
              throw new Error(`Failed to connect to channel: ${channelError instanceof Error ? channelError.message : 'Unknown error'}`)
            }
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }

        if (!streamChannel) {
          throw new Error("Failed to establish channel connection")
        }

        setChannel(streamChannel)
        console.log('Chat initialization completed successfully')

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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Unable to Load Conversation</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push("/messages")}
            >
              Back to Messages
            </Button>
            <Button
              variant="outline"
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-blue-600">Setting up chat...</h2>
          <p className="mt-2 text-gray-600">Please wait while we prepare your conversation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Custom Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100"
            onClick={() => router.push("/messages")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
         
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image} />
            <AvatarFallback className="bg-blue-500 text-white">
              {user.username?.[0]?.toUpperCase() || user.nickname?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
         
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {user.nickname || user.username}
            </h3>
            {user.metro_area && (
              <p className="text-xs text-gray-500">{user.metro_area}</p>
            )}
            <p className="text-sm text-green-500">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
            <Video className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Info className="h-4 w-4 mr-2" />
                Contact Info
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Volume2 className="h-4 w-4 mr-2" />
                Mute Notifications
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pin className="h-4 w-4 mr-2" />
                Pin Chat
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive Chat
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stream Chat Integration */}
      <div className="flex-1 flex">
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
              background: #f8fafc;
            }
           
            .str-chat__message-list {
              padding: 1rem;
              background: #f8fafc;
            }
           
            .str-chat__message-list-scroll {
              height: 100%;
            }
           
            .str-chat__message-simple {
              margin-bottom: 0.75rem;
            }
           
            .str-chat__message-simple__content {
              background: white;
              border: none;
              border-radius: 1.125rem;
              padding: 0.75rem 1rem;
              box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
              max-width: 70%;
            }
           
            .str-chat__message-simple--me .str-chat__message-simple__content {
              background: #3b82f6;
              color: white;
            }
           
            .str-chat__message-simple__text {
              font-size: 0.875rem;
              line-height: 1.25rem;
              margin: 0;
            }
           
            .str-chat__avatar {
              width: 2rem;
              height: 2rem;
              margin-right: 0.5rem;
            }
           
            .str-chat__message-simple__actions {
              display: none;
            }
           
            .str-chat__message-simple:hover .str-chat__message-simple__actions {
              display: flex;
            }
           
            .str-chat__message-timestamp {
              font-size: 0.75rem;
              color: #6b7280;
              margin-top: 0.25rem;
            }
           
            .str-chat__message-simple__status {
              margin-top: 0.25rem;
            }
           
            .str-chat__message-simple__status svg {
              width: 0.875rem;
              height: 0.875rem;
              color: #3b82f6;
            }
           
            .str-chat__thread {
              border-left: 1px solid #e5e7eb;
              background: white;
            }
           
            .str-chat__message-list-scroll {
              scroll-behavior: smooth;
            }
           
            .str-chat__message-list-scroll::-webkit-scrollbar {
              width: 6px;
            }
           
            .str-chat__message-list-scroll::-webkit-scrollbar-track {
              background: #f1f5f9;
            }
           
            .str-chat__message-list-scroll::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 3px;
            }
           
            .str-chat__message-list-scroll::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
           
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
           
            .str-chat__message-simple {
              animation: slideInUp 0.2s ease-out;
            }
           
            @media (max-width: 768px) {
              .str-chat__message-simple__content {
                max-width: 85%;
              }
            }
          `
        }}
      />
    </div>
  )
}