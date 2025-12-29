-- Add comprehensive startup profile columns
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS founded_year integer,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS company_type text,
ADD COLUMN IF NOT EXISTS registered boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS registration_number text,
ADD COLUMN IF NOT EXISTS gst_number text,
ADD COLUMN IF NOT EXISTS pan_number text,
ADD COLUMN IF NOT EXISTS num_directors text,
ADD COLUMN IF NOT EXISTS team_size integer,
ADD COLUMN IF NOT EXISTS founder_name text,
ADD COLUMN IF NOT EXISTS founder_experience text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS business_model text,
ADD COLUMN IF NOT EXISTS target_market text,
ADD COLUMN IF NOT EXISTS competition text,
ADD COLUMN IF NOT EXISTS current_revenue numeric,
ADD COLUMN IF NOT EXISTS funding_raised numeric,
ADD COLUMN IF NOT EXISTS funding_stage text,
ADD COLUMN IF NOT EXISTS monthly_burn numeric,
ADD COLUMN IF NOT EXISTS social_impact boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS impact_description text;

-- Update industry column to support multiple industries (comma-separated)
-- Existing single industry values will remain as-is