// Import React to create components and use hooks.
import React from 'react';
// Import createStackNavigator to make a stack-based navigation.
import { createStackNavigator } from '@react-navigation/stack';
// Import screens used in the stack.
import StartupDashboard from '../screens/StartupDashboard';
import InvestorDashboard from '../screens/InvestorDashboard';
import StartupProfileForm from '../screens/StartupProfileForm';
import InvestorProfileForm from '../screens/InvestorProfileForm';
// Import admin screens we will create for Phase 3.
import AdminDashboard from '../screens/AdminDashboard';
import StartupManagement from '../screens/StartupManagement';
import InvestorManagement from '../screens/InvestorManagement';
import SuperAdminDashboard from '../screens/SuperAdminDashboard';
import UserManagement from '../screens/UserManagement';
// Import fundraising screens
import FundraisingDashboard from '../screens/FundraisingDashboard';
import FundraisingCampaignForm from '../screens/FundraisingCampaignForm';
import FundraisingBrowse from '../screens/FundraisingBrowse';
import FundraisingCampaignDetail from '../screens/FundraisingCampaignDetail';
// Import Home screens
import StartupHome from '../screens/StartupHome';
import InvestorHome from '../screens/InvestorHome';
import StartupDetail from '../screens/StartupDetail';
import InvestorDetail from '../screens/InvestorDetail';
import SettingsScreen from '../screens/SettingsScreen';
// Import the auth hook so we can read the authenticated user's role.
import { useAuth } from '../context/AuthContext';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { supabase } from '../../supabaseClient';

// Define the type for stack routes, including admin screens.
type RootStackParamList = {
  RoleSelection: undefined;
  Login: undefined;
  Signup: undefined;
  /* RecoveryKey removed from navigator to keep recovery UI hidden unless explicitly used */
  // EmailConfirmation removed
  ForgotPassword: undefined;
  StartupHome: undefined;
  InvestorHome: undefined;
  StartupDashboard: undefined;
  InvestorDashboard: undefined;
  StartupProfileForm: undefined;
  InvestorProfileForm: undefined;
  StartupDetail: { startupId: string };
  InvestorDetail: { investorId: string };
  Settings: undefined;
  AdminDashboard: undefined;
  StartupManagement: undefined;
  InvestorManagement: undefined;
  SuperAdminDashboard: undefined;
  UserManagement: undefined;
  FundraisingDashboard: undefined;
  FundraisingCampaignForm: undefined;
  FundraisingBrowse: undefined;
  FundraisingCampaignDetail: { campaignId: string };
};

// Create the Stack navigator using the param list type.
const Stack = createStackNavigator<RootStackParamList>();

// RootNavigator component reads the user role and chooses initial route.
export default function RootNavigator() {
  // Read the authenticated user from auth context. We get the whole user object.
  const { user } = useAuth();
  const [profileCompleted, setProfileCompleted] = React.useState(false);
  const [checkingProfile, setCheckingProfile] = React.useState(true);

  // Check if user has completed their profile
  React.useEffect(() => {
    async function checkProfile() {
      if (!user.id || user.role === null) {
        setCheckingProfile(false);
        return;
      }

      try {
        const tableName = user.role === 'startup' ? 'startups' : 'investors';
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (!error && data) {
          setProfileCompleted(true);
        } else {
          setProfileCompleted(false);
        }
      } catch (err) {
        setProfileCompleted(false);
      } finally {
        setCheckingProfile(false);
      }
    }

    checkProfile();
  }, [user.id, user.role]);

  // DEBUG: Log current user state
  console.log('RootNavigator - user state:', { id: user.id, role: user.role, public_id: user.public_id });

  // If role is not selected yet, show the AFL RoleSelection flow.
  // If there is no authenticated user id, show the auth stack first.
  if (!user.id) {
    return (
      <Stack.Navigator id="RootNavigator">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  // If authenticated but role is not chosen yet, don't force the RoleSelection flow.
  // Show Settings so the user can change role manually when needed.
  if (user.role === null) {
    return (
      <Stack.Navigator id="RootNavigator" initialRouteName="Settings">
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  // Role is set. Check if profile is completed.
  if (user.role === 'startup') {
    // If still checking, show loading
    if (checkingProfile) {
      return (
        <Stack.Navigator id="RootNavigator">
          <Stack.Screen 
            name="StartupProfileForm" 
            component={StartupProfileForm}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      );
    }

    // If profile not completed, show form with message
    if (!profileCompleted) {
      return (
        <Stack.Navigator id="RootNavigator" initialRouteName="StartupProfileForm">
          <Stack.Screen 
            name="StartupProfileForm" 
            component={StartupProfileForm}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
          <Stack.Screen 
            name="StartupHome" 
            component={StartupHome}
            options={{ title: '🏠 Home' }}
          />
          <Stack.Screen 
            name="InvestorDetail" 
            component={InvestorDetail}
            options={{ title: 'Investor Details' }}
          />
          <Stack.Screen name="StartupDashboard" component={StartupDashboard} />
          <Stack.Screen name="FundraisingDashboard" component={FundraisingDashboard} />
          <Stack.Screen name="FundraisingCampaignForm" component={FundraisingCampaignForm} />
        </Stack.Navigator>
      );
    }

    // Profile completed, show home page
    return (
      <Stack.Navigator id="RootNavigator" initialRouteName="StartupHome">
        <Stack.Screen 
          name="StartupHome" 
          component={StartupHome}
          options={{ title: '🏠 Home' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="StartupProfileForm" 
          component={StartupProfileForm}
          options={{ title: '👤 Profile' }}
        />
        <Stack.Screen name="StartupDashboard" component={StartupDashboard} />
        <Stack.Screen 
          name="InvestorDetail" 
          component={InvestorDetail}
          options={{ title: 'Investor Details' }}
        />
        <Stack.Screen name="FundraisingDashboard" component={FundraisingDashboard} />
        <Stack.Screen name="FundraisingCampaignForm" component={FundraisingCampaignForm} />
      </Stack.Navigator>
    );
  }

  if (user.role === 'investor') {
    // If still checking, show loading
    if (checkingProfile) {
      return (
        <Stack.Navigator id="RootNavigator">
          <Stack.Screen 
            name="InvestorProfileForm" 
            component={InvestorProfileForm}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      );
    }

    // If profile not completed, show form with message
    if (!profileCompleted) {
      return (
        <Stack.Navigator id="RootNavigator" initialRouteName="InvestorProfileForm">
          <Stack.Screen 
            name="InvestorProfileForm" 
            component={InvestorProfileForm}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
          <Stack.Screen 
            name="InvestorHome" 
            component={InvestorHome}
            options={{ title: '🏠 Home' }}
          />
          <Stack.Screen 
            name="StartupDetail" 
            component={StartupDetail}
            options={{ title: 'Startup Details' }}
          />
          <Stack.Screen name="InvestorDashboard" component={InvestorDashboard} />
          <Stack.Screen name="FundraisingBrowse" component={FundraisingBrowse} />
          <Stack.Screen name="FundraisingCampaignDetail" component={FundraisingCampaignDetail} />
        </Stack.Navigator>
      );
    }

    // Profile completed, show home page
    return (
      <Stack.Navigator id="RootNavigator" initialRouteName="InvestorHome">
        <Stack.Screen 
          name="InvestorHome" 
          component={InvestorHome}
          options={{ title: '🏠 Home' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="InvestorProfileForm" 
          component={InvestorProfileForm}
          options={{ title: '👤 Profile' }}
        />
        <Stack.Screen name="InvestorDashboard" component={InvestorDashboard} />
        <Stack.Screen 
          name="StartupDetail" 
          component={StartupDetail}
          options={{ title: 'Startup Details' }}
        />
        <Stack.Screen name="FundraisingBrowse" component={FundraisingBrowse} />
        <Stack.Screen name="FundraisingCampaignDetail" component={FundraisingCampaignDetail} />
      </Stack.Navigator>
    );
  }

  if (user.role === 'admin') {
    return (
      <Stack.Navigator id="RootNavigator" initialRouteName="AdminDashboard">
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="StartupManagement" component={StartupManagement} />
        <Stack.Screen name="InvestorManagement" component={InvestorManagement} />
      </Stack.Navigator>
    );
  }

  if (user.role === 'super_admin') {
    return (
      <Stack.Navigator id="RootNavigator" initialRouteName="SuperAdminDashboard">
        <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} />
        <Stack.Screen name="UserManagement" component={UserManagement} />
        <Stack.Screen name="StartupManagement" component={StartupManagement} />
        <Stack.Screen name="InvestorManagement" component={InvestorManagement} />
      </Stack.Navigator>
    );
  }

  // For admin or other roles, show the dashboard.
  const initialRouteName =
    user.role === 'startup' ? 'StartupDashboard' : user.role === 'investor' ? 'InvestorDashboard' : 'AdminDashboard';
  const canAccessAdmin = user.role === 'admin';
  const canAccessFundraising = user.role === 'startup' || user.role === 'investor';

  return (
    <Stack.Navigator id="RootNavigator" initialRouteName={initialRouteName}>
      {/* Public dashboards + forms available to normal roles */}
      <Stack.Screen name="StartupDashboard" component={StartupDashboard} />
      <Stack.Screen name="InvestorDashboard" component={InvestorDashboard} />
      <Stack.Screen name="StartupProfileForm" component={StartupProfileForm} />
      <Stack.Screen name="InvestorProfileForm" component={InvestorProfileForm} />

      {/* Fundraising routes available to startups and investors */}
      {canAccessFundraising && (
        <>
          <Stack.Screen name="FundraisingDashboard" component={FundraisingDashboard} />
          <Stack.Screen name="FundraisingCampaignForm" component={FundraisingCampaignForm} />
          <Stack.Screen name="FundraisingBrowse" component={FundraisingBrowse} />
          <Stack.Screen name="FundraisingCampaignDetail" component={FundraisingCampaignDetail} />
        </>
      )}

      {/* Admin routes are only added when user has admin privileges. */}
      {canAccessAdmin && (
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="StartupManagement" component={StartupManagement} />
          <Stack.Screen name="InvestorManagement" component={InvestorManagement} />
        </>
      )}
    </Stack.Navigator>
  );
}