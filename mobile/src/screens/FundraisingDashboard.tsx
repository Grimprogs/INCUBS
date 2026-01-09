import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

interface Campaign {
  id: string;
  title: string;
  funding_goal: number;
  funding_raised: number;
  status: string;
  created_at: string;
  equity_offered: number;
  campaign_type: string;
}

export default function FundraisingDashboard() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    if (!user?.id) return;

    try {
      // First get the startup ID for this user
      const { data: startupData } = await supabase
        .from('startups')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!startupData) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .select('*')
        .eq('startup_id', startupData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      Alert.alert('Error', 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('fundraising_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;
      await loadCampaigns();
      Alert.alert('Success', `Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      console.error('Error updating campaign:', error);
      Alert.alert('Error', 'Failed to update campaign status');
    }
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

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fundraising Dashboard</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{campaigns.length}</Text>
          <Text style={styles.statLabel}>Total Campaigns</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {campaigns.filter(c => c.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            ₹{campaigns.reduce((sum, c) => sum + (c.funding_raised || 0), 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Raised</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Create New Campaign"
          onPress={() => (navigation as any).navigate('FundraisingCampaignForm')}
          color="#007bff"
        />
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading campaigns...</Text>
      ) : campaigns.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Fundraising Campaigns</Text>
          <Text style={styles.emptyText}>
            Create your first fundraising campaign to start raising capital for your startup.
          </Text>
        </View>
      ) : (
        <View style={styles.campaignsList}>
          {campaigns.map((campaign) => (
            <View key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) }]}>
                  <Text style={styles.statusText}>{campaign.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.campaignDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Goal:</Text>
                  <Text style={styles.detailValue}>₹{campaign.funding_goal.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Raised:</Text>
                  <Text style={styles.detailValue}>₹{(campaign.funding_raised || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Equity:</Text>
                  <Text style={styles.detailValue}>{campaign.equity_offered}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{campaign.campaign_type}</Text>
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

              {/* Action Buttons */}
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
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => (navigation as any).navigate('FundraisingCampaignForm', { campaignId: campaign.id })}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
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
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    marginBottom: 20,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  campaignDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activateButton: {
    backgroundColor: '#28a745',
  },
  pauseButton: {
    backgroundColor: '#ffc107',
  },
  viewButton: {
    backgroundColor: '#007bff',
  },
  editButton: {
    backgroundColor: '#6f42c1',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});