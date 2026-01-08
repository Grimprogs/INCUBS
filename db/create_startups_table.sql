-- db/create_startups_table.sql
-- Purpose: create a `startups` table to store company profiles owned by users.
-- Each startup links to a user (owner_id) and stores public-facing fields.

CREATE TABLE IF NOT EXISTS public.startups (
  -- unique internal id, UUID type. We expect the app or DB to provide the uuid.
  id uuid PRIMARY KEY,

  -- user id who owns this startup; references users(id) for clarity.
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,

  -- short human-friendly id shown in UI and support (must be unique).
  public_id text UNIQUE,

  -- company name shown in UI.
  company_name text NOT NULL,

  -- optional website URL.
  website text,

  -- longer description or pitch.
  description text,

  -- verification status for admin workflows (pending/verified/rejected).
  verification_status text DEFAULT 'pending',

  -- soft-delete / disabled flag so admins can disable accounts.
  disabled boolean DEFAULT false,

  -- created timestamp for auditing.
  created_at timestamptz DEFAULT now()
);

-- Indexes to speed up common queries.
CREATE INDEX IF NOT EXISTS idx_startups_owner_id ON public.startups (owner_id);
CREATE INDEX IF NOT EXISTS idx_startups_public_id ON public.startups (public_id);
CREATE INDEX IF NOT EXISTS idx_startups_verification_status ON public.startups (verification_status);
