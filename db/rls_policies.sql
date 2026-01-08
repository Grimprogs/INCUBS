-- db/rls_policies.sql
-- Purpose: example Row Level Security (RLS) policies for the app tables.
-- Apply these in your Supabase project's SQL editor.

-- NOTE: These are example policies. Review and adapt to your security model
-- and RLS needs before applying in production.

-- 1) Enable RLS on tables so policies take effect.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Helper: allow check for admin role by querying the users table.
-- We use this in policies to let admins read/write everything.
-- (You could also use a JWT claim if you populate role in the token.)

-- 2) Policies for `users` table
-- Allow users to SELECT their own row, or SELECT any row if they are admin.
CREATE POLICY "users_select_own_or_admin" ON public.users
  FOR SELECT
  USING (
    id = auth.uid() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Allow users to INSERT only when the supplied id equals auth.uid().
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Allow users to UPDATE their own row; admins may update any row.
CREATE POLICY "users_update_own_or_admin" ON public.users
  FOR UPDATE
  USING (id = auth.uid() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (id = auth.uid() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Allow deletes only for admin users.
CREATE POLICY "users_delete_admin_only" ON public.users
  FOR DELETE
  USING (EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- 3) Policies for `startups` table
-- Allow owners and admins to SELECT startup rows.
CREATE POLICY "startups_select_owner_or_admin" ON public.startups
  FOR SELECT
  USING (
    owner_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Allow creating startups only when owner_id = auth.uid().
CREATE POLICY "startups_insert_owner_only" ON public.startups
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Allow owners to UPDATE their startups; admins can update any.
CREATE POLICY "startups_update_owner_or_admin" ON public.startups
  FOR UPDATE
  USING (owner_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (owner_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Allow deletes only for admin users.
CREATE POLICY "startups_delete_admin_only" ON public.startups
  FOR DELETE
  USING (EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- 4) Policies for `investors` table
-- Owners and admins can SELECT investor rows.
CREATE POLICY "investors_select_owner_or_admin" ON public.investors
  FOR SELECT
  USING (
    owner_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Insert only when owner_id = auth.uid().
CREATE POLICY "investors_insert_owner_only" ON public.investors
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Update owner rows or allow admin.
CREATE POLICY "investors_update_owner_or_admin" ON public.investors
  FOR UPDATE
  USING (owner_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (owner_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Deletes only for admins.
CREATE POLICY "investors_delete_admin_only" ON public.investors
  FOR DELETE
  USING (EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- 5) Policies for `investments` table
-- Allow SELECT for investor owners, startup owners, or admins.
CREATE POLICY "investments_select_participants_or_admin" ON public.investments
  FOR SELECT
  USING (
    EXISTS(SELECT 1 FROM public.investors i WHERE i.id = public.investments.investor_id AND i.owner_id = auth.uid())
    OR EXISTS(SELECT 1 FROM public.startups s WHERE s.id = public.investments.startup_id AND s.owner_id = auth.uid())
    OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Allow INSERT when the actor owns the investor row or owns the startup row (depending on workflow).
CREATE POLICY "investments_insert_participant" ON public.investments
  FOR INSERT
  WITH CHECK (
    (investor_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.investors i WHERE i.id = investor_id AND i.owner_id = auth.uid()))
    OR (startup_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.owner_id = auth.uid()))
  );

-- Allow UPDATE only for admin (you can relax this if you want participants to update status).
CREATE POLICY "investments_update_admin_only" ON public.investments
  FOR UPDATE
  USING (EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Allow DELETE only for admin.
CREATE POLICY "investments_delete_admin_only" ON public.investments
  FOR DELETE
  USING (EXISTS(SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- End of RLS policies example.
