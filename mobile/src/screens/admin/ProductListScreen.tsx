import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, FontSize, Spacing } from '../../theme';
import { Product } from '../../lib/types';
import { AdminHomeStackParamList } from '../../navigation/types';
import { useProductStore } from '../../stores/product.store';
import EmptyState from '../../components/EmptyState';
import LoadingOverlay from '../../components/LoadingOverlay';

type Nav = StackNavigationProp<AdminHomeStackParamList, 'ProductList'>;
type Filter = 'all' | 'product' | 'process';

const tabs: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'product', label: '产品' },
  { key: 'process', label: '工序' },
];

export default function ProductListScreen() {
  const nav = useNavigation<Nav>();
  const { products, isLoading, fetchProducts } = useProductStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => { fetchProducts(false); }, [fetchProducts]));

  const filtered = products.filter((p) => {
    if (filter !== 'all' && p.type !== filter) return false;
    if (search && !p.name.includes(search) && !p.code.includes(search)) return false;
    return true;
  });

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={s.card} onPress={() => nav.navigate('ProductForm', { productId: item.id })}>
      <View style={s.cardRow}>
        <View style={s.cardInfo}>
          <Text style={s.code}>[{item.code}] {item.name}</Text>
          <Text style={s.price}>¥{item.unitPrice}/{item.unit}</Text>
        </View>
        <View style={s.badges}>
          <View style={[s.typeBadge, { backgroundColor: item.type === 'product' ? Colors.primary : '#9C27B0' }]}>
            <Text style={s.badgeText}>{item.type === 'product' ? '产品' : '工序'}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: item.status === 'active' ? Colors.success : Colors.disabled }]}>
            <Text style={s.badgeText}>{item.status === 'active' ? '启用' : '停用'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !products.length) return <LoadingOverlay />;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>产品管理</Text>
        <TouchableOpacity onPress={() => nav.navigate('ProductForm', {})} style={s.addBtn}>
          <Text style={s.addText}>添加</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabsRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, filter === t.key && s.tabActive]}
            onPress={() => setFilter(t.key)}
          >
            <Text style={[s.tabText, filter === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Searchbar
        placeholder="搜索编号或名称"
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
        ListEmptyComponent={<EmptyState message="暂无产品" />}
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
  tabsRow: { flexDirection: 'row', padding: Spacing.md, paddingBottom: 0 },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: 20, backgroundColor: Colors.card, marginRight: Spacing.sm,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.body, color: Colors.textSecondary },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  search: { marginHorizontal: Spacing.md, marginVertical: Spacing.sm, borderRadius: 10 },
  searchInput: { fontSize: FontSize.body },
  list: { padding: Spacing.md },
  card: {
    backgroundColor: Colors.card, borderRadius: 12,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  code: { fontSize: FontSize.body, fontWeight: '700', color: Colors.textPrimary },
  price: { fontSize: FontSize.body, color: Colors.success, marginTop: 2 },
  badges: { alignItems: 'flex-end' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
