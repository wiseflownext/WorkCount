import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, FontSize, Spacing } from '../../theme';
import { Product } from '../../lib/types';
import { AdminHomeStackParamList } from '../../navigation/types';
import { useProductStore } from '../../stores/product.store';
import { useAuthStore } from '../../stores/auth.store';

type Nav = StackNavigationProp<AdminHomeStackParamList, 'ProductForm'>;
type Route = RouteProp<AdminHomeStackParamList, 'ProductForm'>;

const types: { key: Product['type']; label: string }[] = [
  { key: 'product', label: '产品' },
  { key: 'process', label: '工序' },
];
const units: Product['unit'][] = ['件', '个', '组', '套'];

export default function ProductFormScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const productId = route.params?.productId;
  const isEdit = !!productId;
  const { products, addProduct, updateProduct } = useProductStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<Product['type']>('product');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<Product['unit']>('件');
  const [remark, setRemark] = useState('');
  const [active, setActive] = useState(true);
  const [origPrice, setOrigPrice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const p = products.find((x) => x.id === productId);
    if (p) {
      setCode(p.code);
      setName(p.name);
      setType(p.type);
      setPrice(String(p.unitPrice));
      setUnit(p.unit);
      setRemark(p.remark || '');
      setActive(p.status === 'active');
      setOrigPrice(p.unitPrice);
    }
  }, [productId, isEdit, products]);

  const priceChanged = isEdit && origPrice !== null && price !== '' && Number(price) !== origPrice;

  const validate = (): string | null => {
    if (!code.trim()) return '请输入编号';
    if (!name.trim()) return '请输入名称';
    if (!price || Number(price) <= 0) return '单价须大于0';
    return null;
  };

  const onSave = async () => {
    const err = validate();
    if (err) { Alert.alert('提示', err); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await updateProduct(productId!, {
          code: code.trim(), name: name.trim(), type, unitPrice: Number(price),
          unit, remark: remark.trim() || undefined, status: active ? 'active' : 'inactive',
        }, currentUser?.id);
      } else {
        await addProduct({
          code: code.trim(), name: name.trim(), type, unitPrice: Number(price),
          unit, remark: remark.trim() || undefined, status: 'active',
        });
      }
      Alert.alert('成功', isEdit ? '已更新' : '已添加', [{ text: '确定', onPress: () => nav.goBack() }]);
    } catch (e: any) {
      Alert.alert('错误', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>{isEdit ? '编辑产品' : '添加产品'}</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={s.form} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>编号</Text>
        <TextInput style={s.input} value={code} onChangeText={setCode} placeholder="唯一编号" />

        <Text style={s.label}>名称</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="产品名称" />

        <Text style={s.label}>类型</Text>
        <View style={s.segRow}>
          {types.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.seg, type === t.key && s.segActive]}
              onPress={() => setType(t.key)}
            >
              <Text style={[s.segText, type === t.key && s.segTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>单价</Text>
        <TextInput style={s.input} value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
        {priceChanged && <Text style={s.warning}>单价变更仅对新记录生效</Text>}

        <Text style={s.label}>单位</Text>
        <View style={s.segRow}>
          {units.map((u) => (
            <TouchableOpacity
              key={u}
              style={[s.seg, unit === u && s.segActive]}
              onPress={() => setUnit(u)}
            >
              <Text style={[s.segText, unit === u && s.segTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>备注</Text>
        <TextInput
          style={[s.input, { height: 80, textAlignVertical: 'top' }]}
          value={remark} onChangeText={setRemark}
          placeholder="可选" multiline
        />

        {isEdit && (
          <View style={s.switchRow}>
            <Text style={s.label}>状态</Text>
            <View style={s.switchInner}>
              <Text style={s.switchLabel}>{active ? '启用' : '停用'}</Text>
              <Switch value={active} onValueChange={setActive} trackColor={{ true: Colors.success, false: Colors.disabled }} />
            </View>
          </View>
        )}

        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
          <Text style={s.saveBtnText}>{saving ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
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
  form: { padding: Spacing.md },
  label: { fontSize: FontSize.body, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, padding: Spacing.md,
    fontSize: FontSize.body, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  segRow: { flexDirection: 'row' },
  seg: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: 20, backgroundColor: Colors.card, marginRight: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  segActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  segText: { fontSize: FontSize.body, color: Colors.textSecondary },
  segTextActive: { color: '#fff', fontWeight: '600' },
  warning: { fontSize: FontSize.caption, color: Colors.warning, marginTop: Spacing.xs },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  switchInner: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { fontSize: FontSize.body, color: Colors.textSecondary, marginRight: Spacing.sm },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, height: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl,
  },
  saveBtnText: { fontSize: FontSize.button, fontWeight: '700', color: '#fff' },
});
