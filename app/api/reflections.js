// Save a reflection note for a writing session
export async function saveReflection({ userId, storyId, mood, takeaway }, supabase) {
  const payload = {
    user_id: userId,
    story_id: storyId || null,
    mood: mood || null,
    takeaway: takeaway?.trim() || ''
  };
  const { data, error } = await supabase
    .from('writing_reflections')
    .insert([payload]);
  if (error) throw error;
  return data;
}

// Fetch reflections for a user
export async function fetchReflections(userId, supabase) {
  const { data, error } = await supabase
    .from('writing_reflections')
    .select('id, mood, takeaway, created_at, story_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
