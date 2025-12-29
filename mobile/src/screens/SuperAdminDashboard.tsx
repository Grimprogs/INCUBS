import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

export default function SuperAdminDashboard({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [adminCount, setAdminCount] = useState(0);
  const [superAdminCount, setSuperAdminCount] = useState(0);
  const [startupCount, setStartupCount] = useState(0);
  const [investorCount, setInvestorCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Get all users
      const { data: allUsers } = await supabase.from('users').select('role');
      
      if (allUsers) {
        setTotalUsers(allUsers.length);
        setAdminCount(allUsers.filter(u => u.role === 'admin').length);
        setSuperAdminCount(allUsers.filter(u => u.role === 'super_admin').length);
        setStartupCount(allUsers.filter(u => u.role === 'startup').length);
        setInvestorCount(allUsers.filter(u => u.role === 'investor').length);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>Super Admin Dashboard 👑</Text>
      
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>User Statistics:</Text>
      
      <View style={{ padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>Total Users: {totalUsers}</Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>Super Admins: {superAdminCount} 👑</Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>Admins: {adminCount} 🛡️</Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>Startups: {startupCount} 🚀</Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>Investors: {investorCount} 💰</Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Button 
          title="Manage Users" 
          onPress={() => navigation.navigate('UserManagement')} 
          color="#007bff"
        />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Button 
          title="View All Startups" 
          onPress={() => navigation.navigate('StartupManagement')} 
          color="#28a745"
        />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Button 
          title="View All Investors" 
          onPress={() => navigation.navigate('InvestorManagement')} 
          color="#17a2b8"
        />
      </View>

      <View style={{ height: 32 }} />
      <Button title="Logout" onPress={signOut} color="#dc3545" />
    </ScrollView>
  );
}
