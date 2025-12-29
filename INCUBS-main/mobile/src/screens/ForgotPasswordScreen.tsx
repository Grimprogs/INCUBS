import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { formatRecoveryKeyInput, verifyRecoveryKey, validateRecoveryKey } from '../../../mobile/utils/recovery.util';
import { supabase } from '../../supabaseClient';

export default function ForgotPasswordScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onResetPassword() {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // Validate all fields
      if (!email || !recoveryKey || !newPassword || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }

      // Validate recovery key format
      if (!validateRecoveryKey(recoveryKey)) {
        setError('Recovery key must be 24 digits in format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX');
        return;
      }

      // Validate password
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      console.log('🔍 Verifying recovery key for:', email);
      console.log('🔑 Recovery key entered:', recoveryKey);

      // Step 1: Verify recovery key
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('id, recovery_key_hash')
        .eq('email', email.trim())
        .single();

      if (fetchError || !userData) {
        console.error('❌ User not found:', fetchError);
        setError('No account found with this email address');
        return;
      }

      const storedHash = userData.recovery_key_hash;
      console.log('🔒 Stored hash from DB:', storedHash);

      if (!storedHash) {
        setError('No recovery key found for this account. Please contact support.');
        return;
      }

      // Verify recovery key matches stored hash
      const isValid = verifyRecoveryKey(recoveryKey, storedHash);
      console.log('✓ Recovery key valid:', isValid);
      
      if (!isValid) {
        setError('Invalid recovery key. Please check and try again.');
        return;
      }

      console.log('✅ Recovery key verified! Proceeding with password reset...');

      // Step 2: Reset password using Supabase reset email
      // For production security, we send a reset email rather than directly updating
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: 'your-app://reset-password'
        }
      );

      if (resetError) {
        console.error('❌ Password reset failed:', resetError);
        setError('Failed to send reset email. Please try again.');
        return;
      }

      console.log('✅ Password reset email sent!');
      setSuccess('Recovery key verified! Check your email for a password reset link. Click the link to set your new password.');
      
      // Clear form
      setEmail('');
      setRecoveryKey('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Navigate to login after 5 seconds
      setTimeout(() => {
        navigation.navigate('Login');
      }, 5000);

    } catch (err) {
      setError(`Password reset error: ${String(err)}`);
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRecoveryKeyChange = (text: string) => {
    const formatted = formatRecoveryKeyInput(text);
    setRecoveryKey(formatted);
    if (error) setError('');
  };

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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your recovery key and create a new password
            </Text>
          </View>

          {/* Error Alert */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Success Alert */}
          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {/* Form - All fields visible */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                value={email} 
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                autoCapitalize="none" 
                keyboardType="email-address" 
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                editable={!loading && !success}
                autoComplete="email"
                textContentType="emailAddress"
                style={[styles.input, error && !success ? styles.inputError : null]} 
              />
            </View>

            {/* Recovery Key Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Recovery Key</Text>
              <TextInput 
                value={recoveryKey} 
                onChangeText={handleRecoveryKeyChange} 
                placeholder="0000-0000-0000-0000-0000-0000"
                placeholderTextColor="#9CA3AF"
                editable={!loading && !success}
                maxLength={29} // 24 digits + 5 dashes
                keyboardType="number-pad"
                autoComplete="off"
                textContentType="none"
                style={[styles.input, styles.recoveryInput, error && !success ? styles.inputError : null]} 
              />
              <Text style={styles.hint}>
                Enter the 24-digit recovery key you saved during signup
              </Text>
              
              {/* Live formatting feedback */}
              {recoveryKey.length > 0 && (
                <View style={styles.formatFeedback}>
                  <Text style={styles.formatText}>
                    {recoveryKey.replace(/-/g, '').length} / 24 digits entered
                  </Text>
                  {validateRecoveryKey(recoveryKey) && (
                    <Text style={styles.formatValid}>✓ Valid format</Text>
                  )}
                </View>
              )}
            </View>

            {/* New Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput 
                value={newPassword} 
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (error) setError('');
                }}
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor="#9CA3AF"
                editable={!loading && !success}
                autoComplete="password-new"
                textContentType="newPassword"
                style={[styles.input, error && !success ? styles.inputError : null]} 
              />
              <Text style={styles.hint}>
                Must be at least 6 characters
              </Text>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput 
                value={confirmPassword} 
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError('');
                }}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                editable={!loading && !success}
                autoComplete="password-new"
                textContentType="newPassword"
                style={[styles.input, error && !success ? styles.inputError : null]} 
              />
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <Text style={styles.formatValid}>✓ Passwords match</Text>
              )}
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <Text style={styles.passwordMismatch}>✗ Passwords don't match</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.button, (loading || success) && styles.buttonDisabled]} 
              onPress={onResetPassword} 
              disabled={loading || !!success}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>💡 Can't find your recovery key?</Text>
            <Text style={styles.helpText}>
              Your recovery key was shown once during signup. Check your screenshots or where you saved it.
            </Text>
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
    textAlign: 'center',
    lineHeight: 22,
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
  recoveryInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    fontSize: 18,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  formatFeedback: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  formatText: {
    fontSize: 12,
    color: '#6B7280',
  },
  formatValid: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 6,
  },
  passwordMismatch: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
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
  helpBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 20,
  },
});