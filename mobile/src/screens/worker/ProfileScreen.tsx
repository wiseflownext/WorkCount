import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, FontSize, Spacing } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { formatCurrency } from '../../lib/utils';
import * as authService from '../../services/auth.service';

export default function ProfileScreen() {
  const { currentUser, logout } = useAuthStore();
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消' },
      { text: '确定', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleChangePwd = async () => {
    if (newPwd.length < 6) {
      Toast.show({ type: 'error', text1: '密码至少6位' });
      return;
    }
    if (newPwd !== confirmPwd) {
      Toast.show({ type: 'error', text1: '两次密码不一致' });
      return;
    }
    setSaving(true);
    try {
      await authService.updatePassword(newPwd);
      Toast.show({ type: 'success', text1: '密码修改成功' });
      setShowPwdModal(false);
      setNewPwd('');
      setConfirmPwd('');
    } catch {
      Toast.show({ type: 'error', text1: '修改失败' });
    } finally {
      setSaving(false);
    }
  };

  const roleText = currentUser?.role === 'admin' ? '管理员' : '员工';

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.screenTitle}>我的</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account-circle" size={64} color={Colors.primary} />
        </View>
        <Text style={styles.name}>{currentUser?.name}</Text>
        <Text style={styles.infoText}>{currentUser?.phone}</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>角色</Text>
            <Text style={styles.infoValue}>{roleText}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>时薪</Text>
            <Text style={styles.infoValue}>
              {formatCurrency(currentUser?.hourlyRate || 0)}/时
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => setShowPwdModal(true)}>
        <MaterialCommunityIcons name="lock-reset" size={24} color={Colors.primary} />
        <Text style={styles.menuText}>修改密码</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={24} color={Colors.error} />
        <Text style={[styles.menuText, { color: Colors.error }]}>退出登录</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.error} />
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={showPwdModal}
          onDismiss={() => setShowPwdModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>修改密码</Text>
          <TextInput
            mode="outlined"
            label="新密码"
            placeholder="请输入新密码"
            value={newPwd}
            onChangeText={setNewPwd}
            secureTextEntry
            style={styles.modalInput}
            contentStyle={{ fontSize: FontSize.body }}
          />
          <TextInput
            mode="outlined"
            label="确认密码"
            placeholder="再次输入新密码"
            value={confirmPwd}
            onChangeText={setConfirmPwd}
            secureTextEntry
            style={styles.modalInput}
            contentStyle={{ fontSize: FontSize.body }}
          />
          <TouchableOpacity
            style={[styles.modalBtn, saving && { opacity: 0.6 }]}
            onPress={handleChangePwd}
            disabled={saving}
          >
            <Text style={styles.modalBtnText}>确认修改</Text>
          </TouchableOpacity>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.md },
  screenTitle: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary, paddingVertical: Spacing.md },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: { marginBottom: Spacing.sm },
  name: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary },
  infoText: { fontSize: FontSize.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  infoRow: { flexDirection: 'row', marginTop: Spacing.lg, width: '100%' },
  infoItem: { flex: 1, alignItems: 'center' },
  infoDivider: { width: 1, backgroundColor: Colors.border },
  infoLabel: { fontSize: FontSize.caption, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.body, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.xs },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  menuText: { flex: 1, fontSize: FontSize.body, color: Colors.textPrimary, marginLeft: Spacing.md },
  logoutItem: { marginTop: Spacing.lg },
  modal: {
    backgroundColor: Colors.card,
    margin: Spacing.lg,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  modalTitle: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  modalInput: { marginBottom: Spacing.md, backgroundColor: Colors.card },
  modalBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  modalBtnText: { color: '#fff', fontSize: FontSize.button, fontWeight: '700' },
});
