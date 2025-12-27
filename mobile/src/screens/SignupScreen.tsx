import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SignupScreen({ navigation }: { navigation: any }) {
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSignup() {
    try {
      setError(''); // Clear previous errors
      setSuccess(''); // Clear previous success messages
      setLoading(true);

      // Validate inputs
      if (!email || !password) {
        setError('Please enter email and password');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      const { error } = await signUp(email.trim(), password);
      if (error) {
        // Extract meaningful error message from Supabase error object
        const errorMsg = error.message || error.status || String(error);
        setError(`Signup failed: ${errorMsg}`);
        console.error('Signup error details:', error);
        return;
      }

      // Signup was successful - user auth record created
      setSuccess('Account created successfully! You can now use the app.');

      // Try to sign in automatically to start the session
      const { error: signinError } = await signIn(email.trim(), password);
      if (signinError) {
        console.log('Auto-signin after signup failed:', signinError);
        setError('Account created, but auto-login failed. Please try logging in manually.');
        return;
      }

      // If auto-signin succeeded, auth state will change and navigation will happen automatically
      // Clear form
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(`Unexpected error: ${String(err)}`);
      console.error('Signup exception:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Sign up</Text>
      
      {/* Show error message if present */}
      {error ? (
        <View style={{ backgroundColor: '#ffcccc', padding: 12, marginBottom: 12, borderRadius: 4 }}>
          <Text style={{ color: '#cc0000' }}>{error}</Text>
        </View>
      ) : null}

      {/* Show success message if present */}
      {success ? (
        <View style={{ backgroundColor: '#ccffcc', padding: 12, marginBottom: 12, borderRadius: 4 }}>
          <Text style={{ color: '#00aa00' }}>{success}</Text>
        </View>
      ) : null}

      <Text>Email</Text>
      <TextInput 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address" 
        placeholder="you@example.com"
        editable={!loading}
        style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} 
      />
      <Text>Password</Text>
      <TextInput 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        placeholder="••••••••"
        editable={!loading}
        style={{ borderWidth: 1, padding: 8, marginBottom: 12 }} 
      />
      <Button title={loading ? 'Creating account...' : 'Create account'} onPress={onSignup} disabled={loading} />
      <View style={{ height: 12 }} />
      <Button title="Have an account? Log in" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}
