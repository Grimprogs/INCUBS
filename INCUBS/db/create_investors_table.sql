-- db/create_investors_table.sql
-- Purpose: create an `investors` table to store investor profiles owned by users.
-- Each investor links to a user (owner_id).

CREATE TABLE IF NOT EXISTS public.investors (
  -- internal id; UUID.
  id uuid PRIMARY KEY,

  -- link to auth/user who owns this investor profile.
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,

  -- short public id for display.
  public_id text UNIQUE,

  -- investor type, e.g., 'Angel', 'VC'.
  investor_type text,

  -- subscription or plan info (free/pro/professional).
  subscription text,

  -- soft-disable flag.
  disabled boolean DEFAULT false,

  -- created timestamp.
  created_at timestamptz DEFAULT now()
);

-- Indexes for common lookups.
CREATE INDEX IF NOT EXISTS idx_investors_owner_id ON public.investors (owner_id);
CREATE INDEX IF NOT EXISTS idx_investors_public_id ON public.investors (public_id);
