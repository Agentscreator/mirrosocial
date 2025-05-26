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

export default function SingleConversationPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const [user, setUser] = useState<User | null>(null)
  const [channel, setChannel] = useState<StreamChannel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { client, isReady, error: streamError } = useStreamContext()

  useEffect(() => {
    const initializeChat = async () => {
      if (!client || !isReady || !userId || streamError) {
        if (streamError) {
          setError("Chat service unavailable")
        }
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Validate userId format
        if (!userId || userId === 'undefined' || userId === 'null') {
          setError("Invalid user ID")
          return
        }

        console.log('Fetching user data for userId:', userId)

        // Fetch user information first
        const userResponse = await fetch(`/api/users/${userId}`)
        if (!userResponse.ok) {
          console.error('User fetch failed:', userResponse.status, userResponse.statusText)
          if (userResponse.status === 404) {
            setError("User not found")
            return
          }
          throw new Error(`Failed to fetch user data: ${userResponse.status}`)
        }

        const userData = await userResponse.json()
        console.log('User data received:', JSON.stringify(userData, null, 2))

        // Handle different possible response structures
        let userInfo: User | null = null

        // Try to extract user data from various possible structures
        const extractUserData = (data: any): User | null => {
          // Direct user object
          if (data.user) {
            const user = data.user
            return {
              id: user.id?.toString() || user._id?.toString() || user.userId?.toString(),
              username: user.username || user.name || user.displayName,
              nickname: user.nickname || user.displayName || user.fullName,
              image: user.image || user.profileImage || user.avatar || user.photo,
            }
          }
          
          // Direct data structure
          if (data.id || data._id || data.userId) {
            return {
              id: data.id?.toString() || data._id?.toString() || data.userId?.toString(),
              username: data.username || data.name || data.displayName,
              nickname: data.nickname || data.displayName || data.fullName,
              image: data.image || data.profileImage || data.avatar || data.photo,
            }
          }

          // Array response - take first item
          if (Array.isArray(data) && data.length > 0) {
            return extractUserData(data[0])
          }

          // Nested data structure
          if (data.data) {
            return extractUserData(data.data)
          }

          // Success wrapper
          if (data.success && data.user) {
            return extractUserData(data.user)
          }

          return null
        }

        userInfo = extractUserData(userData)

        if (!userInfo) {
          console.error('Could not extract user data from response:', userData)
          console.error('Available keys:', Object.keys(userData))
          throw new Error(`Invalid user data structure. Available keys: ${Object.keys(userData).join(', ')}`)
        }

        // Validate required fields - be more flexible with username
        if (!userInfo.id || (!userInfo.username && !userInfo.nickname)) {
          console.error('Missing required user fields:', userInfo)
          console.error('userInfo.id:', userInfo.id)
          console.error('userInfo.username:', userInfo.username)
          console.error('userInfo.nickname:', userInfo.nickname)
          throw new Error(`Invalid user data: missing required fields. ID: ${userInfo.id}, Username: ${userInfo.username}, Nickname: ${userInfo.nickname}`)
        }

        // Ensure we have a displayable name
        if (!userInfo.username && userInfo.nickname) {
          userInfo.username = userInfo.nickname
        }

        console.log('Final user info:', userInfo)

        setUser(userInfo)

        console.log('Creating channel for user:', userInfo.id)

        // Create or get existing channel via API
        const channelResponse = await fetch("/api/stream/channel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId: userInfo.id }),
        })

        if (!channelResponse.ok) {
          const errorText = await channelResponse.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          console.error('Channel creation failed:', errorData)
          throw new Error(errorData.error || "Failed to create channel")
        }

        const channelData = await channelResponse.json()
        console.log('Channel data received:', channelData)

        if (!channelData.channelId) {
          throw new Error("No channel ID received")
        }

        // Connect to the channel with retry logic
        let retries = 3
        let streamChannel = null

        while (retries > 0 && !streamChannel) {
          try {
            streamChannel = client.channel("messaging", channelData.channelId)
            await streamChannel.watch()
            console.log('Channel connected successfully:', channelData.channelId)
            break
          } catch (channelError) {
            console.warn(`Channel watch attempt failed, retries left: ${retries - 1}`, channelError)
            retries--
            if (retries === 0) {
              throw channelError
            }
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }

        setChannel(streamChannel)
      } catch (err) {
        console.error("Chat initialization error:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load conversation"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to ensure router is ready
    const timer = setTimeout(initializeChat, 100)
    return () => clearTimeout(timer)
  }, [client, isReady, userId, streamError])

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

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{error}</h2>
          <p className="text-gray-600 mb-4">
            {error === "User not found"
              ? "This user doesn't exist or has been removed."
              : error === "Invalid user ID"
              ? "The user ID provided is not valid."
              : "Unable to load this conversation. Please try again."}
          </p>
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

  if (!channel || !user || !client || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-blue-600">Loading...</h2>
          <p className="mt-2 text-gray-600">Setting up your conversation...</p>
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
              {user.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {user.nickname || user.username}
            </h3>
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

      {/* Stream Chat Integration - No double Chat wrapper */}
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

      {/* Custom Styles - Using dangerouslySetInnerHTML for global styles */}
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