import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth, Role } from '../context/AuthContext';

export default function RoleSelectionScreen() {
  const { setRole, signOut } = useAuth();

  const roles = [
    {
      role: 'startup',
      title: 'Startup',
      icon: 'ST',
      description: 'Access your dashboard and manage your startup profile',
      color: '#2563EB',
      bgColor: '#EFF6FF',
    },
    {
      role: 'investor',
      title: 'Investor',
      icon: 'IN',
      description: 'Browse startups and manage your investment portfolio',
      color: '#10B981',
      bgColor: '#D1FAE5',
    },
  ];

  function confirmRoleChange(role: Role) {
    Alert.alert(
      'Change role?',
      'Changing your role will remove existing role-specific data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, change role',
          style: 'destructive',
          onPress: () => setRole(role),
        },
      ],
      { cancelable: true }
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Please select your role to continue</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Role Cards */}
        <View style={styles.rolesContainer}>
          {roles.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.roleCard}
              onPress={() => confirmRoleChange(item.role as Role)}
              activeOpacity={0.7}
            >
              <View style={[styles.roleIconContainer, { backgroundColor: item.bgColor }]}>
                <Text style={[styles.roleIcon, { color: item.color }]}>{item.icon}</Text>
              </View>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>{item.title}</Text>
                <Text style={styles.roleDescription}>{item.description}</Text>
              </View>
              <View style={styles.roleArrow}>
                <Text style={styles.roleArrowText}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Select your role to access your personalized dashboard and features
          </Text>
        </View>
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
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  rolesContainer: {
    gap: 14,
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleIcon: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  roleArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  roleArrowText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginHorizontal: 16,
    letterSpacing: 1,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DC2626',
    marginBottom: 24,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});