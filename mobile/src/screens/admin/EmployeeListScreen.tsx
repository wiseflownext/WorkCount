import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, FontSize, Spacing } from '../../theme';
import { User } from '../../lib/types';
import { AdminHomeStackParamList } from '../../navigation/types';
import { getAllWorkers } from '../../services/auth.service';
import LoadingOverlay from '../../components/LoadingOverlay';
import EmptyState from '../../components/EmptyState';

type Nav = StackNavigationProp<AdminHomeStackParamList, 'EmployeeList'>;

export default function EmployeeListScreen() {
  const nav = useNavigation<Nav>();
  const [workers, setWorkers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await getAllWorkers();
      setWorkers(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = workers.filter(
    (w) => w.name.includes(search) || w.phone.includes(search),
  );

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={s.card} onPress={() => nav.navigate('EmployeeForm', { userId: item.id })}>
      <View style={s.cardRow}>
        <View style={s.cardInfo}>
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.phone}>{item.phone}</Text>
          <Text style={s.rate}>时薪: ¥{item.hourlyRate}/半小时</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: item.status === 'active' ? Colors.success : Colors.disabled }]}>
          <Text style={s.statusText}>{item.status === 'active' ? '在职' : '离职'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>员工管理</Text>
        <TouchableOpacity onPress={() => nav.navigate('EmployeeForm', {})} style={s.addBtn}>
          <Text style={s.addText}>添加</Text>
        </TouchableOpacity>
      </View>
      <Searchbar
        placeholder="搜索姓名或手机号"
        value={search}
        onChangeText={setSearch}
        style={s.search}
        inputStyle={s.searchInput}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        ListEmptyComponent={<EmptyState message="暂无员工" />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.card,
  },
  backBtn: { padding: Spacing.xs },
  title: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { padding: Spacing.xs },
  addText: { fontSize: FontSize.body, color: Colors.primary, fontWeight: '600' },
  search: { marginHorizontal: Spacing.md, marginVertical: Spacing.sm, borderRadius: 10 },
  searchInput: { fontSize: FontSize.body },
  list: { padding: Spacing.md },
  card: {
    backgroundColor: Colors.card, borderRadius: 12,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  name: { fontSize: FontSize.body, fontWeight: '700', color: Colors.textPrimary },
  phone: { fontSize: FontSize.body, color: Colors.textSecondary, marginTop: 2 },
  rate: { fontSize: FontSize.caption, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: FontSize.caption, fontWeight: '600' },
});
