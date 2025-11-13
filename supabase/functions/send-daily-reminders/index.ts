// Supabase Edge Function - Send Daily Email Reminders
// Deploy: supabase functions deploy send-daily-reminders

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Get current time (UTC)
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()
    
    console.log(`Running email reminders at ${currentHour}:${currentMinute} UTC`)

    // Get today's active prompt
    const { data: todayPrompt, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_active', true)
      .order('active_date', { ascending: false })
      .limit(1)
      .single()

    if (promptError || !todayPrompt) {
      console.error('Error fetching prompt:', promptError)
      throw new Error('Could not fetch today\'s prompt')
    }

    // Get users with email reminders enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, username, current_streak, longest_streak, enable_email_reminders, reminder_time')
      .eq('enable_email_reminders', true)
      .not('email', 'is', null)

    if (profilesError) {
      throw new Error('Could not fetch profiles')
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users with reminders enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter users by reminder time (±15 minute window)
    const usersToNotify = profiles.filter(profile => {
      if (!profile.reminder_time) return false
      
      const [reminderHour, reminderMinute] = profile.reminder_time.split(':').map(Number)
      const reminderTotalMinutes = reminderHour * 60 + reminderMinute
      const currentTotalMinutes = currentHour * 60 + currentMinute
      
      const diff = Math.abs(currentTotalMinutes - reminderTotalMinutes)
      return diff <= 15
    })

    console.log(`Found ${usersToNotify.length} users in time window`)

    // Send emails
    let sent = 0
    let skipped = 0
    let failed = 0

    for (const profile of usersToNotify) {
      try {
        // Check if user already wrote today
        const today = new Date().toISOString().split('T')[0]
        const { data: todayStory } = await supabase
          .from('stories')
          .select('id')
          .eq('user_id', profile.id)
          .gte('created_at', today)
          .limit(1)
          .single()

        if (todayStory) {
          console.log(`Skipping ${profile.email} - already wrote today`)
          skipped++
          continue
        }

        // Generate email HTML
        const emailHtml = generateEmailHtml(profile, todayPrompt)

        // Send via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'DailyQuil <onboarding@resend.dev>',
            to: profile.email,
            subject: `✍️ Your Daily Writing Prompt${profile.current_streak > 0 ? ` (${profile.current_streak} day streak 🔥)` : ''}`,
            html: emailHtml,
          }),
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error(`Failed to send to ${profile.email}:`, errorText)
          failed++
        } else {
          console.log(`Sent email to ${profile.email}`)
          sent++
        }
      } catch (err) {
        console.error(`Error processing ${profile.email}:`, err)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        sent,
        skipped,
        failed,
        total: usersToNotify.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateEmailHtml(profile, prompt) {
  const name = profile.display_name || profile.username || 'Writer'
  const streakEmoji = profile.current_streak >= 7 ? '🔥🔥🔥' : profile.current_streak >= 3 ? '🔥🔥' : '🔥'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily Writing Prompt</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:bold;">✍️ DailyQuil</h1>
              <p style="color:#ffffff;margin:10px 0 0;font-size:16px;opacity:0.9;">Your Daily Writing Prompt</p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 30px 20px;">
              <h2 style="color:#1f2937;margin:0 0 10px;font-size:24px;">Hi ${name}! 👋</h2>
              <p style="color:#6b7280;margin:0;font-size:16px;line-height:1.6;">
                ${profile.current_streak > 0 
                  ? `You're on a <strong>${profile.current_streak}-day streak ${streakEmoji}</strong>! Keep it going!` 
                  : "Ready to start writing? Let's begin a new streak today! 🚀"}
              </p>
            </td>
          </tr>

          ${profile.current_streak > 0 ? `
          <tr>
            <td style="padding:0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7;border-radius:8px;padding:15px;">
                <tr>
                  <td width="50%" style="text-align:center;padding:10px;">
                    <div style="font-size:28px;font-weight:bold;color:#92400e;">${profile.current_streak} 🔥</div>
                    <div style="font-size:12px;color:#78350f;margin-top:5px;">Current Streak</div>
                  </td>
                  <td width="50%" style="text-align:center;padding:10px;border-left:2px solid #fcd34d;">
                    <div style="font-size:28px;font-weight:bold;color:#92400e;">${profile.longest_streak}</div>
                    <div style="font-size:12px;color:#78350f;margin-top:5px;">Longest Streak</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <tr>
            <td style="padding:0 30px 20px;">
              <div style="background:linear-gradient(135deg,rgba(102,126,234,0.1) 0%,rgba(118,75,162,0.1) 100%);border-left:4px solid #667eea;border-radius:8px;padding:20px;">
                <h3 style="color:#667eea;margin:0 0 15px;font-size:18px;font-weight:600;">
                  💡 Today's Prompt: ${prompt.genre}
                </h3>
                <p style="color:#4b5563;margin:0 0 10px;font-size:14px;font-weight:500;">
                  Include these elements in your story:
                </p>
                <div style="margin-top:12px;">
                  ${prompt.elements.map(el => `<span style="display:inline-block;background-color:#ede9fe;color:#5b21b6;padding:6px 12px;border-radius:16px;font-size:13px;font-weight:500;margin:4px;">${el}</span>`).join('')}
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 30px 30px;text-align:center;">
              <a href="https://dailyquil.com/write?prompt=${prompt.id}" 
                 style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 6px rgba(102,126,234,0.3);">
                Start Writing Now →
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 30px 30px;">
              <div style="background-color:#f9fafb;border-radius:8px;padding:15px;text-align:center;">
                <p style="color:#6b7280;margin:0;font-size:14px;">
                  💡 <strong>Tip:</strong> Just 10 minutes of writing a day can boost creativity and reduce stress!
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;margin:0 0 10px;font-size:12px;">
                You're receiving this because you enabled daily reminders.
              </p>
              <p style="margin:0;">
                <a href="https://dailyquil.com/profile" style="color:#667eea;text-decoration:none;font-size:12px;">Update preferences</a>
                <span style="color:#d1d5db;margin:0 8px;">•</span>
                <a href="https://dailyquil.com/unsubscribe?token=${profile.id}" style="color:#9ca3af;text-decoration:none;font-size:12px;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

