import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

export default function FundraisingCampaignForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as any;
  const editingCampaignId = params?.campaignId as string | undefined;
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');
  const [minInvestment, setMinInvestment] = useState('10000');
  const [maxInvestment, setMaxInvestment] = useState('');
  const [equityOffered, setEquityOffered] = useState('');
  const [campaignType, setCampaignType] = useState('equity');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [businessPlanUrl, setBusinessPlanUrl] = useState('');
  const [teamInfo, setTeamInfo] = useState('');
  const [marketAnalysis, setMarketAnalysis] = useState('');
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState('');
  const [useOfFunds, setUseOfFunds] = useState('');
  const [milestones, setMilestones] = useState('');
  const [risks, setRisks] = useState('');
  const [loading, setLoading] = useState(false);

  const campaignTypes = ['equity', 'debt', 'convertible'];

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !fundingGoal || !equityOffered) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      // First get the startup ID for this user
      const { data: startupData, error: startupError } = await supabase
        .from('startups')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (startupError || !startupData) {
        throw new Error('No startup profile found. Please create a startup profile first.');
      }

      if (editingCampaignId) {
        const { error } = await supabase.from('fundraising_campaigns').update({
          title,
          description,
          funding_goal: parseFloat(fundingGoal),
          min_investment: parseFloat(minInvestment) || 10000,
          max_investment: maxInvestment ? parseFloat(maxInvestment) : null,
          equity_offered: parseFloat(equityOffered),
          campaign_type: campaignType,
          start_date: startDate || null,
          end_date: endDate || null,
          pitch_deck_url: pitchDeckUrl,
          business_plan_url: businessPlanUrl,
          team_info: teamInfo,
          market_analysis: marketAnalysis,
          competitive_advantage: competitiveAdvantage,
          use_of_funds: useOfFunds,
          milestones: milestones,
          risks: risks,
        }).eq('id', editingCampaignId);

        if (error) throw error;

        Alert.alert('Success', 'Fundraising campaign updated successfully!');
        navigation.goBack();
      } else {
        const { error } = await supabase.from('fundraising_campaigns').insert({
        startup_id: startupData.id,
        title,
        description,
        funding_goal: parseFloat(fundingGoal),
        min_investment: parseFloat(minInvestment) || 10000,
        max_investment: maxInvestment ? parseFloat(maxInvestment) : null,
        equity_offered: parseFloat(equityOffered),
        campaign_type: campaignType,
        start_date: startDate || null,
        end_date: endDate || null,
        pitch_deck_url: pitchDeckUrl,
        business_plan_url: businessPlanUrl,
        team_info: teamInfo,
        market_analysis: marketAnalysis,
        competitive_advantage: competitiveAdvantage,
        use_of_funds: useOfFunds,
        milestones: milestones,
        risks: risks,
        status: 'draft'
      });
        if (error) throw error;

        Alert.alert('Success', 'Fundraising campaign created successfully!');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      Alert.alert('Error', error.message || 'Failed to create fundraising campaign');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadForEdit() {
      if (!editingCampaignId) return;
      try {
        const { data, error } = await supabase
          .from('fundraising_campaigns')
          .select('*')
          .eq('id', editingCampaignId)
          .single();

        if (error || !data) return;

        setTitle(data.title || '');
        setDescription(data.description || '');
        setFundingGoal(String(data.funding_goal || ''));
        setMinInvestment(String(data.min_investment || '10000'));
        setMaxInvestment(data.max_investment ? String(data.max_investment) : '');
        setEquityOffered(String(data.equity_offered || ''));
        setCampaignType(data.campaign_type || 'equity');
        setStartDate(data.start_date || '');
        setEndDate(data.end_date || '');
        setPitchDeckUrl(data.pitch_deck_url || '');
        setBusinessPlanUrl(data.business_plan_url || '');
        setTeamInfo(data.team_info || '');
        setMarketAnalysis(data.market_analysis || '');
        setCompetitiveAdvantage(data.competitive_advantage || '');
        setUseOfFunds(data.use_of_funds || '');
        setMilestones(data.milestones || '');
        setRisks(data.risks || '');
      } catch (err) {
        console.error('Error loading campaign for edit:', err);
      }
    }

    loadForEdit();
  }, [editingCampaignId]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Fundraising Campaign</Text>

      {/* Basic Information */}
      <Text style={styles.sectionTitle}>Basic Information</Text>

      <Text style={styles.label}>Campaign Title *</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Enter campaign title"
        style={styles.input}
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Describe your campaign and what you're raising funds for..."
        multiline
        numberOfLines={4}
        style={[styles.input, styles.textArea]}
      />

      {/* Funding Details */}
      <Text style={styles.sectionTitle}>Funding Details</Text>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Funding Goal (₹) *</Text>
          <TextInput
            value={fundingGoal}
            onChangeText={setFundingGoal}
            placeholder="1000000"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Equity Offered (%) *</Text>
          <TextInput
            value={equityOffered}
            onChangeText={setEquityOffered}
            placeholder="10"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      </View>

      <Text style={styles.label}>Campaign Type</Text>
      <View style={styles.chipContainer}>
        {campaignTypes.map(type => (
          <TouchableOpacity
            key={type}
            onPress={() => setCampaignType(type)}
            style={[styles.chip, campaignType === type && styles.chipSelected]}
          >
            <Text style={[styles.chipText, campaignType === type && styles.chipTextSelected]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Min Investment (₹)</Text>
          <TextInput
            value={minInvestment}
            onChangeText={setMinInvestment}
            placeholder="10000"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Max Investment (₹)</Text>
          <TextInput
            value={maxInvestment}
            onChangeText={setMaxInvestment}
            placeholder="500000"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      </View>

      {/* Campaign Dates */}
      <Text style={styles.sectionTitle}>Campaign Timeline</Text>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Start Date</Text>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2025-01-01"
            style={styles.input}
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>End Date</Text>
          <TextInput
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2025-03-01"
            style={styles.input}
          />
        </View>
      </View>

      {/* Documents */}
      <Text style={styles.sectionTitle}>Documents</Text>

      <Text style={styles.label}>Pitch Deck URL</Text>
      <TextInput
        value={pitchDeckUrl}
        onChangeText={setPitchDeckUrl}
        placeholder="https://drive.google.com/..."
        keyboardType="url"
        autoCapitalize="none"
        style={styles.input}
      />

      <Text style={styles.label}>Business Plan URL</Text>
      <TextInput
        value={businessPlanUrl}
        onChangeText={setBusinessPlanUrl}
        placeholder="https://drive.google.com/..."
        keyboardType="url"
        autoCapitalize="none"
        style={styles.input}
      />

      {/* Business Details */}
      <Text style={styles.sectionTitle}>Business Details</Text>

      <Text style={styles.label}>Team Information</Text>
      <TextInput
        value={teamInfo}
        onChangeText={setTeamInfo}
        placeholder="Describe your team, experience, and key members..."
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]}
      />

      <Text style={styles.label}>Market Analysis</Text>
      <TextInput
        value={marketAnalysis}
        onChangeText={setMarketAnalysis}
        placeholder="Market size, target customers, growth potential..."
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]}
      />

      <Text style={styles.label}>Competitive Advantage</Text>
      <TextInput
        value={competitiveAdvantage}
        onChangeText={setCompetitiveAdvantage}
        placeholder="What makes your startup unique?"
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]}
      />

      <Text style={styles.label}>Use of Funds</Text>
      <TextInput
        value={useOfFunds}
        onChangeText={setUseOfFunds}
        placeholder="How will you use the raised funds?"
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]}
      />

      <Text style={styles.label}>Milestones</Text>
      <TextInput
        value={milestones}
        onChangeText={setMilestones}
        placeholder="Key milestones achieved and planned..."
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]}
      />

      <Text style={styles.label}>Risks</Text>
      <TextInput
        value={risks}
        onChangeText={setRisks}
        placeholder="Potential risks and mitigation strategies..."
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]}
      />

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Creating..." : "Create Campaign"}
          onPress={handleSave}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#007bff',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#007bff',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});