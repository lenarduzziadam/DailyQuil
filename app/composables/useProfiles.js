export const useProfiles = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Get current user's profile
  const getCurrentProfile = async () => {
    if (!user.value) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()

    if (error) throw error
    return data
  }

  // Get profile by ID
  const getProfileById = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  // Get profile by username
  const getProfileByUsername = async (username) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error) throw error
    return data
  }

  // Update current user's profile
  const updateProfile = async (updates) => {
    if (!user.value) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.value.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Create profile (usually handled by trigger, but useful for manual creation)
  const createProfile = async (profileData) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  return {
    getCurrentProfile,
    getProfileById,
    getProfileByUsername,
    updateProfile,
    createProfile
  }
}
