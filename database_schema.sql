-- DailyQuil Database Schema
-- Run this in your Supabase SQL Editor

-- ⚠️ WARNING: This will delete existing tables and all their data!
-- Drop existing triggers first (if they exist on existing tables)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profile_stats_on_story_insert ON stories;
DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_profile_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  total_stories INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_story_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id BIGSERIAL PRIMARY KEY,
  genre TEXT NOT NULL,
  elements TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  active_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Prompts policies (everyone can read)
CREATE POLICY "Prompts are viewable by everyone"
  ON prompts FOR SELECT
  USING (true);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_id BIGINT REFERENCES prompts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Public stories are viewable by everyone"
  ON stories FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update profile stats when a story is created
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    total_stories = total_stories + 1,
    last_story_date = CURRENT_DATE,
    current_streak = CASE
      WHEN last_story_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
      WHEN last_story_date = CURRENT_DATE THEN current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(
      longest_streak,
      CASE
        WHEN last_story_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
        WHEN last_story_date = CURRENT_DATE THEN current_streak
        ELSE 1
      END
    )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profile stats
CREATE TRIGGER update_profile_stats_on_story_insert
  AFTER INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_stats();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample prompts
INSERT INTO prompts (genre, elements, is_active, active_date) VALUES
  ('Fantasy', ARRAY['princess', 'AI', 'ancient library'], true, CURRENT_DATE),
  ('Sci-Fi', ARRAY['terraformer', 'forgotten signal', 'sandstorm'], false, NULL),
  ('Mystery', ARRAY['locked room', 'old cassette', 'missing hour'], false, NULL),
  ('Horror', ARRAY['mirror', 'last train', 'whisper'], false, NULL),
  ('Romance', ARRAY['coffee shop', 'letter', 'rain'], false, NULL);
