// FEED SCREEN
// Purpose: Engagement page
// - Investors: SWIPE through startup campaign cards (Tinder-style)
// - Startups: VIEW their own campaign posts + analytics

// ========== IMPORTS ==========
import React, { useState, useRef } from 'react';
// useRef = creates a reference to track values without re-rendering

import {
  View,
  Text,
  StyleSheet,
  Dimensions,      // Get screen size
  PanResponder,    // Handle touch gestures (for swiping)
  Animated,        // For smooth animations
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';

import { mockCampaigns, Campaign, getCampaignsForStartup } from '../data/mockCampaigns';

// Get device screen width for calculations
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;  // 25% of screen = swipe trigger

// ========== COMPONENT DEFINITION ==========
interface FeedScreenProps {
  userRole: 'investor' | 'startup';
  userId: string;  // To filter campaigns for startups
}

export default function FeedScreen({ userRole, userId }: FeedScreenProps) {
  
  // ========== STATE FOR INVESTOR (SWIPE VIEW) ==========
  
  // Keep track of which card we're showing (index in array)
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Animated value for card position (starts at 0)
  // This tracks how far left/right the card has been dragged
  const position = useRef(new Animated.ValueXY()).current;
  // ValueXY = tracks both X (horizontal) and Y (vertical) position
  
  // ========== SWIPE DETECTION LOGIC ==========
  
  // PanResponder = handles touch gestures
  // Think of it as "watching" user's finger movements
  const panResponder = useRef(
    PanResponder.create({
      // Should this component respond to touches? Yes!
      onStartShouldSetPanResponder: () => true,
      
      // onPanResponderMove = runs continuously as user drags
      onPanResponderMove: (event, gesture) => {
        // gesture.dx = how far finger moved horizontally
        // gesture.dy = how far finger moved vertically
        
        // Update card position to follow finger
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      
      // onPanResponderRelease = runs when user lifts finger
      onPanResponderRelease: (event, gesture) => {
        // Check if user swiped far enough
        
        // SWIPE RIGHT = Interested
        if (gesture.dx > SWIPE_THRESHOLD) {
          console.log('✅ SWIPED RIGHT - Interested in:', mockCampaigns[currentIndex].startupName);
          forceSwipe('right');
        } 
        // SWIPE LEFT = Not Interested
        else if (gesture.dx < -SWIPE_THRESHOLD) {
          console.log('❌ SWIPED LEFT - Not interested in:', mockCampaigns[currentIndex].startupName);
          forceSwipe('left');
        } 
        // NOT FAR ENOUGH = Reset card to center
        else {
          resetPosition();
        }
      },
    })
  ).current;  // .current gives us the actual value
  
  // Function: Force card to swipe off screen
  const forceSwipe = (direction: 'left' | 'right') => {
    // Calculate where card should end up
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    
    // Animate card flying off screen
    Animated.timing(position, {
      toValue: { x, y: 0 },           // Where to go
      duration: 250,                   // How fast (250ms)
      useNativeDriver: false,          // Required for layout animations
    }).start(() => {
      // After animation completes:
      onSwipeComplete(direction);      // Handle the swipe action
    });
  };
  
  // Function: Reset card back to center
  const resetPosition = () => {
    // Animate back to starting position
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };
  
  // Function: Handle what happens after swipe completes
  const onSwipeComplete = (direction: 'left' | 'right') => {
    // Save the interaction to database (later)
    // For now, just log it
    const campaign = mockCampaigns[currentIndex];
    
    if (direction === 'right') {
      console.log('💙 User interested in campaign:', campaign.id);
      // TODO: Save to "interests" in database
    } else {
      console.log('👎 User not interested in campaign:', campaign.id);
      // TODO: Save to "passed" in database
    }
    
    // Reset card position for next card
    position.setValue({ x: 0, y: 0 });
    
    // Move to next card
    setCurrentIndex(currentIndex + 1);
  };
  
  // Function: Render one swipeable campaign card
  const renderSwipeCard = (campaign: Campaign, index: number) => {
    // Only render the current card (performance optimization)
    if (index < currentIndex) {
      return null;  // Card already swiped, don't render
    }
    
    if (index === currentIndex) {
      // THIS IS THE ACTIVE CARD - make it swipeable
      
      // Calculate rotation based on how far card is dragged
      // When you drag right, card tilts right (like real cards)
      const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ['-10deg', '0deg', '10deg'],  // Tilt angles
        extrapolate: 'clamp',  // Don't go beyond these values
      });
      
      // Calculate opacity for "LIKE" and "NOPE" labels
      const likeOpacity = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: [0, 0, 1],  // Show only when swiping right
        extrapolate: 'clamp',
      });
      
      const nopeOpacity = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: [1, 0, 0],  // Show only when swiping left
        extrapolate: 'clamp',
      });
      
      return (
        <Animated.View
          key={campaign.id}
          style={[
            styles.swipeCard,
            {
              // Apply position and rotation animations
              transform: [
                { translateX: position.x },  // Move left/right
                { translateY: position.y },  // Move up/down
                { rotate: rotate },          // Rotate
              ],
            },
          ]}
          {...panResponder.panHandlers}  // Attach swipe handlers
        >
          {/* Campaign Image */}
          <Image 
            source={{ uri: campaign.image }}
            style={styles.cardImage}
          />
          
          {/* LIKE label (shows when swiping right) */}
          <Animated.View 
            style={[
              styles.likeLabel,
              { opacity: likeOpacity }
            ]}
          >
            <Text style={styles.likeLabelText}>LIKE</Text>
          </Animated.View>
          
          {/* NOPE label (shows when swiping left) */}
          <Animated.View 
            style={[
              styles.nopeLabel,
              { opacity: nopeOpacity }
            ]}
          >
            <Text style={styles.nopeLabelText}>NOPE</Text>
          </Animated.View>
          
          {/* Campaign Info Overlay */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{campaign.title}</Text>
            <Text style={styles.cardStartup}>{campaign.startupName}</Text>
            
            <View style={styles.cardDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Goal</Text>
                <Text style={styles.detailValue}>{campaign.fundingGoal}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Raised</Text>
                <Text style={styles.detailValue}>{campaign.currentRaised}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Stage</Text>
                <Text style={styles.detailValue}>{campaign.stage}</Text>
              </View>
            </View>
            
            <Text style={styles.cardDescription} numberOfLines={3}>
              {campaign.description}
            </Text>
            
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => console.log('View full campaign:', campaign.id)}
            >
              <Text style={styles.viewDetailsText}>View Full Details ↑</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }
    
    // CARDS BELOW - show slightly visible underneath
    return (
      <View 
        key={campaign.id} 
        style={[
          styles.swipeCard, 
          { 
            position: 'absolute',
            top: 10 * (index - currentIndex),  // Stack effect
            opacity: 0.5,                       // Faded
          }
        ]}
      >
        <Image source={{ uri: campaign.image }} style={styles.cardImage} />
      </View>
    );
  };
  
  // ========== STARTUP VIEW (NO SWIPE) ==========
  
  // Function: Render startup's own campaigns with analytics
  const renderStartupCampaigns = () => {
    // Get only this startup's campaigns
    const myCampaigns = getCampaignsForStartup(userId);
    
    // If no campaigns yet
    if (myCampaigns.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Campaigns Yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first fundraising campaign to get started!
          </Text>
          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>+ Create Campaign</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Show campaigns with analytics
    return (
      <ScrollView style={styles.scrollView}>
        {/* Create Campaign Button */}
        <TouchableOpacity style={styles.createCampaignButton}>
          <Text style={styles.createCampaignText}>+ Create New Campaign</Text>
        </TouchableOpacity>
        
        {/* List of campaigns */}
        {myCampaigns.map(campaign => (
          <View key={campaign.id} style={styles.campaignCard}>
            <Image 
              source={{ uri: campaign.image }}
              style={styles.campaignImage}
            />
            
            <View style={styles.campaignContent}>
              <Text style={styles.campaignTitle}>{campaign.title}</Text>
              <Text style={styles.campaignDate}>{campaign.createdAt}</Text>
              
              {/* Analytics Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{campaign.stats.views}</Text>
                  <Text style={styles.statLabel}>Views</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{campaign.stats.interests}</Text>
                  <Text style={styles.statLabel}>Interests</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{campaign.stats.matches}</Text>
                  <Text style={styles.statLabel}>Matches</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>
                    {campaign.currentRaised} raised
                  </Text>
                  <Text style={styles.progressGoal}>
                    of {campaign.fundingGoal}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  {/* Calculate percentage */}
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${
                          (parseFloat(campaign.currentRaised.replace(/[^0-9]/g, '')) / 
                           parseFloat(campaign.fundingGoal.replace(/[^0-9]/g, ''))) * 100
                        }%` 
                      }
                    ]} 
                  />
                </View>
              </View>
              
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };
  
  // ========== MAIN RENDER ==========
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <Text style={styles.headerSubtitle}>
          {userRole === 'investor' 
            ? 'Discover fundraising opportunities'
            : 'Your campaigns and performance'
          }
        </Text>
      </View>
      
      {/* ROLE-BASED CONTENT */}
      {userRole === 'investor' ? (
        // INVESTOR VIEW: Swipeable cards
        <View style={styles.swipeContainer}>
          {currentIndex >= mockCampaigns.length ? (
            // All cards swiped - show end message
            <View style={styles.endState}>
              <Text style={styles.endStateTitle}>That's all for now! 🎉</Text>
              <Text style={styles.endStateText}>
                Check back later for more fundraising campaigns
              </Text>
            </View>
          ) : (
            // Render stack of cards
            mockCampaigns.map((campaign, index) => 
              renderSwipeCard(campaign, index)
            ).reverse()  // Reverse so top card renders last (appears on top)
          )}
        </View>
      ) : (
        // STARTUP VIEW: Campaign list with analytics
        renderStartupCampaigns()
      )}
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
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
  
  // SWIPE CARD STYLES
  swipeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeCard: {
    width: SCREEN_WIDTH - 40,
    height: 500,
    backgroundColor: 'white',
    borderRadius: 20,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  cardInfo: {
    padding: 16,
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardStartup: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  viewDetailsButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // LIKE/NOPE LABELS
  likeLabel: {
    position: 'absolute',
    top: 50,
    left: 40,
    borderWidth: 5,
    borderColor: '#4CAF50',
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: '-30deg' }],
  },
  likeLabelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    right: 40,
    borderWidth: 5,
    borderColor: '#F44336',
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: '30deg' }],
  },
  nopeLabelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F44336',
  },
  
  // END STATE
  endState: {
    alignItems: 'center',
    padding: 40,
  },
  endStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  endStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  
  // STARTUP VIEW STYLES
  scrollView: {
    flex: 1,
  },
  createCampaignButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createCampaignText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  campaignCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
  },
  campaignContent: {
    padding: 16,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  campaignDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressGoal: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
