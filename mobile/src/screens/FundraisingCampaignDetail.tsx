import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
  business_model: string;
  market_size: string;
  competitive_advantage: string;
  use_of_funds: string;
  pitch_deck_url?: string;
  financial_projections_url?: string;
  business_plan_url?: string;
  created_at: string;
  startups: {
    company_name: string;
    industry: string;
    location: string;
    founded_year: number;
    team_size: number;
    website?: string;
    linkedin?: string;
  };
}

export default function FundraisingCampaignDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const params = route.params as any;
  const campaignId = params?.campaignId as string | undefined;
  const isMock = params?.isMock === true;
  const mockCampaign = params?.mockCampaign;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [interestModalVisible, setInterestModalVisible] = useState(false);
  const [proposedInvestment, setProposedInvestment] = useState('');
  const [interestLevel, setInterestLevel] = useState('interested');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isMock && mockCampaign) {
      // Map mock campaign shape to the expected DB campaign shape
      const parsedGoal = parseCurrency(mockCampaign.fundingGoal);
      const parsedRaised = parseCurrency(mockCampaign.currentRaised);

      const mapped: any = {
        id: mockCampaign.id,
        title: mockCampaign.title,
        description: mockCampaign.description,
        funding_goal: parsedGoal,
        funding_raised: parsedRaised,
        equity_offered: 0,
        campaign_type: mockCampaign.stage || 'seed',
        min_investment: 0,
        max_investment: null,
        business_model: '',
        market_size: '',
        competitive_advantage: '',
        use_of_funds: '',
        pitch_deck_url: null,
        financial_projections_url: null,
        business_plan_url: null,
        created_at: mockCampaign.createdAt,
        startups: {
          company_name: mockCampaign.startupName,
          industry: mockCampaign.industry,
          location: 'N/A',
          founded_year: 0,
          team_size: 0,
        }
      };

      setCampaign(mapped as Campaign);
      setLoading(false);
      return;
    }

    loadCampaign();
  }, [campaignId, isMock, mockCampaign]);

  function parseCurrency(str: string) {
    if (!str) return 0;
    const s = String(str).trim();
    const num = parseFloat(s.replace(/[^0-9\.KMkm]/g, '')) || 0;
    if (/K/i.test(s)) return Math.round(num * 1000);
    if (/M/i.test(s)) return Math.round(num * 1000000);
    return Math.round(num);
  }

  const loadCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .select(`
          *,
          startups (*)
        `)
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (error) {
      console.error('Error loading campaign:', error);
      Alert.alert('Error', 'Failed to load campaign details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const submitInterest = async () => {
    if (!user?.id || !campaign) return;

    const investmentAmount = parseFloat(proposedInvestment);
    if (!investmentAmount || investmentAmount < campaign.min_investment) {
      Alert.alert('Invalid Amount', `Minimum investment is ₹${campaign.min_investment.toLocaleString()}`);
      return;
    }

    if (campaign.max_investment && investmentAmount > campaign.max_investment) {
      Alert.alert('Invalid Amount', `Maximum investment is ₹${campaign.max_investment.toLocaleString()}`);
      return;
    }

    setSubmitting(true);
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
        interest_level: interestLevel,
        proposed_investment: investmentAmount,
        status: 'pending'
      });

      if (error) throw error;

      Alert.alert('Success', 'Interest submitted successfully! The startup will be notified.');
      setInterestModalVisible(false);
      setProposedInvestment('');
    } catch (error) {
      console.error('Error submitting interest:', error);
      Alert.alert('Error', 'Failed to submit interest');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const interestLevels = [
    { key: 'interested', label: 'Interested' },
    { key: 'very_interested', label: 'Very Interested' },
    { key: 'ready_to_invest', label: 'Ready to Invest' }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading campaign details...</Text>
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Campaign not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{campaign.startups?.company_name}</Text>
          <Text style={styles.campaignTitle}>{campaign.title}</Text>
          <View style={styles.campaignType}>
            <Text style={styles.typeText}>{campaign.campaign_type.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressStats}>
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
      </View>

      {/* Investment Range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Investment Details</Text>
        <Text style={styles.rangeText}>
          Investment Range: ₹{campaign.min_investment.toLocaleString()}
          {campaign.max_investment ? ` - ₹${campaign.max_investment.toLocaleString()}` : '+'}
        </Text>
      </View>

      {/* Company Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About the Company</Text>
        <View style={styles.companyDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Industry:</Text>
            <Text style={styles.detailValue}>{campaign.startups?.industry}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{campaign.startups?.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Founded:</Text>
            <Text style={styles.detailValue}>{campaign.startups?.founded_year}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Team Size:</Text>
            <Text style={styles.detailValue}>{campaign.startups?.team_size} members</Text>
          </View>
          {campaign.startups?.website && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Website:</Text>
              <Text style={styles.detailValue}>{campaign.startups?.website}</Text>
            </View>
          )}
          {(campaign.startups?.linkedin) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>LinkedIn:</Text>
              <Text style={styles.detailValue}>{campaign.startups?.linkedin}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Campaign Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Campaign Description</Text>
        <Text style={styles.description}>{campaign.description}</Text>
      </View>

      {/* Business Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Details</Text>
        <View style={styles.businessDetails}>
          <View style={styles.detailBlock}>
            <Text style={styles.detailBlockTitle}>Business Model</Text>
            <Text style={styles.detailBlockText}>{campaign.business_model}</Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailBlockTitle}>Market Size</Text>
            <Text style={styles.detailBlockText}>{campaign.market_size}</Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailBlockTitle}>Competitive Advantage</Text>
            <Text style={styles.detailBlockText}>{campaign.competitive_advantage}</Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailBlockTitle}>Use of Funds</Text>
            <Text style={styles.detailBlockText}>{campaign.use_of_funds}</Text>
          </View>
        </View>
      </View>

      {/* Documents */}
      {(campaign.pitch_deck_url || campaign.financial_projections_url || campaign.business_plan_url) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.documentsList}>
            {campaign.pitch_deck_url && (
              <TouchableOpacity style={styles.documentLink}>
                <Text style={styles.documentText}>📊 Pitch Deck</Text>
              </TouchableOpacity>
            )}
            {campaign.financial_projections_url && (
              <TouchableOpacity style={styles.documentLink}>
                <Text style={styles.documentText}>📈 Financial Projections</Text>
              </TouchableOpacity>
            )}
            {campaign.business_plan_url && (
              <TouchableOpacity style={styles.documentLink}>
                <Text style={styles.documentText}>📋 Business Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Action Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.interestButton}
          onPress={() => setInterestModalVisible(true)}
        >
          <Text style={styles.interestButtonText}>Express Interest</Text>
        </TouchableOpacity>
      </View>

      {/* Interest Modal */}
      <Modal
        visible={interestModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInterestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Express Interest</Text>

            <Text style={styles.modalLabel}>Interest Level</Text>
            <View style={styles.interestLevelContainer}>
              {interestLevels.map(level => (
                <TouchableOpacity
                  key={level.key}
                  style={[
                    styles.interestLevelButton,
                    interestLevel === level.key && styles.interestLevelButtonActive
                  ]}
                  onPress={() => setInterestLevel(level.key)}
                >
                  <Text style={[
                    styles.interestLevelText,
                    interestLevel === level.key && styles.interestLevelTextActive
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Proposed Investment Amount (₹)</Text>
            <TextInput
              style={styles.investmentInput}
              value={proposedInvestment}
              onChangeText={setProposedInvestment}
              placeholder={`Minimum: ₹${campaign.min_investment.toLocaleString()}`}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setInterestModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitInterest}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Submitting...' : 'Submit Interest'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  companyInfo: {
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  campaignTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  campaignType: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
  },
  typeText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  progressSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  rangeText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  companyDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  businessDetails: {
    marginTop: 8,
  },
  detailBlock: {
    marginBottom: 16,
  },
  detailBlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailBlockText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  documentsList: {
    marginTop: 8,
  },
  documentLink: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
  },
  documentText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  actionSection: {
    marginTop: 20,
  },
  interestButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  interestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  interestLevelContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  interestLevelButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  interestLevelButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  interestLevelText: {
    fontSize: 12,
    color: '#666',
  },
  interestLevelTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  investmentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#28a745',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});