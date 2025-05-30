import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { usersTable, userTagsTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { nickname, about, genderPreference, preferredAgeMin, preferredAgeMax, proximity, metro_area, tagIds } = body

    // Update user preferences
    const updateData: any = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (about !== undefined) updateData.about = about
    if (genderPreference !== undefined) updateData.genderPreference = genderPreference
    if (preferredAgeMin !== undefined) updateData.preferredAgeMin = preferredAgeMin
    if (preferredAgeMax !== undefined) updateData.preferredAgeMax = preferredAgeMax
    if (proximity !== undefined) updateData.proximity = proximity
    if (metro_area !== undefined) updateData.metro_area = metro_area

    // Add updated_at timestamp
    updateData.updated_at = new Date()

    // Update user data
    await db.update(usersTable).set(updateData).where(eq(usersTable.id, session.user.id))

    // Update user tags if provided
    if (tagIds && Array.isArray(tagIds)) {
      // Delete existing user tags
      await db.delete(userTagsTable).where(eq(userTagsTable.userId, session.user.id))

      // Insert new user tags
      if (tagIds.length > 0) {
        const userTagsData = tagIds.map((tagId) => ({
          userId: session.user.id,
          tagId: Number.parseInt(tagId),
        }))

        await db.insert(userTagsTable).values(userTagsData)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
