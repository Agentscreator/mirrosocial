// app/api/users/profile/[userId]/route.ts - Enhanced profile endpoint
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { db } from '@/src/db'
import { usersTable, userTagsTable, tagsTable, followersTable } from '@/src/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeTags = searchParams.get('includeTags') === 'true'

    const { userId } = await params
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user basic info
    const user = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        image: usersTable.image,
        profileImage: usersTable.profileImage,
        about: usersTable.about,
        metro_area: usersTable.metro_area,
        created_at: usersTable.created_at
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userProfile = user[0]

    // Check if current user is following this user
    let isFollowing = false
    if (session.user.id !== userId) {
      const followingCheck = await db
        .select()
        .from(followersTable)
        .where(
          and(
            eq(followersTable.followerId, session.user.id),
            eq(followersTable.followingId, userId)
          )
        )
        .limit(1)
      
      isFollowing = followingCheck.length > 0
    }

    const response: any = {
      // Return user data in the format your frontend expects
      id: userProfile.id,
      username: userProfile.username,
      nickname: userProfile.nickname,
      image: userProfile.profileImage || userProfile.image,
      profileImage: userProfile.profileImage,
      about: userProfile.about,
      metro_area: userProfile.metro_area,
      created_at: userProfile.created_at,
      isFollowing,
      success: true
    }

    // Optionally include tags if requested
    if (includeTags) {
      const userTags = await db
        .select({
          tagId: userTagsTable.tagId,
          tagName: tagsTable.name,
          tagCategory: tagsTable.category
        })
        .from(userTagsTable)
        .innerJoin(tagsTable, eq(userTagsTable.tagId, tagsTable.id))
        .where(eq(userTagsTable.userId, userId))

      response.tags = userTags
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

