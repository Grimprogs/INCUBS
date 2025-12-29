// Supabase keys should come from environment or Expo extras (EAS).
// If you need a quick local override, set values in `mobile/.env` or
// configure `app.config.js`/EAS secrets so `expo-constants` exposes them
// via `Constants.expoConfig.extra`. Do NOT hardcode secrets here.
// Import React so we can use JSX and create components.
// Disable react-native-screens immediately to avoid a native Fabric/RNSScreen
// prop cast issue during native view registration. Call before loading
// navigation modules so the native manager path is not used.
import { enableScreens } from 'react-native-screens';
enableScreens(false);

import React from 'react';
import Constants from 'expo-constants';
import { LinkingOptions } from '@react-navigation/native';
// Supabase configuration is provided at build time via `process.env`
// and exposed to the app via `Constants.expoConfig.extra` (see mobile/app.config.js).
// Do NOT set values on `globalThis`; configuration is centralized in `app.config.js` or CI/EAS.

// Use runtime requires for navigation and context so the screens disable
// call above runs before those modules initialize native components.
import { RecoveryKeyProvider } from '../mobile/src/context/RecoveryKeyContext';
const { NavigationContainer } = require('@react-navigation/native');
const RootNavigator = require('./src/navigation/RootNavigator').default;
const { AuthProvider } = require('./src/context/AuthContext');

// Deep link handling: use custom scheme incubs://auth/reset
const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['incubs://'],
  config: {
    screens: {
      Login: 'auth/reset',
    },
  },
};
// Define the main App component which is the entry point.
export default function App() {
  // Render the NavigationContainer and wrap it with AuthProvider.
  // AuthProvider gives `user` to all screens via context.
  return (
    <AuthProvider>
      <RecoveryKeyProvider>
      <NavigationContainer linking={linking}>
        {/* RootNavigator decides which screen to show based on role. */}
        <RootNavigator />
      </NavigationContainer>
      </RecoveryKeyProvider>
    </AuthProvider>
  );
}

console.log('expo extras', Constants.expoConfig?.extra);
