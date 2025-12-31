import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.BACKEND_URL || 'https://incubs.onrender.com';

export default function SignupScreen({ navigation }: { navigation: any }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState<string | null>(null);
  const [masked, setMasked] = useState<string | null>(null);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verified, setVerified] = useState(false);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const validateAadhaar = (value: string) => /^[0-9]{12}$/.test(value.trim());
  const validateEmail = (value: string) => /.+@.+\..+/.test(value.trim());

  async function sendOtp() {
    try {
      resetMessages();
      if (!validateAadhaar(aadhaarNumber)) {
        setError('Aadhaar number must be 12 digits');
        return;
      }
      setLoadingSend(true);
      const res = await fetch(`${BACKEND_URL}/aadhaar/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar_number: aadhaarNumber.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to send OTP');
        return;
      }
      setTxnId(json.txn_id);
      setMasked(json.masked || null);
      setSuccess('OTP sent. Use TEST_OTP=123456 in this build.');
      setVerified(false);
    } catch (err) {
      setError(`Failed to send OTP: ${String(err)}`);
    } finally {
      setLoadingSend(false);
    }
  }

  async function verifyOtp() {
    try {
      resetMessages();
      if (!txnId) {
        setError('Send OTP first');
        return;
      }
      if (!otp.trim()) {
        setError('Enter the OTP');
        return;
      }
      setLoadingVerify(true);
      const res = await fetch(`${BACKEND_URL}/aadhaar/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar_number: aadhaarNumber.trim(), otp: otp.trim(), txn_id: txnId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to verify OTP');
        return;
      }
      setVerified(true);
      setSuccess('Aadhaar verified. Complete signup to finish.');
    } catch (err) {
      setError(`Failed to verify OTP: ${String(err)}`);
    } finally {
      setLoadingVerify(false);
    }
  }

  async function completeSignup() {
    try {
      resetMessages();
      if (!txnId || !verified) {
        setError('Verify Aadhaar before signup');
        return;
      }
      if (!validateEmail(email)) {
        setError('Enter a valid email');
        return;
      }
      if (password.trim().length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setLoadingSignup(true);

      const signupEmail = email.trim();
      const signupPassword = password.trim();

      const { error: authError } = await signUp(signupEmail, signupPassword, {
        data: { signup_via: 'aadhaar' },
      });
      if (authError) {
        setError(authError.message || 'Auth signup failed');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar_number: aadhaarNumber.trim(),
          txn_id: txnId,
          profile: { source: 'mobile', email: signupEmail },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Signup failed');
        return;
      }
      setSuccess('Signup complete!');
    } catch (err) {
      setError(`Signup failed: ${String(err)}`);
    } finally {
      setLoadingSignup(false);
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
                editable={!loadingSend && !loadingVerify && !loadingSignup}
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
                editable={!loadingSend && !loadingVerify && !loadingSignup}
                style={[styles.input, error && !success ? styles.inputError : null]}
              />
              <Text style={styles.hint}>At least 6 characters</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Aadhaar Number</Text>
              <TextInput
                value={aadhaarNumber}
                onChangeText={setAadhaarNumber}
                keyboardType="number-pad"
                placeholder="12-digit Aadhaar"
                maxLength={12}
                placeholderTextColor="#9CA3AF"
                editable={!loadingSend && !loadingVerify && !loadingSignup && !verified}
                style={[styles.input, error && !success ? styles.inputError : null]}
              />
              {masked ? <Text style={styles.hint}>Session: {masked}</Text> : null}
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, loadingSend && styles.buttonDisabled]}
                onPress={sendOtp}
                disabled={loadingSend || loadingVerify || loadingSignup}
                activeOpacity={0.8}
              >
                {loadingSend ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Send OTP</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>OTP</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="Enter OTP"
                placeholderTextColor="#9CA3AF"
                editable={!!txnId && !loadingVerify && !loadingSignup}
                style={[styles.input, error && !success ? styles.inputError : null]}
              />
              <Text style={styles.hint}>Use 123456 in this test build</Text>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.button, loadingVerify && styles.buttonDisabled]}
                onPress={verifyOtp}
                disabled={!txnId || loadingVerify || loadingSignup}
                activeOpacity={0.8}
              >
                {loadingVerify ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loadingSignup && styles.buttonDisabled, !verified && styles.buttonDisabled]}
              onPress={completeSignup}
              disabled={!verified || loadingSignup}
              activeOpacity={0.8}
            >
              {loadingSignup ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Complete Signup</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loadingSend || loadingVerify || loadingSignup} activeOpacity={0.7}>
              <Text style={styles.linkText}>Back to Login</Text>
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
  secondaryButton: {
    backgroundColor: '#1F2937',
    shadowColor: '#1F2937',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
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