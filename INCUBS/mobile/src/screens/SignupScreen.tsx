import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, 
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { generateRecoveryKey, hashRecoveryKey } from '../../../mobile/utils/recovery.util';
import { supabase } from '../../supabaseClient';

export default function SignupScreen({ navigation }: { navigation: any }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSignup() {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      if (!email || !password) {
        setError('Please enter email and password');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // Store credentials temporarily for later sign-in
      const signupEmail = email.trim();
      const signupPassword = password;

      // Generate recovery key
      const newRecoveryKey = generateRecoveryKey();
      const recoveryHash = hashRecoveryKey(newRecoveryKey);
      
      console.log('🔑 Recovery Key:', newRecoveryKey);
      console.log('🔒 Recovery Hash:', recoveryHash);

      // Sign up user with recovery hash in metadata
      const { data: signUpData, error: signupError } = await signUp(
        signupEmail, 
        signupPassword,
        {
          data: {
            recovery_key_hash: recoveryHash
          }
        }
      );
      
      if (signupError) {
        const errorMsg = signupError.message || signupError.status || String(signupError);
        setError(`Signup failed: ${errorMsg}`);
        console.error('Signup error details:', signupError);
        return;
      }

      console.log('✅ User created with recovery hash:', signUpData?.user?.id);
      console.log('📋 User metadata:', signUpData?.user?.user_metadata);
      console.log('🔍 Recovery hash in metadata:', signUpData?.user?.user_metadata?.recovery_key_hash);

      // Upsert into app users table so recovery flow can find the user
      const appUserId = signUpData?.user?.id;
      if (!appUserId) {
        setError('Signup failed: missing user id after creation');
        return;
      }

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(
          {
            id: appUserId,
            email: signupEmail,
            recovery_key_hash: recoveryHash,
          },
          { onConflict: 'id' }
        );

      if (upsertError) {
        console.error('User upsert error:', upsertError);
        setError('Could not save user profile. Please try again.');
        return;
      }

      setSuccess('Account created successfully!');
      setLoading(false);

      // Navigate to dedicated recovery key page before signing in.
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'RecoveryKey',
            params: {
              recoveryKey: newRecoveryKey,
              email: signupEmail,
              password: signupPassword,
            },
          },
        ],
      });

    } catch (err) {
      setError(`Unexpected error: ${String(err)}`);
      console.error('Signup exception:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none" 
                keyboardType="email-address" 
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
                style={[styles.input, error && !success ? styles.inputError : null]} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
                style={[styles.input, error && !success ? styles.inputError : null]} 
              />
              <Text style={styles.hint}>Must be at least 6 characters</Text>
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={onSignup} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    lineHeight: 20,
  },
  successContainer: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  successText: {
    color: '#065F46',
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});