import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';
import RoleSelectionScreen from '../src/screens/RoleSelectionScreen';

export default function StartupProfileForm() {
  const navigation = useNavigation();
  const { user, setRole } = useAuth();

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
      if (!user.id || user.role !== 'startup') return;

      try {
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (!error && data) {
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

  async function onSave() {
    if (!user.id) {
      Alert.alert('Error', 'No authenticated user');
      return;
    }

    if (!companyName.trim()) {
      Alert.alert('Error', 'Please enter company name');
      return;
    }

    if (industry.length === 0) {
      Alert.alert('Error', 'Please select at least one industry');
      return;
    }

    try {
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

      Alert.alert('Success', 'Startup profile saved!');
      // @ts-ignore
      navigation.navigate('StartupHome');
    } catch (err) {
      Alert.alert('Error', 'Failed to save startup profile');
      console.error('startupProfileForm save error:', err);
    }
  }

  function toggleIndustry(ind: string) {
    if (industry.includes(ind)) {
      setIndustry(industry.filter(i => i !== ind));
    } else {
      setIndustry([...industry, ind]);
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
        <Text style={styles.headerTitle}>Startup Profile</Text>
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
            Complete your profile to discover and connect with investors
          </Text>
        </View>

        {/* Basic Company Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>CO</Text>
            </View>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          
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
        </View>

        {/* Legal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>LG</Text>
            </View>
            <Text style={styles.sectionTitle}>Legal Information</Text>
          </View>
          
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
        </View>

        {/* Team Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>TM</Text>
            </View>
            <Text style={styles.sectionTitle}>Team Information</Text>
          </View>
          
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

          <Text style={styles.label}>Total Team Size</Text>
          <TextInput 
            value={teamSize} 
            onChangeText={setTeamSize} 
            placeholder="25"
            keyboardType="numeric"
            style={styles.input} 
          />

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
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>BI</Text>
            </View>
            <Text style={styles.sectionTitle}>Business Information</Text>
          </View>
          
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
        </View>

        {/* Financial Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>FN</Text>
            </View>
            <Text style={styles.sectionTitle}>Financial Information</Text>
          </View>
          
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
        </View>

        {/* Social Impact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIconText}>SI</Text>
            </View>
            <Text style={styles.sectionTitle}>Social Impact</Text>
          </View>
          
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
    color: '#2563EB',
    fontWeight: '600',
    marginTop: -2,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563EB',
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
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
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
    backgroundColor: '#2563EB',
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
    color: '#1E40AF',
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
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#2563EB',
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