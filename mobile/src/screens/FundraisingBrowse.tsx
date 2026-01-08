import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

interface Campaign {
  id: string;
  title: string;
  description: string;
  funding_goal: number;
  funding_raised: number;
  equity_offered: number;
  campaign_type: string;
  min_investment: number;
  max_investment?: number;
  startups: {
    company_name: string;
    industry: string;
  };
}

export default function FundraisingBrowse() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadCampaigns();
  }, [filter]);

  const loadCampaigns = async () => {
    try {
      let query = supabase
        .from('fundraising_campaigns')
        .select(`
          *,
          startups (
            company_name,
            industry
          )
        `)
        .eq('status', 'active');

      if (filter !== 'all') {
        query = query.eq('campaign_type', filter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      Alert.alert('Error', 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const expressInterest = async (campaignId: string, campaignTitle: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to express interest');
      return;
    }

    try {
      // Check if already expressed interest
      const { data: existing } = await supabase
        .from('campaign_interests')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('investor_id', user.id)
        .single();

      if (existing) {
        Alert.alert('Already Interested', 'You have already expressed interest in this campaign');
        return;
      }

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

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const filterOptions = [
    { key: 'all', label: 'All Campaigns' },
    { key: 'equity', label: 'Equity' },
    { key: 'debt', label: 'Debt' },
    { key: 'convertible', label: 'Convertible' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fundraising Campaigns</Text>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[styles.filterTab, filter === option.key && styles.filterTabActive]}
            onPress={() => setFilter(option.key)}
          >
            <Text style={[styles.filterTabText, filter === option.key && styles.filterTabTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading campaigns...</Text>
      ) : campaigns.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Active Campaigns</Text>
          <Text style={styles.emptyText}>
            There are currently no active fundraising campaigns matching your criteria.
          </Text>
        </View>
      ) : (
        <View style={styles.campaignsList}>
          {campaigns.map((campaign) => (
            <View key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{campaign.startups?.company_name || 'Unknown Company'}</Text>
                  <Text style={styles.campaignTitle}>{campaign.title}</Text>
                </View>
                <View style={styles.campaignType}>
                  <Text style={styles.typeText}>{campaign.campaign_type.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={2}>
                {campaign.description}
              </Text>

              <View style={styles.campaignStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Goal</Text>
                  <Text style={styles.statValue}>₹{campaign.funding_goal.toLocaleString()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Raised</Text>
                  <Text style={styles.statValue}>₹{(campaign.funding_raised || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Equity</Text>
                  <Text style={styles.statValue}>{campaign.equity_offered}%</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${getProgressPercentage(campaign.funding_raised || 0, campaign.funding_goal)}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {getProgressPercentage(campaign.funding_raised || 0, campaign.funding_goal).toFixed(1)}% funded
                </Text>
              </View>

              {/* Investment Range */}
              <View style={styles.investmentRange}>
                <Text style={styles.rangeText}>
                  Investment Range: ₹{campaign.min_investment.toLocaleString()}
                  {campaign.max_investment ? ` - ₹${campaign.max_investment.toLocaleString()}` : '+'}
                </Text>
              </View>

              {/* Industries */}
              {campaign.startups?.industry && (
                <View style={styles.industriesContainer}>
                  {campaign.startups.industry.split(',').slice(0, 3).map((industry: string, idx: number) => (
                    <View key={idx} style={styles.industryChip}>
                      <Text style={styles.industryText}>{industry.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.interestButton]}
                  onPress={() => expressInterest(campaign.id, campaign.title)}
                >
                  <Text style={styles.actionButtonText}>Express Interest</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.detailsButton]}
                  onPress={() => (navigation as any).navigate('FundraisingCampaignDetail', { campaignId: campaign.id })}
                >
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterTab: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#007bff',
  },
  filterTabText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  campaignsList: {
    marginTop: 10,
  },
  campaignCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  campaignType: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  campaignStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  investmentRange: {
    marginBottom: 8,
  },
  rangeText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  industriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  industryChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  industryText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  interestButton: {
    backgroundColor: '#28a745',
  },
  detailsButton: {
    backgroundColor: '#007bff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});