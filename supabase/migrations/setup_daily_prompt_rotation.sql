-- Function to rotate the daily prompt
-- This will deactivate yesterday's prompt and activate a new one for today
CREATE OR REPLACE FUNCTION rotate_daily_prompt()
RETURNS void AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  next_prompt_id BIGINT;
BEGIN
  -- Deactivate all prompts that are not for today
  UPDATE prompts
  SET is_active = false
  WHERE active_date < today_date OR active_date IS NULL;

  -- Check if there's already a prompt for today
  IF EXISTS (
    SELECT 1 FROM prompts
    WHERE active_date = today_date AND is_active = true
  ) THEN
    -- Already have a prompt for today, nothing to do
    RETURN;
  END IF;

  -- Find the next prompt that hasn't been used recently
  -- Prioritize prompts that have never been shown or were shown longest ago
  SELECT id INTO next_prompt_id
  FROM prompts
  WHERE active_date IS NULL OR active_date < today_date - INTERVAL '30 days'
  ORDER BY 
    CASE WHEN active_date IS NULL THEN 0 ELSE 1 END,
    active_date NULLS FIRST,
    RANDOM()
  LIMIT 1;

  -- If we found a prompt, activate it for today
  IF next_prompt_id IS NOT NULL THEN
    UPDATE prompts
    SET 
      is_active = true,
      active_date = today_date
    WHERE id = next_prompt_id;
    
    RAISE NOTICE 'Activated prompt % for %', next_prompt_id, today_date;
  ELSE
    -- No prompts available, log a warning
    RAISE WARNING 'No prompts available to rotate for %', today_date;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for testing)
GRANT EXECUTE ON FUNCTION rotate_daily_prompt TO authenticated;
GRANT EXECUTE ON FUNCTION rotate_daily_prompt TO anon;

-- Create a cron job to run daily at midnight UTC
-- Note: Make sure pg_cron extension is enabled
SELECT cron.schedule(
  'rotate-daily-prompt',
  '0 0 * * *', -- Every day at midnight UTC
  $$SELECT rotate_daily_prompt();$$
);

-- Optional: Run it now to set up today's prompt
SELECT rotate_daily_prompt();
