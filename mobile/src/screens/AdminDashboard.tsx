// Import React so we can write JSX and components.
import React, { useEffect, useState } from 'react';
// Import UI and Button components from React Native.
import { View, Text, Button, ScrollView } from 'react-native';
// Import navigation to navigate to management screens.
import { useNavigation } from '@react-navigation/native';
// Import auth hook to show current admin info and sign out.
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

// AdminDashboard shows simple counts and navigation to management screens.
export default function AdminDashboard() {
  // Get navigation object to move between screens.
  const navigation = useNavigation();
  // Read the authenticated user from context and signOut function.
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ totalStartups: 0, totalInvestors: 0, unverifiedStartups: 0 });

  useEffect(() => {
    let mounted = true;

    async function loadCounts() {
      setLoading(true);
      try {
        const { count: startupCount } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'startup');
        const { count: investorCount } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'investor');

        let unverified = 0;
        try {
          const { count: uCount } = await supabase
            .from('startups')
            .select('id', { count: 'exact', head: true })
            .eq('verification_status', 'pending');
          unverified = uCount ?? 0;
        } catch (e) {
          unverified = 0;
        }

        if (mounted) setCounts({ totalStartups: startupCount ?? 0, totalInvestors: investorCount ?? 0, unverifiedStartups: unverified });
      } catch (err) {
        if (mounted) setCounts({ totalStartups: 0, totalInvestors: 0, unverifiedStartups: 0 });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCounts();

    return () => {
      mounted = false;
    };
  }, []);

  function onManageStartups() {
    // @ts-ignore
    navigation.navigate('StartupManagement');
  }

  function onManageInvestors() {
    // @ts-ignore
    navigation.navigate('InvestorManagement');
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>Admin Dashboard</Text>

      <Text style={{ marginBottom: 8 }}>You are: {user.public_id} ({user.role})</Text>

      <View style={{ padding: 12, backgroundColor: '#f2f2f2', marginBottom: 8 }}>
        {loading ? (
          <Text>Loading counts...</Text>
        ) : (
          <>
            <Text>Total Startups: {counts.totalStartups}</Text>
            <Text>Total Investors: {counts.totalInvestors}</Text>
            <Text>Unverified Startups: {counts.unverifiedStartups}</Text>
          </>
        )}
      </View>

      <Button title="Manage Startups" onPress={onManageStartups} />
      <View style={{ height: 8 }} />
      <Button title="Manage Investors" onPress={onManageInvestors} />
      <View style={{ height: 8 }} />
      <Button title="Logout" onPress={signOut} />
    </ScrollView>
  );
}
