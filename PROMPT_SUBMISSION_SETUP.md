# Prompt Submission System - Setup Guide

This feature allows authenticated users to submit prompt ideas that admins can review and approve.

## 🎯 Features

- ✅ User submission form with genre and 3-4 elements
- ✅ User dashboard to track submission status
- ✅ Admin review page with approve/reject actions
- ✅ Automatic addition to prompts table when approved
- ✅ Row Level Security policies
- ✅ Admin role system

## 📦 What Was Created

### 1. Database Migration
**File:** `supabase/migrations/create_prompt_submissions.sql`
- `prompt_submissions` table with status tracking
- `is_admin` column added to profiles table
- RLS policies for users and admins
- SQL functions for approve/reject with authorization checks

### 2. Composable
**File:** `app/composables/usePromptSubmissions.js`
- `submitPrompt()` - Users submit new prompts
- `getUserSubmissions()` - View own submissions
- `getPendingSubmissions()` - Admin gets pending items
- `getAllSubmissions()` - Admin gets filtered list
- `approveSubmission()` - Admin approves (adds to prompts table)
- `rejectSubmission()` - Admin rejects with optional notes
- `isAdmin()` - Check if user is admin
- `getSubmissionStats()` - Get count statistics

### 3. User Pages
**Files:**
- `app/pages/submit-prompt/index.vue` - Submission form
- `app/pages/submit-prompt/my-submissions.vue` - User's submission history

**Features:**
- Genre dropdown (9 genres)
- 3-4 element inputs (dynamic add/remove)
- Form validation
- Success/error messages
- Status badges (pending/approved/rejected)
- Admin feedback display

### 4. Admin Page
**File:** `app/pages/admin/submissions.vue`

**Features:**
- Access control (admin only)
- Statistics dashboard
- Filter tabs (pending/approved/rejected/all)
- Approve button (instant)
- Reject button with optional notes modal
- User information display
- Timestamp tracking

## 🚀 Setup Instructions

### Step 1: Run the Database Migration

Open Supabase Dashboard → SQL Editor and run:

```sql
-- File: supabase/migrations/create_prompt_submissions.sql
-- Copy and paste the entire file content
```

This creates:
- `prompt_submissions` table
- `is_admin` column in profiles
- RLS policies
- Approve/reject functions

### Step 2: Make Yourself an Admin

In Supabase SQL Editor, run:

```sql
-- Replace with your email address
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

Or use your user ID:

```sql
-- Replace with your user ID
UPDATE profiles 
SET is_admin = true 
WHERE id = 'your-user-id-here';
```

### Step 3: Test the System

#### As a User:
1. Navigate to `/submit-prompt`
2. Fill out the form:
   - Select a genre
   - Add 3-4 story elements
   - Submit
3. View your submissions at `/submit-prompt/my-submissions`

#### As an Admin:
1. Navigate to `/admin/submissions`
2. Review pending submissions
3. Click "Approve" to add to prompts table
4. Click "Reject" to deny (with optional feedback)

## 📊 How It Works

### Submission Flow

```
User submits prompt
    ↓
Saved to prompt_submissions (status: pending)
    ↓
Admin reviews in admin panel
    ↓
Approve → Added to prompts table (status: approved)
    OR
Reject → Status updated (status: rejected)
    ↓
User sees status in their submissions page
```

### Database Schema

**prompt_submissions table:**
```sql
- id (BIGSERIAL PRIMARY KEY)
- user_id (UUID, foreign key to auth.users)
- genre (TEXT)
- elements (TEXT[]) -- Array of 3-4 strings
- status (TEXT) -- pending, approved, rejected
- admin_notes (TEXT) -- Feedback for rejected prompts
- reviewed_by (UUID) -- Admin who reviewed
- reviewed_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**profiles table addition:**
```sql
- is_admin (BOOLEAN DEFAULT false)
```

### Security

**RLS Policies:**
- Users can view their own submissions
- Users can insert their own submissions
- Admins can view all submissions
- Admins can update submissions

**SQL Functions:**
- `approve_prompt_submission()` - Checks admin status before approving
- `reject_prompt_submission()` - Checks admin status before rejecting
- Both use `SECURITY DEFINER` for elevated permissions

## 🎨 UI Components

### Submit Form
- Genre dropdown with 9 options
- Dynamic element inputs (3-4 items)
- Add/remove element buttons
- Validation and guidelines
- Success state with actions

### User Submissions Page
- Status badges (color-coded)
- Submission history
- Admin feedback display
- Timestamps
- Empty state with CTA

### Admin Panel
- Statistics cards
- Filter tabs
- User information
- Action buttons
- Reject modal with notes
- Toast notifications

## 🔧 Customization

### Add More Genres

Edit both files:
1. `app/pages/submit-prompt/index.vue` - Line ~130
2. Add to `genres` array

### Change Element Limits

Edit `app/composables/usePromptSubmissions.js`:
```javascript
// Change from 3-4 to your preference
if (!elements || elements.length < 3 || elements.length > 4) {
  throw new Error('Please provide 3-4 story elements')
}
```

### Add Email Notifications

When prompts are approved/rejected, you could send emails:

```javascript
// In approve/reject functions
await sendEmail({
  to: userEmail,
  subject: 'Your prompt was approved!',
  body: '...'
})
```

## 📝 Navigation Links

The system adds these routes:
- `/submit-prompt` - Submission form
- `/submit-prompt/my-submissions` - User's submissions
- `/admin/submissions` - Admin review panel

Added navigation link on homepage for logged-in users.

## 🐛 Troubleshooting

### "Access Denied" on Admin Page
- Check `is_admin = true` in your profile
- Run: `SELECT is_admin FROM profiles WHERE id = auth.uid();`

### Can't Submit Prompts
- Verify user is authenticated
- Check RLS policies are enabled
- Check browser console for errors

### Approved Prompts Not Showing
- Check `prompts` table: `SELECT * FROM prompts ORDER BY id DESC LIMIT 10;`
- Approved prompts are added with `is_active = false`
- They'll be scheduled by the rotation system

### Error When Approving
- Verify admin status: `SELECT is_admin FROM profiles WHERE id = 'your-user-id';`
- Check function permissions: `GRANT EXECUTE ON FUNCTION approve_prompt_submission TO authenticated;`

## 🎯 Future Enhancements

- [ ] Email notifications for status changes
- [ ] Voting system for popular submissions
- [ ] Duplicate detection
- [ ] Bulk approve/reject
- [ ] Admin dashboard with analytics
- [ ] User reputation system (approved submissions count)
- [ ] Edit submitted prompts (before approval)
- [ ] Comment system for admin feedback

## ✅ Testing Checklist

- [ ] Run database migration successfully
- [ ] Set at least one user as admin
- [ ] Submit a prompt as regular user
- [ ] View submission in user dashboard
- [ ] Access admin panel (should work)
- [ ] See pending submission in admin panel
- [ ] Approve a submission
- [ ] Verify it appears in prompts table
- [ ] Reject a submission with notes
- [ ] Verify user sees rejection feedback
- [ ] Test non-admin cannot access admin panel

## 📚 Additional Resources

- Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
- Supabase Functions: https://supabase.com/docs/guides/database/functions
- Vue 3 Composables: https://vuejs.org/guide/reusability/composables.html

---

**System is ready to use!** Run the migration, set an admin, and start accepting community prompt submissions! 🎉
