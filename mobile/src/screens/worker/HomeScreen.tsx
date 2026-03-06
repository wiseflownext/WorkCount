import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, FontSize, Spacing } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useRecordStore } from '../../stores/record.store';
import { formatCurrency, formatDate, formatDuration } from '../../lib/utils';
import { WorkerHomeStackParamList } from '../../navigation/types';
import RecordCard from '../../components/RecordCard';

type Nav = StackNavigationProp<WorkerHomeStackParamList, 'WorkerHome'>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { currentUser } = useAuthStore();
  const {
    todayPieceRecords, todayTimeRecords, todayIncome,
    activeTimeRecord, isLoading, fetchTodayData, checkActiveTimer,
  } = useRecordStore();
  const [refreshing, setRefreshing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const uid = currentUser?.id || '';

  useFocusEffect(
    useCallback(() => {
      if (uid) {
        fetchTodayData(uid);
        checkActiveTimer(uid);
      }
    }, [uid])
  );

  useEffect(() => {
    if (activeTimeRecord) {
      const update = () => {
        const diff = Math.floor(
          (Date.now() - new Date(activeTimeRecord.startTime).getTime()) / 1000
        );
        setElapsed(diff);
      };
      update();
      timerRef.current = setInterval(update, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      setElapsed(0);
    }
  }, [activeTimeRecord]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTodayData(uid), checkActiveTimer(uid)]);
    setRefreshing(false);
  };

  const goPiece = () => {
    if (activeTimeRecord) {
      Alert.alert('提示', '计时中无法计件录入，请先结束计时');
      return;
    }
    nav.navigate('PieceEntry');
  };

  const allRecords = [
    ...todayPieceRecords.map((r) => ({ key: `p_${r.id}`, type: 'piece' as const, title: r.productName, detail: `${r.quantity} × ¥${r.unitPriceSnapshot}`, amount: r.amount })),
    ...todayTimeRecords.map((r) => ({ key: `t_${r.id}`, type: 'time' as const, title: r.workContent, detail: r.status === 'working' ? '进行中' : `${r.durationHalfHours || 0}个半小时`, amount: r.amount || 0 })),
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>你好, {currentUser?.name}</Text>
          <Text style={styles.date}>{formatDate(new Date())}</Text>
        </View>

        {activeTimeRecord && (
          <TouchableOpacity
            style={styles.timerBanner}
            onPress={() => nav.navigate('TimeClock')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="timer" size={24} color="#fff" />
            <Text style={styles.timerText}>
              正在计时中... {formatDuration(elapsed)}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.incomeCard}>
          <Text style={styles.incomeLabel}>今日收入</Text>
          <Text style={styles.incomeAmount}>
            {formatCurrency(todayIncome.total)}
          </Text>
          <View style={styles.incomeRow}>
            <Text style={styles.incomeSub}>计件 {formatCurrency(todayIncome.piece)}</Text>
            <Text style={styles.incomeSub}>计时 {formatCurrency(todayIncome.time)}</Text>
          </View>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: Colors.primary }]}
            onPress={goPiece}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="calculator" size={40} color="#fff" />
            <Text style={styles.bigBtnText}>计件录入</Text>
          </TouchableOpacity>
          <View style={{ width: Spacing.md }} />
          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: Colors.warning }]}
            onPress={() => nav.navigate('TimeClock')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="clock-outline" size={40} color="#fff" />
            <Text style={styles.bigBtnText}>计时打卡</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>今日记录</Text>
        {allRecords.length === 0 ? (
          <Text style={styles.empty}>暂无记录</Text>
        ) : (
          allRecords.map((r) => (
            <RecordCard
              key={r.key}
              type={r.type}
              title={r.title}
              detail={r.detail}
              amount={r.amount}
            />
          ))
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: Spacing.md },
  header: { paddingTop: Spacing.md, marginBottom: Spacing.md },
  greeting: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary },
  date: { fontSize: FontSize.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  timerText: { flex: 1, color: '#fff', fontSize: FontSize.body, fontWeight: '600', marginLeft: Spacing.sm },
  incomeCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  incomeLabel: { fontSize: FontSize.body, color: Colors.textSecondary },
  incomeAmount: { fontSize: 36, fontWeight: '800', color: Colors.success, marginVertical: Spacing.sm },
  incomeRow: { flexDirection: 'row', gap: Spacing.xl },
  incomeSub: { fontSize: FontSize.caption, color: Colors.textSecondary },
  btnRow: { flexDirection: 'row', marginBottom: Spacing.lg },
  bigBtn: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBtnText: { color: '#fff', fontSize: FontSize.button, fontWeight: '700', marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSize.header, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  empty: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl },
});
