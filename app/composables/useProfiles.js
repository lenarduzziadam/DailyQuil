export const useProfiles = () => {
  const supabase = useSupabaseClient()

  // Get current user's profile
  const getCurrentProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
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

  // Upload avatar image
  const uploadAvatar = async (file) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('User not authenticated')

    // Create a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage error:', error)
      if (error.message.includes('not found')) {
        throw new Error('Storage bucket "avatars" not found. Please create it in Supabase Dashboard: Storage > New Bucket > Name: "avatars" (Public)')
      }
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update profile with new avatar URL
    await updateProfile({ avatar_url: publicUrl })

    return publicUrl
  }

  // Delete old avatar and upload new one
  const updateAvatar = async (file, oldAvatarUrl) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('User not authenticated')

    // Delete old avatar if exists
    if (oldAvatarUrl) {
      try {
        const oldPath = oldAvatarUrl.split('/avatars/')[1]
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath])
        }
      } catch (error) {
        console.warn('Error deleting old avatar:', error)
      }
    }

    // Upload new avatar
    return await uploadAvatar(file)
  }

  return {
    getCurrentProfile,
    getProfileById,
    getProfileByUsername,
    updateProfile,
    createProfile,
    uploadAvatar,
    updateAvatar
  }
}
