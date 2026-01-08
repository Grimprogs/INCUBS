// SAVED SCREEN (Placeholder)
// Purpose: Show all items user has saved
// - Investors see saved STARTUPS
// - Startups see saved INVESTORS

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SavedScreenProps {
  userRole: 'investor' | 'startup';
}

export default function SavedScreen({ userRole }: SavedScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        <Text style={styles.headerSubtitle}>
          {userRole === 'investor' 
            ? 'Startups you\'ve saved'
            : 'Investors you\'ve saved'
          }
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          💾 Your saved items will appear here
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
});
