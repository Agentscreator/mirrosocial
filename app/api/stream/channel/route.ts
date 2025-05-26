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
    
    // Avoid self-referencing API call - use direct database query instead
    // Replace this with your actual user validation logic
    // const recipientResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/users/${recipientId}`)
    // if (!recipientResponse.ok) {
    //   return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    // }

    // Create deterministic channel ID based on user IDs (sorted to ensure consistency)
    const sortedIds = [currentUserId, recipientId].sort()
    const channelId = `dm_${sortedIds.join('_')}`

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