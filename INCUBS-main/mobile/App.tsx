// TEMPORARY DEV OVERRIDE: Set Supabase keys before any imports.
// This ensures supabaseClient.ts can read them when it initializes.
// TODO: Remove before production and use proper env config.
(globalThis as any).SUPABASE_URL = 'https://jawtvkgblqzprmxgssga.supabase.co';
(globalThis as any).SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphd3R2a2dibHF6cHJteGdzc2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTA1MzUsImV4cCI6MjA4MTk4NjUzNX0.95sCQQmvC7Ng8823NfeLceBUBxEwkSy6WSF4amaHCN4';
// Import React so we can use JSX and create components.
// Disable react-native-screens immediately to avoid a native Fabric/RNSScreen
// prop cast issue during native view registration. Call before loading
// navigation modules so the native manager path is not used.
import { enableScreens } from 'react-native-screens';
enableScreens(false);

import React from 'react';
// Ensure Supabase environment variables are available on `globalThis`.
// Populate these before requiring app modules so the Supabase client
// (which may be imported by context/screens) sees them during initialization.
if (!globalThis.SUPABASE_URL && process.env.SUPABASE_URL) {
  (globalThis as any).SUPABASE_URL = process.env.SUPABASE_URL;
}
if (!globalThis.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY) {
  (globalThis as any).SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Constants = require('expo-constants');
  const expoExtra = (Constants && (Constants.expoConfig?.extra || Constants.manifest?.extra)) || null;
  if (expoExtra) {
    if (!globalThis.SUPABASE_URL && expoExtra.SUPABASE_URL) {
      (globalThis as any).SUPABASE_URL = expoExtra.SUPABASE_URL;
    }
    if (!globalThis.SUPABASE_ANON_KEY && expoExtra.SUPABASE_ANON_KEY) {
      (globalThis as any).SUPABASE_ANON_KEY = expoExtra.SUPABASE_ANON_KEY;
    }
  }
} catch (e) {
  // ignore if expo-constants is not available in this environment
}

// Use runtime requires for navigation and context so the screens disable
// call above runs before those modules initialize native components.
import { RecoveryKeyProvider } from '../mobile/src/context/RecoveryKeyContext';
const { NavigationContainer } = require('@react-navigation/native');
const RootNavigator = require('./src/navigation/RootNavigator').default;
const { AuthProvider } = require('./src/context/AuthContext');
// Define the main App component which is the entry point.
export default function App() {
  // Render the NavigationContainer and wrap it with AuthProvider.
  // AuthProvider gives `user` to all screens via context.
  return (
    <AuthProvider>
      <RecoveryKeyProvider>
      <NavigationContainer>
        {/* RootNavigator decides which screen to show based on role. */}
        <RootNavigator />
      </NavigationContainer>
      </RecoveryKeyProvider>
    </AuthProvider>
  );
}
