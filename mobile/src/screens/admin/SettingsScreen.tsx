import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Dialog, Portal } from 'react-native-paper';
import { Colors, FontSize, Spacing } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { updatePassword } from '../../services/auth.service';

export default function SettingsScreen() {
  const { currentUser, logout } = useAuthStore();
  const [pwdVisible, setPwdVisible] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [saving, setSaving] = useState(false);

  const onChangePwd = async () => {
    if (newPwd.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return;
    }
    setSaving(true);
    try {
      await updatePassword(newPwd);
      Alert.alert('成功', '密码已修改');
      setPwdVisible(false);
      setNewPwd('');
    } catch (e: any) {
      Alert.alert('错误', e.message);
    } finally {
      setSaving(false);
    }
  };

  const onLogout = () => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.pageTitle}>设置</Text>

      <View style={s.userCard}>
        <Text style={s.userName}>{currentUser?.name}</Text>
        <Text style={s.userPhone}>{currentUser?.phone}</Text>
        <View style={s.roleBadge}>
          <Text style={s.roleText}>管理员</Text>
        </View>
      </View>

      <TouchableOpacity style={s.menuItem} onPress={() => setPwdVisible(true)}>
        <Text style={s.menuText}>修改密码</Text>
      </TouchableOpacity>

      <View style={s.versionRow}>
        <Text style={s.versionText}>工计宝 v1.0.0</Text>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={onLogout}>
        <Text style={s.logoutText}>退出登录</Text>
      </TouchableOpacity>

      <Portal>
        <Dialog visible={pwdVisible} onDismiss={() => setPwdVisible(false)}>
          <Dialog.Title style={s.dialogTitle}>修改密码</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={s.dialogInput}
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="请输入新密码"
              secureTextEntry
            />
          </Dialog.Content>
          <Dialog.Actions>
            <TouchableOpacity onPress={() => setPwdVisible(false)} style={s.dialogBtn}>
              <Text style={s.dialogCancel}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onChangePwd} disabled={saving} style={s.dialogBtn}>
              <Text style={s.dialogConfirm}>{saving ? '保存中...' : '确定'}</Text>
            </TouchableOpacity>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, padding: Spacing.md },
  pageTitle: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  userCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  userName: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary },
  userPhone: { fontSize: FontSize.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  roleBadge: {
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: 12, marginTop: Spacing.sm,
  },
  roleText: { color: '#fff', fontSize: FontSize.caption, fontWeight: '600' },
  menuItem: {
    backgroundColor: Colors.card, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  menuText: { fontSize: FontSize.body, color: Colors.textPrimary, fontWeight: '500' },
  versionRow: { alignItems: 'center', marginVertical: Spacing.xl },
  versionText: { fontSize: FontSize.caption, color: Colors.textSecondary },
  logoutBtn: {
    borderWidth: 2, borderColor: Colors.error, borderRadius: 12, height: 56,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutText: { fontSize: FontSize.button, fontWeight: '700', color: Colors.error },
  dialogTitle: { fontSize: FontSize.body },
  dialogInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    padding: Spacing.md, fontSize: FontSize.body,
  },
  dialogBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  dialogCancel: { fontSize: FontSize.body, color: Colors.textSecondary },
  dialogConfirm: { fontSize: FontSize.body, color: Colors.primary, fontWeight: '600' },
});
