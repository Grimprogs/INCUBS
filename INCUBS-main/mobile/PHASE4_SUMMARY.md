Incubes — Phase 3/4 Summary and Next Steps
===========================================

Purpose
-------
This file gathers a concise summary of everything we changed so far (Phase 3 AFL work and Phase 4 Supabase wiring scaffolding), why we changed it, how the new flow works, and how to run and test the app. Open this file in a new chat or editor to get an at-a-glance overview.

High-level goals
----------------
- Phase 3: Add AFL (Auth / Flow / Logic) Role Selection so mock users can choose `startup` or `investor` instead of auto-landing as admin.
- Phase 4 (scaffold): Add a Supabase client and replace the mock Auth provider with a Supabase-backed provider that supports signup/login/session restore and role persistence. Add simple auth screens.

Files Added / Modified
----------------------
- Added: `mobile/src/screens/RoleSelectionScreen.tsx` — UI to pick a role (Startup / Investor) in MOCK mode.
- Modified: `mobile/src/context/AuthContext.tsx` — replaced hardcoded mock with a Supabase-aware `AuthProvider`. Exposes: `user`, `setRole`, `signUp`, `signIn`, `signOut`, `loading`.
- Added: `mobile/supabaseClient.ts` — Supabase client wrapper that reads `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Modified: `mobile/src/navigation/RootNavigator.tsx` — navigation logic updated to show auth screens when not signed in, role selection when signed-in but role missing, and role-based dashboards otherwise. Added typed routes for `RoleSelection`, `Login`, `Signup`.
- Added: `mobile/src/screens/LoginScreen.tsx` — simple email/password login UI using `useAuth().signIn`.
- Added: `mobile/src/screens/SignupScreen.tsx` — simple signup UI using `useAuth().signUp` and attempts sign-in afterwards.
- Modified: `mobile/App.tsx` — preserved `enableScreens(false)` ordering and kept `AuthProvider` wrapping navigation.
- Existing DB migration: `db/create_users_table.sql` — SQL to create `users` table (id, public_id, role, created_at). (Already present.)

Why these changes
------------------
- Admin auto-login was caused by a hardcoded mock user role set to `admin`. Replacing mock with an explicit AFL flow prevents accidental admin access and mirrors real product behavior.
- Android-only native crashes were symptomatic of native package version mismatches or native-views initialization; `enableScreens(false)` is kept as a safe workaround while aligning native deps.
- Supabase client and AuthProvider scaffolding are added so Phase 4 can be implemented incrementally (real signup/login, DB writes for role, real sessions). No real external APIs (Aadhaar, GST, payments) were added.

Short technical overview (how the app flows now)
-----------------------------------------------
1. App starts and mounts `AuthProvider` (in `App.tsx`).
2. `AuthProvider` attempts to restore session from Supabase on mount and subscribes to auth state changes.
3. `RootNavigator` uses `useAuth()` to decide navigation:
   - If `user.id` is falsy (not authenticated): show `Login` and `Signup` screens.
   - If authenticated but `user.role === null`: show `RoleSelection` screen.
   - If role set: navigate to role-specific dashboard (Startup, Investor, Admin — Admin only if role === 'admin').
4. Role selection calls `setRole(role)` which upserts a row into the `users` table and updates context.

Key files, explained briefly
---------------------------
- `mobile/supabaseClient.ts`:
  - Imports `createClient` from `@supabase/supabase-js`.
  - Reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from environment or global object.
  - Creates `supabase` client via `createClient(url, key)` and exports it.
  - Why anon key is safe: the anon key is intended for public clients when you enforce RLS policies server-side. Do not embed service_role keys in frontend code.

- `mobile/src/context/AuthContext.tsx` (important):
  - Exports types `Role` and `MockUser` (id, public_id, role).
  - Exports `AuthProvider` that:
    - Holds `user` state and `loading` flag.
    - On mount: calls `supabase.auth.getSession()` to see if a session exists.
    - If session exists: attempts to load the `users` profile row from the `users` table.
      - If profile exists: sets `user` with id/public_id/role.
      - If profile missing: sets `user` with id and `role = null` (signed-in but role unset).
    - Subscribes to Supabase auth state changes (sign-in/sign-out) and updates `user` accordingly.
    - Exposes `signUp`, `signIn`, `signOut` wrappers that call `supabase.auth`.
    - Exposes `setRole` which upserts a `users` row with `id`, `public_id` and `role`.

- `mobile/src/screens/RoleSelectionScreen.tsx`:
  - Simple center-aligned UI with a heading "Continue as" and two buttons.
  - Buttons call `setRole('startup')` or `setRole('investor')` from `useAuth()`.

- `mobile/src/navigation/RootNavigator.tsx`:
  - Maintains a typed `RootStackParamList` including `RoleSelection`, `Login`, `Signup`, dashboards, and management screens.
  - If not authenticated (`!user.id`): renders Login/Signup stack.
  - If authenticated but `user.role === null`: renders RoleSelection stack.
  - Otherwise uses `initialRouteName` chosen by role and only includes admin routes when `user.role === 'admin'`.

- `mobile/src/screens/LoginScreen.tsx` and `SignupScreen.tsx`:
  - Minimal forms with `TextInput` for email/password and a `Button` that calls `signIn`/`signUp`.
  - `Signup` attempts to `signIn` after signup to obtain a session; if the account requires email confirmation the UI will suggest the user check email.

Database notes
--------------
- `db/create_users_table.sql` describes a `users` table with:
  - `id` (uuid, primary key) matching Supabase auth user id
  - `public_id` (human-friendly display id)
  - `role` (text) — store role here to drive routing and permissions
  - `created_at` timestamp
- Why separate auth and profile data: Supabase Auth stores auth-specific fields (email, hashed password, provider) while profile rows in `users` hold application data (role, public_id). This separation lets RLS policies control access safely and keeps auth stable.

How to run and test locally
---------------------------
1. Install dependencies (from project root):

```bash
cd mobile
npm install
```

2. Ensure your Supabase environment variables are available to Expo. Two common options:

- Use `.env` or `app.config.js`/`app.json` injection (EAS secrets recommended for production).
- For quick local testing, set environment variables in your shell and start Expo:

```bash
set SUPABASE_URL=https://your-project-ref.supabase.co
set SUPABASE_ANON_KEY=your-anon-key
npx expo start --clear
```

3. Open the app in Expo Go (Android) or browser (web). Test flows:
- Fresh device: you should see **Login** screen.
- Tap **Sign up**, create an account.
- After sign up/sign in, if role missing you will see **Role Selection**.
- Pick `Startup` or `Investor` → the app will upsert a `users` row and navigate to the appropriate dashboard.
- If you set `admin` role manually in the DB, the admin dashboard becomes available.

Testing notes
-------------
- When testing on Android with Expo Go, ensure the client and Metro bundler ports match (Metro often uses 8081). If you changed port earlier, restart with `--clear` and accept default 8081.
- If you hit native crashes previously, the temporary `enableScreens(false)` remains in `App.tsx` to avoid native registration issues while dependencies settle.

Developer checklist & next steps
-------------------------------
- [ ] Manually run `npx tsc --noEmit` in `mobile` to check TS errors.
- [ ] Test sign up -> role selection -> navigation for both `startup` and `investor` users.
- [ ] Add loading UI and error handling to `RoleSelectionScreen` (optional).
- [ ] Add server-side RLS policies in Supabase to protect `users` table (only allow row upsert by authenticated user where `auth.uid() = id`).
- [ ] Remove `enableScreens(false)` once native version mismatches are fully resolved and `react-native-screens` is stable with your Expo SDK.

Notes & caveats
---------------
- This PR intentionally kept UI minimal and mock-friendly. We do not integrate Aadhaar/GST/payments.
- The `supabaseClient.ts` uses anon key; ensure you do NOT put service_role keys in client code.
- `AuthProvider` currently upserts `users` on `setRole`. If you want `public_id` generation to be deterministic or follow a different format, change the `setRole` implementation to match your product rules.

If you want this summary trimmed to a one-page README or expanded to include full line-by-line explanations per file, tell me which files to expand and I will produce a detailed per-line explanation inside the same file.

Paths to open directly
----------------------
- Summary file (this file): `mobile/PHASE4_SUMMARY.md`
- Important code files:
  - `mobile/supabaseClient.ts`
  - `mobile/src/context/AuthContext.tsx`
  - `mobile/src/navigation/RootNavigator.tsx`
  - `mobile/src/screens/RoleSelectionScreen.tsx`
  - `mobile/src/screens/LoginScreen.tsx`
  - `mobile/src/screens/SignupScreen.tsx`

-- End of summary

Full project phase summary (Phases 1 → 4)
----------------------------------------

Phase 1 — Auth basics (mock, conceptual)
--------------------------------------
- Goal: Sketch authentication behavior and roles without real backend.
- What we had:
  - A mock `AuthContext` that exposed a `user` object with `role` set to `'admin'` by default.
  - Screens existed but routing assumed a user was already present.
- Why this phase mattered:
  - Helped define how role-based routing should behave (startup vs investor vs admin).
  - Allowed front-end UI and dashboards to be developed without backend dependency.
- Files/concepts created:
  - `src/context/AuthContext.tsx` (initial mock version)
  - Navigation and dashboard screens with role-conditional flows.

Phase 2 — Dashboards & screens (UI + navigation)
------------------------------------------------
- Goal: Build the core app screens and navigation flows for each role.
- What we built:
  - `StartupDashboard`, `InvestorDashboard`, `AdminDashboard` UI screens.
  - Management screens: `StartupManagement`, `InvestorManagement`.
  - Navigation using React Navigation stack and route types.
- Why this phase mattered:
  - Delivered visible product pages for each persona to iterate on UX.
  - Confirmed what data each screen needs (profile info, counts, lists).
- Files created/modified:
  - `mobile/src/screens/*` (dashboard and management screens)
  - `mobile/src/navigation/RootNavigator.tsx` (initial routing logic)

Phase 3 — AFL (Auth / Flow / Logic) and Role selection (mock → guarded)
-------------------------------------------------------------------
- Goal: Prevent accidental admin auto-login and introduce an AFL step so users explicitly choose their role in MOCK mode.
- What we changed:
  - Replaced hardcoded admin with a context whose default role is `null`.
  - Added `RoleSelectionScreen` to let a tester pick `startup` or `investor`.
  - Updated `RootNavigator` to:
    - Show `Login/Signup` stack when not authenticated (Phase 4 prep).
    - Show `RoleSelection` when authenticated but `role === null`.
    - Only include admin routes when `role === 'admin'`.
  - Kept `enableScreens(false)` in `App.tsx` as a temporary Android native-screens workaround.
- Why this phase mattered:
  - Made the flow explicit and prevented accidental admin default.
  - Mimicked a real product flow (choose role before using product features).
- Files changed:
  - `mobile/src/context/AuthContext.tsx` (mock -> stateful provider)
  - `mobile/src/screens/RoleSelectionScreen.tsx` (new)
  - `mobile/src/navigation/RootNavigator.tsx` (updated routing and types)

Phase 4 — Supabase auth + real users table (scaffold)
---------------------------------------------------
- Goal: Replace mocks with real Supabase authentication and persist user roles in the database.
- What we implemented (scaffold):
  - `mobile/supabaseClient.ts` — Supabase client wrapper that reads env vars.
  - Reworked `AuthProvider` to use Supabase to:
    - Restore session on app load.
    - Expose `signUp`, `signIn`, `signOut` methods.
    - Provide `setRole` that upserts the `users` table with `public_id` and `role`.
    - Subscribe to auth state changes and keep `user` in React state.
  - Added simple `LoginScreen` and `SignupScreen`.
  - Updated `RootNavigator` to include auth screens and role-based flows.
  - Provided SQL migration `db/create_users_table.sql` describing the `users` table.
- Why this phase matters:
  - Connects front-end flows to real backend auth and persistent roles.
  - Makes app behavior durable across reloads: session + role are stored server-side.

How the full flow works now (summary)
------------------------------------
1. App boots and `AuthProvider` tries to restore Supabase session.
2. If not signed in → `RootNavigator` shows `Login/Signup`.
3. If signed in but role not set → show `RoleSelection` to pick startup/investor.
4. After choosing role, app upserts `users` table and navigates to the appropriate dashboard.
5. Admin dashboard remains protected and only appears if `role === 'admin'` in DB.

Next recommended steps to finish Phase 4
---------------------------------------
- Add simple auth UI flows for email confirmation and error states.
- Add RLS policies in Supabase to ensure users can only upsert their own profile row.
- Add basic loading and retry UI around `AuthProvider` session restore.
- Replace `enableScreens(false)` once native deps are aligned.

Where to read code
------------------
- `mobile/supabaseClient.ts` — Supabase client
- `mobile/src/context/AuthContext.tsx` — Supabase-backed provider
- `mobile/src/navigation/RootNavigator.tsx` — role-based navigation logic
- `mobile/src/screens/{Login,Signup,RoleSelection}` — auth & AFL UI

If you want, I can now:
- Provide a full line-by-line, plain-English explanation for any single file (pick one).
- Run `npx tsc --noEmit` and show TypeScript errors/warnings.
- Add basic loading and error UI to `RoleSelectionScreen` and auth screens.

End of combined phases summary.
