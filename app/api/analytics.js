// Record daily word count
export async function recordWordCount(userId, wordCount, supabase) {
    const { data, error } = await supabase
        .from('writing_analytics')
        .insert([{ user_id: userId, date: new Date().toISOString().split('T')[0], word_count: wordCount }]);
    if (error) throw error;
    return data;
}

// Fetch analytics data
export async function fetchAnalytics(userId, supabase) {
    const { data, error } = await supabase
        .from('writing_analytics')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return data;
}