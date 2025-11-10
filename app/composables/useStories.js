export const useStories = () => {
  const supabase = useSupabaseClient()

  // Create a new story
  const createStory = async (story) => {
    // Get the current session directly from supabase
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.error('No session found')
      throw new Error('User not authenticated')
    }

    console.log('Creating story with user_id:', session.user.id)
    
    const wordCount = story.content.trim().split(/\s+/).length

    const { data, error } = await supabase
      .from('stories')
      .insert([
        {
          user_id: session.user.id,
          title: story.title,
          content: story.content,
          prompt_id: story.prompt_id || null,
          is_public: story.is_public || false,
          word_count: wordCount
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating story:', error)
      throw error
    }
    return data
  }

  // Update a story
  const updateStory = async (id, updates) => {
    const updateData = { ...updates }
    
    if (updates.content) {
      updateData.word_count = updates.content.trim().split(/\s+/).length
    }

    const { data, error } = await supabase
      .from('stories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete a story
  const deleteStory = async (id) => {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Get story by ID (with prompt and profile info)
  const getStoryById = async (id) => {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        prompt:prompts(*),
        profile:profiles(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Get user's stories
  const getUserStories = async (userId) => {
    let targetUserId = userId
    
    // If no userId provided, get it from the session
    if (!targetUserId) {
      const { data: { session } } = await supabase.auth.getSession()
      targetUserId = session?.user?.id
    }
    
    if (!targetUserId) throw new Error('No user ID provided')

    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        prompt:prompts(*)
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Get public stories (feed)
  const getPublicStories = async (limit = 20) => {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        prompt:prompts(*),
        profile:profiles(username, display_name, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  // Get stories for a specific prompt
  const getStoriesByPrompt = async (promptId, limit = 20) => {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profile:profiles(username, display_name, avatar_url)
      `)
      .eq('prompt_id', promptId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  return {
    createStory,
    updateStory,
    deleteStory,
    getStoryById,
    getUserStories,
    getPublicStories,
    getStoriesByPrompt
  }
}
