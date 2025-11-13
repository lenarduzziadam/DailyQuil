# Daily Prompt Rotation Setup

This feature automatically rotates the daily writing prompt at midnight UTC every day.

## How It Works

1. **Database Function**: `rotate_daily_prompt()` deactivates old prompts and selects a new one for today
2. **Cron Job**: Runs automatically at midnight UTC (pg_cron)
3. **Smart Selection**: Prioritizes prompts that haven't been shown recently (30+ days)
4. **Homepage Display**: Shows "Prompt of the Day" with countdown to next rotation

## Setup Instructions

### 1. Enable pg_cron Extension

In Supabase Dashboard → SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 2. Run the Migration

In Supabase Dashboard → SQL Editor, run the entire file:
`supabase/migrations/setup_daily_prompt_rotation.sql`

This will:
- Create the `rotate_daily_prompt()` function
- Set up the cron job to run at midnight UTC
- Activate today's prompt immediately

### 3. Verify It's Working

Check that a prompt is active for today:

```sql
SELECT * FROM prompts WHERE is_active = true AND active_date = CURRENT_DATE;
```

View scheduled cron jobs:

```sql
SELECT * FROM cron.job;
```

### 4. Manual Rotation (Optional)

To manually trigger a prompt rotation:

```sql
SELECT rotate_daily_prompt();
```

## Features

- ✅ Automatic daily rotation at midnight UTC
- ✅ Countdown timer showing time until next prompt
- ✅ Random prompt button still works for users who want variety
- ✅ Smart prompt selection (avoids recent repeats)
- ✅ Approved user-submitted prompts enter the rotation pool

## Customization

### Change Rotation Time

Edit the cron schedule in the migration file:
- `'0 0 * * *'` = Midnight UTC
- `'0 9 * * *'` = 9 AM UTC
- `'30 14 * * *'` = 2:30 PM UTC

### Change Repeat Interval

Modify the 30-day interval in the function:
```sql
WHERE active_date IS NULL OR active_date < today_date - INTERVAL '30 days'
```

Change `'30 days'` to any interval you want (e.g., `'7 days'`, `'60 days'`).
