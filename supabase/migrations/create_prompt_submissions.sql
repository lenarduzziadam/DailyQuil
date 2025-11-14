-- Add admin role to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create prompt_submissions table
CREATE TABLE IF NOT EXISTS prompt_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  genre TEXT NOT NULL,
  elements TEXT[] NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_prompt_submissions_status ON prompt_submissions(status);
CREATE INDEX IF NOT EXISTS idx_prompt_submissions_user_id ON prompt_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_submissions_created_at ON prompt_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE prompt_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON prompt_submissions
  FOR SELECT
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
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prompt_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on every update
CREATE TRIGGER update_prompt_submission_timestamp
  BEFORE UPDATE ON prompt_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_submission_updated_at();

-- Function to approve a prompt submission and add it to prompts table
CREATE OR REPLACE FUNCTION approve_prompt_submission(submission_id BIGINT, admin_user_id UUID)
RETURNS VOID AS $$
DECLARE
  submission_record RECORD;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = admin_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'User is not authorized to approve submissions';
  END IF;

  -- Get the submission
  SELECT * INTO submission_record
  FROM prompt_submissions
  WHERE id = submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already processed';
  END IF;

  -- Insert into prompts table
  INSERT INTO prompts (genre, elements, is_active, active_date)
  VALUES (
    submission_record.genre,
    submission_record.elements,
    false, -- Not active by default, will be scheduled by rotation system
    NULL
  );

  -- Update submission status
  UPDATE prompt_submissions
  SET 
    status = 'approved',
    reviewed_by = admin_user_id,
    reviewed_at = NOW()
  WHERE id = submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a prompt submission
CREATE OR REPLACE FUNCTION reject_prompt_submission(
  submission_id BIGINT, 
  admin_user_id UUID,
  rejection_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = admin_user_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'User is not authorized to reject submissions';
  END IF;

  -- Update submission status
  UPDATE prompt_submissions
  SET 
    status = 'rejected',
    admin_notes = rejection_notes,
    reviewed_by = admin_user_id,
    reviewed_at = NOW()
  WHERE id = submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already processed';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT ON prompt_submissions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE prompt_submissions_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION approve_prompt_submission TO authenticated;
GRANT EXECUTE ON FUNCTION reject_prompt_submission TO authenticated;

-- Set yourself as admin (replace with your user ID)
UPDATE profiles SET is_admin = true WHERE username = 'FireWalker99';
