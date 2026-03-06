import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors, FontSize, Spacing } from '../theme';
import { formatCurrency } from '../lib/utils';

interface Props {
  pieceIncome: number;
  timeIncome: number;
  totalIncome: number;
}

export default function SummaryCard({ pieceIncome, timeIncome, totalIncome }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>计件收入</Text>
          <Text style={styles.value}>{formatCurrency(pieceIncome)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Text style={styles.label}>计时收入</Text>
          <Text style={styles.value}>{formatCurrency(timeIncome)}</Text>
        </View>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>合计</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalIncome)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  row: { flexDirection: 'row' },
  item: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  label: { fontSize: FontSize.caption, color: Colors.textSecondary },
  value: { fontSize: FontSize.body, color: Colors.textPrimary, fontWeight: '600', marginTop: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: { fontSize: FontSize.header, color: Colors.textPrimary, fontWeight: '600' },
  totalValue: { fontSize: FontSize.amount, color: Colors.success, fontWeight: '700' },
});
