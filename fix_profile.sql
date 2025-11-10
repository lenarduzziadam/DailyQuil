-- This will create profiles for any users who don't have one yet
-- Run this in your Supabase SQL Editor

INSERT INTO public.profiles (id, username, display_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'display_name', au.raw_user_meta_data->>'username', split_part(au.email, '@', 1))
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);
