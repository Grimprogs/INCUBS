// Import React and hooks.
import React, { useState, useEffect } from 'react';
// Import UI components.
import { View, Text, TextInput, Switch, Button, TouchableOpacity, FlatList, Alert, ScrollView, StyleSheet } from 'react-native';
// Import navigation to go back after save.
import { useNavigation } from '@react-navigation/native';
// Import auth hook to get the authenticated user's ID.
import { useAuth } from '../context/AuthContext';
// Import Supabase client to save to the database.
import { supabase } from '../../supabaseClient';

// StartupProfileForm component contains comprehensive fields and save handler.
export default function StartupProfileForm() {
  // Navigation object to navigate to dashboard after save.
  const navigation = useNavigation();
  // Get the authenticated user so we can link the startup to their ID.
  const { user } = useAuth();

  // BASIC COMPANY INFO
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');

  // LEGAL INFO
  const companyTypes = ['Private Limited', 'LLP', 'Proprietorship', 'Partnership', 'Public Limited'];
  const [companyType, setCompanyType] = useState(companyTypes[0]);
  const [registered, setRegistered] = useState(true);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // TEAM INFO
  const directorOptions = ['1', '2', '3', '4', '5', '6+'];
  const [numDirectors, setNumDirectors] = useState(directorOptions[0]);
  const [teamSize, setTeamSize] = useState('');
  const [founderName, setFounderName] = useState('');
  const [founderExperience, setFounderExperience] = useState('');

  // BUSINESS INFO
  const industries = ['FinTech', 'SaaS', 'HealthTech', 'EdTech', 'AI', 'E-commerce', 'CleanTech', 'AgriTech', 'Logistics', 'Real Estate'];
  const [industry, setIndustry] = useState<string[]>([]);
  const [businessModel, setBusinessModel] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [competition, setCompetition] = useState('');

  // FINANCIAL INFO
  const [currentRevenue, setCurrentRevenue] = useState('');
  const [fundingRaised, setFundingRaised] = useState('');
  const [fundingStage, setFundingStage] = useState('');
  const [monthlyBurn, setMonthlyBurn] = useState('');

  // SOCIAL IMPACT
  const [socialImpact, setSocialImpact] = useState(false);
  const [impactDescription, setImpactDescription] = useState('');

  // Load existing profile data on mount
  useEffect(() => {
    async function loadProfile() {
      // Only load if user is a startup
      if (!user.id || user.role !== 'startup') return;

      try {
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (!error && data) {
          // Populate form with existing data
          setCompanyName(data.company_name || '');
          setTagline(data.tagline || '');
          setDescription(data.description || '');
          setFoundedYear(data.founded_year?.toString() || '');
          setLocation(data.location || '');
          setWebsite(data.website || '');
          setEmail(data.email || '');
          setCompanyType(data.company_type || companyTypes[0]);
          setRegistered(data.registered ?? true);
          setRegistrationNumber(data.registration_number || '');
          setGstNumber(data.gst_number || '');
          setPanNumber(data.pan_number || '');
          setNumDirectors(data.num_directors || directorOptions[0]);
          setTeamSize(data.team_size?.toString() || '');
          setFounderName(data.founder_name || '');
          setFounderExperience(data.founder_experience || '');
          setBusinessModel(data.business_model || '');
          setTargetMarket(data.target_market || '');
          setCompetition(data.competition || '');
          setCurrentRevenue(data.current_revenue?.toString() || '');
          setFundingRaised(data.funding_raised?.toString() || '');
          setFundingStage(data.funding_stage || '');
          setMonthlyBurn(data.monthly_burn?.toString() || '');
          setSocialImpact(data.social_impact ?? false);
          setImpactDescription(data.impact_description || '');
          
          if (data.industry) {
            const industryList = data.industry.split(',').filter(Boolean);
            if (industryList.length > 0) {
              setIndustry(industryList);
            }
          }
        }
      } catch (err) {
        console.log('No existing profile found, creating new one');
      }
    }

    loadProfile();
  }, [user.id, user.role]);

  // Handler when Save button is pressed.
  async function onSave() {
    if (!user.id) {
      Alert.alert('Error', 'No authenticated user');
      return;
    }

    // Validation
    if (!companyName.trim()) {
      Alert.alert('Error', 'Please enter company name');
      return;
    }

    if (industry.length === 0) {
      Alert.alert('Error', 'Please select at least one industry');
      return;
    }

    try {
      // Insert or update the startup row in the `startups` table.
      // Use upsert with onConflict to match on owner_id (prevents duplicates)
      const { error } = await supabase.from('startups').upsert({
        owner_id: user.id,
        company_name: companyName,
        tagline: tagline,
        description: description,
        founded_year: foundedYear ? parseInt(foundedYear) : null,
        location: location,
        website: website,
        email: email,
        company_type: companyType,
        registered: registered,
        registration_number: registrationNumber,
        gst_number: gstNumber,
        pan_number: panNumber,
        num_directors: numDirectors,
        team_size: teamSize ? parseInt(teamSize) : null,
        founder_name: founderName,
        founder_experience: founderExperience,
        industry: industry.join(','),
        business_model: businessModel,
        target_market: targetMarket,
        competition: competition,
        current_revenue: currentRevenue ? parseFloat(currentRevenue) : null,
        funding_raised: fundingRaised ? parseFloat(fundingRaised) : null,
        funding_stage: fundingStage,
        monthly_burn: monthlyBurn ? parseFloat(monthlyBurn) : null,
        social_impact: socialImpact,
        impact_description: impactDescription
      }, { onConflict: 'owner_id' });

      if (error) {
        console.error('Startup upsert error:', error);
        Alert.alert('Save failed', error.message || JSON.stringify(error));
        return;
      }

      // Success: show confirmation and take founders to the discovery home.
      Alert.alert('Success', 'Startup profile saved!');
      // @ts-ignore
      navigation.navigate('StartupHome');
    } catch (err) {
      Alert.alert('Error', 'Failed to save startup profile');
      console.error('startupProfileForm save error:', err);
    }
  }

  // Toggle industry selection
  function toggleIndustry(ind: string) {
    if (industry.includes(ind)) {
      setIndustry(industry.filter(i => i !== ind));
    } else {
      setIndustry([...industry, ind]);
    }
  }

  // Render the comprehensive form.
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Startup Profile</Text>

      {/* Info Message */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>🎯</Text>
        <Text style={styles.infoText}>
          Complete your profile to discover and connect with investors!
        </Text>
      </View>

      {/* Basic Company Information */}
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <Text style={styles.label}>Company Name *</Text>
      <TextInput 
        value={companyName} 
        onChangeText={setCompanyName} 
        placeholder="Enter your company name"
        style={styles.input} 
      />

      <Text style={styles.label}>Tagline</Text>
      <TextInput 
        value={tagline} 
        onChangeText={setTagline} 
        placeholder="One sentence description of your company"
        style={styles.input} 
      />

      <Text style={styles.label}>Description</Text>
      <TextInput 
        value={description} 
        onChangeText={setDescription} 
        placeholder="Detailed description of your business..."
        multiline
        numberOfLines={4}
        style={[styles.input, styles.textArea]} 
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Founded Year</Text>
          <TextInput 
            value={foundedYear} 
            onChangeText={setFoundedYear} 
            placeholder="2024"
            keyboardType="numeric"
            style={styles.input} 
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Location</Text>
          <TextInput 
            value={location} 
            onChangeText={setLocation} 
            placeholder="City, Country"
            style={styles.input} 
          />
        </View>
      </View>

      <Text style={styles.label}>Website</Text>
      <TextInput 
        value={website} 
        onChangeText={setWebsite} 
        placeholder="https://yourcompany.com"
        keyboardType="url"
        autoCapitalize="none"
        style={styles.input} 
      />

      <Text style={styles.label}>Business Email</Text>
      <TextInput 
        value={email} 
        onChangeText={setEmail} 
        placeholder="contact@yourcompany.com"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input} 
      />

      {/* Legal Information */}
      <Text style={styles.sectionTitle}>Legal Information</Text>
      
      <Text style={styles.label}>Company Type</Text>
      <View style={styles.chipContainer}>
        {companyTypes.map(t => (
          <TouchableOpacity 
            key={t} 
            onPress={() => setCompanyType(t)} 
            style={[styles.chip, companyType === t && styles.chipSelected]}
          >
            <Text style={[styles.chipText, companyType === t && styles.chipTextSelected]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Company Registered?</Text>
        <Switch value={registered} onValueChange={setRegistered} />
      </View>

      {registered && (
        <>
          <Text style={styles.label}>Registration Number</Text>
          <TextInput 
            value={registrationNumber} 
            onChangeText={setRegistrationNumber} 
            placeholder="Company registration number"
            style={styles.input} 
          />
        </>
      )}

      <Text style={styles.label}>GST Number</Text>
      <TextInput 
        value={gstNumber} 
        onChangeText={setGstNumber} 
        placeholder="22AAAAA0000A1Z5"
        style={styles.input} 
      />

      <Text style={styles.label}>PAN Number</Text>
      <TextInput 
        value={panNumber} 
        onChangeText={setPanNumber} 
        placeholder="AAAAA0000A"
        style={styles.input} 
      />

      {/* Team Information */}
      <Text style={styles.sectionTitle}>Team Information</Text>
      
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Number of Directors</Text>
          <View style={styles.chipContainer}>
            {directorOptions.map(d => (
              <TouchableOpacity 
                key={d} 
                onPress={() => setNumDirectors(d)} 
                style={[styles.chip, numDirectors === d && styles.chipSelected]}
              >
                <Text style={[styles.chipText, numDirectors === d && styles.chipTextSelected]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Total Team Size</Text>
          <TextInput 
            value={teamSize} 
            onChangeText={setTeamSize} 
            placeholder="25"
            keyboardType="numeric"
            style={styles.input} 
          />
        </View>
      </View>

      <Text style={styles.label}>Founder Name</Text>
      <TextInput 
        value={founderName} 
        onChangeText={setFounderName} 
        placeholder="John Doe"
        style={styles.input} 
      />

      <Text style={styles.label}>Founder Experience</Text>
      <TextInput 
        value={founderExperience} 
        onChangeText={setFounderExperience} 
        placeholder="Previous companies, experience..."
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]} 
      />

      {/* Business Information */}
      <Text style={styles.sectionTitle}>Business Information</Text>
      
      <Text style={styles.label}>Industries *</Text>
      <View style={styles.chipContainer}>
        {industries.map(ind => (
          <TouchableOpacity 
            key={ind} 
            onPress={() => toggleIndustry(ind)} 
            style={[styles.chip, industry.includes(ind) && styles.chipSelected]}
          >
            <Text style={[styles.chipText, industry.includes(ind) && styles.chipTextSelected]}>{ind}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Business Model</Text>
      <TextInput 
        value={businessModel} 
        onChangeText={setBusinessModel} 
        placeholder="B2B, B2C, Marketplace, SaaS..."
        style={styles.input} 
      />

      <Text style={styles.label}>Target Market</Text>
      <TextInput 
        value={targetMarket} 
        onChangeText={setTargetMarket} 
        placeholder="Who are your customers?"
        multiline
        numberOfLines={2}
        style={[styles.input, styles.textArea]} 
      />

      <Text style={styles.label}>Competition</Text>
      <TextInput 
        value={competition} 
        onChangeText={setCompetition} 
        placeholder="Who are your main competitors?"
        multiline
        numberOfLines={2}
        style={[styles.input, styles.textArea]} 
      />

      {/* Financial Information */}
      <Text style={styles.sectionTitle}>Financial Information</Text>
      
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Current Revenue (₹)</Text>
          <TextInput 
            value={currentRevenue} 
            onChangeText={setCurrentRevenue} 
            placeholder="5000000"
            keyboardType="numeric"
            style={styles.input} 
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Funding Raised (₹)</Text>
          <TextInput 
            value={fundingRaised} 
            onChangeText={setFundingRaised} 
            placeholder="20000000"
            keyboardType="numeric"
            style={styles.input} 
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Funding Stage</Text>
          <TextInput 
            value={fundingStage} 
            onChangeText={setFundingStage} 
            placeholder="Seed, Series A..."
            style={styles.input} 
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Monthly Burn (₹)</Text>
          <TextInput 
            value={monthlyBurn} 
            onChangeText={setMonthlyBurn} 
            placeholder="500000"
            keyboardType="numeric"
            style={styles.input} 
          />
        </View>
      </View>

      {/* Social Impact */}
      <Text style={styles.sectionTitle}>Social Impact</Text>
      
      <View style={styles.switchRow}>
        <Text style={styles.label}>Does your startup have social impact?</Text>
        <Switch value={socialImpact} onValueChange={setSocialImpact} />
      </View>

      {socialImpact && (
        <>
          <Text style={styles.label}>Impact Description</Text>
          <TextInput 
            value={impactDescription} 
            onChangeText={setImpactDescription} 
            placeholder="Describe your social impact..."
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]} 
          />
        </>
      )}

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
    color: '#007bff',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});
