/*
  # Fix Profile Creation Issue

  1. Database Changes
    - Recreate the handle_new_user function with proper error handling
    - Ensure the trigger is properly set up on auth.users table
    - Add a policy to allow profile creation during signup process
    - Add a function to manually create missing profiles

  2. Security
    - Maintain RLS policies for profiles table
    - Allow temporary profile creation during signup flow
*/

-- Drop existing function and trigger to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with better error handling and logging
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
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
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure we have the right policies for profile creation
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Policy for authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy to allow profile creation during the signup process
-- This handles the brief moment when the user exists but might not be fully authenticated
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to manually create missing profiles for existing users
CREATE OR REPLACE FUNCTION create_missing_profiles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find users in auth.users who don't have profiles
  FOR user_record IN 
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Create missing profile
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (
      user_record.id,
      user_record.email,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE LOG 'Created missing profile for user: %', user_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create any missing profiles
SELECT create_missing_profiles();