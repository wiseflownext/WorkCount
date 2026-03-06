import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../theme';

interface Props {
  message?: string;
}

export default function EmptyState({ message = '暂无数据' }: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="inbox-outline" size={64} color={Colors.disabled} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl * 2 },
  text: { fontSize: FontSize.body, color: Colors.textSecondary, marginTop: Spacing.md },
});
