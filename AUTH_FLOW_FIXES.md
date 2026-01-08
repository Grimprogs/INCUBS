# Auth Flow Fixes - Summary

## What Was Fixed

### 1. **Error Display on LoginScreen & SignupScreen** ✅
- **Before**: Error messages only appeared in browser console. UI showed generic "Alert" dialogs.
- **After**: Error messages now display on the screen in red error boxes with detailed Supabase error text
- **Files Modified**:
  - [LoginScreen.tsx](mobile/src/screens/LoginScreen.tsx)
  - [SignupScreen.tsx](mobile/src/screens/SignupScreen.tsx)
- **What Changed**:
  - Added `error` state to track error messages
  - Display error in red box below the form
  - Parse actual Supabase error messages instead of showing generic text
  - Added input validation (email format, password length)
  - Disabled form inputs while loading

### 2. **Auto-Insert User Row on Signup** ✅
- **Before**: When user called `auth.signUp()`, only the auth user was created. NO row was inserted into the `users` table.
  - This caused later dashboard queries to fail silently (404 or empty results)
- **After**: When `auth.signUp()` succeeds, automatically insert a row into the `users` table with:
  - `id` (auth user ID)
  - `email`
  - `created_at` timestamp
- **File Modified**: [AuthContext.tsx](mobile/src/context/AuthContext.tsx) → `signUp()` function
- **Result**: Users table is now populated immediately, preventing silent failures

### 3. **What Still Needs Verification**
- **RLS Policies on the `users` table** - Check Supabase Dashboard

---

## RLS Policy Checklist (CRITICAL)

Go to **Supabase Dashboard** → **Authentication** → **Policies** and verify the `users` table policies:

### For the `users` table, ensure you have these policies:

#### Policy 1: Allow users to SELECT their own row
```sql
SELECT policy:
  auth.uid() = id
```
✅ **This allows a user to read their own profile**

#### Policy 2: Allow users to INSERT their own row
```sql
INSERT policy:
  auth.uid() = id
```
✅ **This allows the signUp() function to insert the new user row**

#### Policy 3: Allow users to UPDATE their own row
```sql
UPDATE policy:
  auth.uid() = id
```
✅ **This allows setRole() and ProfileForm to update the user's role and profile info**

#### Policy 4: Allow service role (for migrations/admin)
```sql
For both INSERT and UPDATE:
  (SELECT auth.jwt() ->> 'role') = 'service_role'
```
✅ **Allows backend/migrations to manage users without going through RLS**

---

## How to Add/Fix RLS Policies in Supabase

1. Open **Supabase Dashboard**
2. Go to your project's **SQL Editor**
3. Run this SQL to add/replace the policies:

```sql
-- Drop old policies if they exist (optional)
DROP POLICY IF EXISTS "users_select_self" ON users;
DROP POLICY IF EXISTS "users_insert_self" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_service_role" ON users;

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT own row
CREATE POLICY "users_select_self" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: INSERT own row
CREATE POLICY "users_insert_self" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: UPDATE own row
CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policy 4: Service role (admin/migrations)
CREATE POLICY "users_service_role" ON users
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');
```

---

## Testing the Fixed Auth Flow

### Test Signup:
1. Go to **SignupScreen**
2. Enter **new email** (not existing) and **password** (min 6 chars)
3. You should now see:
   - ✅ Detailed error message if signup fails (instead of generic alert)
   - ✅ Success message if signup succeeds
   - ✅ A new row created in `users` table immediately
   - ✅ Auto-navigation to RoleSelection screen

### Test Login:
1. Go to **LoginScreen**
2. Enter **existing email** and **password**
3. You should now see:
   - ✅ Detailed error message if login fails (wrong password, user not found, etc.)
   - ✅ Auto-navigation to RoleSelection/Dashboard screen on success

### Verify User Creation:
1. Open **Supabase Dashboard** → **SQL Editor**
2. Run:
   ```sql
   SELECT id, email, role, created_at FROM users;
   ```
3. You should see a row for each user that signed up

---

## Auth Flow Architecture (Current)

```
SignupScreen
  ↓ (user enters email/password)
  ↓ calls signUp() in AuthContext
  ↓
AuthContext.signUp()
  → supabase.auth.signUp(email, password)  [creates auth user]
  → supabase.from('users').insert(...)      [creates DB user row]  ← NEW!
  → returns { error, data }
  ↓ (shows error on screen if error, or success message)
  ↓
User navigates to RoleSelectionScreen (automatic)
  ↓ (user selects startup or investor)
  ↓ calls setRole('startup' or 'investor')
  ↓
AuthContext.setRole()
  → supabase.from('users').upsert({id, public_id, role, ...})
  ↓
User navigates to ProfileForm (StartupProfileForm or InvestorProfileForm)
  ↓ (user fills in profile details)
  ↓ calls save()
  ↓
ProfileForm saves to DB
  → supabase.from('startups').upsert({owner_id, company_name, ...})
  → or supabase.from('investors').upsert({owner_id, investor_type, ...})
  ↓
User navigates to Dashboard
```

---

## Debugging Tips

If you still see errors, check:

1. **Console Errors**: Open DevTools (F12) → Console tab
   - Look for Supabase error messages with details about what failed
   - Check if it says "policy violation" (RLS issue)

2. **Supabase Logs**: In Supabase Dashboard → Logs
   - Check if there are SQL errors or policy violations

3. **Check Auth Email Confirmation**: 
   - If your Supabase project requires email confirmation, verify the email before signing in
   - You can disable this in Supabase Dashboard → Authentication → Providers → Email

4. **Check `users` table**:
   - Go to Supabase Dashboard → SQL Editor
   - Run: `SELECT * FROM users;`
   - See if new signup users appear there

---

## Files Modified Summary

| File | Change | Status |
|------|--------|--------|
| [LoginScreen.tsx](mobile/src/screens/LoginScreen.tsx) | Added error state + display | ✅ |
| [SignupScreen.tsx](mobile/src/screens/SignupScreen.tsx) | Added error state + display + success message | ✅ |
| [AuthContext.tsx](mobile/src/context/AuthContext.tsx) | Modified `signUp()` to auto-insert user row | ✅ |

---

## Next Steps

1. **Verify RLS Policies** (see checklist above)
2. **Test signup with a new email** - check that:
   - Error message displays on screen (if email already exists)
   - User row is created in `users` table
   - Navigation proceeds to RoleSelection
3. **Test login** - check that:
   - Error message displays on screen (if password wrong)
   - Navigation proceeds to RoleSelection/Dashboard
4. **Test full flow** - signup → select role → fill profile → dashboard

If anything fails, the error message on screen will now tell you exactly what went wrong!
