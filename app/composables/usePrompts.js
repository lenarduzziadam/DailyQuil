export const usePrompts = () => {
  const supabase = useSupabaseClient()

  // Get today's active prompt
  const getTodayPrompt = async () => {
    const today = new Date().toISOString().split('T')[0]
    
    // First try to get today's scheduled prompt
    let { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_active', true)
      .eq('active_date', today)
      .single()

    // If no prompt for today, try to get any active prompt
    if (error || !data) {
      const { data: activeData, error: activeError } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single()
      
      if (!activeError && activeData) {
        return activeData
      }
    }

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Get all prompts
  const getAllPrompts = async () => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Get prompt by ID
  const getPromptById = async (id) => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Get a random prompt (excluding currently active one if specified)
  const getRandomPrompt = async (excludeId = null) => {
    let query = supabase
      .from('prompts')
      .select('*')
    
    // Exclude the current prompt if provided
    if (excludeId) {
      query = query.neq('id', excludeId)
    }
    
    const { data, error } = await query

    if (error) throw error
    
    if (!data || data.length === 0) {
      throw new Error('No prompts available')
    }

    // Pick a random prompt from the results
    const randomIndex = Math.floor(Math.random() * data.length)
    return data[randomIndex]
  }

  return {
    getTodayPrompt,
    getAllPrompts,
    getPromptById,
    getRandomPrompt
  }
}
