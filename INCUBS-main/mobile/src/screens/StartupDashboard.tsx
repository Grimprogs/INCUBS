// Import React to use JSX.
import React, { useEffect, useState } from 'react';
// Import UI components from React Native.
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
// Import navigation hooks to navigate to other screens.
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

// Define the StartupDashboard component.
export default function StartupDashboard() {
  // Get navigation object to navigate to other screens.
  const navigation = useNavigation();
  // Read authenticated user from context and signOut function (id, public_id, role).
  const { user, signOut } = useAuth();

  // Local state for loading and the startup profile we fetch from DB.
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Fetch startup profile for the logged-in user.
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
        // Try to read a `startups` table row linked to this user.
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (!error && data && mounted) {
          setProfile(data as any);
        } else {
          // If table doesn't exist or no row found, keep profile null.
          setProfile(null);
        }
      } catch (err) {
        // Any unexpected error: treat as no profile available.
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

  // Handler when Edit button is pressed: navigate to profile form.
  function onEdit() {
    // @ts-ignore - simple navigation without typed props for brevity.
    navigation.navigate('StartupProfileForm');
  }

  // Render the dashboard UI using real data when available.
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Startup Dashboard</Text>

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : profile ? (
        <>
          {/* Company Overview Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Company Overview</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Company Name:</Text>
              <Text style={styles.value}>{profile.company_name || '—'}</Text>
            </View>

            {profile.tagline && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Tagline:</Text>
                <Text style={styles.value}>{profile.tagline}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.label}>Company Type:</Text>
              <Text style={styles.value}>{profile.company_type || '—'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Registered:</Text>
              <Text style={styles.value}>{profile.registered ? 'Yes' : 'No'}</Text>
            </View>

            {profile.founded_year && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Founded:</Text>
                <Text style={styles.value}>{profile.founded_year}</Text>
              </View>
            )}

            {profile.location && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{profile.location}</Text>
              </View>
            )}
          </View>

          {/* Contact Information Card */}
          {(profile.website || profile.email) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact Information</Text>
              {profile.website && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Website:</Text>
                  <Text style={styles.linkText}>{profile.website}</Text>
                </View>
              )}
              {profile.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{profile.email}</Text>
                </View>
              )}
            </View>
          )}

          {/* Description Card */}
          {profile.description && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About</Text>
              <Text style={styles.description}>{profile.description}</Text>
            </View>
          )}

          {/* Legal Information Card */}
          {(profile.registration_number || profile.gst_number || profile.pan_number) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Legal Information</Text>
              {profile.registration_number && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Registration #:</Text>
                  <Text style={styles.value}>{profile.registration_number}</Text>
                </View>
              )}
              {profile.gst_number && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>GST #:</Text>
                  <Text style={styles.value}>{profile.gst_number}</Text>
                </View>
              )}
              {profile.pan_number && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>PAN #:</Text>
                  <Text style={styles.value}>{profile.pan_number}</Text>
                </View>
              )}
            </View>
          )}

          {/* Team Information Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Team Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Directors:</Text>
              <Text style={styles.value}>{profile.num_directors || '—'}</Text>
            </View>

            {profile.team_size && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Team Size:</Text>
                <Text style={styles.value}>{profile.team_size} members</Text>
              </View>
            )}

            {profile.founder_name && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Founder:</Text>
                <Text style={styles.value}>{profile.founder_name}</Text>
              </View>
            )}
          </View>

          {/* Founder Experience Card */}
          {profile.founder_experience && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Founder Experience</Text>
              <Text style={styles.description}>{profile.founder_experience}</Text>
            </View>
          )}

          {/* Business Information Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Business Information</Text>
            
            {profile.industry && (
              <>
                <Text style={styles.label}>Industries:</Text>
                <View style={styles.industriesContainer}>
                  {profile.industry.split(',').map((ind: string, idx: number) => (
                    <View key={idx} style={styles.industryChip}>
                      <Text style={styles.industryText}>{ind.trim()}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {profile.business_model && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Business Model:</Text>
                <Text style={styles.value}>{profile.business_model}</Text>
              </View>
            )}

            {profile.target_market && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Target Market:</Text>
                <Text style={styles.value}>{profile.target_market}</Text>
              </View>
            )}

            {profile.competition && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Competition:</Text>
                <Text style={styles.value}>{profile.competition}</Text>
              </View>
            )}
          </View>

          {/* Financial Information Card */}
          {(profile.current_revenue || profile.funding_raised || profile.funding_stage || profile.monthly_burn) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Financial Information</Text>
              
              {profile.current_revenue && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Current Revenue:</Text>
                  <Text style={styles.value}>₹{Number(profile.current_revenue).toLocaleString()}</Text>
                </View>
              )}

              {profile.funding_raised && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Funding Raised:</Text>
                  <Text style={styles.value}>₹{Number(profile.funding_raised).toLocaleString()}</Text>
                </View>
              )}

              {profile.funding_stage && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Funding Stage:</Text>
                  <Text style={styles.value}>{profile.funding_stage}</Text>
                </View>
              )}

              {profile.monthly_burn && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Monthly Burn:</Text>
                  <Text style={styles.value}>₹{Number(profile.monthly_burn).toLocaleString()}</Text>
                </View>
              )}
            </View>
          )}

          {/* Social Impact Card */}
          {profile.social_impact && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Social Impact</Text>
              <Text style={styles.description}>{profile.impact_description || 'This startup has social impact focus.'}</Text>
            </View>
          )}

          {/* Verification Status Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verification Status</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, { color: profile.verification_status === 'verified' ? '#28a745' : '#ffc107' }]}>
                {profile.verification_status || 'Pending'}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text>Public ID: {user.public_id ?? 'Not set'}</Text>
          <Text style={styles.noProfileText}>No startup profile found. Please create one.</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Edit Startup Profile" onPress={onEdit} />
      </View>
      <View style={{ height: 8 }} />
      <View style={styles.buttonContainer}>
        <Button 
          title="Fundraising Dashboard" 
          onPress={() => (navigation as any).navigate('FundraisingDashboard')} 
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
  content: {
    padding: 16,
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
    marginTop: 4,
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
