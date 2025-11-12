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
                <span>{{ formatDate(story.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Preferences Section -->
        <div class="card p-8">
          <h2 class="heading-md mb-6">Writing Preferences</h2>
          
          <form @submit.prevent="handleUpdatePreferences" class="space-y-6">
            <!-- Genre Preferences -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Preferred Genres
              </label>
              <p class="text-sm text-gray-500 mb-3">
                Select your favorite genres. Random prompts will favor these (70% chance), but you'll still see variety.
              </p>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <label
                  v-for="genre in availableGenres"
                  :key="genre"
                  class="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all"
                  :class="preferencesForm.preferred_genres.includes(genre) 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'"
                >
                  <input
                    type="checkbox"
                    :value="genre"
                    v-model="preferencesForm.preferred_genres"
                    class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span class="text-sm font-medium text-gray-700">{{ genre }}</span>
                </label>
              </div>
            </div>

            <!-- Daily Word Goal -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Daily Word Goal
              </label>
              <p class="text-sm text-gray-500 mb-3">
                Set a daily writing goal to track your progress.
              </p>
              <div class="flex items-center space-x-4">
                <input
                  v-model.number="preferencesForm.daily_word_goal"
                  type="number"
                  min="50"
                  max="10000"
                  step="50"
                  class="input max-w-xs"
                  placeholder="500"
                />
                <span class="text-sm text-gray-600">words per day</span>
              </div>
              <div class="mt-3 flex items-center space-x-2">
                <button
                  v-for="preset in [250, 500, 750, 1000]"
                  :key="preset"
                  type="button"
                  @click="preferencesForm.daily_word_goal = preset"
                  class="text-xs px-3 py-1 rounded-full border border-purple-300 text-purple-700 hover:bg-purple-50 transition-colors"
                >
                  {{ preset }}
                </button>
              </div>
            </div>

            <!-- Email Reminders -->
            <div>
              <label class="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 transition-colors">
                <input
                  v-model="preferencesForm.enable_email_reminders"
                  type="checkbox"
                  class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <div class="flex-1">
                  <span class="block text-sm font-medium text-gray-700">Enable Email Reminders</span>
                  <span class="block text-xs text-gray-500 mt-1">Get a daily reminder to write your story</span>
                </div>
              </label>
              
              <!-- Reminder Time -->
              <div v-if="preferencesForm.enable_email_reminders" class="mt-3 ml-8">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Time
                </label>
                <input
                  v-model="preferencesForm.reminder_time"
                  type="time"
                  class="input max-w-xs"
                />
              </div>
            </div>

            <div v-if="preferencesMessage" class="p-3 rounded-lg" :class="preferencesMessageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
              {{ preferencesMessage }}
            </div>

            <button
              type="submit"
              :disabled="updatingPreferences"
              class="btn-primary"
            >
              {{ updatingPreferences ? 'Saving...' : 'Save Preferences' }}
            </button>
          </form>
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
const { getCurrentProfile, updateProfile: updateProfileData, updateAvatar, updatePreferences } = useProfiles()
const { getUserStories } = useStories()

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

// Available genres for preferences
const availableGenres = [
  'Fantasy',
  'Sci-Fi',
  'Mystery',
  'Horror',
  'Romance',
  'Adventure',
  'Thriller',
  'Historical',
  'Drama'
]

// Preferences form
const preferencesForm = ref({
  preferred_genres: [],
  daily_word_goal: 500,
  enable_email_reminders: false,
  reminder_time: '09:00'
})

const updatingPreferences = ref(false)
const preferencesMessage = ref('')
const preferencesMessageType = ref('success')
const fileInput = ref(null)

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
    
    // Initialize preferences form
    preferencesForm.value = {
      preferred_genres: profile.value?.preferred_genres || [],
      daily_word_goal: profile.value?.daily_word_goal || 500,
      enable_email_reminders: profile.value?.enable_email_reminders || false,
      reminder_time: profile.value?.reminder_time || '09:00'
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

// Update preferences
const handleUpdatePreferences = async () => {
  try {
    updatingPreferences.value = true
    preferencesMessage.value = ''
    
    await updatePreferences(preferencesForm.value)
    
    preferencesMessage.value = 'Preferences saved successfully!'
    preferencesMessageType.value = 'success'
    
    // Clear message after a moment
    setTimeout(() => {
      preferencesMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Error updating preferences:', error)
    preferencesMessage.value = error.message || 'Error updating preferences'
    preferencesMessageType.value = 'error'
  } finally {
    updatingPreferences.value = false
  }
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
