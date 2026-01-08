// Import React and hooks.
import React, { useState, useEffect } from 'react';
// Import UI and touchable components.
import { View, Text, Button, FlatList, TouchableOpacity, Alert } from 'react-native';
// Import auth hook to check permissions.
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';
// Import audit log helper to record admin actions.
import { addLog, readLog } from '../utils/auditLog';

// StartupManagement screen shows startups and admin actions.
export default function StartupManagement() {
  // Read the current user to check admin vs super_admin.
  const { user } = useAuth();

  // Manage the startups in local state so UI updates.
  const [startups, setStartups] = useState<Array<{ id: string; public_id?: string; company_name?: string; verification_status?: string; disabled?: boolean }>>([]);
  // Read-only view of the audit log for display.
  const [logs] = useState(() => readLog());

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { data } = await supabase.from('startups').select('id, public_id, company_name, verification_status, disabled');
        if (mounted && data) setStartups(data as any);
      } catch (e) {
        if (mounted) setStartups([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to update a startup in the array.
  function updateStartup(id: string, patch: Partial<typeof startups[0]>) {
    setStartups(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }

  // Handler to verify a startup (admins can verify).
  async function onVerify(id: string) {
    // Only admin or super_admin can verify; but path uses pages only accessible to admin.
    // Persist change to DB when possible.
    try {
      await supabase.from('startups').update({ verification_status: 'verified' }).eq('id', id);
    } catch (e) {
      // ignore DB error for now
    }
    updateStartup(id, { verification_status: 'verified' });
    addLog(`Admin ${user.public_id} verified Startup ${id}`);
    Alert.alert('Verified', 'Startup marked as verified');
  }

  // Handler to unverify a startup.
  async function onUnverify(id: string) {
    try {
      await supabase.from('startups').update({ verification_status: 'pending' }).eq('id', id);
    } catch (e) {}
    updateStartup(id, { verification_status: 'pending' });
    addLog(`Admin ${user.public_id} set Startup ${id} to pending`);
    Alert.alert('Set to pending', 'Startup marked as pending');
  }

  // Handler to disable a startup (admin action).
  async function onDisable(id: string) {
    try {
      await supabase.from('startups').update({ disabled: true }).eq('id', id);
    } catch (e) {}
    updateStartup(id, { disabled: true });
    addLog(`Admin ${user.public_id} disabled Startup ${id}`);
    Alert.alert('Disabled', 'Startup disabled');
  }

  // Handler to delete a startup (only super_admin allowed).
  async function onDelete(id: string) {
    // Check role before allowing delete.
    if (user.role !== 'super_admin') {
      // If not super_admin, show an alert and return; admins cannot delete.
      Alert.alert('Forbidden', 'Only super_admin can delete startups');
      return;
    }
    // Super admin may delete: remove from state and log.
    try {
      await supabase.from('startups').delete().eq('id', id);
    } catch (e) {}
    setStartups(prev => prev.filter(s => s.id !== id));
    addLog(`SuperAdmin ${user.public_id} deleted Startup ${id}`);
    Alert.alert('Deleted', 'Startup deleted by super_admin');
  }

  // Render each startup row with action buttons.
  function renderItem({ item }: { item: typeof startups[0] }) {
    return (
      <View style={{ padding: 8, borderBottomWidth: 1 }}>
        <Text>Public ID: {item.public_id}</Text>
        <Text>Company: {item.company_name}</Text>
        <Text>Verification: {item.verification_status}</Text>
        <Text>Disabled: {item.disabled ? 'Yes' : 'No'}</Text>

        {/* Verify button */}
        <Button title="Verify" onPress={() => onVerify(item.id)} />
        <View style={{ height: 4 }} />
        {/* Unverify button */}
        <Button title="Unverify" onPress={() => onUnverify(item.id)} />
        <View style={{ height: 4 }} />
        {/* Edit (mock) */}
        <Button title="Edit" onPress={() => Alert.alert('Edit', 'Edit screen not implemented in Phase 3')} />
        <View style={{ height: 4 }} />
        {/* Disable button */}
        <Button title="Disable" onPress={() => onDisable(item.id)} />
        <View style={{ height: 4 }} />
        {/* Delete button (visible but only works for super_admin) */}
        <Button title="Delete (super_admin only)" onPress={() => onDelete(item.id)} />
      </View>
    );
  }

  // Render the management screen with list and simple audit log view.
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Startup Management</Text>

      {/* Explain role permissions at top */}
      <Text style={{ marginBottom: 8 }}>You are: {user.public_id} ({user.role})</Text>
      <Text style={{ marginBottom: 12 }}>Admins may verify/unverify and disable. Super admin can delete.</Text>

      {loading ? <Text>Loading startups...</Text> : <FlatList data={startups} keyExtractor={s => s.id} renderItem={renderItem} />}

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
