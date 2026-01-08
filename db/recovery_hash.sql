-- ============================================
-- DATABASE SETUP FOR RECOVERY HASH
-- Works with your existing users table
-- ============================================

-- Step 1: Add recovery_key_hash column to existing users table
-- Run this only if the column doesn't exist yet
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS recovery_key_hash TEXT;

-- Step 2: Verify your existing trigger (should already exist)
-- This trigger creates a user row when someone signs up
-- We'll modify it to also extract recovery_key_hash from metadata

-- Step 3: Update your existing handle_new_user function
-- This preserves your existing logic and adds recovery hash extraction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user row with recovery_key_hash from metadata
  INSERT INTO public.users (
    id, 
    email, 
    recovery_key_hash,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'recovery_key_hash',  -- Extract from metadata
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    recovery_key_hash = EXCLUDED.recovery_key_hash;  -- Update if row exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure trigger exists on auth.users
-- If it already exists, this will replace it with our updated version
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Create function to update timestamp (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for updated_at (if not exists)
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- 1. Check if recovery_key_hash column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name = 'recovery_key_hash';

-- 2. View all users with recovery hashes (run as service role)
SELECT 
  id,
  email,
  role,
  public_id,
  recovery_key_hash,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check specific user's recovery hash and metadata
SELECT 
  u.id,
  u.email,
  u.role,
  u.recovery_key_hash,
  au.raw_user_meta_data
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.email = 'test@example.com';

-- 4. Verify trigger is active
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to verify recovery hash for password reset
CREATE OR REPLACE FUNCTION public.verify_recovery_hash(
  user_email TEXT,
  provided_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get stored hash
  SELECT recovery_key_hash INTO stored_hash
  FROM public.users
  WHERE email = user_email;
  
  -- Return true if hashes match
  RETURN stored_hash IS NOT NULL AND stored_hash = provided_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update recovery hash (for password reset flow)
CREATE OR REPLACE FUNCTION public.update_recovery_hash(
  user_id UUID,
  new_hash TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET recovery_key_hash = new_hash,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user by recovery hash (for password reset)
CREATE OR REPLACE FUNCTION public.get_user_by_recovery_hash(
  provided_hash TEXT
)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, email
  FROM public.users
  WHERE recovery_key_hash = provided_hash
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TEST THE IMPLEMENTATION
-- ============================================

-- After a user signs up, run this to verify everything worked:
-- Replace 'newuser@example.com' with the actual email

/*
SELECT 
  u.id,
  u.email,
  u.role,
  u.public_id,
  u.recovery_key_hash,
  au.raw_user_meta_data,
  u.created_at
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.email = 'newuser@example.com';
*/

-- Expected output:
-- - recovery_key_hash should contain a hashed value
-- - raw_user_meta_data should show { "recovery_key_hash": "..." }
-- - Both values should match

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If recovery hash is NULL after signup:

-- 1. Check if metadata was passed correctly
SELECT raw_user_meta_data 
FROM auth.users 
WHERE email = 'test@example.com';
-- Should show: {"recovery_key_hash": "abc123..."}

-- 2. Check if trigger fired
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
-- Should return one row

-- 3. Manually test the trigger function
SELECT public.handle_new_user();

-- 4. Check for errors in Supabase logs
-- Go to: Supabase Dashboard → Logs → Function Logs

-- ============================================
-- CLEANUP (Development Only - USE WITH CAUTION)
-- ============================================

/*
-- To remove recovery hash functionality:
ALTER TABLE public.users DROP COLUMN IF EXISTS recovery_key_hash;
DROP FUNCTION IF EXISTS public.verify_recovery_hash(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_recovery_hash(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_user_by_recovery_hash(TEXT);
*/