// Import React and hooks.
import React, { useState, useEffect } from 'react';
// Import UI components.
import { View, Text, Button, FlatList, Alert } from 'react-native';
// Import auth hook for permission checks.
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';
// Import audit log helper.
import { addLog, readLog } from '../utils/auditLog';

// InvestorManagement screen shows investors and admin actions.
export default function InvestorManagement() {
  // Read current user to check permissions.
  const { user } = useAuth();

  // Local state for list and audit log view.
  const [investors, setInvestors] = useState<Array<{ id: string; public_id?: string; investor_type?: string; subscription?: string; disabled?: boolean }>>([]);
  const [logs] = useState(() => readLog());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { data } = await supabase.from('investors').select('id, public_id, investor_type, subscription, disabled');
        if (mounted && data) setInvestors(data as any);
      } catch (e) {
        if (mounted) setInvestors([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // View profile (mock) just shows an alert.
  function onView(id: string) {
    Alert.alert('View', `View profile for ${id}`);
    addLog(`Admin ${user.public_id} viewed Investor ${id}`);
  }

  // Edit profile shows alert and log.
  function onEdit(id: string) {
    Alert.alert('Edit', `Edit profile for ${id}`);
    addLog(`Admin ${user.public_id} edited Investor ${id}`);
  }

  // Disable account (admin action).
  async function onDisable(id: string) {
    try {
      await supabase.from('investors').update({ disabled: true }).eq('id', id);
    } catch (e) {}
    setInvestors(prev => prev.map(i => (i.id === id ? { ...i, disabled: true } : i)));
    addLog(`Admin ${user.public_id} disabled Investor ${id}`);
    Alert.alert('Disabled', 'Investor disabled');
  }

  // Render each investor row with actions.
  function renderItem({ item }: { item: typeof investors[0] }) {
    return (
      <View style={{ padding: 8, borderBottomWidth: 1 }}>
        <Text>Public ID: {item.public_id}</Text>
        <Text>Type: {item.investor_type}</Text>
        <Text>Subscription: {item.subscription}</Text>
        <Text>Disabled: {item.disabled ? 'Yes' : 'No'}</Text>

        <Button title="View Profile" onPress={() => onView(item.id)} />
        <View style={{ height: 4 }} />
        <Button title="Edit" onPress={() => onEdit(item.id)} />
        <View style={{ height: 4 }} />
        <Button title="Disable" onPress={() => onDisable(item.id)} />
      </View>
    );
  }

  // Render the management UI and audit log.
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Investor Management</Text>

      <Text style={{ marginBottom: 8 }}>You are: {user.public_id} ({user.role})</Text>
      <Text style={{ marginBottom: 12 }}>Admins can view/edit/disable investor accounts.</Text>

      {loading ? <Text>Loading investors...</Text> : <FlatList data={investors} keyExtractor={i => i.id} renderItem={renderItem} />}

      <View style={{ height: 12 }} />
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Audit Log (recent)</Text>
      {logs.map((l, idx) => (
        <Text key={idx} style={{ fontSize: 12 }}>
          {l}
        </Text>
      ))}
    </View>
  );
}
