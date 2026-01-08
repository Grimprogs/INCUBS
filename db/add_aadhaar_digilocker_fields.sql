-- Adds DigiLocker/eKYC fields to aadhaar_checks and copies to users on signup
-- Run this in Supabase SQL editor.

ALTER TABLE public.aadhaar_checks
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS kyc_provider text,
  ADD COLUMN IF NOT EXISTS kyc_ref text,
  ADD COLUMN IF NOT EXISTS kyc_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_aadhaar_checks_kyc_verified ON public.aadhaar_checks (kyc_verified);
