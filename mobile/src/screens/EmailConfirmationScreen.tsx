import React, { useEffect } from 'react';
import { View } from 'react-native';

// Legacy screen kept to avoid navigation errors. Immediately redirect
// users to RoleSelection if this screen is ever reached.
export default function EmailConfirmationScreen({ navigation }: { navigation: any }) {
  useEffect(() => {
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
  }, [navigation]);

  return <View />;
}