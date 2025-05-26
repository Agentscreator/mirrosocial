// components/providers/StreamProvider.tsx
'use client'

import { StreamChat } from 'stream-chat'
import { Chat, useChatContext } from 'stream-chat-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState, createContext, useContext } from 'react'

// Create a context for additional Stream functionality
const StreamContext = createContext<{
  client: StreamChat | null
  isLoading: boolean
  error: string | null
  isReady: boolean
}>({
  client: null,
  isLoading: true,
  error: null,
  isReady: false
})

// Export the hook for components to use
export const useStreamContext = () => {
  const context = useContext(StreamContext)
  if (!context) {
    throw new Error('useStreamContext must be used within a StreamProvider')
  }
  return context
}

// Also export the chat context hook for convenience
export { useChatContext }

let chatClient: StreamChat | null = null

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [client, setClient] = useState<StreamChat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user?.id) {
      setIsLoading(false)
      setIsReady(false)
      return
    }

    const initializeClient = async () => {
      try {
        setError(null)
        
        if (!process.env.NEXT_PUBLIC_STREAM_API_KEY) {
          throw new Error('Stream API key is not configured')
        }

        // Create client if it doesn't exist
        if (!chatClient) {
          chatClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY)
        }

        // Check if user is already connected
        if (chatClient.userID === session.user.id) {
          setClient(chatClient)
          setIsReady(true)
          setIsLoading(false)
          return
        }

        // Disconnect any existing user first
        if (chatClient.userID) {
          await chatClient.disconnectUser()
        }

        // Get token from your API
        const tokenResponse = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id
          })
        })

        if (!tokenResponse.ok) {
          throw new Error(`Failed to get Stream token: ${tokenResponse.status}`)
        }

        const { token } = await tokenResponse.json()

        if (!token) {
          throw new Error('No token received from API')
        }

        // Connect user
        await chatClient.connectUser(
          {
            id: session.user.id,
            name: session.user.name || 'Unknown User',
            image: session.user.image || undefined,
          },
          token
        )

        setClient(chatClient)
        setIsReady(true)
        console.log('Stream client connected successfully')
        
      } catch (err) {
        console.error('Stream client initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize chat')
        setIsReady(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeClient()

    // Cleanup on unmount
    return () => {
      // Don't disconnect here as it might interfere with other components
      // Only disconnect when the session changes or component unmounts completely
    }
  }, [session?.user?.id, status])

  // Cleanup on unmount or session change
  useEffect(() => {
    return () => {
      if (chatClient?.userID && status !== 'loading') {
        chatClient.disconnectUser()
          .catch(err => console.error('Error disconnecting user:', err))
      }
    }
  }, [])

  if (status === 'loading' || isLoading) {
    return (
      <StreamContext.Provider value={{ client: null, isLoading: true, error: null, isReady: false }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </StreamContext.Provider>
    )
  }

  if (error) {
    return (
      <StreamContext.Provider value={{ client: null, isLoading: false, error, isReady: false }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-600">
            <p>Chat initialization failed: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </StreamContext.Provider>
    )
  }

  if (!session?.user?.id || !client || !isReady) {
    return (
      <StreamContext.Provider value={{ client, isLoading: false, error: null, isReady }}>
        {children}
      </StreamContext.Provider>
    )
  }

  return (
    <StreamContext.Provider value={{ client, isLoading: false, error: null, isReady: true }}>
      <Chat client={client} theme="messaging light">
        {children}
      </Chat>
    </StreamContext.Provider>
  )
}