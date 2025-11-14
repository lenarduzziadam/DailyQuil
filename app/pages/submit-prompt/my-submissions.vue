<template>
  <div class="min-h-screen gradient-bg">
    <!-- Navigation -->
    <nav class="nav">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <NuxtLink to="/" class="text-2xl font-bold text-purple-600">
            DailyQuil
          </NuxtLink>
          <NuxtLink to="/submit-prompt" class="text-gray-700 hover:text-purple-600">
            ← Back to Submit
          </NuxtLink>
        </div>
      </div>
    </nav>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="heading-lg mb-2">My Prompt Submissions</h1>
        <p class="text-gray-600">Track the status of your submitted prompt ideas.</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p class="text-gray-500">Loading your submissions...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading && submissions.length === 0" class="card p-12 text-center">
        <div class="text-6xl mb-4">📝</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">No Submissions Yet</h2>
        <p class="text-gray-600 mb-6">
          You haven't submitted any prompt ideas yet. Share your creativity with the community!
        </p>
        <NuxtLink to="/submit-prompt" class="btn-primary inline-block">
          Submit Your First Prompt
        </NuxtLink>
      </div>

      <!-- Submissions List -->
      <div v-else class="space-y-4">
        <div
          v-for="submission in submissions"
          :key="submission.id"
          class="card p-6"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="badge-primary">{{ submission.genre }}</span>
                <span
                  class="badge"
                  :class="{
                    'badge-warning': submission.status === 'pending',
                    'badge-success': submission.status === 'approved',
                    'badge-error': submission.status === 'rejected'
                  }"
                >
                  {{ submission.status.charAt(0).toUpperCase() + submission.status.slice(1) }}
                </span>
              </div>
              <p class="text-sm text-gray-500">
                Submitted {{ formatDate(submission.created_at) }}
              </p>
            </div>
          </div>

          <!-- Elements -->
          <div class="mb-4">
            <p class="text-sm font-medium text-gray-700 mb-2">Story Elements:</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(element, index) in submission.elements"
                :key="index"
                class="badge-element"
              >
                {{ element }}
              </span>
            </div>
          </div>

          <!-- Admin Notes (if rejected) -->
          <div v-if="submission.status === 'rejected' && submission.admin_notes" class="bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <p class="text-sm font-medium text-red-900 mb-1">Feedback from Admin:</p>
            <p class="text-sm text-red-800">{{ submission.admin_notes }}</p>
          </div>

          <!-- Approved Message -->
          <div v-if="submission.status === 'approved'" class="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <p class="text-sm text-green-800">
              🎉 Your prompt has been approved and added to the rotation! Thank you for contributing.
            </p>
          </div>

          <!-- Pending Message -->
          <div v-if="submission.status === 'pending'" class="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
            <p class="text-sm text-yellow-800">
              ⏳ Your submission is under review. We'll notify you once it's been processed.
            </p>
          </div>
        </div>
      </div>

      <!-- Submit Another Button -->
      <div v-if="submissions.length > 0" class="mt-8 text-center">
        <NuxtLink to="/submit-prompt" class="btn-primary inline-block">
          Submit Another Prompt
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const user = useSupabaseUser()
const { getUserSubmissions } = usePromptSubmissions()

const submissions = ref([])
const loading = ref(true)

const loadSubmissions = async () => {
  try {
    loading.value = true
    submissions.value = await getUserSubmissions()
  } catch (error) {
    console.error('Error loading submissions:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Check if user is logged in
onMounted(async () => {
  if (!user.value) {
    navigateTo('/login')
    return
  }
  await loadSubmissions()
})

watch(user, async (newUser) => {
  if (!newUser) {
    navigateTo('/login')
  } else {
    await loadSubmissions()
  }
})
</script>

<style scoped>
.badge-warning {
  @apply bg-yellow-100 text-yellow-800;
}

.badge-success {
  @apply bg-green-100 text-green-800;
}

.badge-error {
  @apply bg-red-100 text-red-800;
}
</style>
