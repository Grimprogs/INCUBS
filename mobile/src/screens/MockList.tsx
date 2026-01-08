// Import React.
import React from 'react';
// Import UI components.
import { View, Text, FlatList } from 'react-native';
// Import route prop to read parameters passed when navigating.
import { RouteProp, useRoute } from '@react-navigation/native';

// Define the route type to access params safely.
type RouteParams = RouteProp<{ MockList: { listType: 'startups' | 'investors' } }, 'MockList'>;

// MockList shows a simple read-only list of startups or investors.
export default function MockList() {
  // Get the route to read params.
  const route = useRoute<RouteParams>();
  // Read the list type param, default to startups if missing.
  const listType = route.params?.listType ?? 'startups';

  // Mock arrays we render.
  const startups = [
    { id: 's1', name: 'Acme Startup' },
    { id: 's2', name: 'Beta Labs' }
  ];
  const investors = [
    { id: 'i1', name: 'Jane Doe' },
    { id: 'i2', name: 'Seed VC' }
  ];

  // Choose which data to show based on listType.
  const data = listType === 'startups' ? startups : investors;

  // Render the list using FlatList and a simple item layout.
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>{listType === 'startups' ? 'Startups' : 'Investors'}</Text>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 8, borderBottomWidth: 1 }}>
            <Text>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}
