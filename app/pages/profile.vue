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

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500 text-lg">Loading profile...</p>
      </div>

      <div v-else-if="!user" class="text-center py-12">
        <p class="text-gray-500 text-lg mb-4">Please sign in to view your profile</p>
        <NuxtLink to="/login" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
          Sign In
        </NuxtLink>
      </div>

      <div v-else class="space-y-6">
        <!-- Profile Header -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-6">
              <!-- Avatar -->
              <div class="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                {{ (profile?.display_name || profile?.username || 'U')[0].toUpperCase() }}
              </div>
              
              <!-- Profile Info -->
              <div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                  {{ profile?.display_name || profile?.username || 'User' }}
                </h1>
                <p v-if="profile?.username" class="text-gray-500 mb-2">@{{ profile.username }}</p>
                <p v-if="profile?.bio" class="text-gray-600 max-w-2xl">{{ profile.bio }}</p>
              </div>
            </div>

            <!-- Edit Profile Button -->
            <button
              @click="showEditModal = true"
              class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-6 mt-8 pt-6 border-t">
            <div class="text-center">
              <div class="text-3xl font-bold text-purple-600">{{ profile?.total_stories || 0 }}</div>
              <div class="text-sm text-gray-500 mt-1">Stories Written</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-orange-500">{{ profile?.current_streak || 0 }} 🔥</div>
              <div class="text-sm text-gray-500 mt-1">Current Streak</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600">{{ profile?.longest_streak || 0 }}</div>
              <div class="text-sm text-gray-500 mt-1">Longest Streak</div>
            </div>
          </div>
        </div>

        <!-- Stories Section -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Your Stories</h2>
            <NuxtLink
              to="/write"
              class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Write New Story
            </NuxtLink>
          </div>

          <div v-if="loadingStories" class="text-center py-8 text-gray-500">
            Loading stories...
          </div>

          <div v-else-if="stories.length === 0" class="text-center py-12">
            <p class="text-gray-500 text-lg mb-4">You haven't written any stories yet.</p>
            <NuxtLink
              to="/write"
              class="text-purple-600 hover:text-purple-700 font-medium"
            >
              Write your first story →
            </NuxtLink>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="story in stories"
              :key="story.id"
              class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              @click="navigateTo(`/story/${story.id}`)"
            >
              <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                  <h3 class="text-xl font-semibold text-gray-900 mb-2">
                    {{ story.title }}
                  </h3>
                  <p class="text-gray-600 text-sm line-clamp-2 mb-3">
                    {{ story.content }}
                  </p>
                </div>
                <div class="ml-4 flex flex-col items-end space-y-2">
                  <span
                    :class="story.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
                    class="px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {{ story.is_public ? 'Public' : 'Private' }}
                  </span>
                  <span
                    v-if="story.prompt"
                    class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {{ story.prompt.genre }}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>{{ story.word_count }} words</span>
                <span>{{ formatDate(story.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showEditModal = false"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
        
        <form @submit.prevent="handleUpdateProfile" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              v-model="editForm.username"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="username"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              v-model="editForm.display_name"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              v-model="editForm.bio"
              rows="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>

          <div v-if="updateMessage" class="p-3 rounded-lg" :class="updateMessageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
            {{ updateMessage }}
          </div>

          <div class="flex gap-3">
            <button
              type="submit"
              :disabled="updating"
              class="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {{ updating ? 'Saving...' : 'Save Changes' }}
            </button>
            <button
              type="button"
              @click="showEditModal = false"
              class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const user = useSupabaseUser()
const { getCurrentProfile, updateProfile: updateProfileData } = useProfiles()
const { getUserStories } = useStories()

const profile = ref(null)
const stories = ref([])
const loading = ref(true)
const loadingStories = ref(true)
const showEditModal = ref(false)
const updating = ref(false)
const updateMessage = ref('')
const updateMessageType = ref('success')

const editForm = ref({
  username: '',
  display_name: '',
  bio: ''
})

// Load profile
const loadProfile = async () => {
  if (!user.value) {
    loading.value = false
    return
  }
  
  try {
    loading.value = true
    profile.value = await getCurrentProfile()
    
    // Initialize edit form
    editForm.value = {
      username: profile.value?.username || '',
      display_name: profile.value?.display_name || '',
      bio: profile.value?.bio || ''
    }
  } catch (error) {
    console.error('Error loading profile:', error)
  } finally {
    loading.value = false
  }
}

// Load stories
const loadStories = async () => {
  if (!user.value) {
    loadingStories.value = false
    return
  }
  
  try {
    loadingStories.value = true
    stories.value = await getUserStories()
  } catch (error) {
    console.error('Error loading stories:', error)
  } finally {
    loadingStories.value = false
  }
}

// Update profile
const handleUpdateProfile = async () => {
  try {
    updating.value = true
    updateMessage.value = ''
    
    await updateProfileData(editForm.value)
    
    updateMessage.value = 'Profile updated successfully!'
    updateMessageType.value = 'success'
    
    // Reload profile
    await loadProfile()
    
    // Close modal after a moment
    setTimeout(() => {
      showEditModal.value = false
      updateMessage.value = ''
    }, 1500)
  } catch (error) {
    console.error('Error updating profile:', error)
    updateMessage.value = error.message || 'Error updating profile'
    updateMessageType.value = 'error'
  } finally {
    updating.value = false
  }
}

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Load data on mount
onMounted(async () => {
  await Promise.all([
    loadProfile(),
    loadStories()
  ])
})

// Watch user changes
watch(user, async () => {
  if (user.value) {
    await Promise.all([
      loadProfile(),
      loadStories()
    ])
  }
})
</script>
