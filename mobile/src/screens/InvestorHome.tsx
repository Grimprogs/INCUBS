import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Platform, ActionSheetIOS } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

interface Startup {
  id: string;
  company_name: string;
  tagline?: string;
  location?: string;
  industry?: string;
  website?: string;
  founded_year?: number;
}

export default function InvestorHome() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStartups();
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

  const filteredStartups = startups.filter(startup => {
    const query = searchQuery.toLowerCase();
    return (
      startup.company_name.toLowerCase().includes(query) ||
      startup.industry?.toLowerCase().includes(query) ||
      startup.location?.toLowerCase().includes(query)
    );
  });

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
          placeholder="Search by name, industry, or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Startups List */}
      <ScrollView style={styles.content}>
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
  startupsList: {
    padding: 16,
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
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
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
