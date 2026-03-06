import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, SegmentedButtons } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, Spacing } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import {
  getToday, getWeekRange, getMonthRange, addDays,
  formatDateShort, formatCurrency,
} from '../../lib/utils';
import { PeriodReport } from '../../lib/types';
import * as reportService from '../../services/report.service';
import DateNavigator from '../../components/DateNavigator';
import SummaryCard from '../../components/SummaryCard';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function PayslipScreen() {
  const { currentUser } = useAuthStore();
  const uid = currentUser?.id || '';
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [refDate, setRefDate] = useState(getToday());
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(false);

  const range = mode === 'week'
    ? getWeekRange(refDate)
    : getMonthRange(new Date(refDate).getFullYear(), new Date(refDate).getMonth() + 1);

  const fetchData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = await reportService.getPeriodReport(range.start, range.end, uid);
      setReport(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [uid, range.start, range.end]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const canNext = range.end < getToday();

  const navigate = (dir: number) => {
    if (mode === 'week') {
      setRefDate(addDays(refDate, dir * 7));
    } else {
      const d = new Date(refDate);
      d.setMonth(d.getMonth() + dir);
      setRefDate(d.toISOString().split('T')[0]);
    }
  };

  const navLabel = mode === 'week'
    ? `${formatDateShort(range.start)} - ${formatDateShort(range.end)}`
    : `${new Date(refDate).getFullYear()}年${new Date(refDate).getMonth() + 1}月`;

  const maxIncome = report
    ? Math.max(...report.dailyData.map((d) => d.total), 1)
    : 1;

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.screenTitle}>工资条</Text>

      <SegmentedButtons
        value={mode}
        onValueChange={(v) => setMode(v as 'week' | 'month')}
        buttons={[
          { value: 'week', label: '周报' },
          { value: 'month', label: '月报' },
        ]}
        style={styles.segment}
      />

      <DateNavigator
        label={navLabel}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        canNext={canNext}
      />

      {loading && <LoadingOverlay />}

      <ScrollView style={styles.scroll}>
        {report && (
          <>
            <SummaryCard
              pieceIncome={report.totalPieceIncome}
              timeIncome={report.totalTimeIncome}
              totalIncome={report.totalIncome}
            />

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>收入趋势</Text>
              <View style={styles.chartRow}>
                {report.dailyData.map((d) => (
                  <View key={d.date} style={styles.chartCol}>
                    <Text style={styles.chartAmount}>
                      {d.total > 0 ? `¥${Math.round(d.total)}` : ''}
                    </Text>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: Math.max((d.total / maxIncome) * 120, 2),
                          backgroundColor: d.total > 0 ? Colors.primary : Colors.border,
                        },
                      ]}
                    />
                    <Text style={styles.chartLabel}>{formatDateShort(d.date).replace('月', '/').replace('日', '')}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.tableCellDate]}>日期</Text>
                <Text style={styles.tableCell}>计件</Text>
                <Text style={styles.tableCell}>计时</Text>
                <Text style={[styles.tableCell, styles.tableCellTotal]}>合计</Text>
              </View>
              {report.dailyData.map((d) => (
                <View key={d.date} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellDate]}>{formatDateShort(d.date)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(d.pieceIncome)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(d.timeIncome)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellTotal]}>{formatCurrency(d.total)}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.md },
  screenTitle: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary, paddingVertical: Spacing.md },
  segment: { marginBottom: Spacing.md },
  scroll: { flex: 1 },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  chartTitle: { fontSize: FontSize.body, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBar: { width: 20, borderRadius: 4, minHeight: 2 },
  chartAmount: { fontSize: 10, color: Colors.textSecondary, marginBottom: 2 },
  chartLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 4 },
  tableCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  tableCell: { flex: 1, fontSize: FontSize.caption, color: Colors.textSecondary, textAlign: 'center' },
  tableCellDate: { flex: 1.2, textAlign: 'left' },
  tableCellTotal: { fontWeight: '700', color: Colors.textPrimary },
});
