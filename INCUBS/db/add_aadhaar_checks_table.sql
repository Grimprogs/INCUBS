-- Migration: create aadhaar_checks and link to users

CREATE TABLE IF NOT EXISTS public.aadhaar_checks (
  id uuid PRIMARY KEY,
  -- Store Aadhaar number encrypted at rest in production; placeholder column name kept for clarity.
  aadhaar_number_encrypted text NOT NULL,
  aadhaar_last4 text NOT NULL,
  otp_txn_id text NOT NULL UNIQUE,
  otp_verified boolean DEFAULT false,
  otp_expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aadhaar_checks_txn ON public.aadhaar_checks (otp_txn_id);
CREATE INDEX IF NOT EXISTS idx_aadhaar_checks_verified ON public.aadhaar_checks (otp_verified);
CREATE INDEX IF NOT EXISTS idx_aadhaar_checks_last4 ON public.aadhaar_checks (aadhaar_last4);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS aadhaar_check_id uuid REFERENCES public.aadhaar_checks(id);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS aadhaar_verified boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_aadhaar_verified ON public.users (aadhaar_verified);
