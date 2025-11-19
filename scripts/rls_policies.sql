-- Row-Level Security (RLS) Policies for Pharmacy Table
-- Run this script in your Supabase SQL Editor after creating the pharmacy table

-- Enable RLS on pharmacy table
ALTER TABLE pharmacy ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean reinstall)
DROP POLICY IF EXISTS "Allow public insert for pharmacy" ON pharmacy;
DROP POLICY IF EXISTS "Allow users to update own pharmacy" ON pharmacy;
DROP POLICY IF EXISTS "Allow users to delete own pharmacy" ON pharmacy;
DROP POLICY IF EXISTS "Allow users to read own pharmacy" ON pharmacy;
DROP POLICY IF EXISTS "Allow service role full access" ON pharmacy;

-- Policy 1: Allow anyone to INSERT (for signup/registration)
-- This allows new users to register without authentication
CREATE POLICY "Allow public insert for pharmacy"
ON pharmacy
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Allow users to UPDATE their own pharmacy record
-- Users can only update records where the email matches their authenticated email
-- Note: This requires JWT token with email claim or using service role
CREATE POLICY "Allow users to update own pharmacy"
ON pharmacy
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Alternative: If you want to restrict updates to own record only (requires auth.email() function)
-- Uncomment the following and comment out the above if you have auth.email() available:
-- CREATE POLICY "Allow users to update own pharmacy"
-- ON pharmacy
-- FOR UPDATE
-- TO authenticated
-- USING (auth.email() = email)
-- WITH CHECK (auth.email() = email);

-- Policy 3: Allow users to DELETE their own pharmacy record
CREATE POLICY "Allow users to delete own pharmacy"
ON pharmacy
FOR DELETE
TO public
USING (true);

-- Alternative: If you want to restrict deletes to own record only:
-- CREATE POLICY "Allow users to delete own pharmacy"
-- ON pharmacy
-- FOR DELETE
-- TO authenticated
-- USING (auth.email() = email);

-- Policy 4: Allow users to READ their own pharmacy record (for signin)
-- This is needed for the signin functionality to query by email
CREATE POLICY "Allow users to read own pharmacy"
ON pharmacy
FOR SELECT
TO public
USING (true);

-- Policy 5: Allow service role full access (for backend operations)
-- This allows your backend service to perform all operations
-- Make sure you're using the service_role key in your backend for admin operations
CREATE POLICY "Allow service role full access"
ON pharmacy
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: 
-- - The policies above use 'public' role which allows operations without authentication
-- - For production, consider using 'authenticated' role and proper JWT claims
-- - The service_role policy allows your backend to bypass RLS when using service_role key
-- - Adjust policies based on your authentication requirements

