// Import React and hooks.
import React, { useState, useEffect } from 'react';
// Import UI components.
import { View, Text, TextInput, Button, TouchableOpacity, FlatList, Alert, ScrollView, StyleSheet } from 'react-native';
// Import navigation.
import { useNavigation } from '@react-navigation/native';
// Import auth hook to get the authenticated user's ID.
import { useAuth } from '../context/AuthContext';
// Import Supabase client to save to the database.
import { supabase } from '../../supabaseClient';

// InvestorProfileForm component implements a comprehensive form.
export default function InvestorProfileForm() {
  // Navigation object.
  const navigation = useNavigation();
  // Get the authenticated user so we can link the investor to their ID.
  const { user } = useAuth();

  // BASIC INFO
  const [investorName, setInvestorName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // INVESTOR TYPE
  const investorTypes = ['Angel', 'VC', 'Individual', 'Corporate', 'Family Office'];
  const [investorType, setInvestorType] = useState(investorTypes[0]);

  // INVESTMENT DETAILS
  const [minInvestment, setMinInvestment] = useState('');
  const [maxInvestment, setMaxInvestment] = useState('');
  const [previousInvestments, setPreviousInvestments] = useState('');
  
  // INTERESTED INDUSTRIES
  const allIndustries = ['FinTech', 'SaaS', 'HealthTech', 'EdTech', 'AI', 'E-commerce', 'CleanTech', 'AgriTech'];
  const [interested, setInterested] = useState<string[]>([]);

  // ONLINE PRESENCE
  const [website, setWebsite] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');

  // Load existing profile data on mount
  useEffect(() => {
    async function loadProfile() {
      // Only load if user is an investor
      if (!user.id || user.role !== 'investor') return;

      try {
        const { data, error } = await supabase
          .from('investors')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (!error && data) {
          // Populate form with existing data
          setInvestorName(data.investor_name || '');
          setCompanyName(data.company_name || '');
          setLocation(data.location || '');
          setPhoneNumber(data.phone_number || '');
          setInvestorType(data.investor_type || investorTypes[0]);
          setMinInvestment(data.min_investment?.toString() || '');
          setMaxInvestment(data.max_investment?.toString() || '');
          setPreviousInvestments(data.previous_investments || '');
          setWebsite(data.website || '');
          setLinkedinUrl(data.linkedin_url || '');
          setBio(data.bio || '');
          
          if (data.interested_industries) {
            const industries = data.interested_industries.split(',').filter(Boolean);
            if (industries.length > 0) {
              setInterested(industries);
            }
          }
        }
      } catch (err) {
        console.log('No existing profile found, creating new one');
      }
    }

    loadProfile();
  }, [user.id, user.role]);

  // Toggle an industry in the selected list.
  function toggleIndustry(ind: string) {
    if (interested.includes(ind)) {
      // Remove it.
      setInterested(interested.filter(i => i !== ind));
    } else {
      // Add it.
      setInterested([...interested, ind]);
    }
  }

  // Save handler.
  async function onSave() {
    if (!user.id) {
      Alert.alert('Error', 'No authenticated user');
      return;
    }

    // Validation
    if (!investorName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (interested.length === 0) {
      Alert.alert('Error', 'Please select at least one interested industry');
      return;
    }

    try {
      // Insert or update the investor row in the `investors` table.
      const { error } = await supabase.from('investors').upsert({
        owner_id: user.id,
        investor_name: investorName,
        company_name: companyName,
        location: location,
        phone_number: phoneNumber,
        investor_type: investorType,
        min_investment: minInvestment ? parseFloat(minInvestment) : null,
        max_investment: maxInvestment ? parseFloat(maxInvestment) : null,
        previous_investments: previousInvestments,
        interested_industries: interested.join(','),
        website: website,
        linkedin_url: linkedinUrl,
        bio: bio,
        subscription: 'basic'
      }, { onConflict: 'owner_id' });

      if (error) {
        console.error('Investor upsert error:', error);
        Alert.alert('Save failed', error.message || JSON.stringify(error));
        return;
      }

      // Success: show confirmation and take investors to the discovery home.
      Alert.alert('Success', 'Investor profile saved!');
      // @ts-ignore
      navigation.navigate('InvestorHome');
    } catch (err) {
      Alert.alert('Error', 'Failed to save investor profile');
      console.error('investorProfileForm save error:', err);
    }
  }

  // Render the form with comprehensive fields.
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Investor Profile</Text>

      {/* Info Message */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Complete your profile to discover and invest in startups!
        </Text>
      </View>

      {/* Basic Information */}
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <Text style={styles.label}>Full Name *</Text>
      <TextInput 
        value={investorName} 
        onChangeText={setInvestorName} 
        placeholder="John Doe"
        style={styles.input} 
      />

      <Text style={styles.label}>Company Name (if applicable)</Text>
      <TextInput 
        value={companyName} 
        onChangeText={setCompanyName} 
        placeholder="ABC Ventures"
        style={styles.input} 
      />

      <Text style={styles.label}>Location</Text>
      <TextInput 
        value={location} 
        onChangeText={setLocation} 
        placeholder="San Francisco, CA"
        style={styles.input} 
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput 
        value={phoneNumber} 
        onChangeText={setPhoneNumber} 
        placeholder="+1 234 567 8900"
        keyboardType="phone-pad"
        style={styles.input} 
      />

      {/* Investor Type */}
      <Text style={styles.sectionTitle}>Investor Type *</Text>
      <View style={styles.chipContainer}>
        {investorTypes.map(t => (
          <TouchableOpacity 
            key={t} 
            onPress={() => setInvestorType(t)} 
            style={[styles.chip, investorType === t && styles.chipSelected]}
          >
            <Text style={[styles.chipText, investorType === t && styles.chipTextSelected]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Investment Range */}
      <Text style={styles.sectionTitle}>Investment Range (USD)</Text>
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Minimum</Text>
          <TextInput 
            value={minInvestment} 
            onChangeText={setMinInvestment} 
            placeholder="10000"
            keyboardType="numeric"
            style={styles.input} 
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Maximum</Text>
          <TextInput 
            value={maxInvestment} 
            onChangeText={setMaxInvestment} 
            placeholder="1000000"
            keyboardType="numeric"
            style={styles.input} 
          />
        </View>
      </View>

      {/* Previous Investments */}
      <Text style={styles.label}>Previous Investments (Optional)</Text>
      <TextInput 
        value={previousInvestments} 
        onChangeText={setPreviousInvestments} 
        placeholder="List your previous investments..."
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]} 
      />

      {/* Interested Industries */}
      <Text style={styles.sectionTitle}>Interested Industries *</Text>
      <View style={styles.chipContainer}>
        {allIndustries.map(ind => (
          <TouchableOpacity 
            key={ind} 
            onPress={() => toggleIndustry(ind)} 
            style={[styles.chip, interested.includes(ind) && styles.chipSelected]}
          >
            <Text style={[styles.chipText, interested.includes(ind) && styles.chipTextSelected]}>{ind}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Online Presence */}
      <Text style={styles.sectionTitle}>Online Presence</Text>
      
      <Text style={styles.label}>Website</Text>
      <TextInput 
        value={website} 
        onChangeText={setWebsite} 
        placeholder="https://yourwebsite.com"
        keyboardType="url"
        autoCapitalize="none"
        style={styles.input} 
      />

      <Text style={styles.label}>LinkedIn Profile</Text>
      <TextInput 
        value={linkedinUrl} 
        onChangeText={setLinkedinUrl} 
        placeholder="https://linkedin.com/in/yourprofile"
        keyboardType="url"
        autoCapitalize="none"
        style={styles.input} 
      />

      {/* Bio */}
      <Text style={styles.label}>About You</Text>
      <TextInput 
        value={bio} 
        onChangeText={setBio} 
        placeholder="Tell us about your investment philosophy, experience, and what you're looking for..."
        multiline
        numberOfLines={5}
        style={[styles.input, styles.textArea]} 
      />

      <View style={styles.buttonContainer}>
        <Button title="Save Profile" onPress={onSave} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#007bff',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    color: '#1565c0',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
