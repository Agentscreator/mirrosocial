// app/api/users/[userId]/following/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { usersTable, followersTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params in Next.js 15
    const { userId } = await params;

    // Get following
    const following = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        profileImage: usersTable.profileImage,
        image: usersTable.image,
      })
      .from(followersTable)
      .innerJoin(usersTable, eq(followersTable.followingId, usersTable.id))
      .where(eq(followersTable.followerId, userId))

    return NextResponse.json({
      following,
      success: true,
    })
  } catch (error) {
    console.error("Error fetching following:", error)
    return NextResponse.json({ error: "Failed to fetch following" }, { status: 500 })
  }
}