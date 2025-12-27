-- db/create_users_table.sql
--
-- Purpose: SQL migration to create the `users` table used by the
-- authentication system. Each column is explained inline.

-- Note: adapt this SQL to your Supabase project's SQL editor or
-- migration system.

CREATE TABLE IF NOT EXISTS public.users (
  -- `id` is the internal primary key. We use UUIDs so that the
  -- identifier is globally unique and not guessable.
  id uuid PRIMARY KEY,

  -- `email` stores the user's email address from Supabase Auth.
  -- This is synced from the auth.users table.
  email text,

  -- `public_id` is a short human-friendly identifier shown in the
  -- UI and used for support or quick reference. It is unique but
  -- not used for authentication.
  public_id text UNIQUE,

  -- `role` stores the fixed role string (startup/investor/admin/...)
  -- This must be enforced by application logic and RLS policies.
  role text,

  -- `recovery_key_hash` stores the hashed recovery key. We keep the
  -- plain recovery key only transiently and never store it.
  recovery_key_hash text,

  -- `created_at` records when the user row was created. Useful for
  -- auditing and housekeeping.
  created_at timestamptz DEFAULT now()
);

-- Indexes can speed up lookups by role or public_id.
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_public_id ON public.users (public_id);
