-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own submissions" ON prompt_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON prompt_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON prompt_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON prompt_submissions;

-- Recreate policies with correct syntax

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON prompt_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can create submissions"
  ON prompt_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON prompt_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Admins can update submissions
CREATE POLICY "Admins can update submissions"
  ON prompt_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'prompt_submissions';
