// app/api/users/[userId]/follow-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/db';
import { followersTable } from '@/src/db/schema';
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

    const { userId } = await params;
    
    if (session.user.id === userId) {
      return NextResponse.json({ isFollowing: false }); // Can't follow yourself
    }

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