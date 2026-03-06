import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, FontSize, Spacing } from '../../theme';
import { AdminDashboard, ActivityRecord } from '../../lib/types';
import { AdminHomeStackParamList } from '../../navigation/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getAdminDashboard } from '../../services/report.service';
import LoadingOverlay from '../../components/LoadingOverlay';

type Nav = StackNavigationProp<AdminHomeStackParamList, 'AdminHome'>;

const actions = [
  { key: 'employee', label: '员工管理', icon: 'account-group' as const, route: 'EmployeeList' as const },
  { key: 'product', label: '产品管理', icon: 'package-variant' as const, route: 'ProductList' as const },
  { key: 'report', label: '数据报表', icon: 'chart-bar' as const, tab: 'ReportsTab' },
  { key: 'export', label: '数据导出', icon: 'download' as const, tab: 'ExportTab' },
];

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const parentNav = useNavigation<any>();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await getAdminDashboard();
      setData(d);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const onAction = (a: typeof actions[number]) => {
    if (a.route) nav.navigate(a.route);
    else if (a.tab) parentNav.navigate(a.tab);
  };

  if (loading && !data) return <LoadingOverlay />;

  const stats = [
    { label: '今日在岗', value: `${data?.activeWorkers ?? 0}人`, icon: 'account-check' as const },
    { label: '今日产出', value: formatCurrency(data?.totalOutput ?? 0), icon: 'currency-cny' as const },
    { label: '正在计时', value: `${data?.workingCount ?? 0}人`, icon: 'timer-outline' as const },
  ];

  const renderRecord = ({ item }: { item: ActivityRecord }) => (
    <View style={s.recordRow}>
      <Text style={s.recordName}>{item.workerName}</Text>
      <View style={[s.typeBadge, { backgroundColor: item.type === 'piece' ? Colors.primary : Colors.warning }]}>
        <Text style={s.typeBadgeText}>{item.type === 'piece' ? '计件' : '计时'}</Text>
      </View>
      <Text style={s.recordProduct} numberOfLines={1}>{item.productName}</Text>
      <Text style={s.recordAmount}>{formatCurrency(item.amount)}</Text>
      <Text style={s.recordTime}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={s.header}>
          <Text style={s.title}>管理员面板</Text>
          <Text style={s.date}>{formatDate(new Date())}</Text>
        </View>

        <View style={s.statsRow}>
          {stats.map((st) => (
            <View key={st.label} style={s.statCard}>
              <MaterialCommunityIcons name={st.icon} size={24} color={Colors.primary} />
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.grid}>
          {actions.map((a) => (
            <TouchableOpacity key={a.key} style={s.actionBtn} onPress={() => onAction(a)}>
              <MaterialCommunityIcons name={a.icon} size={32} color={Colors.primary} />
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>今日动态</Text>
        {data?.recentRecords?.length ? (
          <FlatList
            data={data.recentRecords}
            keyExtractor={(i) => i.id}
            renderItem={renderRecord}
            scrollEnabled={false}
          />
        ) : (
          <Text style={s.empty}>暂无动态</Text>
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: Spacing.md },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary },
  date: { fontSize: FontSize.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12,
    padding: Spacing.md, alignItems: 'center', marginHorizontal: Spacing.xs,
  },
  statValue: { fontSize: FontSize.body, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.xs },
  statLabel: { fontSize: FontSize.caption, color: Colors.textSecondary, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.lg },
  actionBtn: {
    width: '48%', backgroundColor: Colors.card, borderRadius: 12,
    padding: Spacing.lg, alignItems: 'center', margin: '1%',
  },
  actionLabel: { fontSize: FontSize.body, color: Colors.textPrimary, marginTop: Spacing.sm, fontWeight: '500' },
  sectionTitle: { fontSize: FontSize.header, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  recordRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: 10, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  recordName: { fontSize: FontSize.body, fontWeight: '600', color: Colors.textPrimary, width: 60 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginHorizontal: Spacing.sm },
  typeBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  recordProduct: { flex: 1, fontSize: FontSize.body, color: Colors.textSecondary },
  recordAmount: { fontSize: FontSize.body, fontWeight: '700', color: Colors.success, marginHorizontal: Spacing.sm },
  recordTime: { fontSize: FontSize.caption, color: Colors.textSecondary },
  empty: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl },
});
