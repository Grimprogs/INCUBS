-- ============================================================================
-- COMPLETE DATABASE SETUP FOR TINDER APP
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor to set up all tables
-- with correct columns and RLS policies.
--
-- Steps:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Click "New Query"
-- 4. Paste this entire script
-- 5. Click "Run"
-- ============================================================================

-- ============================================================================
-- 1. CREATE USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text,
  public_id text UNIQUE,
  role text,
  recovery_key_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_public_id ON public.users (public_id);

-- ============================================================================
-- 2. CREATE STARTUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.startups (
  id uuid PRIMARY KEY,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  public_id text UNIQUE,
  company_name text NOT NULL,
  website text,
  description text,
  verification_status text DEFAULT 'pending',
  disabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_startups_owner_id ON public.startups (owner_id);
CREATE INDEX IF NOT EXISTS idx_startups_public_id ON public.startups (public_id);
CREATE INDEX IF NOT EXISTS idx_startups_verification_status ON public.startups (verification_status);

-- ============================================================================
-- 3. CREATE INVESTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.investors (
  id uuid PRIMARY KEY,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  public_id text UNIQUE,
  investor_type text,
  subscription text,
  disabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investors_owner_id ON public.investors (owner_id);
CREATE INDEX IF NOT EXISTS idx_investors_public_id ON public.investors (public_id);

-- ============================================================================
-- 4. CREATE INVESTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.investments (
  id uuid PRIMARY KEY,
  startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE,
  investor_id uuid REFERENCES public.investors(id) ON DELETE SET NULL,
  amount numeric,
  equity_offered numeric,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investments_startup_id ON public.investments (startup_id);
CREATE INDEX IF NOT EXISTS idx_investments_investor_id ON public.investments (investor_id);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS POLICIES FOR USERS TABLE
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_select_self" ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;
DROP POLICY IF EXISTS "users_service_role" ON public.users;

-- Policy: Allow users to SELECT their own row
CREATE POLICY "users_select_self" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Allow users to INSERT their own row
CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Allow users to UPDATE their own row
CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policy: Allow service role (admin/migrations) full access
CREATE POLICY "users_service_role" ON public.users
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- 7. RLS POLICIES FOR STARTUPS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "startups_select_public" ON public.startups;
DROP POLICY IF EXISTS "startups_select_owner" ON public.startups;
DROP POLICY IF EXISTS "startups_insert_owner" ON public.startups;
DROP POLICY IF EXISTS "startups_update_owner" ON public.startups;
DROP POLICY IF EXISTS "startups_delete_owner" ON public.startups;
DROP POLICY IF EXISTS "startups_service_role" ON public.startups;

-- Policy: Allow anyone to SELECT verified startups
CREATE POLICY "startups_select_public" ON public.startups
  FOR SELECT USING (verification_status = 'verified' OR owner_id = auth.uid());

-- Policy: Allow owner to see their own startup (verified or not)
CREATE POLICY "startups_select_owner" ON public.startups
  FOR SELECT USING (owner_id = auth.uid());

-- Policy: Allow authenticated users to INSERT their own startup
CREATE POLICY "startups_insert_owner" ON public.startups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Policy: Allow owner to UPDATE their own startup
CREATE POLICY "startups_update_owner" ON public.startups
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Policy: Allow owner to DELETE their own startup
CREATE POLICY "startups_delete_owner" ON public.startups
  FOR DELETE USING (auth.uid() = owner_id);

-- Policy: Allow service role full access
CREATE POLICY "startups_service_role" ON public.startups
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- 8. RLS POLICIES FOR INVESTORS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "investors_select_public" ON public.investors;
DROP POLICY IF EXISTS "investors_select_owner" ON public.investors;
DROP POLICY IF EXISTS "investors_insert_owner" ON public.investors;
DROP POLICY IF EXISTS "investors_update_owner" ON public.investors;
DROP POLICY IF EXISTS "investors_delete_owner" ON public.investors;
DROP POLICY IF EXISTS "investors_service_role" ON public.investors;

-- Policy: Allow anyone to SELECT non-disabled investors
CREATE POLICY "investors_select_public" ON public.investors
  FOR SELECT USING (disabled = false OR owner_id = auth.uid());

-- Policy: Allow owner to see their own investor profile
CREATE POLICY "investors_select_owner" ON public.investors
  FOR SELECT USING (owner_id = auth.uid());

-- Policy: Allow authenticated users to INSERT their own investor profile
CREATE POLICY "investors_insert_owner" ON public.investors
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Policy: Allow owner to UPDATE their own investor profile
CREATE POLICY "investors_update_owner" ON public.investors
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Policy: Allow owner to DELETE their own investor profile
CREATE POLICY "investors_delete_owner" ON public.investors
  FOR DELETE USING (auth.uid() = owner_id);

-- Policy: Allow service role full access
CREATE POLICY "investors_service_role" ON public.investors
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- 9. RLS POLICIES FOR INVESTMENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "investments_select_participant" ON public.investments;
DROP POLICY IF EXISTS "investments_insert_investor" ON public.investments;
DROP POLICY IF EXISTS "investments_update_investor" ON public.investments;
DROP POLICY IF EXISTS "investments_service_role" ON public.investments;

-- Policy: Allow startup owner and investor to see investments
CREATE POLICY "investments_select_participant" ON public.investments
  FOR SELECT USING (
    -- Startup owner can see
    (startup_id IN (SELECT id FROM public.startups WHERE owner_id = auth.uid()))
    OR
    -- Investor can see their own investment
    (investor_id IN (SELECT id FROM public.investors WHERE owner_id = auth.uid()))
  );

-- Policy: Allow investor to INSERT investments
CREATE POLICY "investments_insert_investor" ON public.investments
  FOR INSERT WITH CHECK (
    investor_id IN (SELECT id FROM public.investors WHERE owner_id = auth.uid())
  );

-- Policy: Allow investor to UPDATE their investments
CREATE POLICY "investments_update_investor" ON public.investments
  FOR UPDATE USING (
    investor_id IN (SELECT id FROM public.investors WHERE owner_id = auth.uid())
  );

-- Policy: Allow service role full access
CREATE POLICY "investments_service_role" ON public.investments
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- 10. VERIFY SETUP
-- ============================================================================
-- Run these SELECT statements to verify all tables exist and have correct columns:

-- Check users table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check startups table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'startups' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check investors table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'investors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check investments table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'investments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- END OF SETUP SCRIPT
-- ============================================================================
