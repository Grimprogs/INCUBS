import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RecoveryKeyScreen({ route, navigation }: { route: any; navigation: any }) {
  const { signIn } = useAuth();
  const { recoveryKey, email, password } = route.params || {};
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    Alert.alert(
      'Have you saved this key?',
      'You will need this recovery key if you lose access. Please store it safely.',
      [
        {
          text: 'Continue',
          onPress: async () => {
            setLoading(true);
            try {
              // If we have credentials, sign in; otherwise just continue.
              if (email && password) {
                const { error: signinError } = await signIn(email, password);
                if (signinError) {
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                } else {
                  navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
                }
              } else {
                navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
              }
            } catch (err) {
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } finally {
              setLoading(false);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Your Recovery Key</Text>
        <Text style={styles.subtitle}>Save this key now. It will not be shown again.</Text>

        <View style={styles.keyBox}>
          <Text style={styles.keyLabel}>Recovery Key</Text>
          <Text style={styles.keyValue} selectable>
            {recoveryKey}
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>This key is the only way to recover your account if you lose access.</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F3F4F6',
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  keyBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  keyLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  keyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 1.5,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
