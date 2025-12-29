import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const { setRole } = useAuth();

  function handleChangeRole() {
    Alert.alert(
      'Change role?',
      'Changing your role will remove existing role-specific data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, change role',
          style: 'destructive',
          onPress: async () => {
            await setRole(null);
            navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
          },
        },
      ],
      { cancelable: true }
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity style={styles.button} onPress={handleChangeRole} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Change Role</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
