-- ============================================================================
-- FUNDRAISING SYSTEM TABLES
-- ============================================================================

-- 1. FUNDRAISING CAMPAIGNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fundraising_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  funding_goal numeric NOT NULL,
  funding_raised numeric DEFAULT 0,
  min_investment numeric DEFAULT 10000,
  max_investment numeric,
  equity_offered numeric NOT NULL,
  campaign_type text DEFAULT 'equity', -- equity, debt, convertible
  status text DEFAULT 'draft', -- draft, active, paused, completed, cancelled
  start_date date,
  end_date date,
  pitch_deck_url text,
  business_plan_url text,
  financial_projections_url text,
  team_info text,
  market_analysis text,
  competitive_advantage text,
  use_of_funds text,
  milestones text,
  risks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_startup_id ON public.fundraising_campaigns (startup_id);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_status ON public.fundraising_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_created_at ON public.fundraising_campaigns (created_at);

-- 2. CAMPAIGN UPDATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaign_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  update_type text DEFAULT 'general', -- general, milestone, financial, team
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_updates_campaign_id ON public.campaign_updates (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_updates_created_at ON public.campaign_updates (created_at);

-- 3. CAMPAIGN INTERESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaign_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE,
  investor_id uuid REFERENCES public.investors(id) ON DELETE CASCADE,
  interest_level text DEFAULT 'interested', -- interested, very_interested, committed
  proposed_investment numeric,
  proposed_equity numeric,
  notes text,
  status text DEFAULT 'pending', -- pending, contacted, meeting_scheduled, invested
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, investor_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_interests_campaign_id ON public.campaign_interests (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_interests_investor_id ON public.campaign_interests (investor_id);
CREATE INDEX IF NOT EXISTS idx_campaign_interests_status ON public.campaign_interests (status);

-- 4. CAMPAIGN DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaign_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- pitch_deck, business_plan, financials, legal, other
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  uploaded_by uuid REFERENCES public.users(id),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_documents_campaign_id ON public.campaign_documents (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_documents_type ON public.campaign_documents (document_type);

-- ============================================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================================
ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR FUNDRAISING TABLES
-- ============================================================================

-- Fundraising Campaigns: Startups can manage their own, investors can view active ones
CREATE POLICY "Startups can manage their campaigns" ON public.fundraising_campaigns
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM public.startups WHERE id = fundraising_campaigns.startup_id
    )
  );

CREATE POLICY "Investors can view active campaigns" ON public.fundraising_campaigns
  FOR SELECT USING (
    status = 'active' AND
    auth.uid() IN (
      SELECT owner_id FROM public.investors
    )
  );

-- Campaign Updates: Public updates visible to investors, private to startup owners
CREATE POLICY "Campaign updates access" ON public.campaign_updates
  FOR SELECT USING (
    is_public = true OR
    auth.uid() IN (
      SELECT s.owner_id FROM public.startups s
      JOIN public.fundraising_campaigns fc ON fc.startup_id = s.id
      WHERE fc.id = campaign_updates.campaign_id
    )
  );

CREATE POLICY "Startups can manage their updates" ON public.campaign_updates
  FOR ALL USING (
    auth.uid() IN (
      SELECT s.owner_id FROM public.startups s
      JOIN public.fundraising_campaigns fc ON fc.startup_id = s.id
      WHERE fc.id = campaign_updates.campaign_id
    )
  );

-- Campaign Interests: Investors manage their own interests, startups can view interests in their campaigns
CREATE POLICY "Investors manage their interests" ON public.campaign_interests
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM public.investors WHERE id = campaign_interests.investor_id
    )
  );

CREATE POLICY "Startups view interests in their campaigns" ON public.campaign_interests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT s.owner_id FROM public.startups s
      JOIN public.fundraising_campaigns fc ON fc.startup_id = s.id
      WHERE fc.id = campaign_interests.campaign_id
    )
  );

-- Campaign Documents: Controlled access based on document visibility
CREATE POLICY "Campaign documents access" ON public.campaign_documents
  FOR SELECT USING (
    is_public = true OR
    auth.uid() IN (
      SELECT s.owner_id FROM public.startups s
      JOIN public.fundraising_campaigns fc ON fc.startup_id = s.id
      WHERE fc.id = campaign_documents.campaign_id
    ) OR
    auth.uid() IN (
      SELECT i.owner_id FROM public.investors i
      JOIN public.campaign_interests ci ON ci.investor_id = i.id
      WHERE ci.campaign_id = campaign_documents.campaign_id AND ci.status IN ('contacted', 'meeting_scheduled', 'invested')
    )
  );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update campaign funding_raised when investments are made
CREATE OR REPLACE FUNCTION update_campaign_funding()
RETURNS TRIGGER AS $$
BEGIN
  -- Update funding_raised in the campaign
  UPDATE public.fundraising_campaigns
  SET funding_raised = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.investments i
    WHERE i.startup_id = (
      SELECT startup_id FROM public.fundraising_campaigns WHERE id = NEW.startup_id
    )
  )
  WHERE startup_id = NEW.startup_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update funding when investments change
CREATE TRIGGER update_campaign_funding_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION update_campaign_funding();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_fundraising_campaigns_updated_at
  BEFORE UPDATE ON public.fundraising_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_interests_updated_at
  BEFORE UPDATE ON public.campaign_interests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();