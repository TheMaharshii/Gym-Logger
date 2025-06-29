/*
  # Fix Profile Creation and Workout RLS Policies

  1. Security Updates
    - Update profiles INSERT policy to properly handle new user registration
    - Ensure profiles can be created during the signup process
    - Fix any issues with the uid() function reference

  2. Changes
    - Drop and recreate the profiles INSERT policy with correct auth.uid() reference
    - Ensure the policy allows authenticated users to create their own profile
    - Verify foreign key relationships work correctly
*/

-- Drop existing INSERT policy for profiles if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new INSERT policy that properly handles user registration
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the profiles table has the correct RLS setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify other policies are correctly referencing auth.uid()
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure workouts policies are correctly referencing auth.uid()
DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
CREATE POLICY "Users can insert own workouts"
  ON workouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own workouts" ON workouts;
CREATE POLICY "Users can read own workouts"
  ON workouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
CREATE POLICY "Users can update own workouts"
  ON workouts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;
CREATE POLICY "Users can delete own workouts"
  ON workouts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure food_entries policies are correctly referencing auth.uid()
DROP POLICY IF EXISTS "Users can insert own food entries" ON food_entries;
CREATE POLICY "Users can insert own food entries"
  ON food_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own food entries" ON food_entries;
CREATE POLICY "Users can read own food entries"
  ON food_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own food entries" ON food_entries;
CREATE POLICY "Users can update own food entries"
  ON food_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own food entries" ON food_entries;
CREATE POLICY "Users can delete own food entries"
  ON food_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure exercises policies are correctly referencing auth.uid()
DROP POLICY IF EXISTS "Users can insert exercises to own workouts" ON exercises;
CREATE POLICY "Users can insert exercises to own workouts"
  ON exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM workouts 
    WHERE workouts.id = exercises.workout_id 
    AND workouts.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can read exercises from own workouts" ON exercises;
CREATE POLICY "Users can read exercises from own workouts"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workouts 
    WHERE workouts.id = exercises.workout_id 
    AND workouts.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update exercises in own workouts" ON exercises;
CREATE POLICY "Users can update exercises in own workouts"
  ON exercises
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workouts 
    WHERE workouts.id = exercises.workout_id 
    AND workouts.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM workouts 
    WHERE workouts.id = exercises.workout_id 
    AND workouts.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete exercises from own workouts" ON exercises;
CREATE POLICY "Users can delete exercises from own workouts"
  ON exercises
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workouts 
    WHERE workouts.id = exercises.workout_id 
    AND workouts.user_id = auth.uid()
  ));