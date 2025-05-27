// app/api/stream/channel/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { StreamChat } from "stream-chat"

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY!
)

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
    
    // Create deterministic channel ID based on user IDs (sorted to ensure consistency)
    const sortedIds = [currentUserId, recipientId].sort()
    const channelId = `dm_${sortedIds.join('_')}`

    try {
      // Ensure both users exist in Stream Chat before creating channel
      await Promise.all([
        // Create/update current user
        serverClient.upsertUser({
          id: currentUserId,
          name: session.user.name || `User ${currentUserId}`,
          image: session.user.image || undefined,
        }),
        // Create/update recipient user
        serverClient.upsertUser({
          id: recipientId,
          name: `User ${recipientId}`, // You might want to fetch actual user data
        })
      ])

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