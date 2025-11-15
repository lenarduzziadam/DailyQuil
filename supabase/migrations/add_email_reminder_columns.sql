-- Add email reminder columns to profiles table if they don't exist

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS enable_email_reminders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_time TIME DEFAULT '09:00:00';

-- Add comments
COMMENT ON COLUMN profiles.enable_email_reminders IS 'Whether user wants daily email reminders';
COMMENT ON COLUMN profiles.reminder_time IS 'Time of day for email reminders (UTC)';

-- Enable email reminders for a test user (replace with your email)
-- UPDATE profiles SET enable_email_reminders = true, reminder_time = CURRENT_TIME WHERE email = 'your-email@example.com';

-- Check the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('enable_email_reminders', 'reminder_time');
