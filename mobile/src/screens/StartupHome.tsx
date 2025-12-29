import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Platform, ActionSheetIOS } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

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

export default function StartupHome() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInvestors();
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

      {/* Investors List */}
      <ScrollView style={styles.content}>
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
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
