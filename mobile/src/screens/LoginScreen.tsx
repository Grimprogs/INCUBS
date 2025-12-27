import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onLogin() {
    try {
      setError(''); // Clear previous errors
      setLoading(true);
      const { error } = await signIn(email.trim(), password);
      if (error) {
        // Extract meaningful error message from Supabase error object
        const errorMsg = error.message || error.status || String(error);
        setError(`Login failed: ${errorMsg}`);
        console.error('Login error details:', error);
      } else {
        // Success: navigating happens automatically via auth state change in context
        setError('');
      }
    } catch (err) {
      setError(`Unexpected error: ${String(err)}`);
      console.error('Login exception:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Login</Text>
      
      {/* Show error message if present */}
      {error ? (
        <View style={{ backgroundColor: '#ffcccc', padding: 12, marginBottom: 12, borderRadius: 4 }}>
          <Text style={{ color: '#cc0000' }}>{error}</Text>
        </View>
      ) : null}
      
      <Text>Email</Text>
      <TextInput 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address" 
        placeholder="you@example.com"
        style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} 
      />
      <Text>Password</Text>
      <TextInput 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        placeholder="••••••••"
        style={{ borderWidth: 1, padding: 8, marginBottom: 12 }} 
      />
      <Button title={loading ? 'Logging in...' : 'Log in'} onPress={onLogin} disabled={loading} />
      <View style={{ height: 12 }} />
      <Button title="Sign up instead" onPress={() => navigation.navigate('Signup')} />
    </View>
  );
}
