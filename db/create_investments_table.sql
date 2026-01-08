-- db/create_investments_table.sql
-- Purpose: record investment commitments between investors and startups.

CREATE TABLE IF NOT EXISTS public.investments (
  -- internal id; UUID.
  id uuid PRIMARY KEY,

  -- the startup receiving investment.
  startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE,

  -- the investor row making the investment.
  investor_id uuid REFERENCES public.investors(id) ON DELETE SET NULL,

  -- investment amount in the project's currency (use numeric for money).
  amount numeric,

  -- equity offered (as decimal fraction or percentage string depending on your UI).
  equity_offered numeric,

  -- status of the investment: pending/committed/rejected.
  status text DEFAULT 'pending',

  -- created timestamp.
  created_at timestamptz DEFAULT now()
);

-- Indexes for lookups by participant.
CREATE INDEX IF NOT EXISTS idx_investments_startup_id ON public.investments (startup_id);
CREATE INDEX IF NOT EXISTS idx_investments_investor_id ON public.investments (investor_id);
