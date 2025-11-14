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

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="heading-lg mb-4">💡 Submit a Prompt Idea</h1>
        <p class="text-gray-600 max-w-2xl mx-auto">
          Have a great idea for a writing prompt? Share it with the community! 
          Approved prompts will be added to the daily rotation.
        </p>
      </div>

      <!-- Success Message -->
      <div v-if="submitted" class="card p-8 text-center mb-6">
        <div class="mb-4">
          <svg class="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Prompt Submitted!</h2>
        <p class="text-gray-600 mb-6">
          Thank you for your contribution! Your prompt will be reviewed by our team.
        </p>
        <div class="flex gap-4 justify-center">
          <button @click="resetForm" class="btn-primary">
            Submit Another
          </button>
          <NuxtLink to="/submit-prompt/my-submissions" class="btn-outline">
            View My Submissions
          </NuxtLink>
        </div>
      </div>

      <!-- Submission Form -->
      <div v-else class="card p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Genre Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Genre <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.genre"
              required
              class="input"
            >
              <option value="">Select a genre...</option>
              <option v-for="genre in genres" :key="genre" :value="genre">
                {{ genre }}
              </option>
            </select>
          </div>

          <!-- Story Elements -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Story Elements <span class="text-red-500">*</span>
            </label>
            <p class="text-sm text-gray-500 mb-3">
              Provide 3-4 creative elements or themes that should be included in stories written for this prompt.
            </p>
            
            <div class="space-y-3">
              <div v-for="(element, index) in formData.elements" :key="index" class="flex gap-2">
                <input
                  v-model="formData.elements[index]"
                  type="text"
                  :placeholder="`Element ${index + 1} (e.g., 'a mysterious letter', 'an old photograph')`"
                  maxlength="100"
                  required
                  class="input flex-1"
                />
                <button
                  v-if="formData.elements.length > 3"
                  type="button"
                  @click="removeElement(index)"
                  class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove element"
                >
                  ✕
                </button>
              </div>
            </div>

            <button
              v-if="formData.elements.length < 4"
              type="button"
              @click="addElement"
              class="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              + Add Element
            </button>
          </div>

          <!-- Guidelines -->
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 class="text-sm font-semibold text-blue-900 mb-2">📝 Submission Guidelines</h3>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>• Be creative and original</li>
              <li>• Keep elements clear and specific</li>
              <li>• Avoid offensive or inappropriate content</li>
              <li>• Elements should inspire creativity, not restrict it</li>
            </ul>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-4 bg-red-50 text-red-800 rounded-lg">
            {{ errorMessage }}
          </div>

          <!-- Submit Button -->
          <div class="flex gap-4">
            <button
              type="submit"
              :disabled="submitting"
              class="btn-primary flex-1"
            >
              {{ submitting ? 'Submitting...' : 'Submit Prompt' }}
            </button>
            <NuxtLink to="/" class="btn-outline">
              Cancel
            </NuxtLink>
          </div>
        </form>
      </div>

      <!-- Link to View Submissions -->
      <div class="mt-6 text-center">
        <NuxtLink
          to="/submit-prompt/my-submissions"
          class="text-purple-600 hover:text-purple-700 font-medium text-sm"
        >
          View my previous submissions →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { submitPrompt } = usePromptSubmissions()

// Check authentication status on mount
onMounted(async () => {
  console.log('User from useSupabaseUser():', user.value)
  const { data: { session } } = await supabase.auth.getSession()
  console.log('Session:', session)
  console.log('Session user:', session?.user)
  
  if (!session?.user) {
    alert('You must be logged in to submit prompts. Please log in first.')
    navigateTo('/')
  }
})

const genres = [
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

const formData = ref({
  genre: '',
  elements: ['', '', '']
})

const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

const addElement = () => {
  if (formData.value.elements.length < 4) {
    formData.value.elements.push('')
  }
}

const removeElement = (index) => {
  if (formData.value.elements.length > 3) {
    formData.value.elements.splice(index, 1)
  }
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    errorMessage.value = ''

    // Check if user is logged in
    if (!user.value) {
      errorMessage.value = 'You must be logged in to submit prompts'
      return
    }

    console.log('Current user:', user.value)

    // Filter out empty elements
    const cleanElements = formData.value.elements.filter(el => el && el.trim().length > 0)

    if (cleanElements.length < 3) {
      errorMessage.value = 'Please provide at least 3 story elements'
      return
    }

    await submitPrompt(formData.value.genre, cleanElements)
    
    submitted.value = true
  } catch (error) {
    console.error('Error submitting prompt:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    errorMessage.value = error.message || 'Failed to submit prompt. Please try again.'
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formData.value = {
    genre: '',
    elements: ['', '', '']
  }
  submitted.value = false
  errorMessage.value = ''
}

// Check if user is logged in
onMounted(() => {
  if (!user.value) {
    navigateTo('/login')
  }
})

watch(user, (newUser) => {
  if (!newUser) {
    navigateTo('/login')
  }
})
</script>
