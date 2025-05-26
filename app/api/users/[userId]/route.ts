// app/api/users/[userId]/route.ts - Fixed to return single user profile
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/db';
import { usersTable, followersTable } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const { userId } = await params;
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get user profile
    const user = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        profileImage: usersTable.profileImage,
        image: usersTable.image,
        about: usersTable.about,
        metro_area: usersTable.metro_area,
        created_at: usersTable.created_at,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userProfile = user[0];

    // Check if current user is following this user
    let isFollowing = false;
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
        .limit(1);
      
      isFollowing = followingCheck.length > 0;
    }

    // Return consistent format that your frontend expects
    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
