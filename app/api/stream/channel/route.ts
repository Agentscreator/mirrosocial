// app/api/stream/channel/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { StreamChat } from "stream-chat"
import crypto from "crypto"

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY!
)

function createChannelId(userId1: string, userId2: string): string {
  // Sort IDs to ensure consistency regardless of order
  const sortedIds = [userId1, userId2].sort()
  const combined = sortedIds.join('_')
  
  // If the combined string is short enough, use it directly
  if (combined.length <= 60) { // Leave room for 'dm_' prefix
    return `dm_${combined}`
  }
  
  // Otherwise, create a hash to ensure it's under 64 characters
  const hash = crypto.createHash('md5').update(combined).digest('hex')
  return `dm_${hash}` // This will be exactly 35 characters (dm_ + 32 char hash)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipientId } = await request.json()
    
    if (!recipientId) {
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 })
    }

    const currentUserId = session.user.id
    
    // Create deterministic channel ID that's guaranteed to be under 64 characters
    const channelId = createChannelId(currentUserId, recipientId)
    
    console.log(`Creating channel with ID: ${channelId} (length: ${channelId.length})`)

    try {
      // Ensure both users exist in Stream Chat before creating channel
      await Promise.all([
        // Create/update current user
        serverClient.upsertUser({
          id: currentUserId,
          name: session.user.name || `User ${currentUserId}`,
          image: session.user.image || undefined,
        }),
        // Create/update recipient user (you might want to fetch actual user data from your DB)
        serverClient.upsertUser({
          id: recipientId,
          name: `User ${recipientId}`,
        })
      ])

      // Create or get existing channel
      const channel = serverClient.channel('messaging', channelId, {
        members: [currentUserId, recipientId],
        created_by_id: currentUserId,
      })

      // Create the channel if it doesn't exist
      await channel.create()

      return NextResponse.json({ 
        channelId,
        success: true 
      })
    } catch (streamError: any) {
      console.error("Stream error:", streamError)
      
      // Handle Stream Chat specific errors
      if (streamError.code === 4 && streamError.message?.includes('already exists')) {
        // Channel already exists, that's fine
        return NextResponse.json({ 
          channelId,
          success: true,
          message: "Channel already exists"
        })
      }
      
      // Re-throw other Stream errors
      throw streamError
    }
  } catch (error: any) {
    console.error("Channel creation error:", error)
    return NextResponse.json({ 
      error: "Failed to create channel",
      details: error.message || "Unknown error",
      success: false
    }, { status: 500 })
  }
}