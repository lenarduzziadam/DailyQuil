export const usePromptSubmissions = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Helper to get user ID consistently
  const getUserId = () => {
    if (!user.value) return null
    // The user ID can be at user.id or user.sub depending on context
    return user.value.id || user.value.sub
  }

  // Submit a new prompt idea
  const submitPrompt = async (genre, elements) => {
    if (!user.value) {
      throw new Error('You must be logged in to submit prompts')
    }

    const userId = getUserId()
    console.log('Submitting prompt with user:', userId)

    // Validate elements
    if (!elements || elements.length < 3 || elements.length > 4) {
      throw new Error('Please provide 3-4 story elements')
    }

    // Filter out empty elements
    const cleanElements = elements.filter(el => el && el.trim().length > 0)
    
    if (cleanElements.length < 3) {
      throw new Error('Please provide at least 3 story elements')
    }

    console.log('Inserting:', {
      user_id: userId,
      genre,
      elements: cleanElements
    })

    const { data, error } = await supabase
      .from('prompt_submissions')
      .insert({
        user_id: userId,
        genre,
        elements: cleanElements
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    return data
  }

  // Get user's own submissions
  const getUserSubmissions = async () => {
    if (!user.value) return []

    const userId = getUserId()
    const { data, error } = await supabase
      .from('prompt_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Get all pending submissions (admin only)
  const getPendingSubmissions = async () => {
    const { data, error } = await supabase
      .from('prompt_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get all submissions with filters (admin only)
  const getAllSubmissions = async (status = null) => {
    let query = supabase
      .from('prompt_submissions')
      .select('*')

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Approve a submission (admin only)
  const approveSubmission = async (submissionId) => {
    if (!user.value) {
      throw new Error('You must be logged in')
    }

    const userId = getUserId()
    const { error } = await supabase.rpc('approve_prompt_submission', {
      submission_id: submissionId,
      admin_user_id: userId
    })

    if (error) throw error
  }

  // Reject a submission (admin only)
  const rejectSubmission = async (submissionId, notes = null) => {
    if (!user.value) {
      throw new Error('You must be logged in')
    }

    const userId = getUserId()
    const { error } = await supabase.rpc('reject_prompt_submission', {
      submission_id: submissionId,
      admin_user_id: userId,
      rejection_notes: notes
    })

    if (error) throw error
  }

  // Check if current user is admin
  const isAdmin = async () => {
    if (!user.value) return false

    const userId = getUserId()
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error) return false
    return data?.is_admin || false
  }

  // Get submission statistics
  const getSubmissionStats = async () => {
    const { data, error } = await supabase
      .from('prompt_submissions')
      .select('status')

    if (error) throw error

    const stats = {
      total: data.length,
      pending: data.filter(s => s.status === 'pending').length,
      approved: data.filter(s => s.status === 'approved').length,
      rejected: data.filter(s => s.status === 'rejected').length
    }

    return stats
  }

  return {
    submitPrompt,
    getUserSubmissions,
    getPendingSubmissions,
    getAllSubmissions,
    approveSubmission,
    rejectSubmission,
    isAdmin,
    getSubmissionStats
  }
}
