// EXPLORE SCREEN
// Purpose: Discovery page where users browse profiles
// - Investors see STARTUPS
// - Startups see INVESTORS

// ========== IMPORTS ==========
// React and React Native basic building blocks
import React, { useState } from 'react';
// 'useState' lets us create variables that can change and trigger re-renders

// UI Components from React Native
import {
  View,          // Like a <div> in HTML - a container
  Text,          // For displaying text
  ScrollView,    // Makes content scrollable
  StyleSheet,    // For styling components (like CSS)
  TouchableOpacity, // A button that responds to touches
  Image,         // For displaying images
} from 'react-native';

// Import our mock data
import { mockStartups, Startup } from '../data/mockStartups';
import { mockInvestors, Investor } from '../data/mockInvestors';

// ========== COMPONENT DEFINITION ==========
// This is the main Explore screen component
// Props = properties passed to this component from parent
interface ExploreScreenProps {
  userRole: 'investor' | 'startup';  // User can only be one of these two
}

// Export means other files can import and use this component
export default function ExploreScreen({ userRole }: ExploreScreenProps) {
  
  // ========== STATE MANAGEMENT ==========
  // State = data that can change over time
  
  // Keep track of which items are saved
  // useState returns [currentValue, functionToUpdateValue]
  const [savedStartups, setSavedStartups] = useState<string[]>([]);
  // savedStartups = array of startup IDs that user has saved
  // setSavedStartups = function to update this array
  
  const [savedInvestors, setSavedInvestors] = useState<string[]>([]);
  // savedInvestors = array of investor IDs that user has saved
  
  // ========== EVENT HANDLERS ==========
  // These functions run when user does something
  
  // Function: Handle when user clicks "View Profile"
  const handleViewProfile = (id: string) => {
    // For now, just log to console (developer tools)
    // Later, this will navigate to a detail page
    console.log('Viewing profile:', id);
    // TODO: Navigate to profile detail screen
  };
  
  // Function: Handle when user clicks "Save" button
  const handleSave = (id: string, type: 'startup' | 'investor') => {
    // Check which type we're saving
    if (type === 'startup') {
      // Check if this startup is already saved
      if (savedStartups.includes(id)) {
        // It's saved, so UNSAVE it (remove from array)
        // filter = create new array without this ID
        setSavedStartups(savedStartups.filter(savedId => savedId !== id));
      } else {
        // It's not saved, so SAVE it (add to array)
        // spread operator (...) copies existing items, then adds new one
        setSavedStartups([...savedStartups, id]);
      }
    } else {
      // Same logic for investors
      if (savedInvestors.includes(id)) {
        setSavedInvestors(savedInvestors.filter(savedId => savedId !== id));
      } else {
        setSavedInvestors([...savedInvestors, id]);
      }
    }
  };
  
  // ========== RENDER CARD COMPONENTS ==========
  
  // Function: Render a single STARTUP card
  // This shows what an investor sees for each startup
  const renderStartupCard = (startup: Startup) => {
    // Check if this startup is in our saved list
    const isSaved = savedStartups.includes(startup.id);
    
    // Return JSX (looks like HTML but it's JavaScript)
    return (
      // Key helps React identify which items changed
      <View key={startup.id} style={styles.card}>
        
        {/* Top section with logo and name */}
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: startup.logo }}  // Image URL
            style={styles.logo}              // Size and styling
          />
          <View style={styles.headerText}>
            <Text style={styles.cardTitle}>{startup.name}</Text>
            <Text style={styles.subtitle}>{startup.industry}</Text>
          </View>
        </View>
        
        {/* Main info section */}
        <Text style={styles.description}>{startup.description}</Text>
        
        {/* Info chips/tags */}
        <View style={styles.infoRow}>
          {/* Each piece of info in a small bubble */}
          <View style={styles.infoBadge}>
            <Text style={styles.badgeText}>Stage: {startup.stage}</Text>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.badgeText}>Need: {startup.fundingNeeded}</Text>
          </View>
        </View>
        
        <Text style={styles.location}>📍 {startup.location}</Text>
        
        {/* Action buttons at bottom */}
        <View style={styles.buttonRow}>
          {/* View Profile button */}
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => handleViewProfile(startup.id)}  // When pressed
          >
            <Text style={styles.primaryButtonText}>View Profile</Text>
          </TouchableOpacity>
          
          {/* Save button - changes appearance if saved */}
          <TouchableOpacity 
            style={[
              styles.saveButton,
              isSaved && styles.savedButton  // Add extra style if saved
            ]}
            onPress={() => handleSave(startup.id, 'startup')}
          >
            <Text style={styles.saveButtonText}>
              {isSaved ? '💾 Saved' : '🤍 Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Function: Render a single INVESTOR card
  // This shows what a startup sees for each investor
  const renderInvestorCard = (investor: Investor) => {
    const isSaved = savedInvestors.includes(investor.id);
    
    return (
      <View key={investor.id} style={styles.card}>
        
        {/* Top section with avatar and name */}
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: investor.avatar }}
            style={styles.logo}
          />
          <View style={styles.headerText}>
            <Text style={styles.cardTitle}>{investor.name}</Text>
            <Text style={styles.subtitle}>{investor.type} Investor</Text>
          </View>
        </View>
        
        {/* About the investor */}
        <Text style={styles.description}>{investor.description}</Text>
        
        {/* Investment info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBadge}>
            <Text style={styles.badgeText}>💰 {investor.ticketSize}</Text>
          </View>
        </View>
        
        {/* Industries they invest in */}
        <View style={styles.industriesRow}>
          <Text style={styles.labelText}>Invests in: </Text>
          {/* Map = loop through array and render each item */}
          {investor.industries.map((industry, index) => (
            <View key={index} style={styles.industryTag}>
              <Text style={styles.industryText}>{industry}</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.location}>📍 {investor.location}</Text>
        
        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => handleViewProfile(investor.id)}
          >
            <Text style={styles.primaryButtonText}>View Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton,
              isSaved && styles.savedButton
            ]}
            onPress={() => handleSave(investor.id, 'investor')}
          >
            <Text style={styles.saveButtonText}>
              {isSaved ? '💾 Saved' : '🤍 Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // ========== MAIN RENDER ==========
  // This is what appears on screen
  
  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>
          {/* Conditional text based on role */}
          {userRole === 'investor' 
            ? 'Discover startups looking for funding'
            : 'Find investors for your startup'
          }
        </Text>
      </View>
      
      {/* Scrollable content area */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}  // Hide scroll bar
      >
        {/* ROLE-BASED RENDERING - This is the key part! */}
        {/* If user is investor, show startups */}
        {userRole === 'investor' && (
          <View style={styles.cardsContainer}>
            {/* Loop through all startups and render each one */}
            {mockStartups.map(startup => renderStartupCard(startup))}
          </View>
        )}
        
        {/* If user is startup, show investors */}
        {userRole === 'startup' && (
          <View style={styles.cardsContainer}>
            {/* Loop through all investors and render each one */}
            {mockInvestors.map(investor => renderInvestorCard(investor))}
          </View>
        )}
        
        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ========== STYLES ==========
// Like CSS - defines how things look
const styles = StyleSheet.create({
  container: {
    flex: 1,  // Take up full screen height
    backgroundColor: '#f5f5f5',  // Light gray background
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,  // Extra space at top for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,  // Rounded corners
    padding: 16,
    marginBottom: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',  // Items side by side
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,  // Make it circular
    backgroundColor: '#e0e0e0',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',  // Allow wrapping to next line
    marginBottom: 8,
  },
  infoBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  industriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  industryTag: {
    backgroundColor: '#e3f2fd',  // Light blue
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  industryText: {
    fontSize: 12,
    color: '#1976d2',  // Dark blue
    fontWeight: '500',
  },
  location: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,  // Take equal space
    backgroundColor: '#007AFF',  // iOS blue
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  savedButton: {
    backgroundColor: '#007AFF',  // Filled when saved
    borderColor: '#007AFF',
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
