<template>
  <div class="min-h-screen gradient-bg">
    <!-- Navigation -->
    <nav class="nav">
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
        <div class="card p-8">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-6">
              <!-- Avatar -->
              <div class="relative group">
                <div 
                  v-if="profile?.avatar_url" 
                  class="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-200"
                >
                  <img 
                    :src="profile.avatar_url" 
                    :alt="profile.display_name || profile.username"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div 
                  v-else
                  class="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-4xl"
                >
                  {{ (profile?.display_name || profile?.username || 'U')[0].toUpperCase() }}
                </div>
                <!-- Edit overlay -->
                <button
                  @click="showEditModal = true"
                  class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium"
                >
                  Change
                </button>
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
            <div class="stat-box">
              <div class="stat-value">{{ profile?.total_stories || 0 }}</div>
              <div class="stat-label">Stories Written</div>
            </div>
            <div class="stat-box">
              <div class="stat-value text-orange-500">{{ profile?.current_streak || 0 }} 🔥</div>
              <div class="stat-label">Current Streak</div>
            </div>
            <div class="stat-box">
              <div class="stat-value text-blue-600">{{ profile?.longest_streak || 0 }}</div>
              <div class="stat-label">Longest Streak</div>
            </div>
          </div>
        </div>

        <!-- Stories Section -->
        <div class="card p-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="heading-md">Your Stories</h2>
            <NuxtLink
              to="/write"
              class="btn-primary"
            >
              Write New Story
            </NuxtLink>
          </div>

          <div v-if="deleteMessage" class="p-3 rounded-lg" :class="deleteMessageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
            {{ deleteMessage }}
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
              class="card-interactive p-6"
            >
              <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                  <h3 class="text-xl font-semibold text-gray-900 mb-2">
                    <NuxtLink :to="`/story/${story.id}`" class="hover:text-purple-600">
                      {{ story.title }}
                    </NuxtLink>
                  </h3>
                  <p class="text-gray-600 text-sm line-clamp-2 mb-3">
                    {{ story.content }}
                  </p>
                </div>
                <div class="ml-4 flex flex-col items-end space-y-2">
                  <span
                    :class="story.is_public ? 'badge-status' : 'bg-gray-100 text-gray-700'"
                    class="badge"
                  >
                    {{ story.is_public ? 'Public' : 'Private' }}
                  </span>
                  <span
                    v-if="story.prompt"
                    class="badge-genre"
                  >
                    {{ story.prompt.genre }}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>{{ story.word_count }} words</span>
                <div class="flex items-center gap-3">
                  <span>{{ formatDate(story.created_at) }}</span>
                  <NuxtLink :to="`/story/${story.id}`" class="text-purple-600 hover:text-purple-700 font-semibold">
                    View
                  </NuxtLink>
                  <button
                    type="button"
                    class="text-red-500 hover:text-red-700 font-semibold text-sm"
                    :disabled="deletingStoryId === story.id"
                    @click.stop="handleDeleteStory(story.id)"
                  >
                    {{ deletingStoryId === story.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
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
      <div class="card max-w-md w-full p-8">
        <h2 class="heading-md mb-6">Edit Profile</h2>
        
        <form @submit.prevent="handleUpdateProfile" class="space-y-4">
          <!-- Avatar Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo
            </label>
            <div class="flex items-center space-x-4">
              <!-- Current/Preview Avatar -->
              <div class="relative">
                <div 
                  v-if="avatarPreview || profile?.avatar_url" 
                  class="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-200"
                >
                  <img 
                    :src="avatarPreview || profile.avatar_url" 
                    alt="Avatar preview"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div 
                  v-else
                  class="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                >
                  {{ (profile?.display_name || profile?.username || 'U')[0].toUpperCase() }}
                </div>
              </div>
              
              <!-- Upload Button -->
              <div class="flex-1">
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  @change="handleFileSelect"
                  class="hidden"
                />
                <button
                  type="button"
                  @click="$refs.fileInput.click()"
                  class="btn-outline w-full"
                >
                  {{ avatarFile ? 'Change Photo' : 'Upload Photo' }}
                </button>
                <p v-if="avatarFile" class="text-xs text-gray-500 mt-1">
                  {{ avatarFile.name }}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              v-model="editForm.username"
              type="text"
              class="input"
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
              class="input"
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
              class="textarea"
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
              class="btn-primary flex-1"
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
const { getCurrentProfile, updateProfile: updateProfileData, updateAvatar } = useProfiles()
const { getUserStories, deleteStory } = useStories()

const profile = ref(null)
const stories = ref([])
const loading = ref(true)
const loadingStories = ref(true)
const showEditModal = ref(false)
const updating = ref(false)
const updateMessage = ref('')
const updateMessageType = ref('success')
const avatarFile = ref(null)
const avatarPreview = ref(null)
const fileInput = ref(null)
const deletingStoryId = ref(null)
const deleteMessage = ref('')
const deleteMessageType = ref('success')

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

const handleDeleteStory = async (id) => {
  if (!confirm('Are you sure you want to delete this story? This cannot be undone.')) {
    return
  }

  deletingStoryId.value = id
  deleteMessage.value = ''
  deleteMessageType.value = 'success'

  try {
    await deleteStory(id)
    deleteMessage.value = 'Story deleted.'
    deleteMessageType.value = 'success'
    await loadStories()
  } catch (error) {
    console.error('Error deleting story:', error)
    deleteMessage.value = error.message || 'Could not delete story.'
    deleteMessageType.value = 'error'
  } finally {
    deletingStoryId.value = null
  }
}

// Handle file selection
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    updateMessage.value = 'Please select an image file'
    updateMessageType.value = 'error'
    return
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    updateMessage.value = 'Image must be less than 5MB'
    updateMessageType.value = 'error'
    return
  }
  
  avatarFile.value = file
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// Update profile
const handleUpdateProfile = async () => {
  try {
    updating.value = true
    updateMessage.value = ''
    
    // Upload avatar if a new one was selected
    if (avatarFile.value) {
      updateMessage.value = 'Uploading photo...'
      await updateAvatar(avatarFile.value, profile.value?.avatar_url)
    }
    
    // Update other profile fields
    await updateProfileData(editForm.value)
    
    updateMessage.value = 'Profile updated successfully!'
    updateMessageType.value = 'success'
    
    // Reset avatar state
    avatarFile.value = null
    avatarPreview.value = null
    
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
