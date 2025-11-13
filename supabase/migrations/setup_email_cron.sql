-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Setup cron job to send daily reminders every hour
-- The Edge Function will filter users based on their reminder_time preference
SELECT cron.schedule(
  'send-daily-reminders-hourly',
  '0 * * * *',  -- Every hour at :00
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);

-- Alternative: Run at specific times (more efficient if you know common reminder times)
-- Uncomment and customize if preferred:
/*
SELECT cron.schedule(
  'send-daily-reminders-specific',
  '0 6,9,12,15,18,21 * * *',  -- 6am, 9am, 12pm, 3pm, 6pm, 9pm UTC
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);
*/

-- View all scheduled cron jobs
SELECT * FROM cron.job;

-- View cron job execution history
-- Run this to monitor your cron jobs:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To update the cron schedule later:
-- SELECT cron.unschedule('send-daily-reminders-hourly');
-- Then run the schedule command again with new parameters

-- To delete a cron job:
-- SELECT cron.unschedule('send-daily-reminders-hourly');
