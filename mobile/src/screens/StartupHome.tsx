import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Platform, ActionSheetIOS } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { mockCampaigns } from '../data/mockCampaigns';
import SimpleDropdown from '../components/SimpleDropdown';

interface Investor {
  id: string;
  investor_name?: string;
  company_name?: string;
  location?: string;
  min_investment?: number;
  max_investment?: number;
  interested_industries?: string;
  linkedin_url?: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  funding_goal: number;
  funding_raised: number;
  status: string;
  created_at: string;
  equity_offered: number;
  campaign_type: string;
}

export default function StartupHome() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [dbCampaigns, setDbCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'investors' | 'campaigns'>('investors');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [campaignScope, setCampaignScope] = useState<'mine' | 'others'>('mine');

  useEffect(() => {
    loadInvestors();
    loadCampaigns();
  }, []);

  const loadInvestors = async () => {
    try {
      const { data, error } = await supabase
        .from('investors')
        .select('id, investor_name, company_name, location, min_investment, max_investment, interested_industries, linkedin_url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestors(data || []);
    } catch (error) {
      console.error('Error loading investors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    if (!user?.id) return;

    try {
      // Get startup ID for this user
      const { data: startupData } = await supabase
        .from('startups')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!startupData) {
        setDbCampaigns([]);
        return;
      }

      // Load campaigns from DB
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .select('*')
        .eq('startup_id', startupData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDbCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const filteredInvestors = investors.filter(investor => {
    const query = searchQuery.toLowerCase();
    return (
      investor.investor_name?.toLowerCase().includes(query) ||
      investor.company_name?.toLowerCase().includes(query) ||
      investor.interested_industries?.toLowerCase().includes(query) ||
      investor.location?.toLowerCase().includes(query)
    );
  });

  const formatInvestmentRange = (min?: number, max?: number) => {
    if (!min && !max) return 'Range not specified';
    if (!max) return `₹${min.toLocaleString()}+`;
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'draft': return '#ffc107';
      case 'paused': return '#fd7e14';
      case 'completed': return '#20c997';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('fundraising_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;
      // Refresh list
      await loadCampaigns();
    } catch (err) {
      console.error('Error updating campaign status:', err);
      Alert.alert('Error', 'Failed to update campaign status');
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
          if (buttonIndex === 0) (navigation as any).navigate('StartupProfileForm');
          else if (buttonIndex === 1) (navigation as any).navigate('Settings');
        }
      );
    } else {
      Alert.alert('Profile', 'Choose an option', [
        { text: 'Edit Profile', onPress: () => (navigation as any).navigate('StartupProfileForm') },
        { text: 'Settings', onPress: () => (navigation as any).navigate('Settings') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Investors</Text>
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
          placeholder="Search by name, company, or industry..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs: Investors / Campaigns */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'investors' && styles.tabActive]}
          onPress={() => setActiveTab('investors')}
        >
          <Text style={[styles.tabText, activeTab === 'investors' && styles.tabTextActive]}>💼 Investors</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'campaigns' && styles.tabActive]}
          onPress={() => setActiveTab('campaigns')}
        >
          <Text style={[styles.tabText, activeTab === 'campaigns' && styles.tabTextActive]}>📊 Campaigns</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={styles.content}>
        {activeTab === 'campaigns' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 My Fundraising Campaigns</Text>

            {/* Filters + Dashboard Button */}
            <View style={{ marginBottom: 12 }}>
              <SimpleDropdown
                options={[ 'All', ...Array.from(new Set(mockCampaigns.map(c => c.industry))) ]}
                value={industryFilter}
                onChange={setIndustryFilter}
              />
              <TouchableOpacity
                style={[styles.viewAllButton, { marginTop: 8 }]}
                onPress={() => (navigation as any).navigate('FundraisingDashboard')}
              >
                <Text style={styles.viewAllText}>View Full Fundraising Dashboard →</Text>
              </TouchableOpacity>
            </View>

            {/* Scope Toggle: My campaigns / Other campaigns */}
            <View style={styles.scopeToggleWrap}>
              <TouchableOpacity
                style={[styles.scopeButton, campaignScope === 'mine' && styles.scopeButtonActive]}
                onPress={() => setCampaignScope('mine')}
              >
                <Text style={[styles.scopeText, campaignScope === 'mine' && styles.scopeTextActive]}>My Campaigns</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scopeButton, campaignScope === 'others' && styles.scopeButtonActive]}
                onPress={() => setCampaignScope('others')}
              >
                <Text style={[styles.scopeText, campaignScope === 'others' && styles.scopeTextActive]}>Other Campaigns</Text>
              </TouchableOpacity>
            </View>

            {/* Campaign list based on selected scope */}
            {campaignScope === 'mine' ? (
              <>
                <Text style={styles.dataSourceLabel}>🔴 Live Campaigns (Database)</Text>
                {dbCampaigns.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No campaigns in database yet</Text>
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={() => (navigation as any).navigate('FundraisingCampaignForm')}
                    >
                      <Text style={styles.createButtonText}>+ Create First Campaign</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  dbCampaigns.map((campaign) => (
                    <TouchableOpacity
                      key={campaign.id}
                      style={styles.campaignCard}
                      onPress={() => (navigation as any).navigate('FundraisingCampaignDetail', { campaignId: campaign.id })}
                    >
                      <View style={styles.campaignHeader}>
                        <Text style={styles.campaignTitle}>{campaign.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) }]}>
                          <Text style={styles.statusText}>{campaign.status.toUpperCase()}</Text>
                        </View>
                      </View>

                      <Text style={styles.campaignDescription} numberOfLines={2}>
                        {campaign.description}
                      </Text>

                      <View style={styles.campaignStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Goal</Text>
                          <Text style={styles.statValue}>₹{campaign.funding_goal.toLocaleString()}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Raised</Text>
                          <Text style={styles.statValue}>₹{campaign.funding_raised.toLocaleString()}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Progress</Text>
                          <Text style={styles.statValue}>
                            {getProgressPercentage(campaign.funding_raised, campaign.funding_goal).toFixed(0)}%
                          </Text>
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
                      <View style={styles.actionButtons}>
                        {campaign.status === 'draft' && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.activateButton]}
                            onPress={() => updateCampaignStatus(campaign.id, 'active')}
                          >
                            <Text style={styles.actionButtonText}>Activate</Text>
                          </TouchableOpacity>
                        )}

                        {campaign.status === 'active' && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.pauseButton]}
                            onPress={() => updateCampaignStatus(campaign.id, 'paused')}
                          >
                            <Text style={styles.actionButtonText}>Pause</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[styles.actionButton, styles.viewButton]}
                          onPress={() => (navigation as any).navigate('FundraisingCampaignDetail', { campaignId: campaign.id })}
                        >
                          <Text style={styles.actionButtonText}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              <>
                <Text style={[styles.dataSourceLabel, { marginTop: 4 }]}>🟢 Other Campaigns</Text>
                {mockCampaigns
                  .filter(c => industryFilter === 'All' ? true : c.industry === industryFilter)
                  .map((campaign) => (
                  <TouchableOpacity
                    key={campaign.id}
                    style={[styles.campaignCard, styles.mockCampaignCard]}
                    onPress={() => (navigation as any).navigate('FundraisingCampaignDetail', { mockCampaign: campaign, isMock: true })}
                  >
                    <View style={styles.campaignHeader}>
                      <Text style={styles.campaignTitle}>{campaign.title}</Text>
                      <View style={styles.mockBadge}>
                        <Text style={styles.mockBadgeText}>MOCK</Text>
                      </View>
                    </View>

                    <Text style={styles.campaignDescription} numberOfLines={2}>
                      {campaign.description}
                    </Text>

                    <View style={styles.campaignStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Goal</Text>
                        <Text style={styles.statValue}>{campaign.fundingGoal}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Raised</Text>
                        <Text style={styles.statValue}>{campaign.currentRaised}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Views</Text>
                        <Text style={styles.statValue}>{campaign.stats.views}</Text>
                      </View>
                    </View>

                    <View style={styles.mockStats}>
                      <Text style={styles.mockStatText}>👀 {campaign.stats.views} views</Text>
                      <Text style={styles.mockStatText}>❤️ {campaign.stats.interests} interests</Text>
                      <Text style={styles.mockStatText}>🤝 {campaign.stats.matches} matches</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

        {activeTab === 'investors' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💼 Discover Investors</Text>

            {loading ? (
              <Text style={styles.loadingText}>Loading investors...</Text>
            ) : filteredInvestors.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Investors Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Try adjusting your search' : 'No investors are registered yet'}
                </Text>
              </View>
            ) : (
              <View style={styles.investorsList}>
                {filteredInvestors.map((investor) => (
                  <TouchableOpacity
                    key={investor.id}
                    style={styles.investorCard}
                    onPress={() => (navigation as any).navigate('InvestorDetail', { investorId: investor.id })}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.investorName}>{investor.investor_name || 'Anonymous Investor'}</Text>
                    </View>

                    {investor.company_name && (
                      <Text style={styles.companyName}>
                        {investor.company_name}
                      </Text>
                    )}

                    <View style={styles.cardDetails}>
                      {investor.location && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailIcon}>📍</Text>
                          <Text style={styles.detailText}>{investor.location}</Text>
                        </View>
                      )}

                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>💰</Text>
                        <Text style={styles.detailText}>
                          {formatInvestmentRange(investor.min_investment, investor.max_investment)}
                        </Text>
                      </View>

                      {investor.interested_industries && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailIcon}>🏢</Text>
                          <Text style={styles.detailText} numberOfLines={1}>
                            {investor.interested_industries.split(',').slice(0, 2).join(', ')}
                          </Text>
                        </View>
                      )}

                      {investor.linkedin_url && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailIcon}>🔗</Text>
                          <Text style={styles.detailText} numberOfLines={1}>
                            LinkedIn Profile
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
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#333',
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activateButton: {
    backgroundColor: '#28a745',
  },
  pauseButton: {
    backgroundColor: '#fd7e14',
  },
  viewButton: {
    backgroundColor: '#007bff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
    color: '#999',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  campaignTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
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
  campaignDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  campaignStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 4,
  },
  mockStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  mockStatText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
  content: {
    flex: 1,
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
  investorsList: {
    padding: 16,
  },
  investorCard: {
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
    marginBottom: 4,
  },
  investorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
