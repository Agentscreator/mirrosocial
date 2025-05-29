"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Info,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  Volume2,
  Archive,
  Trash2,
  Pin,
  Users,
  Settings,
  MessageSquarePlus,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Chat,
  Channel,
  MessageList,
  Thread,
  Window,
  ChannelList,
  useChannelStateContext,
  useChatContext,
  type ChannelPreviewUIComponentProps,
} from "stream-chat-react"
import { useStreamContext } from "@/components/providers/StreamProvider"
import type { Channel as StreamChannel } from "stream-chat"
import "stream-chat-react/dist/css/v2/index.css"
import { cn } from "@/lib/utils"

// Custom Channel Preview Component
const CustomChannelPreview = ({ channel, setActiveChannel, watchers }: ChannelPreviewUIComponentProps) => {
  const { client } = useChatContext()
  const currentUser = client.user

  // Get the other participant
  const otherMember = Object.values(channel.state.members || {}).find((member) => member.user?.id !== currentUser?.id)

  const lastMessage = channel.state.messages[channel.state.messages.length - 1]
  const unreadCount = channel.countUnread()

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString()
  }

  const handleClick = () => {
    setActiveChannel?.(channel, watchers)
  }

  return (
    <div
      onClick={handleClick}
      className="group flex items-center p-4 hover:bg-gradient-to-r hover:from-sky-50/50 hover:to-white cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-sm rounded-2xl mx-2 my-1"
    >
      <div className="relative mr-4">
        <Avatar className="h-14 w-14 ring-2 ring-sky-100/50 ring-offset-2 transition-all duration-300 group-hover:ring-sky-200">
          <AvatarImage src={otherMember?.user?.image || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white font-semibold text-lg">
            {otherMember?.user?.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        {/* Online status indicator */}
        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-400 border-3 border-white rounded-full shadow-sm animate-pulse"></div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sky-900 truncate text-base">
            {otherMember?.user?.name || otherMember?.user?.id || "Unknown"}
          </h3>
          <div className="flex items-center gap-2">
            {lastMessage && (
              <span className="text-xs text-sky-500 font-medium">{formatTime(new Date(lastMessage.created_at!))}</span>
            )}
            {unreadCount > 0 && (
              <Badge className="bg-gradient-to-r from-sky-400 to-sky-500 text-white text-xs px-2 py-1 min-w-[1.5rem] h-6 shadow-lg shadow-sky-200/50 animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastMessage?.user?.id === currentUser?.id && (
            <div className="text-sky-500 flex-shrink-0">
              {lastMessage.status === "received" ? <CheckCheck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </div>
          )}
          <p className="text-sm text-sky-600 truncate leading-relaxed">
            {lastMessage?.text || lastMessage?.type || "No messages yet"}
          </p>
        </div>
      </div>
    </div>
  )
}

// Custom Channel Header
const CustomChannelHeader = ({ onBack }: { onBack?: () => void }) => {
  const { channel } = useChannelStateContext()
  const { client } = useChatContext()
  const currentUser = client.user

  const otherMember = Object.values(channel.state.members || {}).find((member) => member.user?.id !== currentUser?.id)

  return (
    <div className="flex items-center justify-between p-4 md:p-6 bg-white/95 backdrop-blur-xl border-b border-sky-100/50 shadow-sm">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile back button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-2 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-sky-100 ring-offset-2">
          <AvatarImage src={otherMember?.user?.image || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white font-semibold">
            {otherMember?.user?.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-sky-900 text-base md:text-lg">{otherMember?.user?.name || "Unknown"}</h2>
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

// Custom Message Input Component
const CustomMessageInput = () => {
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
    <div className="p-4 md:p-6 bg-white/95 backdrop-blur-xl border-t border-sky-100/50 pb-[env(safe-area-inset-bottom)] relative z-10">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-4 min-h-[60px]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="p-2 md:p-3 mb-1 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200 flex-shrink-0"
        >
          <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
          <span className="sr-only md:not-sr-only md:ml-1 text-xs">Media</span>
        </Button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full resize-none border-0 rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-sm bg-sky-50/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 focus:bg-white/80 max-h-[120px] placeholder:text-sky-400 transition-all duration-300"
            rows={1}
          />
        </div>

        <Button
          type="submit"
          disabled={!text.trim()}
          className="bg-sky-500 hover:bg-sky-600 text-white p-3 md:p-4 rounded-full mb-1 disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex-shrink-0"
        >
          <Send className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </form>
    </div>
  )
}

// Empty State Component
const EmptyState = () => (
  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-sky-50/30 via-white to-sky-50/30 relative overflow-hidden">
    {/* Simple doodle elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Simple line doodles */}
      <svg className="absolute top-1/4 left-1/4 w-16 h-16 text-sky-200/40" viewBox="0 0 64 64" fill="none">
        <path
          d="M8 32C8 32 16 24 32 32C48 40 56 32 56 32"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="2" fill="currentColor" />
        <circle cx="44" cy="44" r="1.5" fill="currentColor" />
      </svg>

      <svg className="absolute bottom-1/3 right-1/4 w-12 h-12 text-sky-200/40" viewBox="0 0 48 48" fill="none">
        <path
          d="M12 24L24 12L36 24L24 36Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="1" fill="currentColor" />
      </svg>

      <svg className="absolute top-1/2 right-1/3 w-10 h-10 text-sky-200/40" viewBox="0 0 40 40" fill="none">
        <path
          d="M8 20C8 20 12 16 20 20C28 24 32 20 32 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect x="16" y="28" width="8" height="4" rx="2" fill="currentColor" />
      </svg>

      <svg className="absolute top-1/3 left-1/2 w-8 h-8 text-sky-200/40" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="24" cy="8" r="1" fill="currentColor" />
      </svg>

      <svg className="absolute bottom-1/4 left-1/3 w-14 h-14 text-sky-200/40" viewBox="0 0 56 56" fill="none">
        <path
          d="M14 28L28 14L42 28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M20 42C20 42 24 38 28 42C32 46 36 42 36 42"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>

    {/* Minimal content area - completely empty */}
    <div className="text-center max-w-md relative z-10">{/* Just empty space for clean, minimal look */}</div>

    {/* Subtle grid pattern overlay */}
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(14 165 233) 1px, transparent 0)`,
        backgroundSize: "32px 32px",
      }}
    ></div>
  </div>
)

// Main Messages Page Component
export default function MessagesPage() {
  const { client, isReady, error: streamError } = useStreamContext()
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  // Custom setActiveChannel handler that matches the expected signature
  const handleSetActiveChannel = (
    newChannel?: StreamChannel,
    watchers?: { limit?: number; offset?: number },
    event?: any,
  ) => {
    setActiveChannel(newChannel || null)
  }

  if (streamError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-sky-100/50 border border-sky-100/50">
          <h2 className="text-xl font-semibold text-red-500 mb-3">Chat Unavailable</h2>
          <p className="text-sky-600 mb-6">{streamError}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!client || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-100 border-t-sky-400 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200/20 to-sky-400/20 animate-pulse"></div>
          </div>
          <p className="text-sky-600 font-medium">Loading chat...</p>
        </div>
      </div>
    )
  }

  const currentUser = client.user
  if (!currentUser?.id) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50">
        <p className="text-sky-600">Unable to load user information</p>
      </div>
    )
  }

  // Channel filters and options
  const channelListFilters = {
    type: "messaging",
    members: { $in: [currentUser.id] },
  }

  const channelListSort = { last_message_at: -1 as const }
  const channelListOptions = {
    limit: 20,
    state: true,
    watch: true,
    presence: true,
  }

  return (
    <div className="flex h-[100dvh] bg-gradient-to-br from-sky-50/30 via-white to-sky-50/30">
      <Chat client={client}>
        {/* Sidebar - hidden on mobile when channel is active */}
        <div
          className={cn(
            "w-full md:w-96 border-r border-sky-100/50 flex flex-col bg-white/95 backdrop-blur-xl shadow-lg",
            activeChannel && "hidden md:flex",
          )}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-sky-100/50 bg-white/95 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-500 rounded-full flex items-center justify-center shadow-lg shadow-sky-200/50">
                  <MessageSquarePlus className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-sky-900">Messages</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/discover")}
                  className="p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-sky-100/50 shadow-xl">
                    <DropdownMenuItem className="text-sky-700 hover:bg-sky-50">
                      <Users className="h-4 w-4 mr-3" />
                      New Group
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-sky-700 hover:bg-sky-50">
                      <Archive className="h-4 w-4 mr-3" />
                      Archived Chats
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-sky-700 hover:bg-sky-50">
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-sky-50/50 border-0 rounded-2xl h-12 placeholder:text-sky-400 focus:ring-2 focus:ring-sky-300/50 focus:bg-white/80 transition-all duration-300"
              />
            </div>
          </div>

          {/* Channel List */}
          <div className="flex-1 overflow-hidden">
            <ChannelList
              filters={channelListFilters}
              sort={channelListSort}
              options={channelListOptions}
              Preview={(props) => <CustomChannelPreview {...props} setActiveChannel={handleSetActiveChannel} />}
              setActiveChannelOnMount={false}
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={cn("flex-1 flex flex-col h-full", !activeChannel && "hidden md:flex")}>
          {activeChannel ? (
            <Channel channel={activeChannel}>
              <Window>
                <CustomChannelHeader onBack={() => setActiveChannel(null)} />
                <div className="flex-1 overflow-hidden">
                  <MessageList />
                </div>
                <div className="flex-shrink-0 w-full">
                  <CustomMessageInput />
                </div>
              </Window>
              <Thread />
            </Channel>
          ) : (
            <EmptyState />
          )}
        </div>
      </Chat>

      {/* Custom Styles */}
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

            .str-chat__channel-list {
              background: transparent;
            }

            .str-chat__channel-list-messenger__main {
              background: transparent;
            }

            .str-chat__channel-preview-messenger {
              background: transparent;
              border: none;
              padding: 0;
              margin: 0;
            }

            .str-chat__channel-preview-messenger:hover {
              background: transparent;
            }

            .str-chat__channel-preview-messenger--active {
              background: rgba(14, 165, 233, 0.05);
              border-radius: 1rem;
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

            @keyframes slideInLeft {
              from {
                opacity: 0;
                transform: translateX(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }

            .str-chat__channel-list {
              animation: slideInLeft 0.5s ease-out;
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
