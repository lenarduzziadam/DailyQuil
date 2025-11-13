-- Add user preferences to profiles table
-- This adds genre bias, word goals, and notification settings

-- Add preference columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_genres TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS daily_word_goal INT DEFAULT 500,
ADD COLUMN IF NOT EXISTS enable_email_reminders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_time TIME DEFAULT '09:00:00';

-- Add a comment to document the fields
COMMENT ON COLUMN profiles.preferred_genres IS 'Array of genre preferences for weighted prompt selection';
COMMENT ON COLUMN profiles.daily_word_goal IS 'Target word count for daily writing';
COMMENT ON COLUMN profiles.enable_email_reminders IS 'Whether user wants daily email reminders';
COMMENT ON COLUMN profiles.reminder_time IS 'Time of day for email reminders (UTC)';

-- Create a function to get weighted random prompt based on user preferences
CREATE OR REPLACE FUNCTION get_user_preferred_prompt(user_id UUID)
RETURNS TABLE (
  id BIGINT,
  genre TEXT,
  elements TEXT[],
  is_active BOOLEAN,
  active_date DATE,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  user_genres TEXT[];
BEGIN
  -- Get user's preferred genres
  SELECT preferred_genres INTO user_genres
  FROM profiles
  WHERE profiles.id = user_id;
  
  -- If user has no preferences or empty array, return any random prompt
  IF user_genres IS NULL OR array_length(user_genres, 1) IS NULL THEN
    RETURN QUERY
    SELECT p.id, p.genre, p.elements, p.is_active, p.active_date, p.created_at
    FROM prompts p
    ORDER BY RANDOM()
    LIMIT 1;
  ELSE
    -- Return a prompt biased toward user's preferred genres
    -- 70% chance from preferred genres, 30% chance from any genre
    IF RANDOM() < 0.7 THEN
      -- Try to get from preferred genres
      RETURN QUERY
      SELECT p.id, p.genre, p.elements, p.is_active, p.active_date, p.created_at
      FROM prompts p
      WHERE p.genre = ANY(user_genres)
      ORDER BY RANDOM()
      LIMIT 1;
      
      -- If no prompts match preferences, fall back to any genre
      IF NOT FOUND THEN
        RETURN QUERY
        SELECT p.id, p.genre, p.elements, p.is_active, p.active_date, p.created_at
        FROM prompts p
        ORDER BY RANDOM()
        LIMIT 1;
      END IF;
    ELSE
      -- Return random from any genre
      RETURN QUERY
      SELECT p.id, p.genre, p.elements, p.is_active, p.active_date, p.created_at
      FROM prompts p
      ORDER BY RANDOM()
      LIMIT 1;
    END IF;
  END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_preferred_prompt(UUID) TO authenticated;

-- Create a view to show user writing stats with goal progress
CREATE OR REPLACE VIEW user_writing_stats AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.daily_word_goal,
  p.total_stories,
  p.current_streak,
  p.longest_streak,
  COALESCE(today_story.word_count, 0) as today_word_count,
  CASE 
    WHEN p.daily_word_goal > 0 THEN 
      ROUND((COALESCE(today_story.word_count, 0)::DECIMAL / p.daily_word_goal::DECIMAL) * 100, 1)
    ELSE 0
  END as goal_progress_percent,
  today_story.id IS NOT NULL as wrote_today
FROM profiles p
LEFT JOIN LATERAL (
  SELECT id, word_count
  FROM stories
  WHERE user_id = p.id 
    AND DATE(created_at) = CURRENT_DATE
  LIMIT 1
) today_story ON true;

-- Grant access to the view
GRANT SELECT ON user_writing_stats TO authenticated;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('preferred_genres', 'daily_word_goal', 'enable_email_reminders', 'reminder_time')
ORDER BY ordinal_position;
