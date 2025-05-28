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

    if (existingFollow.length > 0) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    // Follow - create the relationship
    await db.insert(followersTable).values({
      followerId: currentUserId,
      followingId: userId,
    });

    return NextResponse.json({
      success: true,
      isFollowing: true,
      message: 'Successfully followed user'
    });

  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Can't unfollow yourself
    if (currentUserId === userId) {
      return NextResponse.json(
        { error: 'Cannot unfollow yourself' },
        { status: 400 }
      );
    }

    // Check if currently following
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

    if (existingFollow.length === 0) {
      return NextResponse.json(
        { error: 'Not currently following this user' },
        { status: 400 }
      );
    }

    // Unfollow - delete the relationship
    await db
      .delete(followersTable)
      .where(
        and(
          eq(followersTable.followerId, currentUserId),
          eq(followersTable.followingId, userId)
        )
      );

    return NextResponse.json({
      success: true,
      isFollowing: false,
      message: 'Successfully unfollowed user'
    });

  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}

// GET method to check follow status
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