// HOW TO USE THE NEW DASHBOARD IN YOUR EXISTING APP
//
// This file explains how to integrate the new Dashboard
// into your existing INCUBES app structure

/*
═══════════════════════════════════════════════════════════════
STEP 1: UNDERSTAND YOUR CURRENT APP STRUCTURE
═══════════════════════════════════════════════════════════════

Your current app has:
- AuthContext (handles login/user state)
- RootNavigator (decides which screen to show)

After user logs in successfully, you need to:
1. Get their role from database (investor or startup)
2. Show them the Dashboard component
3. Pass their role to Dashboard

═══════════════════════════════════════════════════════════════
STEP 2: UPDATE RootNavigator to use Dashboard
═══════════════════════════════════════════════════════════════

In your RootNavigator.tsx, AFTER user logs in:

// OLD CODE (example):
if (user && user.role === 'investor') {
  return <InvestorDashboard />;
}
if (user && user.role === 'startup') {
  return <StartupDashboard />;
}

// NEW CODE (simpler):
if (user && user.role) {
  return (
    <Dashboard 
      userRole={user.role}   // Pass role from AuthContext
      userId={user.id}        // Pass user ID
    />
  );
}

═══════════════════════════════════════════════════════════════
STEP 3: MAKE SURE USER OBJECT HAS ROLE
═══════════════════════════════════════════════════════════════

In your AuthContext, when user logs in, you should have:

const user = {
  id: 'user123',
  email: 'investor@example.com',
  role: 'investor',  // This is crucial! 'investor' or 'startup'
};

This role comes from your `users` table in Supabase.

═══════════════════════════════════════════════════════════════
STEP 4: FILE IMPORTS
═══════════════════════════════════════════════════════════════

In RootNavigator.tsx, add:

import Dashboard from '../screens/Dashboard';

That's it! Dashboard will handle everything else.

═══════════════════════════════════════════════════════════════
STEP 5: TESTING
═══════════════════════════════════════════════════════════════

To test:

1. Login as INVESTOR
   - Explore should show: Startup cards
   - Feed should show: Swipeable campaign cards

2. Login as STARTUP  
   - Explore should show: Investor cards
   - Feed should show: Your campaigns + analytics

═══════════════════════════════════════════════════════════════
COMPLETE EXAMPLE: RootNavigator.tsx
═══════════════════════════════════════════════════════════════
*/

// import React from 'react';
// import { ActivityIndicator, View } from 'react-native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

// // Import your existing screens
// import LoginScreen from '../screens/LoginScreen';
// import SignupScreen from '../screens/SignupScreen';

// // Import the NEW Dashboard
// import Dashboard from '../screens/Dashboard';

// // Import your auth context
// import { useAuth } from '../context/AuthContext';

// const Stack = createNativeStackNavigator();

// export default function RootNavigator() {
//   // Get user from context
//   const { user, loading } = useAuth();
  
//   // Show loading spinner while checking auth
//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }
  
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       {!user ? (
//         // User is NOT logged in → Show auth screens
//         <>
//           <Stack.Screen name="Login" component={LoginScreen} />
//           <Stack.Screen name="Signup" component={SignupScreen} />
//         </>
//       ) : (
//         // User IS logged in → Show Dashboard
//         // Dashboard will show different content based on role
//         <Stack.Screen name="Dashboard">
//           {(props) => (
//             <Dashboard 
//               {...props}
//               userRole={user.role}  // Pass role from auth context
//               userId={user.id}      // Pass user ID
//             />
//           )}
//         </Stack.Screen>
//       )}
//     </Stack.Navigator>
//   );
// }

/*
═══════════════════════════════════════════════════════════════
EXPLANATION OF THE CODE ABOVE
═══════════════════════════════════════════════════════════════

1. useAuth() - Gets current user from your AuthContext
   - Returns: { user, loading }
   - user = null if not logged in
   - user = { id, role, email } if logged in

2. if (loading) - Shows spinner while app checks if user is logged in
   - Prevents flash of login screen

3. {!user ? ... : ...} - Conditional rendering
   - If NO user → Show Login/Signup screens
   - If YES user → Show Dashboard

4. userRole={user.role} - Pass role to Dashboard
   - Dashboard uses this to decide what to show
   - Must be either 'investor' or 'startup'

5. userId={user.id} - Pass ID to Dashboard
   - Used to filter campaigns for startups
   - Used to save interactions

═══════════════════════════════════════════════════════════════
WHAT EACH FILE DOES
═══════════════════════════════════════════════════════════════

📁 data/mockStartups.ts
   → Array of fake startup profiles
   → Used by investors in Explore screen

📁 data/mockInvestors.ts  
   → Array of fake investor profiles
   → Used by startups in Explore screen

📁 data/mockCampaigns.ts
   → Array of fake fundraising campaigns
   → Used by investors in Feed (swipe cards)
   → Used by startups in Feed (analytics)

📁 screens/Dashboard.tsx
   → Main container with bottom tabs
   → Manages which tab is active
   → Renders correct screen based on tab

📁 screens/ExploreScreen.tsx
   → Discovery page
   → Shows startups (investor) OR investors (startup)
   → Cards with "View" and "Save" buttons

📁 screens/FeedScreen.tsx
   → Engagement page
   → Swipeable cards (investor) OR analytics (startup)
   → Has PanResponder for swipe detection

📁 screens/SavedScreen.tsx
   → Placeholder for saved items
   → Will show saved startups/investors

📁 screens/ProfileScreen.tsx
   → Placeholder for user profile
   → Shows role and basic settings

═══════════════════════════════════════════════════════════════
NEXT STEPS (DO THESE IN ORDER)
═══════════════════════════════════════════════════════════════

✅ DONE:
- Created all screens with extensive comments
- Created mock data files
- Implemented role-based rendering
- Implemented swipe logic
- Created bottom tab navigation

🔄 TO DO NEXT:
1. Update RootNavigator to use Dashboard (copy code above)
2. Test login as investor → See startup cards
3. Test login as startup → See investor cards
4. Test swipe functionality in Feed
5. Connect to real database later

═══════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════

Problem: "Dashboard doesn't show"
Solution: Check that user.role exists and is 'investor' or 'startup'

Problem: "Seeing wrong content"
Solution: Console.log(userRole) to verify correct role is passed

Problem: "Swipe doesn't work"
Solution: Make sure you're testing in Feed tab, not Explore tab

Problem: "Can't import Dashboard"
Solution: Check file path in import statement

═══════════════════════════════════════════════════════════════
*/

// This file is just documentation - don't import it anywhere!
// It's here to help you understand how to integrate the Dashboard.
