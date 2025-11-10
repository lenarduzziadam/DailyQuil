<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-purple-600">DailyQuil</h1>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink
              v-if="user"
              to="/write"
              class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              ✍️ Write
            </NuxtLink>
            <NuxtLink
              v-if="user"
              to="/profile"
              class="text-gray-700 hover:text-purple-600"
            >
              Profile
            </NuxtLink>
            <NuxtLink
              v-if="!user"
              to="/login"
              class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Sign In
            </NuxtLink>
            <button
              v-else
              @click="handleSignOut"
              class="text-gray-700 hover:text-purple-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Daily Prompt Section -->
      <div class="mb-8">
        <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-3xl font-bold text-gray-900">Today's Prompt</h2>
            <span class="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
              {{ new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
            </span>
          </div>
          
          <div v-if="loadingPrompt" class="text-gray-500">
            Loading today's prompt...
          </div>
          
          <div v-else-if="todayPrompt" class="space-y-4">
            <div class="flex items-center space-x-2">
              <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {{ todayPrompt.genre }}
              </span>
            </div>
            
            <div class="space-y-2">
              <p class="text-gray-600 font-medium">Use these elements in your story:</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(element, index) in todayPrompt.elements"
                  :key="index"
                  class="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {{ element }}
                </span>
              </div>
            </div>
            
            <NuxtLink
              v-if="user"
              :to="`/write?prompt=${todayPrompt.id}`"
              class="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              Start Writing
            </NuxtLink>
            <NuxtLink
              v-else
              to="/login"
              class="inline-block bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-700"
            >
              Sign in to Write
            </NuxtLink>
          </div>
          
          <div v-else class="text-gray-500">
            No prompt available today. Check back tomorrow!
          </div>
        </div>
      </div>

      <!-- Recent Stories Feed -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Recent Stories</h2>
          <button
            @click="loadStories"
            class="text-purple-600 hover:text-purple-700 font-medium"
          >
            Refresh
          </button>
        </div>

        <div v-if="loadingStories" class="text-gray-500 text-center py-8">
          Loading stories...
        </div>

        <div v-else-if="stories.length === 0" class="text-center py-12 bg-white rounded-xl shadow">
          <p class="text-gray-500 text-lg">No public stories yet.</p>
          <p class="text-gray-400 mt-2">Be the first to share your story!</p>
        </div>

        <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="story in stories"
            :key="story.id"
            class="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
            @click="navigateTo(`/story/${story.id}`)"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="font-bold text-lg text-gray-900 line-clamp-2">
                  {{ story.title }}
                </h3>
                <p class="text-sm text-gray-500 mt-1">
                  by {{ story.profile?.display_name || story.profile?.username || 'Anonymous' }}
                </p>
              </div>
              <span
                v-if="story.prompt"
                class="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
              >
                {{ story.prompt.genre }}
              </span>
            </div>
            
            <p class="text-gray-600 text-sm line-clamp-3 mb-4">
              {{ story.content }}
            </p>
            
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span>{{ story.word_count }} words</span>
              <span>{{ formatDate(story.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- User's Recent Stories (if logged in) -->
      <div v-if="user && userStories.length > 0" class="mb-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Your Recent Stories</h2>
          <NuxtLink
            to="/profile"
            class="text-purple-600 hover:text-purple-700 font-medium"
          >
            View All
          </NuxtLink>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div
            v-for="story in userStories.slice(0, 4)"
            :key="story.id"
            class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
            @click="navigateTo(`/story/${story.id}`)"
          >
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold text-gray-900">{{ story.title }}</h3>
              <span
                :class="story.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
                class="px-2 py-1 rounded text-xs"
              >
                {{ story.is_public ? 'Public' : 'Private' }}
              </span>
            </div>
            <p class="text-sm text-gray-500">
              {{ story.word_count }} words • {{ formatDate(story.created_at) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { getTodayPrompt } = usePrompts()
const { getPublicStories, getUserStories: fetchUserStories } = useStories()

const todayPrompt = ref(null)
const stories = ref([])
const userStories = ref([])
const loadingPrompt = ref(true)
const loadingStories = ref(true)

// Load today's prompt
const loadPrompt = async () => {
  try {
    loadingPrompt.value = true
    todayPrompt.value = await getTodayPrompt()
  } catch (error) {
    console.error('Error loading prompt:', error)
  } finally {
    loadingPrompt.value = false
  }
}

// Load public stories
const loadStories = async () => {
  try {
    loadingStories.value = true
    stories.value = await getPublicStories(12)
  } catch (error) {
    console.error('Error loading stories:', error)
  } finally {
    loadingStories.value = false
  }
}

// Load user's stories
const loadUserStories = async () => {
  if (!user.value) return
  try {
    userStories.value = await fetchUserStories()
  } catch (error) {
    console.error('Error loading user stories:', error)
  }
}

// Sign out
const handleSignOut = async () => {
  await supabase.auth.signOut()
  navigateTo('/')
}

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Load data on mount
onMounted(async () => {
  await Promise.all([
    loadPrompt(),
    loadStories(),
    loadUserStories()
  ])
})

// Watch user changes
watch(user, () => {
  loadUserStories()
})
</script>
