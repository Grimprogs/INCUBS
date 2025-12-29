## Fix Investor Profile Form - Missing Column

The investor profile form was resetting because the `interested_industries` column doesn't exist in the database.

### What was fixed:
1. Removed the unused `investorName` field from the form (it wasn't in the database)
2. Created SQL migration to add `interested_industries` column

### To complete the fix:

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Add interested_industries column to investors table
ALTER TABLE public.investors 
ADD COLUMN IF NOT EXISTS interested_industries text;

-- Update existing investors with default value
UPDATE public.investors 
SET interested_industries = 'FinTech' 
WHERE interested_industries IS NULL;
```

Or run the file: `db/add_interested_industries.sql`

After running this, the investor profile form will properly save and load the selected industries.
