<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <NuxtLink to="/" class="flex justify-center">
          <h1 class="text-4xl font-bold text-purple-600">DailyQuil</h1>
        </NuxtLink>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ isSignUp ? 'Create your account' : 'Sign in to your account' }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
          <button
            @click="isSignUp = !isSignUp"
            class="font-medium text-purple-600 hover:text-purple-500"
          >
            {{ isSignUp ? 'Sign in' : 'Sign up' }}
          </button>
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm space-y-3">
          <div v-if="isSignUp">
            <label for="username" class="sr-only">Username</label>
            <input
              id="username"
              v-model="username"
              name="username"
              type="text"
              :required="isSignUp"
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
              placeholder="Username"
            />
          </div>
          
          <div v-if="isSignUp">
            <label for="display-name" class="sr-only">Display Name</label>
            <input
              id="display-name"
              v-model="displayName"
              name="display-name"
              type="text"
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
              placeholder="Display Name (optional)"
            />
          </div>
          
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
              :placeholder="isSignUp ? 'Password (min 6 characters)' : 'Password'"
              :minlength="isSignUp ? 6 : undefined"
            />
          </div>
        </div>

        <div v-if="error" class="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
          {{ error }}
        </div>

        <div v-if="success" class="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
          {{ success }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {{ loading ? 'Loading...' : (isSignUp ? 'Sign up' : 'Sign in') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const username = ref('')
const displayName = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

// Redirect if already logged in
watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''
    success.value = ''
    
    if (isSignUp.value) {
      // Sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            username: username.value,
            display_name: displayName.value || username.value
          }
        }
      })
      
      if (signUpError) throw signUpError
      
      success.value = 'Account created successfully! Redirecting...'
      setTimeout(() => {
        navigateTo('/')
      }, 1500)
    } else {
      // Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      
      if (signInError) throw signInError
      
      navigateTo('/')
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Clear messages when switching between sign in/up
watch(isSignUp, () => {
  error.value = ''
  success.value = ''
})
</script>
