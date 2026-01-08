// Import React and hooks.
import React, { useState } from 'react';
// Import basic UI components from React Native.
import { View, Text, Pressable } from 'react-native';

// Define the props for the dropdown component.
type Props = {
  // List of string options to choose from.
  options: string[];
  // Current value selected.
  value: string;
  // Callback when selection changes.
  onChange: (val: string) => void;
};

// SimpleDropdown is a minimal dropdown that cycles options on press.
export default function SimpleDropdown({ options, value, onChange }: Props) {
  // Track the index locally only for UI convenience.
  const currentIndex = Math.max(0, options.indexOf(value));

  // Handler called when user presses the dropdown.
  function handlePress() {
    // Compute next index by wrapping around.
    const nextIndex = (currentIndex + 1) % options.length;
    // Call onChange with the new value.
    onChange(options[nextIndex]);
  }

  // Render a view with the current value and pressable area.
  return (
    <View style={{ marginVertical: 6 }}>
      {/* Show the selected option label. */}
      <Text style={{ marginBottom: 4 }}>Selected: {value}</Text>
      {/* Pressing this toggles to the next option. */}
      <Pressable onPress={handlePress} style={{ padding: 10, backgroundColor: '#eee' }}>
        <Text>Tap to change</Text>
      </Pressable>
    </View>
  );
}
