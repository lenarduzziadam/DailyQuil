// https://nuxt.com/docs/api/configuration/nuxt-config
// nuxt.config.ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],
  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.NUXT_PUBLIC_SUPABASE_URL,
        key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY
      }
    }
  },
  app: {
    head: {
      title: 'Daily Quill',
      meta: [{ name: 'description', content: 'Daily creative writing prompts and streaks' }]
    }
  }
})
