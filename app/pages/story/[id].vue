<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <NuxtLink to="/" class="text-2xl font-bold text-purple-600">
            DailyQuil
          </NuxtLink>
          <NuxtLink to="/" class="text-gray-700 hover:text-purple-600">
            ← Back to Home
          </NuxtLink>
        </div>
      </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500 text-lg">Loading story...</p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500 text-lg">{{ error }}</p>
        <NuxtLink to="/" class="text-purple-600 hover:text-purple-700 mt-4 inline-block">
          Go back home
        </NuxtLink>
      </div>

      <div v-else-if="story" class="space-y-6">
        <!-- Story Header -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h1 class="text-4xl font-bold text-gray-900 mb-4">
                {{ story.title }}
              </h1>
              <div class="flex items-center space-x-3 text-sm text-gray-500">
                <!-- Author Avatar -->
                <div 
                  v-if="story.profile?.avatar_url" 
                  class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                >
                  <img 
                    :src="story.profile.avatar_url" 
                    :alt="story.profile.display_name || story.profile.username"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div 
                  v-else
                  class="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                >
                  {{ (story.profile?.display_name || story.profile?.username || 'A')[0].toUpperCase() }}
                </div>
                <div>
                  <div class="font-medium text-gray-700">
                    {{ story.profile?.display_name || story.profile?.username || 'Anonymous' }}
                  </div>
                  <div class="flex items-center space-x-2 text-xs">
                    <span>{{ story.word_count }} words</span>
                    <span>•</span>
                    <span>{{ formatDate(story.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Edit button if user owns the story -->
            <NuxtLink
              v-if="user && story.user_id === user.id"
              :to="`/write?edit=${story.id}`"
              class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Edit Story
            </NuxtLink>
          </div>

          <!-- Prompt info if available -->
          <div v-if="story.prompt" class="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-medium text-gray-700">Written for prompt:</span>
                <span class="ml-2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  {{ story.prompt.genre }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(element, index) in story.prompt.elements"
                  :key="index"
                  class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                >
                  {{ element }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Story Content -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="prose prose-lg max-w-none">
            <div class="whitespace-pre-wrap text-gray-800 leading-relaxed">{{ story.content }}</div>
          </div>
        </div>

        <!-- Author Info -->
        <div v-if="story.profile" class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">About the Author</h3>
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {{ (story.profile.display_name || story.profile.username || 'A')[0].toUpperCase() }}
            </div>
            <div>
              <p class="font-medium text-gray-900">
                {{ story.profile.display_name || story.profile.username }}
              </p>
              <p class="text-sm text-gray-500">
                {{ story.profile.total_stories || 0 }} stories written
                <span v-if="story.profile.current_streak > 0">
                  • {{ story.profile.current_streak }} day streak 🔥
                </span>
              </p>
            </div>
          </div>
          <p v-if="story.profile.bio" class="mt-4 text-gray-600">
            {{ story.profile.bio }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const user = useSupabaseUser()
const { getStoryById } = useStories()

const story = ref(null)
const loading = ref(true)
const error = ref(null)

// Load story
const loadStory = async () => {
  try {
    loading.value = true
    const storyId = parseInt(route.params.id)
    
    if (isNaN(storyId)) {
      error.value = 'Invalid story ID'
      return
    }
    
    story.value = await getStoryById(storyId)
  } catch (err) {
    console.error('Error loading story:', err)
    error.value = err.message || 'Story not found'
  } finally {
    loading.value = false
  }
}

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Load story on mount
onMounted(() => {
  loadStory()
})
</script>
