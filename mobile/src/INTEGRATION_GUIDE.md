# Integration Guide - How to Use the New Dashboard

This guide explains how to integrate the new Dashboard screens into your existing INCUBES app.

---

## 📋 Step 1: Understand Your Current App Structure

Your current app has:
- **AuthContext** - Handles login/user state
- **RootNavigator** - Decides which screen to show

After user logs in successfully, you need to:
1. Get their role from database (investor or startup)
2. Show them the Dashboard component
3. Pass their role to Dashboard

---

## 🔧 Step 2: Update RootNavigator to Use Dashboard

In your `RootNavigator.tsx`, update it to use the new Dashboard:

### Before (Old Code):
```typescript
if (user && user.role === 'investor') {
  return <InvestorDashboard />;
}
if (user && user.role === 'startup') {
  return <StartupDashboard />;
}
```

### After (New Code - Simpler):
```typescript
if (user && user.role) {
  return (
    <Dashboard 
      userRole={user.role}   // Pass role from AuthContext
      userId={user.id}        // Pass user ID
    />
  );
}
```

---

## ✅ Step 3: Verify User Object Has Role

In your **AuthContext**, when user logs in, ensure you have:

```typescript
const user = {
  id: 'user123',
  email: 'investor@example.com',
  role: 'investor',  // Must be 'investor' or 'startup'
};
```

This role comes from your `users` table in Supabase.

---

## 📦 Step 4: Add Required Import

In `RootNavigator.tsx`, add this import:

```typescript
import Dashboard from './screens/Dashboard';
```

That's it! Dashboard will handle everything else.

---

## 🧪 Step 5: Testing

### Test as Investor:
1. Login with investor account
2. **Explore** should show: Startup cards
3. **Feed** should show: Swipeable campaign cards

### Test as Startup:
1. Login with startup account
2. **Explore** should show: Investor cards
3. **Feed** should show: Your campaigns + analytics

---

## 📝 Complete Example: RootNavigator.tsx

Here's a complete example of how your RootNavigator should look:

```typescript
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your existing screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';

// Import the NEW Dashboard
import Dashboard from './screens/Dashboard';

// Import your auth context
import { useAuth } from './context/AuthContext';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  // Get user from context
  const { user, loading } = useAuth();
  
  // Show loading spinner while checking auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // User is NOT logged in → Show auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        // User IS logged in → Show Dashboard
        <Stack.Screen name="Dashboard">
          {(props) => (
            <Dashboard 
              {...props}
              userRole={user.role}  // Pass role from auth context
              userId={user.id}      // Pass user ID
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
```

### Code Explanation:

1. **useAuth()** - Gets current user from your AuthContext
   - Returns: `{ user, loading }`
   - `user = null` if not logged in
   - `user = { id, role, email }` if logged in

2. **if (loading)** - Shows spinner while checking if user is logged in
   - Prevents flash of login screen

3. **{!user ? ... : ...}** - Conditional rendering
   - If NO user → Show Login/Signup screens
   - If YES user → Show Dashboard

4. **userRole={user.role}** - Pass role to Dashboard
   - Dashboard uses this to decide what to show
   - Must be either 'investor' or 'startup'

5. **userId={user.id}** - Pass ID to Dashboard
   - Used to filter campaigns for startups
   - Used to save interactions

---

## 📁 What Each File Does

### Data Files (src/data/):

| File | Purpose |
|------|---------|
| `mockStartups.ts` | Array of fake startup profiles (used by investors) |
| `mockInvestors.ts` | Array of fake investor profiles (used by startups) |
| `mockCampaigns.ts` | Array of fundraising campaigns (used in Feed) |

### Screen Files (src/screens/):

| File | Purpose |
|------|---------|
| `Dashboard.tsx` | Main container with bottom tabs |
| `ExploreScreen.tsx` | Discovery page (shows startups OR investors) |
| `FeedScreen.tsx` | Engagement page (swipe cards OR analytics) |
| `SavedScreen.tsx` | Shows saved items (placeholder) |
| `ProfileScreen.tsx` | User profile page (placeholder) |

---

## 🎯 What Displays Where

| Screen | Investor Sees | Startup Sees |
|--------|--------------|--------------|
| **Explore** | Startup profile cards | Investor profile cards |
| **Feed** | Swipeable campaign cards | Own campaigns + analytics |
| **Saved** | Saved startups | Saved investors |
| **Profile** | Own investor profile | Own startup profile |

---

## 🚀 Next Steps (In Order)

### ✅ Already Done:
- [x] Created all screens with detailed comments
- [x] Created mock data files
- [x] Implemented role-based rendering
- [x] Implemented swipe logic
- [x] Created bottom tab navigation

### 🔄 To Do Next:
1. [ ] Update RootNavigator to use Dashboard (copy code above)
2. [ ] Test login as investor → Verify startup cards appear
3. [ ] Test login as startup → Verify investor cards appear
4. [ ] Test swipe functionality in Feed tab
5. [ ] Connect to real Supabase database (later)
6. [ ] Implement actual save functionality
7. [ ] Add navigation to profile detail pages

---

## 🐛 Troubleshooting

### Problem: "Dashboard doesn't show"
**Solution:** Check that `user.role` exists and is either 'investor' or 'startup'

### Problem: "Seeing wrong content"
**Solution:** Add `console.log(userRole)` in Dashboard to verify correct role is passed

### Problem: "Swipe doesn't work"
**Solution:** Make sure you're testing in **Feed** tab, not Explore tab. Explore doesn't have swiping.

### Problem: "Can't import Dashboard"
**Solution:** Check file path. Should be `./screens/Dashboard` from RootNavigator

### Problem: "Mock data not showing"
**Solution:** Mock data is hardcoded. It should always show. Check console for errors.

---

## 💡 Key Concepts to Remember

1. **One variable changes everything** - `userRole` prop determines entire app experience
2. **Conditional rendering** - `{role === 'investor' ? <A /> : <B />}` shows different content
3. **Mock data first** - Build UI with fake data, connect real database later
4. **Component reuse** - Same Dashboard for both roles, just different content

---

## 📚 Additional Resources

- **README_CODE_EXPLANATION.md** - Detailed architecture guide
- Check comments in each screen file - Every line is explained!

---

Made with ❤️ for learning React Native
