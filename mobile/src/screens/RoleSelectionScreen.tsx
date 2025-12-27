import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Simple screen that allows the tester to pick a mock role.
export default function RoleSelectionScreen() {
  // Grab setRole and signOut from the Auth context.
  const { setRole, signOut } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <Text style={{ fontSize: 24, marginBottom: 24 }}>Continue as</Text>
      <Button title="Startup" onPress={() => setRole('startup')} />
      <View style={{ height: 12 }} />
      <Button title="Investor" onPress={() => setRole('investor')} />
      <View style={{ height: 12 }} />
      <Button title="Admin" onPress={() => setRole('admin')} color="#6c757d" />
      <View style={{ height: 12 }} />
      <Button title="Super Admin" onPress={() => setRole('super_admin')} color="#343a40" />
      <View style={{ height: 24 }} />
      <Button title="Logout" onPress={signOut} color="#dc3545" />
    </View>
  );
}
