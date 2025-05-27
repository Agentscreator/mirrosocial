// app/api/users/[userId]/follow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/db';
import { followersTable } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const currentUserId = session.user.id;

    // Can't follow yourself
    if (currentUserId === userId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await db
      .select()
      .from(followersTable)
      .where(
        and(
          eq(followersTable.followerId, currentUserId),
          eq(followersTable.followingId, userId)
        )
      )
      .limit(1);

    let isFollowing: boolean;

    if (existingFollow.length > 0) {
      // Unfollow - delete the relationship
      await db
        .delete(followersTable)
        .where(
          and(
            eq(followersTable.followerId, currentUserId),
            eq(followersTable.followingId, userId)
          )
        );
      isFollowing = false;
    } else {
      // Follow - create the relationship
      await db.insert(followersTable).values({
        followerId: currentUserId,
        followingId: userId,
      });
      isFollowing = true;
    }

    return NextResponse.json({
      success: true,
      isFollowing,
      message: isFollowing ? 'Successfully followed user' : 'Successfully unfollowed user'
    });

  } catch (error) {
    console.error('Error toggling follow status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle follow status' },
      { status: 500 }
    );
  }
}

// Optional: GET method to check follow status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const currentUserId = session.user.id;

    if (currentUserId === userId) {
      return NextResponse.json({ isFollowing: false });
    }

    const followingCheck = await db
      .select()
      .from(followersTable)
      .where(
        and(
          eq(followersTable.followerId, currentUserId),
          eq(followersTable.followingId, userId)
        )
      )
      .limit(1);

    return NextResponse.json({
      isFollowing: followingCheck.length > 0
    });

  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}