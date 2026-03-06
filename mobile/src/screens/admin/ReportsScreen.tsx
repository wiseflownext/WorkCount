import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Colors, FontSize, Spacing } from '../../theme';
import { User, PeriodReport } from '../../lib/types';
import {
  formatCurrency, formatDateShort, getToday, addDays,
  getWeekRange, getMonthRange,
} from '../../lib/utils';
import { getPeriodReport } from '../../services/report.service';
import { getAllWorkers } from '../../services/auth.service';
import SummaryCard from '../../components/SummaryCard';
import DateNavigator from '../../components/DateNavigator';
import LoadingOverlay from '../../components/LoadingOverlay';

type Mode = 'day' | 'week' | 'month';
const modes: { key: Mode; label: string }[] = [
  { key: 'day', label: '日报' },
  { key: 'week', label: '周报' },
  { key: 'month', label: '月报' },
];

export default function ReportsScreen() {
  const [mode, setMode] = useState<Mode>('day');
  const [date, setDate] = useState(getToday());
  const [month, setMonth] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() + 1 });
  const [workers, setWorkers] = useState<User[]>([]);
  const [userId, setUserId] = useState<string>('all');
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getAllWorkers().then(setWorkers); }, []);

  const getRange = useCallback(() => {
    if (mode === 'day') return { start: date, end: date };
    if (mode === 'week') return getWeekRange(date);
    const r = getMonthRange(month.y, month.m);
    return { start: r.start, end: r.end };
  }, [mode, date, month]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getRange();
      const r = await getPeriodReport(start, end, userId === 'all' ? undefined : userId);
      setReport(r);
    } finally {
      setLoading(false);
    }
  }, [getRange, userId]);

  useEffect(() => { load(); }, [load]);

  const onPrev = () => {
    if (mode === 'day') setDate(addDays(date, -1));
    else if (mode === 'week') setDate(addDays(date, -7));
    else setMonth((p) => p.m === 1 ? { y: p.y - 1, m: 12 } : { y: p.y, m: p.m - 1 });
  };

  const onNext = () => {
    if (mode === 'day') setDate(addDays(date, 1));
    else if (mode === 'week') setDate(addDays(date, 7));
    else setMonth((p) => p.m === 12 ? { y: p.y + 1, m: 1 } : { y: p.y, m: p.m + 1 });
  };

  const dateLabel = () => {
    if (mode === 'day') return formatDateShort(date);
    if (mode === 'week') {
      const r = getWeekRange(date);
      return `${formatDateShort(r.start)} - ${formatDateShort(r.end)}`;
    }
    return `${month.y}年${month.m}月`;
  };

  const canNext = () => {
    const today = getToday();
    if (mode === 'day') return date < today;
    if (mode === 'week') return addDays(date, 7) <= today;
    const now = new Date();
    return month.y < now.getFullYear() || (month.y === now.getFullYear() && month.m < now.getMonth() + 1);
  };

  return (
    <SafeAreaView style={s.safe}>
      {loading && <LoadingOverlay />}
      <ScrollView style={s.scroll}>
        <Text style={s.pageTitle}>数据报表</Text>

        <View style={s.modesRow}>
          {modes.map((m) => (
            <View key={m.key} style={[s.modeBtn, mode === m.key && s.modeBtnActive]}>
              <Text
                style={[s.modeBtnText, mode === m.key && s.modeBtnTextActive]}
                onPress={() => setMode(m.key)}
              >
                {m.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.pickerWrap}>
          <Picker selectedValue={userId} onValueChange={setUserId} style={s.picker}>
            <Picker.Item label="全部员工" value="all" />
            {workers.map((w) => <Picker.Item key={w.id} label={w.name} value={w.id} />)}
          </Picker>
        </View>

        <DateNavigator label={dateLabel()} onPrev={onPrev} onNext={onNext} canNext={canNext()} />

        {report && (
          <>
            <SummaryCard
              pieceIncome={report.totalPieceIncome}
              timeIncome={report.totalTimeIncome}
              totalIncome={report.totalIncome}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={s.tableHeader}>
                  <Text style={[s.th, { width: 90 }]}>日期</Text>
                  <Text style={[s.th, { width: 100 }]}>计件收入</Text>
                  <Text style={[s.th, { width: 100 }]}>计时收入</Text>
                  <Text style={[s.th, { width: 100 }]}>日合计</Text>
                </View>
                {report.dailyData.map((d) => (
                  <View key={d.date} style={s.tableRow}>
                    <Text style={[s.td, { width: 90 }]}>{formatDateShort(d.date)}</Text>
                    <Text style={[s.td, { width: 100 }]}>{formatCurrency(d.pieceIncome)}</Text>
                    <Text style={[s.td, { width: 100 }]}>{formatCurrency(d.timeIncome)}</Text>
                    <Text style={[s.td, s.tdBold, { width: 100 }]}>{formatCurrency(d.total)}</Text>
                  </View>
                ))}
                <View style={s.tableRow}>
                  <Text style={[s.td, s.tdBold, { width: 90 }]}>合计</Text>
                  <Text style={[s.td, s.tdBold, { width: 100 }]}>{formatCurrency(report.totalPieceIncome)}</Text>
                  <Text style={[s.td, s.tdBold, { width: 100 }]}>{formatCurrency(report.totalTimeIncome)}</Text>
                  <Text style={[s.td, s.tdBold, { width: 100 }]}>{formatCurrency(report.totalIncome)}</Text>
                </View>
              </View>
            </ScrollView>
          </>
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: Spacing.md },
  pageTitle: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  modesRow: { flexDirection: 'row', marginBottom: Spacing.md },
  modeBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: 20, backgroundColor: Colors.card, marginRight: Spacing.sm,
  },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeBtnText: { fontSize: FontSize.body, color: Colors.textSecondary },
  modeBtnTextActive: { color: '#fff', fontWeight: '600' },
  pickerWrap: {
    backgroundColor: Colors.card, borderRadius: 10, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  picker: { height: 50, fontSize: FontSize.body },
  tableHeader: {
    flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 8,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs, marginTop: Spacing.md,
  },
  th: { fontSize: FontSize.caption, fontWeight: '700', color: '#fff', textAlign: 'center' },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
  },
  td: { fontSize: FontSize.caption, color: Colors.textPrimary, textAlign: 'center' },
  tdBold: { fontWeight: '700' },
});
