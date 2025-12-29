import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../supabaseClient';

interface Startup {
  id: string;
  company_name: string;
  tagline?: string;
  description?: string;
  location?: string;
  industry?: string;
  website?: string;
  founded_year?: number;
  team_size?: number;
  business_model?: string;
  target_market?: string;
  founder_name?: string;
  current_revenue?: number;
  funding_stage?: string;
}

export default function StartupDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { startupId } = route.params as { startupId: string };

  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStartup();
  }, [startupId]);

  const loadStartup = async () => {
    try {
      const { data, error } = await supabase
        .from('startups')
        .select('id, company_name, tagline, description, location, industry, website, founded_year, team_size, business_model, target_market, founder_name, current_revenue, funding_stage')
        .eq('id', startupId)
        .single();

      if (error) throw error;
      setStartup(data);
    } catch (error) {
      console.error('Error loading startup:', error);
      Alert.alert('Error', 'Failed to load startup details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const openWebsite = () => {
    if (startup?.website) {
      const url = startup.website.startsWith('http') ? startup.website : `https://${startup.website}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open website');
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!startup) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Startup not found</Text>
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
        <Text style={styles.companyName}>{startup.company_name}</Text>
        {startup.founded_year && (
          <Text style={styles.foundedText}>Founded {startup.founded_year}</Text>
        )}
      </View>

      {/* Tagline */}
      {startup.tagline && (
        <Text style={styles.tagline}>{startup.tagline}</Text>
      )}

      {/* Basic Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.infoGrid}>
          {startup.location && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📍</Text>
              <View>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{startup.location}</Text>
              </View>
            </View>
          )}

          {startup.industry && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🏢</Text>
              <View>
                <Text style={styles.infoLabel}>Industry</Text>
                <Text style={styles.infoValue}>{startup.industry}</Text>
              </View>
            </View>
          )}

          {startup.team_size && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>👥</Text>
              <View>
                <Text style={styles.infoLabel}>Team Size</Text>
                <Text style={styles.infoValue}>{startup.team_size} members</Text>
              </View>
            </View>
          )}

          {startup.funding_stage && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>💼</Text>
              <View>
                <Text style={styles.infoLabel}>Funding Stage</Text>
                <Text style={styles.infoValue}>{startup.funding_stage}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Website Button */}
      {startup.website && (
        <TouchableOpacity style={styles.websiteButton} onPress={openWebsite}>
          <Text style={styles.websiteIcon}>🌐</Text>
          <Text style={styles.websiteText}>Visit Website</Text>
        </TouchableOpacity>
      )}

      {/* Description */}
      {startup.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{startup.description}</Text>
        </View>
      )}

      {/* Business Details */}
      {(startup.business_model || startup.target_market) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          
          {startup.business_model && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Business Model</Text>
              <Text style={styles.detailText}>{startup.business_model}</Text>
            </View>
          )}

          {startup.target_market && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Target Market</Text>
              <Text style={styles.detailText}>{startup.target_market}</Text>
            </View>
          )}
        </View>
      )}

      {/* Founder Info */}
      {startup.founder_name && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leadership</Text>
          <Text style={styles.founderName}>👤 {startup.founder_name}</Text>
        </View>
      )}

      {/* Revenue Info */}
      {startup.current_revenue !== null && startup.current_revenue !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Snapshot</Text>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Current Revenue</Text>
            <Text style={styles.revenueValue}>₹{startup.current_revenue.toLocaleString()}</Text>
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
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  foundedText: {
    fontSize: 14,
    color: '#666',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
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
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  websiteIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  websiteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  detailBlock: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  founderName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  revenueCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
});
