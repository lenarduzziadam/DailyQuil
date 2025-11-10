export const usePrompts = () => {
  const supabase = useSupabaseClient()

  // Get today's active prompt
  const getTodayPrompt = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_active', true)
      .eq('active_date', today)
      .single()

    if (error) throw error
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

  return {
    getTodayPrompt,
    getAllPrompts,
    getPromptById
  }
}
