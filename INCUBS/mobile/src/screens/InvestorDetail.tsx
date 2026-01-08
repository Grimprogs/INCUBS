import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../supabaseClient';

interface Investor {
  id: string;
  investor_name?: string;
  company_name?: string;
  location?: string;
  bio?: string;
  min_investment?: number;
  max_investment?: number;
  interested_industries?: string;
  investment_stage?: string;
  linkedin_url?: string;
  twitter?: string;
  website?: string;
}

export default function InvestorDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { investorId } = route.params as { investorId: string };

  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvestor();
  }, [investorId]);

  const loadInvestor = async () => {
    try {
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .eq('id', investorId)
        .single();

      if (error) throw error;
      setInvestor(data);
    } catch (error) {
      console.error('Error loading investor:', error);
      Alert.alert('Error', 'Failed to load investor details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url?: string) => {
    if (!url) return;
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const formatInvestmentRange = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (!max) return `₹${min.toLocaleString()}+`;
    if (!min) return `Up to ₹${max.toLocaleString()}`;
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!investor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Investor not found</Text>
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
        <Text style={styles.investorName}>{investor.investor_name || 'Anonymous Investor'}</Text>
        {investor.company_name && (
          <Text style={styles.companyName}>{investor.company_name}</Text>
        )}
      </View>

      {/* Investment Capacity Card */}
      <View style={styles.investmentCard}>
        <Text style={styles.investmentLabel}>Investment Capacity</Text>
        <Text style={styles.investmentValue}>
          {formatInvestmentRange(investor.min_investment, investor.max_investment)}
        </Text>
      </View>

      {/* Basic Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.infoList}>
          {investor.location && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{investor.location}</Text>
              </View>
            </View>
          )}

          {investor.investment_stage && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>💼</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Investment Stage</Text>
                <Text style={styles.infoValue}>{investor.investment_stage}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Industries */}
      {investor.interested_industries && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interested Industries</Text>
          <View style={styles.industriesContainer}>
            {investor.interested_industries.split(',').map((industry, idx) => (
              <View key={idx} style={styles.industryChip}>
                <Text style={styles.industryText}>{industry.trim()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Bio */}
      {investor.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{investor.bio}</Text>
        </View>
      )}

      {/* Social Links */}
      {(investor.linkedin_url || investor.twitter || investor.website) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect</Text>
          <View style={styles.linksContainer}>
            {investor.linkedin_url && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => openLink(investor.linkedin_url)}
              >
                <Text style={styles.linkIcon}>🔗</Text>
                <Text style={styles.linkText}>LinkedIn</Text>
              </TouchableOpacity>
            )}

            {investor.twitter && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => openLink(investor.twitter)}
              >
                <Text style={styles.linkIcon}>🐦</Text>
                <Text style={styles.linkText}>Twitter</Text>
              </TouchableOpacity>
            )}

            {investor.website && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => openLink(investor.website)}
              >
                <Text style={styles.linkIcon}>🌐</Text>
                <Text style={styles.linkText}>Website</Text>
              </TouchableOpacity>
            )}
          </View>
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
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  investorName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  investmentCard: {
    backgroundColor: '#28a745',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  investmentLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  investmentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoList: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  industriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  industryChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  industryText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  bio: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  linksContainer: {
    marginTop: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  linkIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
});
