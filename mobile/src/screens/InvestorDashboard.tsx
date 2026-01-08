// Import React.
import React, { useEffect, useState } from 'react';
// Import UI components.
import { View, Text, Button, ScrollView, StyleSheet, Platform } from 'react-native';
// Import navigation hook.
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

// InvestorDashboard component shows investor info.
export default function InvestorDashboard() {
  // Get navigation to move to other screens.
  const navigation = useNavigation();
  // Read authenticated user from context and signOut function.
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      if (!user.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Try to read an `investors` table row linked to this user.
        const { data, error } = await supabase
          .from('investors')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (!error && data && mounted) setProfile(data as any);
        else setProfile(null);
      } catch (err) {
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [user.id]);

  function onEdit() {
    // @ts-ignore
    navigation.navigate('InvestorProfileForm');
  }

  return (
    <ScrollView
      style={[styles.container, Platform.OS === 'web' ? styles.webScroll : null]}
      contentContainerStyle={[styles.content, Platform.OS === 'web' ? styles.webContent : null]}
    >
      <Text style={styles.title}>Investor Dashboard</Text>

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : profile ? (
        <>
          {/* Profile Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Profile</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{profile.investor_name || '—'}</Text>
            </View>

            {profile.company_name && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Company:</Text>
                <Text style={styles.value}>{profile.company_name}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.label}>Investor Type:</Text>
              <Text style={styles.value}>{profile.investor_type || '—'}</Text>
            </View>

            {profile.location && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{profile.location}</Text>
              </View>
            )}

            {profile.phone_number && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{profile.phone_number}</Text>
              </View>
            )}
          </View>

          {/* Investment Details Card */}
          {(profile.min_investment || profile.max_investment) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Investment Range</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Min Investment:</Text>
                <Text style={styles.value}>
                  {profile.min_investment ? `$${Number(profile.min_investment).toLocaleString()}` : '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Max Investment:</Text>
                <Text style={styles.value}>
                  {profile.max_investment ? `$${Number(profile.max_investment).toLocaleString()}` : '—'}
                </Text>
              </View>
            </View>
          )}

          {/* Interested Industries Card */}
          {profile.interested_industries && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Interested Industries</Text>
              <View style={styles.industriesContainer}>
                {profile.interested_industries.split(',').map((industry: string, idx: number) => (
                  <View key={idx} style={styles.industryChip}>
                    <Text style={styles.industryText}>{industry.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Previous Investments */}
          {profile.previous_investments && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Previous Investments</Text>
              <Text style={styles.description}>{profile.previous_investments}</Text>
            </View>
          )}

          {/* Bio */}
          {profile.bio && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About</Text>
              <Text style={styles.description}>{profile.bio}</Text>
            </View>
          )}

          {/* Online Presence */}
          {(profile.website || profile.linkedin_url) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Online Presence</Text>
              {profile.website && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Website:</Text>
                  <Text style={styles.linkText}>{profile.website}</Text>
                </View>
              )}
              {profile.linkedin_url && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>LinkedIn:</Text>
                  <Text style={styles.linkText}>{profile.linkedin_url}</Text>
                </View>
              )}
            </View>
          )}

          {/* Subscription Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Subscription</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Plan:</Text>
              <Text style={styles.value}>{profile.subscription || 'Basic'}</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text>Public ID: {user.public_id ?? 'Not set'}</Text>
          <Text style={styles.noProfileText}>No investor profile found.</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Edit Investor Profile" onPress={onEdit} />
      </View>
      <View style={{ height: 8 }} />
      <View style={styles.buttonContainer}>
        <Button
          title="Browse Fundraising Campaigns"
          onPress={() => (navigation as any).navigate('FundraisingBrowse')}
          color="#28a745"
        />
      </View>
      <View style={{ height: 8 }} />
      <Button title="Logout" onPress={signOut} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webScroll: {
    height: '100vh',
  },
  content: {
    padding: 16,
  },
  webContent: {
    paddingBottom: 48,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#007bff',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
    width: 140,
  },
  value: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  linkText: {
    fontSize: 14,
    color: '#007bff',
    flex: 1,
    textDecorationLine: 'underline',
  },
  industriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  noProfileText: {
    fontSize: 15,
    color: '#999',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
});
