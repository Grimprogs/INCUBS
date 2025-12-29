import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, 
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Modal, Alert 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { generateRecoveryKey, hashRecoveryKey } from '../../../mobile/utils/recovery.util';

export default function SignupScreen({ navigation }: { navigation: any }) {
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Recovery key modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  
  // Timer state for 60-second minimum display
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [canDismiss, setCanDismiss] = useState(false);

  // Timer effect - runs when modal is shown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showRecoveryModal && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCanDismiss(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showRecoveryModal, timeRemaining]);

  // Reset timer when modal opens
  useEffect(() => {
    if (showRecoveryModal) {
      setTimeRemaining(60);
      setCanDismiss(false);
    }
  }, [showRecoveryModal]);

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

      setSuccess('Account created successfully!');

      // Show recovery key modal FIRST (before auto sign-in)
      setRecoveryKey(newRecoveryKey);
      setShowRecoveryModal(true);
      
      // Store credentials in state for later use
      setEmail(signupEmail);
      setPassword(signupPassword);

      // DON'T auto sign-in yet - wait for user to acknowledge recovery key
      // Auto sign-in will happen in acknowledgeKey() function

    } catch (err) {
      setError(`Unexpected error: ${String(err)}`);
      console.error('Signup exception:', err);
    } finally {
      setLoading(false);
    }
  }
  
  function acknowledgeKey() {
    if (!canDismiss) {
      Alert.alert(
        'Please Wait',
        `Take your time to save this code. You can continue in ${timeRemaining} seconds.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setKeySaved(true);
    Alert.alert(
      '✓ Got it!',
      'Your recovery code has been noted. You can use it to reset your password if you forget it.',
      [
        {
          text: 'Continue',
          onPress: async () => {
            // Close modal first
            setShowRecoveryModal(false);
            
            // Now auto sign-in with stored credentials
            if (email && password) {
              console.log('🔐 Auto-signing in user...');
              const { error: signinError } = await signIn(email, password);
              if (signinError) {
                console.log('❌ Auto-signin failed:', signinError);
                // Show error but don't block - user can manually login
                Alert.alert(
                  'Sign In Required',
                  'Please sign in with your new account.',
                  [{ text: 'OK' }]
                );
              } else {
                console.log('✅ Auto-signin successful');
              }
              
              // Clear credentials from state
              setEmail('');
              setPassword('');
            }
          }
        }
      ]
    );
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

      {/* Recovery Key Modal */}
      <Modal
        visible={showRecoveryModal}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalEmoji}>🔑</Text>
              <Text style={styles.modalTitle}>Your Recovery Code</Text>
              <Text style={styles.modalSubtitle}>
                Save this code! You'll need it if you forget your password.
              </Text>
              
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ This code will only be shown ONCE
                </Text>
              </View>

              <View style={styles.keyContainer}>
                <Text style={styles.recoveryKeyLabel}>Your Recovery Code:</Text>
                <Text style={styles.recoveryKeyText} selectable={true}>
                  {recoveryKey}
                </Text>
              </View>

              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>💡 How to use:</Text>
                <Text style={styles.instructionsText}>
                  • Write this code down or take a screenshot{'\n'}
                  • If you forget your password, enter this code to reset it{'\n'}
                  • Keep it safe - you cannot retrieve it later
                </Text>
              </View>

              {/* Timer Display */}
              {!canDismiss && (
                <View style={styles.timerBox}>
                  <Text style={styles.timerText}>
                    ⏱️ Please take {timeRemaining} second{timeRemaining !== 1 ? 's' : ''} to save your code
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={[
                  styles.acknowledgeButton,
                  !canDismiss && styles.acknowledgeButtonDisabled
                ]}
                onPress={acknowledgeKey}
                disabled={false} // Always enabled so we can show the alert
              >
                <Text style={styles.acknowledgeButtonText}>
                  {canDismiss 
                    ? "✓ I've Saved My Recovery Code" 
                    : `Wait ${timeRemaining}s to Continue`
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  keyContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  recoveryKeyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  recoveryKeyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  instructionsBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 22,
  },
  timerBox: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  timerText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  acknowledgeButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acknowledgeButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0.1,
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});