import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Checkbox } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Colors, FontSize, Spacing } from '../../theme';
import { User } from '../../lib/types';
import { getToday, addDays } from '../../lib/utils';
import { getAllWorkers } from '../../services/auth.service';
import { exportToExcel } from '../../services/export.service';
import LoadingOverlay from '../../components/LoadingOverlay';

const dateReg = /^\d{4}-\d{2}-\d{2}$/;

export default function ExportScreen() {
  const [startDate, setStartDate] = useState(addDays(getToday(), -30));
  const [endDate, setEndDate] = useState(getToday());
  const [workers, setWorkers] = useState<User[]>([]);
  const [userId, setUserId] = useState<string>('all');
  const [piece, setPiece] = useState(true);
  const [time, setTime] = useState(true);
  const [summary, setSummary] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { getAllWorkers().then(setWorkers); }, []);

  const types: ('piece' | 'time' | 'summary')[] = [];
  if (piece) types.push('piece');
  if (time) types.push('time');
  if (summary) types.push('summary');

  const onExport = async () => {
    if (!dateReg.test(startDate) || !dateReg.test(endDate)) {
      Alert.alert('提示', '日期格式须为YYYY-MM-DD');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('提示', '开始日期须早于结束日期');
      return;
    }
    if (!types.length) {
      Alert.alert('提示', '请至少选择一种数据类型');
      return;
    }
    setExporting(true);
    try {
      await exportToExcel(startDate, endDate, userId === 'all' ? 'all' : [userId], types);
      Alert.alert('成功', '导出完成');
    } catch (e: any) {
      Alert.alert('错误', e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {exporting && <LoadingOverlay />}
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.pageTitle}>数据导出</Text>

        <Text style={s.label}>开始日期</Text>
        <TextInput style={s.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />

        <Text style={s.label}>结束日期</Text>
        <TextInput style={s.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />

        <Text style={s.label}>员工筛选</Text>
        <View style={s.pickerWrap}>
          <Picker selectedValue={userId} onValueChange={setUserId} style={s.picker}>
            <Picker.Item label="全部员工" value="all" />
            {workers.map((w) => <Picker.Item key={w.id} label={w.name} value={w.id} />)}
          </Picker>
        </View>

        <Text style={s.label}>数据类型</Text>
        <TouchableOpacity style={s.checkRow} onPress={() => setPiece(!piece)}>
          <Checkbox status={piece ? 'checked' : 'unchecked'} onPress={() => setPiece(!piece)} />
          <Text style={s.checkLabel}>计件明细</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.checkRow} onPress={() => setTime(!time)}>
          <Checkbox status={time ? 'checked' : 'unchecked'} onPress={() => setTime(!time)} />
          <Text style={s.checkLabel}>计时明细</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.checkRow} onPress={() => setSummary(!summary)}>
          <Checkbox status={summary ? 'checked' : 'unchecked'} onPress={() => setSummary(!summary)} />
          <Text style={s.checkLabel}>薪资汇总</Text>
        </TouchableOpacity>

        <Text style={s.preview}>
          将导出 约{types.length * (userId === 'all' ? workers.length || 1 : 1)}项数据
        </Text>

        <TouchableOpacity
          style={[s.exportBtn, exporting && { opacity: 0.6 }]}
          onPress={onExport}
          disabled={exporting}
        >
          <Text style={s.exportBtnText}>{exporting ? '导出中...' : '导出Excel'}</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: Spacing.md },
  pageTitle: { fontSize: FontSize.title, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  label: { fontSize: FontSize.body, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, padding: Spacing.md,
    fontSize: FontSize.body, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  pickerWrap: {
    backgroundColor: Colors.card, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  picker: { height: 50, fontSize: FontSize.body },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  checkLabel: { fontSize: FontSize.body, color: Colors.textPrimary },
  preview: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg },
  exportBtn: {
    backgroundColor: Colors.success, borderRadius: 12, height: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg,
  },
  exportBtnText: { fontSize: FontSize.button, fontWeight: '700', color: '#fff' },
});
