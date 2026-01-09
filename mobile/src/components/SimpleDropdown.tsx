// Import React and hooks.
import React, { useEffect, useRef } from 'react';
// Import basic UI components from React Native.
import { View, Text, ScrollView, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Pressable } from 'react-native';

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
  const scrollRef = useRef<ScrollView | null>(null);
  const ITEM_WIDTH = 120; // visual width of the option
  const ITEM_MARGIN = 6; // horizontal margin applied in styles.option
  const H_PADDING = 8; // contentContainerStyle horizontal padding
  const SLOT = ITEM_WIDTH + ITEM_MARGIN * 2; // actual snapping slot width

  const currentIndex = Math.max(0, options.indexOf(value));

  useEffect(() => {
    // Scroll to current index when value changes using the full slot width
    if (scrollRef.current) {
      const x = Math.max(0, currentIndex * SLOT - H_PADDING);
      scrollRef.current.scrollTo({ x, animated: true });
    }
  }, [currentIndex]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round((x + H_PADDING) / SLOT);
    const safeIndex = Math.max(0, Math.min(index, options.length - 1));
    const selected = options[safeIndex];
    if (selected !== value) onChange(selected);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Filter industry</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLOT}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: H_PADDING }}
      >
        {options.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={[styles.option, active && styles.optionActive, { width: ITEM_WIDTH }]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={1}>{opt}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 6 },
  label: { marginBottom: 6, color: '#444', fontSize: 12 },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: '#007bff',
  },
  optionText: { color: '#333' },
  optionTextActive: { color: '#fff', fontWeight: '700' },
});
