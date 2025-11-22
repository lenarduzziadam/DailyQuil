-- Add table to store writing reflections
CREATE TABLE IF NOT EXISTS writing_reflections (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  story_id BIGINT REFERENCES stories(id) ON DELETE CASCADE,
  mood TEXT,
  takeaway TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE writing_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert reflections" ON writing_reflections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their reflections" ON writing_reflections
  FOR SELECT
  USING (auth.uid() = user_id);
