import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors, FontSize, Spacing } from '../theme';
import { formatCurrency } from '../lib/utils';

interface Props {
  type: 'piece' | 'time';
  title: string;
  detail: string;
  amount: number;
}

export default function RecordCard({ type, title, detail, amount }: Props) {
  const badgeColor = type === 'piece' ? Colors.primary : Colors.warning;
  const badgeText = type === 'piece' ? '计件' : '计时';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(amount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  info: { flex: 1 },
  title: { fontSize: FontSize.body, color: Colors.textPrimary, fontWeight: '500' },
  detail: { fontSize: FontSize.caption, color: Colors.textSecondary, marginTop: 2 },
  amount: { fontSize: FontSize.body, color: Colors.success, fontWeight: '700' },
});
