import React, { useState, useEffect } from 'react';
import { View, Text, Button, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

export default function UserManagement() {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<Array<{ id: string; public_id?: string; email?: string; role?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data } = await supabase.from('users').select('id, public_id, email, role').order('created_at', { ascending: false });
      if (data) setUsers(data as any);
    } catch (e) {
      console.error('Failed to load users:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function promoteToAdmin(userId: string, currentRole: string, userEmail: string) {
    if (currentRole === 'admin' || currentRole === 'super_admin') {
      alert('This user is already an admin');
      return;
    }

    if (!confirm(`Promote ${userEmail} to Admin?`)) {
      return;
    }

    setActionInProgress(true);
    try {
      const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        alert('Success: User promoted to Admin');
        await loadUsers();
      }
    } catch (err) {
      alert('Error: Failed to promote user');
      console.error(err);
    } finally {
      setActionInProgress(false);
    }
  }

  async function demoteUser(userId: string, currentRole: string, userEmail: string) {
    if (currentRole === 'super_admin') {
      alert('Error: Cannot demote super admin');
      return;
    }

    if (!confirm(`Demote ${userEmail}?`)) {
      return;
    }

    setActionInProgress(true);
    try {
      // Determine new role based on existing data
      const { data: startupData } = await supabase.from('startups').select('id').eq('owner_id', userId).single();
      const { data: investorData } = await supabase.from('investors').select('id').eq('owner_id', userId).single();
      
      const newRole = startupData ? 'startup' : investorData ? 'investor' : null;
      
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        alert('Success: Admin demoted');
        await loadUsers();
      }
    } catch (err) {
      alert('Error: Failed to demote user');
      console.error(err);
    } finally {
      setActionInProgress(false);
    }
  }

  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
  const startupCount = users.filter(u => u.role === 'startup').length;
  const investorCount = users.filter(u => u.role === 'investor').length;

  // Filter users based on selected filter
  const filteredUsers = selectedFilter === 'all' 
    ? users 
    : selectedFilter === 'admin'
    ? users.filter(u => u.role === 'admin' || u.role === 'super_admin')
    : users.filter(u => u.role === selectedFilter);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>User Management</Text>
      
      <View style={styles.statsBox}>
        <Text style={styles.statsBold}>Statistics:</Text>
        <Text style={styles.statsText}>Total Admins: {adminCount}</Text>
        <Text style={styles.statsText}>Total Startups: {startupCount}</Text>
        <Text style={styles.statsText}>Total Investors: {investorCount}</Text>
        <Text style={styles.statsText}>Total Users: {users.length}</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
            All ({users.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'admin' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('admin')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'admin' && styles.filterTabTextActive]}>
            Admins ({adminCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'startup' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('startup')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'startup' && styles.filterTabTextActive]}>
            Startups ({startupCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'investor' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('investor')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'investor' && styles.filterTabTextActive]}>
            Investors ({investorCount})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading users...</Text>
      ) : (
        <View style={styles.usersList}>
          {filteredUsers.length === 0 ? (
            <Text style={styles.noUsersText}>No users found in this category</Text>
          ) : (
            filteredUsers.map((item) => (
            <View key={item.id} style={styles.userCard}>
              <Text style={styles.userEmail}>{item.email || 'No email'}</Text>
              <Text style={styles.userDetail}>Public ID: {item.public_id || 'Not set'}</Text>
              <Text style={styles.userDetail}>
                Role: {item.role || 'None'} {item.role === 'super_admin' ? '👑' : item.role === 'admin' ? '🛡️' : ''}
              </Text>
              
              <View style={styles.buttonContainer}>
                {item.role !== 'admin' && item.role !== 'super_admin' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.promoteButton]} 
                    onPress={() => promoteToAdmin(item.id, item.role || '', item.email || '')}
                    disabled={actionInProgress}
                  >
                    <Text style={styles.buttonText}>Promote to Admin</Text>
                  </TouchableOpacity>
                )}
                {item.role === 'admin' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.demoteButton]} 
                    onPress={() => demoteUser(item.id, item.role || '', item.email || '')}
                    disabled={actionInProgress}
                  >
                    <Text style={styles.buttonText}>Demote</Text>
                  </TouchableOpacity>
                )}
                {item.role === 'super_admin' && (
                  <Text style={styles.superAdminText}>Cannot modify super admin</Text>
                )}
              </View>
            </View>
          )))}
        </View>
      )}
      
      <View style={styles.spacer} />
      <Button title="Logout" onPress={signOut} />
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsBox: {
    padding: 12,
    backgroundColor: '#f2f2f2',
    marginBottom: 12,
    borderRadius: 4,
  },
  statsBold: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsText: {
    marginBottom: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterTab: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  filterTabActive: {
    backgroundColor: '#007bff',
  },
  filterTabText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noUsersText: {
    padding: 20,
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  },
  loadingText: {
    padding: 20,
    textAlign: 'center',
  },
  usersList: {
    marginBottom: 16,
  },
  userCard: {
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  userEmail: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userDetail: {
    marginBottom: 2,
  },
  buttonContainer: {
    marginTop: 8,
  },
  actionButton: {
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  promoteButton: {
    backgroundColor: '#28a745',
  },
  demoteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  superAdminText: {
    color: '#888',
    fontStyle: 'italic',
  },
  spacer: {
    height: 16,
  },
  bottomSpacer: {
    height: 20,
  },
});
