// app/api/stream/token/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { StreamChat } from "stream-chat"

// Validate environment variables - but don't throw during build
const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY
const STREAM_SECRET_KEY = process.env.STREAM_SECRET_KEY

// Initialize StreamChat server client only when variables are available
let serverClient: StreamChat | null = null

if (STREAM_API_KEY && STREAM_SECRET_KEY) {
  try {
    serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_SECRET_KEY)
  } catch (error) {
    console.error("Failed to initialize Stream Chat client:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stream Chat is properly configured
    if (!serverClient) {
      console.error("Stream Chat client not initialized - missing environment variables")
      return NextResponse.json({ 
        error: "Stream Chat service unavailable",
        details: "Configuration error"
      }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.error("No session or user ID found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    
    // Validate userId format
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      console.error("Invalid user ID:", userId)
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Generate token with error handling
    let token: string
    try {
      token = serverClient.createToken(userId)
    } catch (tokenError) {
      console.error("Token creation failed:", tokenError)
      return NextResponse.json({ error: "Token generation failed" }, { status: 500 })
    }

    // Validate token was created
    if (!token) {
      console.error("Token is empty or undefined")
      return NextResponse.json({ error: "Invalid token generated" }, { status: 500 })
    }

    console.log(`Token generated successfully for user: ${userId}`)
    return NextResponse.json({ token, userId })
    
  } catch (error) {
    console.error("Stream token API error:", error)
    
    // More specific error handling
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: "Failed to generate token", 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}