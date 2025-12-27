// Import React and hooks so we can make a provider and use context.
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// Define the allowed role values. `null` means no role selected yet (AFL step).
export type Role = 'startup' | 'investor' | 'admin' | 'super_admin' | null;

// A small user object shape used by screens and navigation.
// Keep this minimal: `id` and `public_id` may be null when role is not selected.
export type User = {
  id: string | null;
  public_id: string | null;
  email?: string | null;
  role: Role;
};

// Default user starts with no role selected. IMPORTANT: not 'admin'.
const defaultUser: User = {
  id: null,
  public_id: null,
  email: null,
  role: null
};

// Context value stores the `user` and a helper `setRole` to change the role.
// We intentionally expose only what's needed for authentication and role flow.
const AuthContext = createContext<{
  user: User;
  setRole: (r: Role) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
} | undefined>(undefined);

// Provider that keeps `user` in React state and lets children update the role.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Keep the user and a loading flag in state.
  const [user, setUser] = useState<User>(defaultUser);
  const [loading, setLoading] = useState<boolean>(true);

  // On mount, restore session from Supabase and load profile from `users` table.
  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      // Get the current session from Supabase auth.
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session && session.user) {
        // If we have a logged-in user, fetch their profile row from `users`.
        const userId = session.user.id;
        try {
          const { data: profile, error } = await supabase
            .from('users')
            .select('id, public_id, role')
            .eq('id', userId)
            .single();

          if (!error && profile && mounted) {
            setUser({ id: profile.id, public_id: profile.public_id, role: profile.role, email: session.user.email ?? null });
          } else if (mounted) {
            // No profile row yet: treat as logged-in but role not selected.
            setUser({ id: userId, public_id: null, role: null, email: session.user.email ?? null });
          }
        } catch (err) {
          // DB query failed (e.g., table doesn't exist). Treat as logged-in without profile.
          if (mounted) {
            setUser({ id: userId, public_id: null, role: null, email: session.user.email ?? null });
          }
        }
      } else if (mounted) {
        // No session: keep default user (not logged in).
        setUser(defaultUser);
      }

      // Subscribe to auth state changes so app updates on sign-in/out.
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          // On sign-in, try to load profile row.
          const uid = session.user.id;
          (async () => {
            try {
              const { data: profile } = await supabase.from('users').select('id, public_id, role').eq('id', uid).single();
              if (profile) setUser({ id: profile.id, public_id: profile.public_id, role: profile.role, email: session?.user?.email ?? null });
              else setUser({ id: uid, public_id: null, role: null, email: session?.user?.email ?? null });
            } catch (err) {
              // DB query failed; treat as logged-in without profile.
              setUser({ id: uid, public_id: null, role: null, email: session?.user?.email ?? null });
            }
          })();
        } else {
          // Signed out
          setUser(defaultUser);
        }
      });

      setLoading(false);

      return () => {
        mounted = false;
        listener?.subscription.unsubscribe();
      };
    }

    // Run init and capture cleanup from the returned function.
    const cleanup = init();
    return () => {
      // If init returned a cleanup function, call it on unmount.
      (async () => (await cleanup) && typeof (await cleanup) === 'function' && (await cleanup)())();
    };
  }, []);

  // Sign up with email and password using Supabase auth.
  // User row is created automatically via trigger on auth.users table.
  async function signUp(email: string, password: string) {
    const { error, data } = await supabase.auth.signUp({ email, password });
    // Supabase trigger automatically creates a row in public.users table
    return { error, data };
  }

  // Sign in with email and password.
  async function signIn(email: string, password: string) {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    return { error, data };
  }

  // Sign out.
  async function signOut() {
    await supabase.auth.signOut();
    // The auth state listener will reset the user.
  }

  // Set role after signup or when user chooses a role. This updates the users table.
  async function setRole(r: Role) {
    if (!user.id) throw new Error('No authenticated user to set role for');

    // Generate a small public_id for display.
    const public_id = `${r}-${Date.now().toString().slice(-6)}`;

    // Update the user row in the `users` table with the selected role.
    // User row already exists (created by trigger), so we just update the role.
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          public_id, 
          role: r
        })
        .eq('id', user.id);

      if (error) {
        console.error('setRole update failed:', error);
        // Still update local state so user can proceed
      }

      // Update local state regardless of DB success
      setUser({ ...user, public_id, role: r });
    } catch (err) {
      console.error('setRole exception:', err);
      // Update local state anyway
      setUser({ ...user, public_id, role: r });
    }
  }

  return (
    <AuthContext.Provider value={{ user, setRole, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

  // Hook that components call to read/write auth state.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
