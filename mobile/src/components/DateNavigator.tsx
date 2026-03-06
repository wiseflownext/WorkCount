import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../theme';

interface Props {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  canNext?: boolean;
}

export default function DateNavigator({ label, onPrev, onNext, canNext = true }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPrev} style={styles.btn}>
        <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.primary} />
      </TouchableOpacity>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onNext} style={styles.btn} disabled={!canNext}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={28}
          color={canNext ? Colors.primary : Colors.disabled}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  btn: { padding: Spacing.sm },
  label: { fontSize: FontSize.body, fontWeight: '600', color: Colors.textPrimary },
});
