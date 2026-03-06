import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Colors, FontSize, Spacing } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useProductStore } from '../../stores/product.store';
import { useRecordStore } from '../../stores/record.store';
import { formatCurrency } from '../../lib/utils';
import { Product } from '../../lib/types';

export default function PieceEntryScreen() {
  const nav = useNavigation();
  const { currentUser } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const { activeTimeRecord, addPieceRecord } = useRecordStore();

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [resultAmount, setResultAmount] = useState(0);

  useEffect(() => {
    if (activeTimeRecord) {
      Alert.alert('提示', '计时中无法计件', [
        { text: '返回', onPress: () => nav.goBack() },
      ]);
      return;
    }
    fetchProducts(true);
  }, []);

  const filtered = products.filter(
    (p) => p.name.includes(search) || p.code.includes(search)
  );

  const total = selected ? quantity * selected.unitPrice : 0;

  const handleSubmit = async () => {
    if (!selected || !currentUser) return;
    setSubmitting(true);
    try {
      const rec = await addPieceRecord(
        currentUser.id, selected.id, selected.name, quantity, selected.unitPrice
      );
      setResultAmount(rec.amount);
      setStep(3);
      Toast.show({ type: 'success', text1: '录入成功' });
    } catch {
      Toast.show({ type: 'error', text1: '录入失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const adjustQty = (delta: number) => {
    setQuantity((q) => Math.max(1, q + delta));
  };

  if (step === 3) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => nav.goBack()} title="录入成功" />
        <View style={styles.successContainer}>
          <MaterialCommunityIcons name="check-circle" size={80} color={Colors.success} />
          <Text style={styles.successAmount}>{formatCurrency(resultAmount)}</Text>
          <Text style={styles.successLabel}>已计入今日收入</Text>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => { setStep(1); setSelected(null); setQuantity(1); }}
          >
            <Text style={styles.continueBtnText}>继续录入</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.goBack()} style={{ marginTop: Spacing.md }}>
            <Text style={styles.backLink}>返回首页</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 2 && selected) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => setStep(1)} title="输入数量" />
        <View style={styles.stepContent}>
          <Text style={styles.productName}>{selected.name}</Text>
          <Text style={styles.productPrice}>
            单价: {formatCurrency(selected.unitPrice)}/{selected.unit}
          </Text>

          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => adjustQty(-1)}>
              <MaterialCommunityIcons name="minus" size={28} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => adjustQty(1)}>
              <MaterialCommunityIcons name="plus" size={28} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            {[10, 20, 50, 100].map((n) => (
              <TouchableOpacity
                key={n}
                style={styles.quickBtn}
                onPress={() => setQuantity(n)}
              >
                <Text style={styles.quickBtnText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.calcCard}>
            <Text style={styles.calcText}>
              {quantity} × {formatCurrency(selected.unitPrice)} =
            </Text>
            <Text style={styles.calcTotal}>{formatCurrency(total)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>确认提交</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header onBack={() => nav.goBack()} title="选择产品" />
      <View style={styles.stepContent}>
        <Searchbar
          placeholder="搜索产品名称或编码"
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={{ fontSize: FontSize.body }}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.productCard,
                selected?.id === item.id && styles.productCardSelected,
              ]}
              onPress={() => { setSelected(item); setStep(2); }}
            >
              <Text style={styles.productCode}>[{item.code}]</Text>
              <Text style={styles.productItemName}>{item.name}</Text>
              <Text style={styles.productItemPrice}>
                {formatCurrency(item.unitPrice)}/{item.unit}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>无匹配产品</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerBack}>
        <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
  },
  headerBack: { padding: Spacing.sm },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.header, fontWeight: '700', color: Colors.textPrimary },
  stepContent: { flex: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  searchbar: { marginBottom: Spacing.md, backgroundColor: Colors.card },
  productCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productCardSelected: { borderColor: Colors.primary },
  productCode: { fontSize: FontSize.caption, color: Colors.textSecondary, marginRight: Spacing.sm },
  productItemName: { flex: 1, fontSize: FontSize.body, fontWeight: '600', color: Colors.textPrimary },
  productItemPrice: { fontSize: FontSize.body, color: Colors.success, fontWeight: '700' },
  productName: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  productPrice: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  qtyBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyText: { fontSize: 40, fontWeight: '800', color: Colors.textPrimary, marginHorizontal: Spacing.xl },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  quickBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickBtnText: { fontSize: FontSize.body, fontWeight: '600', color: Colors.primary },
  calcCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  calcText: { fontSize: FontSize.body, color: Colors.textSecondary },
  calcTotal: { fontSize: FontSize.amount, fontWeight: '800', color: Colors.success, marginTop: Spacing.sm },
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  submitText: { color: '#fff', fontSize: FontSize.button, fontWeight: '700' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successAmount: { fontSize: 40, fontWeight: '800', color: Colors.success, marginTop: Spacing.lg },
  successLabel: { fontSize: FontSize.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  continueBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.xl,
  },
  continueBtnText: { color: '#fff', fontSize: FontSize.button, fontWeight: '700' },
  backLink: { fontSize: FontSize.body, color: Colors.primary },
  emptyText: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl },
});
