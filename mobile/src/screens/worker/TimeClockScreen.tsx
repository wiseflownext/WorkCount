import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Animated, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Modal, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Colors, FontSize, Spacing } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useRecordStore } from '../../stores/record.store';
import { useProductStore } from '../../stores/product.store';
import { formatCurrency, formatDuration, formatTime, calcHalfHours } from '../../lib/utils';
import { Product, TimeRecord } from '../../lib/types';

type ScreenState = 'idle' | 'working' | 'completed';

export default function TimeClockScreen() {
  const nav = useNavigation();
  const { currentUser } = useAuthStore();
  const { activeTimeRecord, checkActiveTimer, startTimer, endTimer } = useRecordStore();
  const { products, fetchProducts } = useProductStore();

  const [state, setState] = useState<ScreenState>('idle');
  const [workContent, setWorkContent] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completedRecord, setCompletedRecord] = useState<TimeRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const uid = currentUser?.id || '';
  const hourlyRate = currentUser?.hourlyRate || 0;

  useFocusEffect(
    useCallback(() => {
      fetchProducts(true);
      if (uid) checkActiveTimer(uid);
    }, [uid])
  );

  useEffect(() => {
    if (activeTimeRecord && state !== 'completed') {
      setState('working');
      setWorkContent(activeTimeRecord.workContent);
    }
  }, [activeTimeRecord]);

  useEffect(() => {
    if (state === 'working' && activeTimeRecord) {
      const update = () => {
        const diff = Math.floor(
          (Date.now() - new Date(activeTimeRecord.startTime).getTime()) / 1000
        );
        setElapsed(diff);
      };
      update();
      timerRef.current = setInterval(update, 1000);

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        pulse.stop();
      };
    }
  }, [state, activeTimeRecord]);

  const handleStart = async () => {
    if (!workContent.trim()) {
      Toast.show({ type: 'error', text1: '请输入工作内容' });
      return;
    }
    setLoading(true);
    try {
      await startTimer(uid, workContent.trim(), hourlyRate, selectedProduct?.id);
      setState('working');
    } catch {
      Toast.show({ type: 'error', text1: '开始失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = () => {
    Alert.alert('确认', '确定结束工作？', [
      { text: '取消' },
      {
        text: '确定', onPress: async () => {
          if (!activeTimeRecord) return;
          setLoading(true);
          try {
            const rec = await endTimer(activeTimeRecord.id, uid);
            setCompletedRecord(rec);
            setState('completed');
          } catch {
            Toast.show({ type: 'error', text1: '结束失败' });
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const estimatedEarnings = (elapsed / 3600) * hourlyRate;

  if (state === 'completed' && completedRecord) {
    const halfHours = completedRecord.durationHalfHours || 0;
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => nav.goBack()} title="工作完成" />
        <View style={styles.completedContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{completedRecord.workContent}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>开始时间</Text>
              <Text style={styles.summaryValue}>{formatTime(completedRecord.startTime)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>结束时间</Text>
              <Text style={styles.summaryValue}>{formatTime(completedRecord.endTime!)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>工时(半小时)</Text>
              <Text style={styles.summaryValue}>{halfHours}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.calcText}>
              {halfHours} × ¥{(completedRecord.hourlyRateSnapshot / 2).toFixed(2)} =
            </Text>
            <Text style={styles.completedAmount}>
              {formatCurrency(completedRecord.amount || 0)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.success }]}
            onPress={() => nav.goBack()}
          >
            <Text style={styles.actionBtnText}>确认</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.outlineBtn]}
            onPress={() => { setState('idle'); setWorkContent(''); setCompletedRecord(null); }}
          >
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>继续工作</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'working') {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => nav.goBack()} title="工作中" />
        <View style={styles.workingContainer}>
          <Text style={styles.workingContent}>{workContent}</Text>
          <Text style={styles.timerDisplay}>{formatDuration(elapsed)}</Text>
          <Text style={styles.estimatedLabel}>预计收入</Text>
          <Text style={styles.estimatedAmount}>{formatCurrency(estimatedEarnings)}</Text>

          <Animated.View style={[styles.circleWrap, { opacity: pulseAnim }]}>
            <TouchableOpacity
              style={[styles.circleBtn, { backgroundColor: Colors.error }]}
              onPress={handleEnd}
              disabled={loading}
            >
              <MaterialCommunityIcons name="stop" size={48} color="#fff" />
              <Text style={styles.circleBtnText}>结束工作</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header onBack={() => nav.goBack()} title="计时打卡" />
      <ScrollView style={styles.idleContent}>
        <TextInput
          mode="outlined"
          label="工作内容"
          placeholder="请输入工作内容"
          value={workContent}
          onChangeText={setWorkContent}
          style={styles.input}
          contentStyle={{ fontSize: FontSize.body }}
        />

        <TouchableOpacity
          style={styles.productSelect}
          onPress={() => setShowProductPicker(true)}
        >
          <Text style={styles.productSelectLabel}>
            {selectedProduct ? `${selectedProduct.name}` : '选择产品(可选)'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.rateInfo}>
          时薪: {formatCurrency(hourlyRate)}/小时
        </Text>

        <View style={styles.startBtnWrap}>
          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: Colors.success }]}
            onPress={handleStart}
            disabled={loading}
          >
            <MaterialCommunityIcons name="play" size={48} color="#fff" />
            <Text style={styles.circleBtnText}>开始工作</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={showProductPicker}
          onDismiss={() => setShowProductPicker(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>选择产品</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => { setSelectedProduct(null); setShowProductPicker(false); }}
            >
              <Text style={styles.modalItemText}>不选择产品</Text>
            </TouchableOpacity>
            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.modalItem}
                onPress={() => { setSelectedProduct(p); setShowProductPicker(false); }}
              >
                <Text style={styles.modalItemText}>[{p.code}] {p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>
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
  idleContent: { flex: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
  input: { marginBottom: Spacing.md, backgroundColor: Colors.card },
  productSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productSelectLabel: { fontSize: FontSize.body, color: Colors.textSecondary },
  rateInfo: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  startBtnWrap: { alignItems: 'center', marginTop: Spacing.xl },
  circleBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnText: { color: '#fff', fontSize: FontSize.button, fontWeight: '700', marginTop: Spacing.xs },
  circleWrap: { marginTop: Spacing.xl },
  workingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  workingContent: { fontSize: FontSize.title, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.lg },
  timerDisplay: { fontSize: 48, fontWeight: '800', color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  estimatedLabel: { fontSize: FontSize.body, color: Colors.textSecondary, marginTop: Spacing.lg },
  estimatedAmount: { fontSize: FontSize.amount, fontWeight: '700', color: Colors.success, marginTop: Spacing.xs },
  completedContainer: { flex: 1, padding: Spacing.lg },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryTitle: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: { fontSize: FontSize.body, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSize.body, fontWeight: '600', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  calcText: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },
  completedAmount: { fontSize: 36, fontWeight: '800', color: Colors.success, textAlign: 'center', marginTop: Spacing.sm },
  actionBtn: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionBtnText: { color: '#fff', fontSize: FontSize.button, fontWeight: '700' },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  modal: {
    backgroundColor: Colors.card,
    margin: Spacing.lg,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  modalTitle: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  modalItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalItemText: { fontSize: FontSize.body, color: Colors.textPrimary },
});
