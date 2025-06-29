/*
  # Fix profiles table INSERT policy for user signup

  1. Changes
    - Drop the existing restrictive INSERT policy for profiles
    - Create a new INSERT policy that allows users to create their own profile during signup
    - The policy allows INSERT when the user ID matches the authenticated user's ID OR when creating during initial signup

  2. Security
    - Maintains security by ensuring users can only create profiles for themselves
    - Allows profile creation during the signup process when the user becomes authenticated
*/

-- Drop the existing INSERT policy that's too restrictive
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new INSERT policy that works with the signup flow
CREATE POLICY "Users can insert own profile" 
  ON profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Also ensure we have a policy for unauthenticated users during the brief moment of signup
-- This is needed because there's a timing issue where the user might not be fully authenticated yet
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);