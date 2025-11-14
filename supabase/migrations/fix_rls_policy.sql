-- Fix RLS policy for prompt_submissions
-- Run this if you're getting "new row violates row-level security policy"

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create submissions" ON prompt_submissions;

-- Recreate with correct policy that allows authenticated users to insert
CREATE POLICY "Users can create submissions"
  ON prompt_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
