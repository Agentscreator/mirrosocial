'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  Smile,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  Volume2,
  VolumeX,
  Archive,
  Trash2,
  Pin,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Thread,
  Window,
  ChannelList,
  useChannelStateContext,
  useChatContext,
  MessageInputFlat,
  ChannelPreviewUIComponentProps,
} from 'stream-chat-react'
import { useStreamContext } from '@/components/providers/StreamProvider'
import { Channel as StreamChannel } from 'stream-chat'
import 'stream-chat-react/dist/css/v2/index.css'

// Custom Channel Preview Component
const CustomChannelPreview = ({ channel, setActiveChannel, watchers }: ChannelPreviewUIComponentProps) => {
  const { client } = useChatContext()
  const currentUser = client.user
  
  // Get the other participant
  const otherMember = Object.values(channel.state.members || {}).find(
    member => member.user?.id !== currentUser?.id
  )
  
  const lastMessage = channel.state.messages[channel.state.messages.length - 1]
  const unreadCount = channel.countUnread()
  
  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'now'
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
      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
    >
      <div className="relative mr-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherMember?.user?.image} />
          <AvatarFallback className="bg-blue-500 text-white">
            {otherMember?.user?.name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        {/* Online status indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm text-gray-900 truncate">
            {otherMember?.user?.name || otherMember?.user?.id || 'Unknown'}
          </h3>
          <div className="flex items-center gap-1">
            {lastMessage && (
              <span className="text-xs text-gray-500">
                {formatTime(new Date(lastMessage.created_at!))}
              </span>
            )}
            {unreadCount > 0 && (
              <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {lastMessage?.user?.id === currentUser?.id && (
            <div className="text-blue-500">
              {lastMessage.status === 'received' ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </div>
          )}
          <p className="text-sm text-gray-600 truncate">
            {lastMessage?.text || lastMessage?.type || 'No messages yet'}
          </p>
        </div>
      </div>
    </div>
  )
}

// Custom Channel Header
const CustomChannelHeader = () => {
  const { channel } = useChannelStateContext()
  const { client } = useChatContext()
  const currentUser = client.user
  
  const otherMember = Object.values(channel.state.members || {}).find(
    member => member.user?.id !== currentUser?.id
  )

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherMember?.user?.image} />
          <AvatarFallback className="bg-blue-500 text-white">
            {otherMember?.user?.name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-gray-900">
            {otherMember?.user?.name || 'Unknown'}
          </h2>
          <p className="text-sm text-green-500">Online</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="p-2">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="p-2">
          <Video className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
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
  )
}

// Custom Message Input Component
const CustomMessageInput = () => {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { channel } = useChannelStateContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !channel) return

    try {
      await channel.sendMessage({
        text: text.trim(),
      })
      setText('')
    } catch (error) {
      console.error('Error sending message:', error)
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
    <div className="flex items-end gap-3 p-4 border-t bg-white">
      <Button variant="ghost" size="sm" className="p-2 mb-1">
        <Paperclip className="h-5 w-5 text-gray-500" />
      </Button>
      
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full resize-none border rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-[120px]"
          rows={1}
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5"
        >
          <Smile className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
      
      <Button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full mb-1"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Empty State Component
const EmptyState = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="h-12 w-12 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Welcome to Messages
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm">
        Select a conversation to start chatting, or create a new conversation to connect with someone.
      </p>
      <Button className="bg-blue-500 hover:bg-blue-600 text-white">
        <Plus className="h-4 w-4 mr-2" />
        New Message
      </Button>
    </div>
  </div>
)

// Main Messages Page Component
export default function MessagesPage() {
  const { client, isReady, error: streamError } = useStreamContext()
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  // Custom setActiveChannel handler that matches the expected signature
  const handleSetActiveChannel = (
    newChannel?: StreamChannel,
    watchers?: { limit?: number; offset?: number },
    event?: any
  ) => {
    setActiveChannel(newChannel || null)
  }

  if (streamError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Chat Unavailable</h2>
          <p className="text-gray-600 mb-4">{streamError}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!client || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  const currentUser = client.user
  if (!currentUser?.id) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Unable to load user information</p>
      </div>
    )
  }

  // Channel filters and options
  const channelListFilters = {
    type: 'messaging',
    members: { $in: [currentUser.id] }
  }

  const channelListSort = { last_message_at: -1 as const }
  const channelListOptions = {
    limit: 20,
    state: true,
    watch: true,
    presence: true
  }

  return (
    <div className="flex h-screen bg-white">
      <Chat client={client}>
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.push('/discover')}
                  className="p-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>New Group</DropdownMenuItem>
                    <DropdownMenuItem>Archived Chats</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-100 border-none rounded-full"
              />
            </div>
          </div>

          {/* Channel List */}
          <div className="flex-1 overflow-hidden">
            <ChannelList
              filters={channelListFilters}
              sort={channelListSort}
              options={channelListOptions}
              Preview={(props) => (
                <CustomChannelPreview 
                  {...props}
                  setActiveChannel={handleSetActiveChannel}
                />
              )}
              setActiveChannelOnMount={false}
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChannel ? (
            <Channel channel={activeChannel}>
              <Window>
                <CustomChannelHeader />
                <div className="flex-1 overflow-hidden">
                  <MessageList />
                </div>
                <CustomMessageInput />
              </Window>
              <Thread />
            </Channel>
          ) : (
            <EmptyState />
          )}
        </div>
      </Chat>

      {/* Custom Styles */}
      <style jsx global>{`
        .str-chat__main-panel {
          height: 100%;
        }
        
        .str-chat__message-list {
          padding: 1rem;
          background: #f8fafc;
        }
        
        .str-chat__message-list-scroll {
          height: 100%;
        }
        
        .str-chat__message-simple {
          margin-bottom: 0.5rem;
        }
        
        .str-chat__message-simple__content {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        
        .str-chat__message-simple--me .str-chat__message-simple__content {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .str-chat__message-simple__text {
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        
        .str-chat__avatar {
          width: 2rem;
          height: 2rem;
        }
        
        .str-chat__message-simple__actions {
          display: none;
        }
        
        .str-chat__message-simple:hover .str-chat__message-simple__actions {
          display: flex;
        }
      `}</style>
    </div>
  )
}