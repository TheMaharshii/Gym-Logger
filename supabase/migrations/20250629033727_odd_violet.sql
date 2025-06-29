/*
  # Fix Profile Creation Trigger

  1. Database Changes
    - Drop and recreate the profile creation trigger function
    - Ensure proper trigger setup on auth.users table
    - Add proper error handling and logging
    - Create function to backfill missing profiles

  2. Security
    - Update RLS policies to allow profile creation during signup
    - Ensure proper permissions for the trigger function
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert profile record for new user
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't prevent user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to allow profile creation during signup
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Policy for authenticated users to manage their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy to allow profile creation during the signup process
-- This is needed because the trigger runs with elevated privileges
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to create missing profiles for existing users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  profile_count INTEGER;
BEGIN
  -- Count existing profiles
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  RAISE LOG 'Current profile count: %', profile_count;
  
  -- Find users in auth.users who don't have profiles and create them
  FOR user_record IN 
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
      AND au.email IS NOT NULL
  LOOP
    BEGIN
      -- Create missing profile
      INSERT INTO public.profiles (id, email, created_at, updated_at)
      VALUES (
        user_record.id,
        user_record.email,
        COALESCE(user_record.created_at, NOW()),
        NOW()
      );
      
      RAISE LOG 'Created missing profile for user: % (email: %)', user_record.id, user_record.email;
    EXCEPTION
      WHEN others THEN
        RAISE LOG 'Failed to create profile for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  -- Count profiles after creation
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  RAISE LOG 'Profile count after backfill: %', profile_count;
END;
$$;

-- Execute the function to create any missing profiles
SELECT public.create_missing_profiles();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;