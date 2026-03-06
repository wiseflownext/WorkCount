import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, Spacing } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { getToday, addDays, formatDate } from '../../lib/utils';
import { DailyReport } from '../../lib/types';
import * as reportService from '../../services/report.service';
import DateNavigator from '../../components/DateNavigator';
import SummaryCard from '../../components/SummaryCard';
import RecordCard from '../../components/RecordCard';
import EmptyState from '../../components/EmptyState';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function DailyReportScreen() {
  const { currentUser } = useAuthStore();
  const [date, setDate] = useState(getToday());
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const uid = currentUser?.id || '';

  const fetchData = useCallback(async (d: string) => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = await reportService.getDailyReport(uid, d);
      setReport(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [uid]);

  useFocusEffect(
    useCallback(() => { fetchData(date); }, [date, fetchData])
  );

  const canNext = date < getToday();

  const records = report ? [
    ...report.pieceRecords.map((r) => ({
      key: `p_${r.id}`,
      type: 'piece' as const,
      title: r.productName,
      detail: `${r.quantity} × ¥${r.unitPriceSnapshot}`,
      amount: r.amount,
    })),
    ...report.timeRecords.map((r) => ({
      key: `t_${r.id}`,
      type: 'time' as const,
      title: r.workContent,
      detail: `${r.durationHalfHours || 0}个半小时`,
      amount: r.amount || 0,
    })),
  ] : [];

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.screenTitle}>日报</Text>
      <DateNavigator
        label={formatDate(date)}
        onPrev={() => setDate(addDays(date, -1))}
        onNext={() => setDate(addDays(date, 1))}
        canNext={canNext}
      />
      {loading && <LoadingOverlay />}
      {report && (
        <SummaryCard
          pieceIncome={report.pieceIncome}
          timeIncome={report.timeIncome}
          totalIncome={report.totalIncome}
        />
      )}
      <FlatList
        data={records}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <RecordCard type={item.type} title={item.title} detail={item.detail} amount={item.amount} />
        )}
        ListEmptyComponent={!loading ? <EmptyState message="当日暂无记录" /> : null}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.md },
  screenTitle: {
    fontSize: FontSize.title,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
});
