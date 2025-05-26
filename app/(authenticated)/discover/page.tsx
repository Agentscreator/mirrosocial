"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, MessageCircle, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserCard } from "@/components/user-card"
import { TypingAnimation } from "@/components/typing-animation"
import { ShimmerText } from "@/components/shimmer-text"
import type { RecommendedUser } from "@/src/lib/recommendationService"
import { fetchRecommendations, generateExplanation } from "@/src/lib/apiServices"
import type { RecommendedUser as ApiRecommendedUser } from "@/src/lib/apiServices"
import { useRouter } from "next/navigation"
import { debounce } from "lodash"
import { useStreamContext } from "@/components/providers/StreamProvider"
import { toast } from "@/hooks/use-toast"

// Define search user type
interface SearchUser {
  id: string
  username: string
  nickname?: string
  image?: string
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<RecommendedUser[]>([])
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [explanationLoading, setExplanationLoading] = useState<number>(-1)
  const [generatingExplanations, setGeneratingExplanations] = useState<Set<string>>(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [messagingUser, setMessagingUser] = useState<string | null>(null)
  const router = useRouter()
  const { client: streamClient, isReady } = useStreamContext()

  // Helper function to convert API user to local user type
  const convertApiUserToLocalUser = (apiUser: ApiRecommendedUser): RecommendedUser => ({
    id: apiUser.id,
    username: apiUser.username,
    image: apiUser.image ?? null,
    reason: apiUser.reason,
    tags: apiUser.tags ?? [],
    score: (apiUser as any).score ?? 0,
  })

  // Search users function - FIXED
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`, {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()

        // Handle different response structures
        let users: SearchUser[] = []

        if (data.users && Array.isArray(data.users)) {
          // Response has { users: [...] } structure
          users = data.users.map((user: any) => ({
            id: user.id?.toString() || user._id?.toString(),
            username: user.username || user.name || user.displayName,
            nickname: user.nickname || user.displayName || user.fullName,
            image: user.image || user.profileImage || user.avatar,
          }))
        } else if (Array.isArray(data)) {
          // Response is directly an array
          users = data.map((user: any) => ({
            id: user.id?.toString() || user._id?.toString(),
            username: user.username || user.name || user.displayName,
            nickname: user.nickname || user.displayName || user.fullName,
            image: user.image || user.profileImage || user.avatar,
          }))
        } else if (data.data && Array.isArray(data.data)) {
          // Response has { data: [...] } structure
          users = data.data.map((user: any) => ({
            id: user.id?.toString() || user._id?.toString(),
            username: user.username || user.name || user.displayName,
            nickname: user.nickname || user.displayName || user.fullName,
            image: user.image || user.profileImage || user.avatar,
          }))
        }

        // Filter out invalid users
        users = users.filter((user) => user.id && user.username)

        setSearchResults(users)
        setShowSearchResults(true)
      } else {
        console.warn("Search returned status", response.status)
        setSearchResults([])
        setShowSearchResults(false)
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
      setShowSearchResults(false)
    } finally {
      setSearchLoading(false)
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => searchUsers(query), 300),
    [],
  )

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      debouncedSearch(value)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  // Handle search input focus/blur
  const handleSearchFocus = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowSearchResults(true)
    }
  }

  const handleSearchBlur = () => {
    // Delay hiding to allow clicks on search results
    setTimeout(() => setShowSearchResults(false), 200)
  }

  // Navigate to user profile - FIXED
  const handleViewProfile = (userId: string) => {
    setShowSearchResults(false) // Hide search results when navigating
    router.push(`/profile/${userId}`)
  }

  // Start conversation with user - FIXED
  const handleMessage = async (userId: string) => {
    if (!streamClient || !isReady) {
      toast({
        title: "Error",
        description: "Chat is not ready. Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }

    setMessagingUser(userId)
    setShowSearchResults(false) // Hide search results

    try {
      // First validate that the user exists
      const userCheckResponse = await fetch(`/api/users/${userId}`, {
        method: "GET",
        credentials: "include",
      })

      if (!userCheckResponse.ok) {
        throw new Error("User not found or inaccessible")
      }

      // Create/get channel via API
      const response = await fetch("/api/stream/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipientId: userId }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }

        console.error("Channel creation failed:", errorData)
        throw new Error(errorData.error || `Failed to create channel (${response.status})`)
      }

      const channelData = await response.json()

      if (!channelData.channelId) {
        throw new Error("No channel ID received from server")
      }

      // Navigate to the message page immediately
      router.push(`/messages/${userId}`)
    } catch (error) {
      console.error("Error creating channel:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start conversation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setMessagingUser(null)
    }
  }

  // Initial load of recommendations
  useEffect(() => {
    async function loadInitialRecommendations() {
      try {
        setLoading(true)
        const { users: recommendedUsers, hasMore: moreAvailable, nextPage } = await fetchRecommendations(1, 2)
        const usersWithReasons: RecommendedUser[] = []

        for (const user of recommendedUsers) {
          const convertedUser = convertApiUserToLocalUser(user)
          const userId = convertedUser.id.toString()

          // Add to generating set
          setGeneratingExplanations((prev) => new Set(prev).add(userId))

          // Set initial placeholder
          convertedUser.reason = "Calculating why you'd be a good match..."
          usersWithReasons.push(convertedUser)
        }

        setUsers(usersWithReasons)

        // Generate explanations asynchronously
        for (let i = 0; i < recommendedUsers.length; i++) {
          const user = recommendedUsers[i]
          const convertedUser = usersWithReasons[i]
          const userId = convertedUser.id.toString()

          try {
            const explanation = await generateExplanation(user)

            // Update the user with the real explanation
            setUsers((prevUsers) =>
              prevUsers.map((u) => (u.id.toString() === userId ? { ...u, reason: explanation } : u)),
            )
          } finally {
            // Remove from generating set
            setGeneratingExplanations((prev) => {
              const newSet = new Set(prev)
              newSet.delete(userId)
              return newSet
            })
          }
        }

        setHasMore(moreAvailable)
        setCurrentPage(nextPage ?? 1)
        setExplanationLoading(-1)
      } catch (error) {
        console.error("Failed to load recommendations:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialRecommendations()
  }, [])

  // Filter users based on search query
  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()))

  // Load more recommendations
  const loadMore = async () => {
    if (!hasMore || loadingMore) return

    try {
      setLoadingMore(true)
      const { users: newUsers, hasMore: moreAvailable, nextPage } = await fetchRecommendations(currentPage, 2)
      const usersWithReasons = [...users]

      for (const newUser of newUsers) {
        let userId = -1
        if (typeof newUser.id === "string") {
          const parsed = Number.parseInt(newUser.id, 10)
          if (!isNaN(parsed)) {
            userId = parsed
          }
        } else if (typeof newUser.id === "number") {
          userId = newUser.id
        }

        if (userId > 0) {
          setExplanationLoading(userId)
        }

        const convertedUser = convertApiUserToLocalUser(newUser)
        const userIdString = convertedUser.id.toString()

        // Add to generating set
        setGeneratingExplanations((prev) => new Set(prev).add(userIdString))

        // Set initial placeholder
        convertedUser.reason = "Calculating why you'd be a good match..."
        usersWithReasons.push(convertedUser)

        // Update users immediately with placeholder
        setUsers([...usersWithReasons])

        // Generate explanation asynchronously
        try {
          const explanation = await generateExplanation(newUser)

          // Update with real explanation
          setUsers((prevUsers) =>
            prevUsers.map((u) => (u.id.toString() === userIdString ? { ...u, reason: explanation } : u)),
          )
        } finally {
          // Remove from generating set
          setGeneratingExplanations((prev) => {
            const newSet = new Set(prev)
            newSet.delete(userIdString)
            return newSet
          })
          setExplanationLoading(-1)
        }
      }

      setHasMore(moreAvailable)
      setCurrentPage(nextPage ?? currentPage)
    } catch (error) {
      console.error("Failed to load more recommendations:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <TypingAnimation />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-sky-50/30 via-white to-sky-50/30 min-h-screen p-6">
      <h1 className="mb-6 text-3xl font-bold text-sky-900">Discover</h1>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-400" />
        <Input
          placeholder="Search for users..."
          className="pl-12 bg-sky-50/50 border-0 rounded-2xl h-12 placeholder:text-sky-400 focus:ring-2 focus:ring-sky-300/50 focus:bg-white/80 transition-all duration-300"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
        />

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-sky-100/50 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
            {searchLoading ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center text-sky-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-200 border-t-sky-500 mr-2"></div>
                  Searching...
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="px-6 py-4 hover:bg-sky-50/50 cursor-pointer border-b border-sky-100/30 last:border-b-0 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-sky-100">
                          {user.image ? (
                            <img
                              src={user.image || "/placeholder.svg"}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center text-white text-sm font-semibold">
                              {user.username[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sky-900">{user.username}</div>
                          {user.nickname && <div className="text-sm text-sky-600">{user.nickname}</div>}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProfile(user.id)}
                          className="rounded-full border-sky-200 text-sky-600 hover:bg-sky-50"
                        >
                          <User className="h-3 w-3 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleMessage(user.id)}
                          className="rounded-full bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white shadow-lg shadow-sky-200/50"
                          disabled={messagingUser === user.id || !isReady}
                        >
                          {messagingUser === user.id ? (
                            <div className="h-3 w-3 mr-2 animate-spin rounded-full border-b border-white"></div>
                          ) : (
                            <MessageCircle className="h-3 w-3 mr-2" />
                          )}
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sky-600">No users found</div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {!showSearchResults && (
          <>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-sky-100/50 border border-sky-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50"
                >
                  <UserCard
                    user={{
                      id: user.id,
                      username: user.username,
                      image: user.image || "/placeholder.svg?height=100&width=100",
                      reason: (
                        <ShimmerText
                          isGenerating={generatingExplanations.has(user.id.toString())}
                          className="text-sky-700"
                        >
                          {user.reason || "Calculating why you'd be a good match..."}
                        </ShimmerText>
                      ),
                      tags: user.tags || [],
                    }}
                    onMessage={() => handleMessage(user.id.toString())}
                    onViewProfile={() => handleViewProfile(user.id.toString())}
                    isMessaging={messagingUser === user.id.toString()}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-sky-600">No matching users found</div>
            )}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="rounded-full border-sky-200 hover:bg-sky-50 text-sky-600 px-8 py-3"
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-200 border-t-sky-500 mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
