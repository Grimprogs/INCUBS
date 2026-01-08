import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Platform, ActionSheetIOS } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { mockCampaigns } from '../data/mockCampaigns';

interface Startup {
  id: string;
  company_name: string;
  tagline?: string;
  location?: string;
  industry?: string;
  website?: string;
  founded_year?: number;
}

interface DbCampaign {
  id: string;
  title: string;
  description: string;
  funding_goal: number;
  funding_raised: number;
  equity_offered: number;
  campaign_type: string;
  min_investment: number;
  max_investment?: number;
  status: string;
  startups: {
    company_name: string;
    industry: string;
  };
}

export default function InvestorHome() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [dbCampaigns, setDbCampaigns] = useState<DbCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'explore' | 'startups' | 'saved'>('explore');

  useEffect(() => {
    loadStartups();
    loadCampaigns();
  }, []);

  const loadStartups = async () => {
    try {
      const { data, error } = await supabase
        .from('startups')
        .select('id, company_name, tagline, location, industry, website, founded_year')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStartups(data || []);
    } catch (error) {
      console.error('Error loading startups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .select(`
          *,
          startups (
            company_name,
            industry
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDbCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const filteredStartups = startups.filter(startup => {
    const query = searchQuery.toLowerCase();
    return (
      startup.company_name.toLowerCase().includes(query) ||
      startup.industry?.toLowerCase().includes(query) ||
      startup.location?.toLowerCase().includes(query)
    );
  });

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const expressInterest = async (campaignId: string, campaignTitle: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to express interest');
      return;
    }

    try {
      // Get investor profile
      const { data: investorData } = await supabase
        .from('investors')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!investorData) {
        Alert.alert('Error', 'Please complete your investor profile first');
        return;
      }

      // Check if already expressed interest
      const { data: existing } = await supabase
        .from('campaign_interests')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('investor_id', investorData.id)
        .single();

      if (existing) {
        Alert.alert('Already Interested', 'You have already expressed interest in this campaign');
        return;
      }

      const { error } = await supabase.from('campaign_interests').insert({
        campaign_id: campaignId,
        investor_id: investorData.id,
        interest_level: 'interested',
        status: 'pending'
      });

      if (error) throw error;

      Alert.alert('Success', `Interest expressed in "${campaignTitle}"`);
    } catch (error) {
      console.error('Error expressing interest:', error);
      Alert.alert('Error', 'Failed to express interest');
    }
  };

  const showProfileOptions = () => {
    const options = ['Edit Profile', 'Settings', 'Cancel'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) (navigation as any).navigate('InvestorProfileForm');
          else if (buttonIndex === 1) (navigation as any).navigate('Settings');
        }
      );
    } else {
      Alert.alert('Profile', 'Choose an option', [
        { text: 'Edit Profile', onPress: () => (navigation as any).navigate('InvestorProfileForm') },
        { text: 'Settings', onPress: () => (navigation as any).navigate('Settings') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Startups</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={showProfileOptions}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={signOut}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search campaigns, startups..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'explore' && styles.tabActive]}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={[styles.tabText, activeTab === 'explore' && styles.tabTextActive]}>
            🎯 Explore
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'startups' && styles.tabActive]}
          onPress={() => setActiveTab('startups')}
        >
          <Text style={[styles.tabText, activeTab === 'startups' && styles.tabTextActive]}>
            🚀 Startups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            💾 Saved
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      <ScrollView style={styles.content}>
        {activeTab === 'explore' && (
          <View style={styles.exploreContent}>
            {/* Live Campaigns from Database */}
            <Text style={styles.dataSourceLabel}>🔴 Live Campaigns (Database)</Text>
            {dbCampaigns.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No active campaigns in database yet</Text>
              </View>
            ) : (
              dbCampaigns.map((campaign) => (
                <TouchableOpacity
                  key={campaign.id}
                  style={styles.campaignCard}
                  onPress={() => (navigation as any).navigate('FundraisingCampaignDetail', { campaignId: campaign.id })}
                >
                  <View style={styles.campaignHeader}>
                    <View style={styles.campaignHeaderLeft}>
                      <Text style={styles.companyName}>{campaign.startups.company_name}</Text>
                      <Text style={styles.industry}>{campaign.startups.industry}</Text>
                    </View>
                    <View style={styles.campaignTypeBadge}>
                      <Text style={styles.campaignTypeText}>{campaign.campaign_type}</Text>
                    </View>
                  </View>

                  <Text style={styles.campaignTitle}>{campaign.title}</Text>
                  <Text style={styles.campaignDescription} numberOfLines={3}>
                    {campaign.description}
                  </Text>

                  <View style={styles.campaignStats}>
                    <View style={styles.statColumn}>
                      <Text style={styles.statLabel}>Goal</Text>
                      <Text style={styles.statValue}>₹{campaign.funding_goal.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statColumn}>
                      <Text style={styles.statLabel}>Raised</Text>
                      <Text style={styles.statValue}>₹{campaign.funding_raised.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statColumn}>
                      <Text style={styles.statLabel}>Min Investment</Text>
                      <Text style={styles.statValue}>₹{campaign.min_investment.toLocaleString()}</Text>
                    </View>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${getProgressPercentage(campaign.funding_raised, campaign.funding_goal)}%` }
                      ]}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.interestButton}
                    onPress={() => expressInterest(campaign.id, campaign.title)}
                  >
                    <Text style={styles.interestButtonText}>❤️ Express Interest</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}

            {/* Mock Campaigns */}
            <Text style={[styles.dataSourceLabel, { marginTop: 24 }]}>🟢 Mock Campaigns (Test Data)</Text>
            {mockCampaigns.map((campaign) => (
              <View key={campaign.id} style={[styles.campaignCard, styles.mockCampaignCard]}>
                <View style={styles.campaignHeader}>
                  <View style={styles.campaignHeaderLeft}>
                    <Text style={styles.companyName}>{campaign.startupName}</Text>
                    <Text style={styles.industry}>{campaign.industry}</Text>
                  </View>
                  <View style={styles.mockBadge}>
                    <Text style={styles.mockBadgeText}>MOCK</Text>
                  </View>
                </View>

                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <Text style={styles.campaignDescription} numberOfLines={3}>
                  {campaign.description}
                </Text>

                <View style={styles.campaignStats}>
                  <View style={styles.statColumn}>
                    <Text style={styles.statLabel}>Goal</Text>
                    <Text style={styles.statValue}>{campaign.fundingGoal}</Text>
                  </View>
                  <View style={styles.statColumn}>
                    <Text style={styles.statLabel}>Raised</Text>
                    <Text style={styles.statValue}>{campaign.currentRaised}</Text>
                  </View>
                  <View style={styles.statColumn}>
                    <Text style={styles.statLabel}>Stage</Text>
                    <Text style={styles.statValue}>{campaign.stage}</Text>
                  </View>
                </View>

                <View style={styles.mockStats}>
                  <Text style={styles.mockStatText}>👀 {campaign.stats.views} views</Text>
                  <Text style={styles.mockStatText}>❤️ {campaign.stats.interests} interests</Text>
                  <Text style={styles.mockStatText}>🤝 {campaign.stats.matches} matches</Text>
                </View>

                <TouchableOpacity
                  style={[styles.interestButton, styles.mockInterestButton]}
                  onPress={() => Alert.alert('Mock Action', 'This is mock data. No action taken.')}
                >
                  <Text style={styles.interestButtonText}>❤️ Express Interest (Mock)</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => (navigation as any).navigate('FundraisingBrowse')}
            >
              <Text style={styles.viewAllText}>Browse All Campaigns →</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'startups' && (
          <View style={styles.startupsContent}>
            <Text style={styles.sectionTitle}>All Startups</Text>
            {loading ? (
              <Text style={styles.loadingText}>Loading startups...</Text>
            ) : filteredStartups.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Startups Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Try adjusting your search' : 'No startups are registered yet'}
                </Text>
              </View>
            ) : (
              <View style={styles.startupsList}>
                {filteredStartups.map((startup) => (
                  <TouchableOpacity
                    key={startup.id}
                    style={styles.startupCard}
                    onPress={() => (navigation as any).navigate('StartupDetail', { startupId: startup.id })}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.companyName}>{startup.company_name}</Text>
                      {startup.founded_year && (
                        <Text style={styles.yearBadge}>{startup.founded_year}</Text>
                      )}
                    </View>

                    {startup.tagline && (
                      <Text style={styles.tagline} numberOfLines={2}>
                        {startup.tagline}
                      </Text>
                    )}

                    <View style={styles.cardDetails}>
                      {startup.industry && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailIcon}>🏢</Text>
                          <Text style={styles.detailText} numberOfLines={1}>
                            {startup.industry.split(',')[0]}
                          </Text>
                        </View>
                      )}

                      {startup.location && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailIcon}>📍</Text>
                          <Text style={styles.detailText}>{startup.location}</Text>
                        </View>
                      )}

                      {startup.website && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailIcon}>🌐</Text>
                          <Text style={styles.detailText} numberOfLines={1}>
                            {startup.website}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.viewDetailsButton}>
                      <Text style={styles.viewDetailsText}>View Details →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'saved' && (
          <View style={styles.savedContent}>
            <Text style={styles.emptyTitle}>Saved Items</Text>
            <Text style={styles.emptyText}>
              Your saved campaigns and startups will appear here.
            </Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: 8,
  },
  profileIcon: {
    fontSize: 24,
  },
  logoutButton: {
    padding: 8,
    marginLeft: 4,
  },
  logoutIcon: {
    fontSize: 24,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007bff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  exploreContent: {
    padding: 16,
  },
  startupsContent: {
    padding: 16,
  },
  savedContent: {
    padding: 40,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dataSourceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#f9f9f9',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  campaignCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mockCampaignCard: {
    borderColor: '#28a745',
    borderWidth: 2,
    backgroundColor: '#f8fff9',
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  campaignHeaderLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  industry: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  campaignTypeBadge: {
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  campaignTypeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  mockBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mockBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 8,
  },
  campaignDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  campaignStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statColumn: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 4,
  },
  mockStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  mockStatText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  interestButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mockInterestButton: {
    backgroundColor: '#28a745',
  },
  interestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  startupsList: {
    marginTop: 8,
  },
  startupCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  yearBadge: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  viewDetailsButton: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
});
