-- Add comprehensive investor profile columns
ALTER TABLE public.investors 
ADD COLUMN IF NOT EXISTS investor_name text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS min_investment numeric,
ADD COLUMN IF NOT EXISTS max_investment numeric,
ADD COLUMN IF NOT EXISTS previous_investments text,
ADD COLUMN IF NOT EXISTS interested_industries text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS bio text;

-- Update existing investors with default value for interested_industries
UPDATE public.investors 
SET interested_industries = 'FinTech' 
WHERE interested_industries IS NULL;
