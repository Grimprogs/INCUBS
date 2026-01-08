// DASHBOARD WITH BOTTOM TAB NAVIGATION
// This is the main screen after login
// Shows 4 tabs at bottom: Explore | Feed | Saved | Profile

// ========== IMPORTS ==========
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

// Import all our screens
import ExploreScreen from './ExploreScreen';
import FeedScreen from './FeedScreen';
import SavedScreen from './SavedScreen';
import ProfileScreen from './ProfileScreen';

// ========== TYPE DEFINITIONS ==========
// Define what tabs are available
type TabName = 'Explore' | 'Feed' | 'Saved' | 'Profile';

interface DashboardProps {
  userRole: 'investor' | 'startup';
  userId: string;  // For filtering user-specific data
}

// ========== MAIN COMPONENT ==========
export default function Dashboard({ userRole, userId }: DashboardProps) {
  
  // ========== STATE ==========
  // Keep track of which tab is currently selected
  // useState returns [currentValue, functionToUpdate]
  const [activeTab, setActiveTab] = useState<TabName>('Explore');
  // Default tab = Explore
  
  // ========== RENDER CONTENT ==========
  // Function: Show the right screen based on active tab
  const renderScreen = () => {
    // Switch statement = like multiple if-else
    switch (activeTab) {
      case 'Explore':
        return <ExploreScreen userRole={userRole} />;
      
      case 'Feed':
        return <FeedScreen userRole={userRole} userId={userId} />;
      
      case 'Saved':
        return <SavedScreen userRole={userRole} />;
      
      case 'Profile':
        return <ProfileScreen userRole={userRole} />;
      
      default:
        return <ExploreScreen userRole={userRole} />;
    }
  };
  
  // ========== RENDER TAB BUTTON ==========
  // Function: Render one tab button at bottom
  const renderTab = (tabName: TabName, icon: string) => {
    // Check if this tab is currently active
    const isActive = activeTab === tabName;
    
    return (
      <TouchableOpacity
        key={tabName}  // Unique key for React
        style={styles.tab}
        onPress={() => setActiveTab(tabName)}  // When clicked, change tab
      >
        {/* Icon */}
        <Text style={[
          styles.tabIcon,
          isActive && styles.tabIconActive  // Change color if active
        ]}>
          {icon}
        </Text>
        
        {/* Label */}
        <Text style={[
          styles.tabLabel,
          isActive && styles.tabLabelActive
        ]}>
          {tabName}
        </Text>
        
        {/* Active indicator (blue line) */}
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };
  
  // ========== MAIN RENDER ==========
  return (
    <SafeAreaView style={styles.container}>
      {/* SafeAreaView = avoids notch and status bar */}
      
      {/* Main content area (changes based on tab) */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      
      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {/* Render all 4 tabs */}
        {renderTab('Explore', '🔍')}
        {renderTab('Feed', '📰')}
        {renderTab('Saved', '💾')}
        {renderTab('Profile', '👤')}
      </View>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,  // Take full screen height
    backgroundColor: 'white',
  },
  screenContainer: {
    flex: 1,  // Take all space except tab bar
  },
  tabBar: {
    flexDirection: 'row',  // Tabs side by side
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 0,  // Adjust for iPhone bottom spacing
  },
  tab: {
    flex: 1,  // Each tab takes equal width
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',  // For positioning active indicator
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabIconActive: {
    // Active icon stays same (you could change this)
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#007AFF',  // iOS blue for active
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,  // Thin blue line at top
    backgroundColor: '#007AFF',
  },
});
