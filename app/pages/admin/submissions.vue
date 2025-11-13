<template>
  <div class="min-h-screen gradient-bg">
    <!-- Navigation -->
    <nav class="nav">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <NuxtLink to="/" class="text-2xl font-bold text-purple-600">
            DailyQuil Admin
          </NuxtLink>
          <NuxtLink to="/" class="text-gray-700 hover:text-purple-600">
            ← Back to Home
          </NuxtLink>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Access Denied -->
      <div v-if="!loading && !userIsAdmin" class="card p-12 text-center">
        <div class="text-6xl mb-4">🔒</div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p class="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <NuxtLink to="/" class="btn-primary inline-block">
          Go Home
        </NuxtLink>
      </div>

      <!-- Admin Content -->
      <div v-else-if="!loading && userIsAdmin">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="heading-lg mb-4">🛡️ Prompt Submissions Admin</h1>
          
          <!-- Stats -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="stat-box">
              <div class="stat-value text-blue-600">{{ stats.total }}</div>
              <div class="stat-label">Total Submissions</div>
            </div>
            <div class="stat-box">
              <div class="stat-value text-yellow-600">{{ stats.pending }}</div>
              <div class="stat-label">Pending Review</div>
            </div>
            <div class="stat-box">
              <div class="stat-value text-green-600">{{ stats.approved }}</div>
              <div class="stat-label">Approved</div>
            </div>
            <div class="stat-box">
              <div class="stat-value text-red-600">{{ stats.rejected }}</div>
              <div class="stat-label">Rejected</div>
            </div>
          </div>

          <!-- Filter Tabs -->
          <div class="flex gap-2 border-b border-gray-200">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              @click="currentTab = tab.value; loadSubmissions()"
              class="px-4 py-2 font-medium transition-colors"
              :class="currentTab === tab.value 
                ? 'text-purple-600 border-b-2 border-purple-600' 
                : 'text-gray-600 hover:text-purple-600'"
            >
              {{ tab.label }}
              <span v-if="tab.value === 'pending'" class="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                {{ stats.pending }}
              </span>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loadingSubmissions" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p class="text-gray-500">Loading submissions...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="submissions.length === 0" class="card p-12 text-center">
          <div class="text-6xl mb-4">📭</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">No Submissions</h2>
          <p class="text-gray-600">
            No {{ currentTab }} submissions at this time.
          </p>
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
                    {{ submission.status }}
                  </span>
                </div>
                <div class="text-sm text-gray-600">
                  <p>
                    Submitted by <strong>User {{ submission.user_id.substring(0, 8) }}...</strong>
                  </p>
                  <p>{{ formatDate(submission.created_at) }}</p>
                  <p v-if="submission.reviewed_at">
                    Reviewed {{ formatDate(submission.reviewed_at) }}
                  </p>
                </div>
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

            <!-- Admin Notes (for rejected) -->
            <div v-if="submission.status === 'rejected' && submission.admin_notes" class="mb-4 p-3 bg-gray-50 rounded">
              <p class="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
              <p class="text-sm text-gray-600">{{ submission.admin_notes }}</p>
            </div>

            <!-- Actions (for pending only) -->
            <div v-if="submission.status === 'pending'" class="flex gap-3 pt-4 border-t">
              <button
                @click="handleApprove(submission.id)"
                :disabled="processing"
                class="btn-primary flex-1"
              >
                ✓ Approve
              </button>
              <button
                @click="openRejectModal(submission)"
                :disabled="processing"
                class="px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-all flex-1"
              >
                ✕ Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Initial State -->
      <div v-else class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p class="text-gray-500">Checking permissions...</p>
      </div>
    </div>

    <!-- Reject Modal -->
    <div
      v-if="showRejectModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showRejectModal = false"
    >
      <div class="card max-w-md w-full p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Reject Submission</h2>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Reason for Rejection (Optional)
          </label>
          <textarea
            v-model="rejectNotes"
            rows="4"
            class="textarea"
            placeholder="Provide feedback to the user..."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            This message will be visible to the user.
          </p>
        </div>

        <div class="flex gap-3">
          <button
            @click="handleReject"
            :disabled="processing"
            class="btn-primary flex-1 bg-red-600 hover:bg-red-700"
          >
            {{ processing ? 'Rejecting...' : 'Confirm Rejection' }}
          </button>
          <button
            @click="showRejectModal = false"
            :disabled="processing"
            class="btn-outline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Toast -->
    <div
      v-if="message"
      class="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md"
      :class="messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'"
    >
      {{ message }}
    </div>
  </div>
</template>

<script setup>
const user = useSupabaseUser()
const {
  getPendingSubmissions,
  getAllSubmissions,
  approveSubmission,
  rejectSubmission,
  isAdmin,
  getSubmissionStats
} = usePromptSubmissions()

const userIsAdmin = ref(false)
const loading = ref(true)
const loadingSubmissions = ref(false)
const processing = ref(false)
const submissions = ref([])
const stats = ref({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0
})

const currentTab = ref('pending')
const tabs = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' }
]

const showRejectModal = ref(false)
const selectedSubmission = ref(null)
const rejectNotes = ref('')

const message = ref('')
const messageType = ref('success')

const loadSubmissions = async () => {
  try {
    loadingSubmissions.value = true
    
    if (currentTab.value === 'pending') {
      submissions.value = await getPendingSubmissions()
    } else {
      const status = currentTab.value === 'all' ? null : currentTab.value
      submissions.value = await getAllSubmissions(status)
    }
  } catch (error) {
    console.error('Error loading submissions:', error)
    showMessage('Error loading submissions', 'error')
  } finally {
    loadingSubmissions.value = false
  }
}

const loadStats = async () => {
  try {
    stats.value = await getSubmissionStats()
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const handleApprove = async (submissionId) => {
  if (!confirm('Are you sure you want to approve this prompt? It will be added to the rotation.')) {
    return
  }

  try {
    processing.value = true
    await approveSubmission(submissionId)
    showMessage('Prompt approved successfully!', 'success')
    await loadSubmissions()
    await loadStats()
  } catch (error) {
    console.error('Error approving submission:', error)
    showMessage(error.message || 'Error approving submission', 'error')
  } finally {
    processing.value = false
  }
}

const openRejectModal = (submission) => {
  selectedSubmission.value = submission
  rejectNotes.value = ''
  showRejectModal.value = true
}

const handleReject = async () => {
  if (!selectedSubmission.value) return

  try {
    processing.value = true
    await rejectSubmission(selectedSubmission.value.id, rejectNotes.value || null)
    showMessage('Prompt rejected', 'success')
    showRejectModal.value = false
    selectedSubmission.value = null
    rejectNotes.value = ''
    await loadSubmissions()
    await loadStats()
  } catch (error) {
    console.error('Error rejecting submission:', error)
    showMessage(error.message || 'Error rejecting submission', 'error')
  } finally {
    processing.value = false
  }
}

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Check admin status and load data
onMounted(async () => {
  if (!user.value) {
    navigateTo('/login')
    return
  }

  try {
    loading.value = true
    userIsAdmin.value = await isAdmin()
    
    if (userIsAdmin.value) {
      await Promise.all([
        loadSubmissions(),
        loadStats()
      ])
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
  } finally {
    loading.value = false
  }
})

watch(user, async (newUser) => {
  if (!newUser) {
    navigateTo('/login')
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
