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

// Function to generate a short, deterministic channel ID
function generateChannelId(userId1: string, userId2: string): string {
  // Sort IDs to ensure consistency regardless of who initiates the chat
  const sortedIds = [userId1, userId2].sort()
  
  // Try the simple approach first
  const simpleId = `dm_${sortedIds.join('_')}`
  
  // If it's within the 64-character limit, use it
  if (simpleId.length <= 64) {
    return simpleId
  }
  
  // If too long, create a hash-based approach
  // Use first 8 characters of each ID plus a hash for uniqueness
  const shortId1 = sortedIds[0].substring(0, 8)
  const shortId2 = sortedIds[1].substring(0, 8)
  
  // Create a deterministic hash of the full IDs for uniqueness
  const hash = crypto
    .createHash('sha256')
    .update(sortedIds.join('_'))
    .digest('hex')
    .substring(0, 8)
  
  const hashedId = `dm_${shortId1}_${shortId2}_${hash}`
  
  // If still too long, use pure hash approach
  if (hashedId.length > 64) {
    const fullHash = crypto
      .createHash('sha256')
      .update(sortedIds.join('_'))
      .digest('hex')
      .substring(0, 32) // Use 32 chars to stay well under 64
    
    return `dm_${fullHash}`
  }
  
  return hashedId
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipientId, channelId: providedChannelId } = await request.json()
    
    if (!recipientId) {
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 })
    }

    const currentUserId = session.user.id
    
    // Use provided channel ID if available (from frontend), otherwise generate one
    const channelId = providedChannelId || generateChannelId(currentUserId, recipientId)
    
    // Log for debugging
    console.log(`Generated channel ID: "${channelId}" (${channelId.length} characters)`)
    console.log(`Current user: ${currentUserId}`)
    console.log(`Recipient: ${recipientId}`)
    
    // Validate channel ID length
    if (channelId.length > 64) {
      console.error(`Channel ID too long: ${channelId.length} characters`)
      return NextResponse.json({ 
        error: "Channel ID too long", 
        details: `Generated ID is ${channelId.length} characters, max is 64`
      }, { status: 400 })
    }

    try {
      // Create or get existing channel
      const channel = serverClient.channel('messaging', channelId, {
        members: [currentUserId, recipientId],
        created_by_id: currentUserId,
      })

      // Create the channel if it doesn't exist
      await channel.create()

      return NextResponse.json({ channelId })
    } catch (streamError: any) {
      console.error("Stream error:", streamError)
      
      // Handle Stream Chat specific errors
      if (streamError.code === 4) {
        // Channel already exists or validation error
        if (streamError.message?.includes('length')) {
          return NextResponse.json({ 
            error: "Channel ID validation failed", 
            details: streamError.message 
          }, { status: 400 })
        }
        // Channel already exists, that's fine
        return NextResponse.json({ channelId })
      }
      throw streamError
    }
  } catch (error) {
    console.error("Channel creation error:", error)
    return NextResponse.json({
      error: "Failed to create channel",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}