import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, FontSize, Spacing } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (phone.length !== 11) {
      Toast.show({ type: 'error', text1: '请输入11位手机号' });
      return;
    }
    if (!password) {
      Toast.show({ type: 'error', text1: '请输入密码' });
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
    } catch {
      Toast.show({ type: 'error', text1: '手机号或密码错误' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.appTitle}>工计宝</Text>
            <Text style={styles.subtitle}>制造业计时计件薪资管理</Text>

            <TextInput
              mode="outlined"
              label="手机号"
              placeholder="请输入手机号"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 11))}
              keyboardType="numeric"
              maxLength={11}
              style={styles.input}
              contentStyle={styles.inputContent}
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              mode="outlined"
              label="密码"
              placeholder="请输入密码"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              style={styles.input}
              contentStyle={styles.inputContent}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPwd ? 'eye-off' : 'eye'}
                  onPress={() => setShowPwd(!showPwd)}
                />
              }
            />

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginText}>登录</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: Spacing.xl,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  input: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
  },
  inputContent: { fontSize: FontSize.body },
  loginBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginText: {
    color: '#fff',
    fontSize: FontSize.button,
    fontWeight: '700',
  },
});
