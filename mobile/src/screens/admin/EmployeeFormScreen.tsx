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
import { AdminHomeStackParamList } from '../../navigation/types';
import { createUser, updateUser, getAllWorkers } from '../../services/auth.service';

type Nav = StackNavigationProp<AdminHomeStackParamList, 'EmployeeForm'>;
type Route = RouteProp<AdminHomeStackParamList, 'EmployeeForm'>;

export default function EmployeeFormScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const userId = route.params?.userId;
  const isEdit = !!userId;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rate, setRate] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getAllWorkers().then((list) => {
      const u = list.find((w) => w.id === userId);
      if (u) {
        setName(u.name);
        setPhone(u.phone);
        setRate(String(u.hourlyRate));
        setActive(u.status === 'active');
      }
    });
  }, [userId, isEdit]);

  const validate = (): string | null => {
    if (!name.trim()) return '请输入姓名';
    if (!/^\d{11}$/.test(phone)) return '手机号须为11位';
    if (!isEdit && !password) return '请输入密码';
    if (!rate || Number(rate) <= 0) return '时薪须大于0';
    return null;
  };

  const onSave = async () => {
    const err = validate();
    if (err) { Alert.alert('提示', err); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await updateUser(userId!, {
          name: name.trim(),
          phone,
          hourlyRate: Number(rate),
          status: active ? 'active' : 'inactive',
        });
      } else {
        await createUser(name.trim(), phone, password, Number(rate));
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
        <Text style={s.title}>{isEdit ? '编辑员工' : '添加员工'}</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={s.form} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>姓名</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="请输入姓名" />

        <Text style={s.label}>手机号</Text>
        <TextInput
          style={s.input} value={phone} onChangeText={setPhone}
          placeholder="11位手机号" keyboardType="numeric" maxLength={11}
        />

        {!isEdit && (
          <>
            <Text style={s.label}>密码</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="请输入密码" secureTextEntry />
          </>
        )}

        <Text style={s.label}>时薪 (元/半小时)</Text>
        <TextInput
          style={s.input} value={rate} onChangeText={setRate}
          placeholder="请输入时薪" keyboardType="decimal-pad"
        />

        {isEdit && (
          <View style={s.switchRow}>
            <Text style={s.label}>状态</Text>
            <View style={s.switchInner}>
              <Text style={s.switchLabel}>{active ? '在职' : '离职'}</Text>
              <Switch value={active} onValueChange={setActive} trackColor={{ true: Colors.success, false: Colors.disabled }} />
            </View>
          </View>
        )}

        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
          <Text style={s.saveBtnText}>{saving ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  switchInner: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { fontSize: FontSize.body, color: Colors.textSecondary, marginRight: Spacing.sm },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, height: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl,
  },
  saveBtnText: { fontSize: FontSize.button, fontWeight: '700', color: '#fff' },
});
