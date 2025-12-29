import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';

export default function InvestorProfileForm() {
  const navigation = useNavigation();
  const { user, setRole } = useAuth();

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

  useEffect(() => {
    async function loadProfile() {
      if (!user.id || user.role !== 'investor') return;

      try {
        const { data, error } = await supabase
          .from('investors')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (!error && data) {
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

  function toggleIndustry(ind: string) {
    if (interested.includes(ind)) {
      setInterested(interested.filter(i => i !== ind));
    } else {
      setInterested([...interested, ind]);
    }
  }

  async function onSave() {
    if (!user.id) {
      Alert.alert('Error', 'No authenticated user');
      return;
    }

    if (!investorName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (interested.length === 0) {
      Alert.alert('Error', 'Please select at least one interested industry');
      return;
    }

    try {
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

      Alert.alert('Success', 'Investor profile saved!');
      // @ts-ignore
      navigation.navigate('InvestorHome');
    } catch (err) {
      Alert.alert('Error', 'Failed to save investor profile');
      console.error('investorProfileForm save error:', err);
    }
  }

  function onBack() {
    setRole(null);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <View style={styles.backIconContainer}>
            <Text style={styles.backIcon}>‹</Text>
          </View>
          <Text style={styles.backButtonText}></Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investor Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Message */}
        <View style={styles.infoBox}>
          <View style={styles.infoIconContainer}>
            <Text style={styles.infoIconText}>i</Text>
          </View>
          <Text style={styles.infoText}>
            Complete your profile to discover and invest in startups
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>BS</Text>
            </View>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          
          <Text style={styles.label}>Full Name *</Text>
          <TextInput 
            value={investorName} 
            onChangeText={setInvestorName} 
            placeholder="John Doe"
            style={styles.input} 
          />

          <Text style={styles.label}>Company Name</Text>
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
        </View>

        {/* Investor Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>TP</Text>
            </View>
            <Text style={styles.sectionTitle}>Investor Type</Text>
          </View>
          
          <Text style={styles.label}>Type *</Text>
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
        </View>

        {/* Investment Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>IN</Text>
            </View>
            <Text style={styles.sectionTitle}>Investment Range</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Minimum (₹)</Text>
              <TextInput 
                value={minInvestment} 
                onChangeText={setMinInvestment} 
                placeholder="1000000"
                keyboardType="numeric"
                style={styles.input} 
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Maximum (₹)</Text>
              <TextInput 
                value={maxInvestment} 
                onChangeText={setMaxInvestment} 
                placeholder="100000000"
                keyboardType="numeric"
                style={styles.input} 
              />
            </View>
          </View>

          <Text style={styles.label}>Previous Investments</Text>
          <TextInput 
            value={previousInvestments} 
            onChangeText={setPreviousInvestments} 
            placeholder="List your previous investments..."
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]} 
          />
        </View>

        {/* Interested Industries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>ID</Text>
            </View>
            <Text style={styles.sectionTitle}>Interested Industries</Text>
          </View>
          
          <Text style={styles.label}>Industries *</Text>
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
        </View>

        {/* Online Presence */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>ON</Text>
            </View>
            <Text style={styles.sectionTitle}>Online Presence</Text>
          </View>
          
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

          <Text style={styles.label}>About You</Text>
          <TextInput 
            value={bio} 
            onChangeText={setBio} 
            placeholder="Tell us about your investment philosophy, experience, and what you're looking for..."
            multiline
            numberOfLines={5}
            style={[styles.input, styles.textArea]} 
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={onSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: '600',
    marginTop: -2,
  },
  backButtonText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 70,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBox: {
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoText: {
    flex: 1,
    color: '#065F46',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});