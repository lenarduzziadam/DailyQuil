-- From setup_auto_rotation.sql file
SELECT rotate_daily_prompt();
SELECT * FROM schedule_prompts_ahead(30);<template>
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

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Prompt Display (if using a prompt) -->
      <div v-if="prompt" class="mb-6">
        <button
          @click="showPrompt = !showPrompt"
          class="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-purple-200"
        >
          <div class="flex items-center space-x-3">
            <span class="text-2xl">💡</span>
            <div class="text-left">
              <h3 class="font-semibold text-gray-900">{{ isRandomPrompt ? 'Random Prompt' : "Today's Prompt" }}</h3>
              <p class="text-sm text-gray-500">{{ showPrompt ? 'Click to hide' : 'Click to view' }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              v-if="!isEditing"
              @click.stop="handleRandomPrompt"
              :disabled="loadingRandom"
              class="btn-outline px-3 py-1 text-sm"
            >
              {{ loadingRandom ? '...' : '🎲 Random' }}
            </button>
            <svg 
              :class="{'rotate-180': showPrompt}" 
              class="w-6 h-6 text-purple-600 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        <!-- Expandable Prompt Content -->
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-96"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 max-h-96"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-show="showPrompt" class="overflow-hidden">
            <div class="prompt-card mt-3">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Writing for Prompt:</h3>
                <span class="badge-primary">
                  {{ prompt.genre }}
                </span>
              </div>
              <div class="space-y-2">
                <p class="text-sm text-gray-600 font-medium">Include these elements in your story:</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(element, index) in prompt.elements"
                    :key="index"
                    class="badge-element"
                  >
                    {{ element }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Writing Form -->
      <div class="card p-8">
        <h1 class="heading-lg mb-6">
          {{ isEditing ? 'Edit Your Story' : 'Write Your Story' }}
        </h1>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Story Title
            </label>
            <input
              v-model="formData.title"
              type="text"
              required
              maxlength="200"
              class="input"
              placeholder="Give your story a title..."
            />
          </div>

          <!-- Content -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">
                Your Story
              </label>
              <span class="word-count">
                {{ wordCount }} words
              </span>
            </div>
            <textarea
              v-model="formData.content"
              required
              rows="20"
              class="textarea"
              placeholder="Once upon a time..."
            ></textarea>
          </div>

          <!-- Public Toggle -->
          <div class="flex items-center space-x-3">
            <input
              v-model="formData.is_public"
              type="checkbox"
              id="is_public"
              class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label for="is_public" class="text-sm font-medium text-gray-700">
              Make this story public (others can read it)
            </label>
          </div>

          <!-- Error/Success Message -->
          <div v-if="message" class="p-4 rounded-lg" :class="messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
            {{ message }}
          </div>

          <!-- Actions -->
          <div class="flex gap-4">
            <button
              type="submit"
              :disabled="saving"
              class="btn-primary flex-1"
            >
              {{ saving ? 'Saving...' : (isEditing ? 'Update Story' : 'Publish Story') }}
            </button>
            <button
              v-if="isEditing"
              type="button"
              @click="handleDelete"
              class="px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-all"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { getPromptById, getRandomPrompt } = usePrompts()
const { createStory, updateStory, deleteStory, getStoryById } = useStories()

const prompt = ref(null)
const isEditing = ref(false)
const storyId = ref(null)
const saving = ref(false)
const message = ref('')
const messageType = ref('success')
const loading = ref(true)
const showPrompt = ref(true) // Start expanded by default
const loadingRandom = ref(false)
const isRandomPrompt = ref(false)

const formData = ref({
  title: '',
  content: '',
  is_public: false
})

// Computed word count
const wordCount = computed(() => {
  return formData.value.content.trim().split(/\s+/).filter(word => word.length > 0).length
})

// Load prompt if provided
const loadPrompt = async () => {
  const promptId = route.query.prompt
  if (promptId) {
    try {
      prompt.value = await getPromptById(parseInt(promptId))
      // Check if this is from the random button (not today's prompt)
      isRandomPrompt.value = route.query.random === 'true'
    } catch (error) {
      console.error('Error loading prompt:', error)
    }
  }
}

// Get a random prompt
const handleRandomPrompt = async () => {
  try {
    loadingRandom.value = true
    const randomPrompt = await getRandomPrompt(prompt.value?.id)
    prompt.value = randomPrompt
    isRandomPrompt.value = true
    showPrompt.value = true // Expand to show the new prompt
    
    // Update URL without reloading
    router.replace({ 
      query: { 
        ...route.query, 
        prompt: randomPrompt.id,
        random: 'true'
      } 
    })
  } catch (error) {
    console.error('Error loading random prompt:', error)
    message.value = 'Error loading random prompt'
    messageType.value = 'error'
  } finally {
    loadingRandom.value = false
  }
}

// Load existing story if editing
const loadStory = async () => {
  const editId = route.query.edit
  if (editId) {
    try {
      isEditing.value = true
      storyId.value = parseInt(editId)
      const story = await getStoryById(storyId.value)
      
      // Check if user owns this story
      if (story.user_id !== user.value.id) {
        message.value = 'You cannot edit this story'
        messageType.value = 'error'
        setTimeout(() => router.push('/'), 2000)
        return
      }
      
      formData.value = {
        title: story.title,
        content: story.content,
        is_public: story.is_public
      }
      
      if (story.prompt) {
        prompt.value = story.prompt
      }
    } catch (error) {
      console.error('Error loading story:', error)
      message.value = 'Error loading story'
      messageType.value = 'error'
    }
  }
}

// Handle form submission
const handleSubmit = async () => {
  try {
    saving.value = true
    message.value = ''
    
    if (isEditing.value) {
      await updateStory(storyId.value, formData.value)
      message.value = 'Story updated successfully!'
    } else {
      const newStory = await createStory({
        ...formData.value,
        prompt_id: prompt.value?.id
      })
      message.value = 'Story published successfully!'
      storyId.value = newStory.id
      isEditing.value = true
    }
    
    messageType.value = 'success'
    
    // Redirect to story page after a moment
    setTimeout(() => {
      router.push(`/story/${storyId.value}`)
    }, 1500)
  } catch (error) {
    console.error('Error saving story:', error)
    message.value = `Error: ${error.message}`
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

// Handle delete
const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this story? This cannot be undone.')) {
    return
  }
  
  try {
    await deleteStory(storyId.value)
    message.value = 'Story deleted successfully'
    messageType.value = 'success'
    setTimeout(() => router.push('/profile'), 1500)
  } catch (error) {
    console.error('Error deleting story:', error)
    message.value = `Error: ${error.message}`
    messageType.value = 'error'
  }
}

// Load data on mount
onMounted(async () => {
  // Check if user is logged in
  loading.value = true
  
  // Wait a moment for user to load
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (!user.value) {
    navigateTo('/login')
    return
  }
  
  await loadPrompt()
  await loadStory()
  loading.value = false
})

// Watch for user changes
watch(user, (newUser) => {
  if (!newUser && !loading.value) {
    navigateTo('/login')
  }
})
</script>
