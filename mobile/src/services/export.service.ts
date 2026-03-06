import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getRecordsByDateRange } from './record.service';
import { supabase } from '../lib/supabase';
import { toCamel } from '../lib/utils';
import { User } from '../lib/types';

export async function exportToExcel(
  startDate: string,
  endDate: string,
  userIds: string[] | 'all',
  types: ('piece' | 'time' | 'summary')[]
): Promise<void> {
  const XLSX = require('xlsx');

  const { data: allUsers } = await supabase.from('users').select('*').eq('role', 'worker');
  const users = (allUsers || []).map((u: any) => toCamel<User>(u));
  const nameMap = new Map(users.map((u) => [u.id, u.name]));

  const targetIds = userIds === 'all' ? users.map((u) => u.id) : userIds;

  let allPiece: any[] = [];
  let allTime: any[] = [];

  for (const uid of targetIds) {
    const { pieceRecords, timeRecords } = await getRecordsByDateRange(startDate, endDate, uid);
    allPiece.push(...pieceRecords.map((r) => ({ ...r, workerName: nameMap.get(r.userId) || '' })));
    allTime.push(...timeRecords.map((r) => ({ ...r, workerName: nameMap.get(r.userId) || '' })));
  }

  const wb = XLSX.utils.book_new();

  if (types.includes('piece')) {
    const rows = allPiece.map((r: any) => ({
      '日期': r.workDate,
      '员工': r.workerName,
      '产品编号': r.productId,
      '产品名称': r.productName,
      '数量': r.quantity,
      '单价': r.unitPriceSnapshot,
      '金额': r.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, '计件明细');
  }

  if (types.includes('time')) {
    const rows = allTime.map((r: any) => ({
      '日期': r.workDate,
      '员工': r.workerName,
      '工作内容': r.workContent,
      '开始时间': r.startTime,
      '结束时间': r.endTime,
      '时长(半小时)': r.durationHalfHours,
      '时薪': r.hourlyRateSnapshot,
      '金额': r.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, '计时明细');
  }

  if (types.includes('summary')) {
    const summaryMap = new Map<string, { piece: number; time: number }>();
    targetIds.forEach((id) => summaryMap.set(id, { piece: 0, time: 0 }));
    allPiece.forEach((r: any) => {
      const s = summaryMap.get(r.userId);
      if (s) s.piece += r.amount;
    });
    allTime.forEach((r: any) => {
      const s = summaryMap.get(r.userId);
      if (s) s.time += r.amount || 0;
    });
    const rows = Array.from(summaryMap.entries()).map(([uid, s]) => ({
      '员工': nameMap.get(uid) || '',
      '计件总额': s.piece,
      '计时总额': s.time,
      '合计': s.piece + s.time,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, '薪资汇总');
  }

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const fileName = `工计宝_${startDate}_${endDate}.xlsx`;
  const filePath = FileSystem.cacheDirectory + fileName;
  await FileSystem.writeAsStringAsync(filePath, wbout, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(filePath, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: '导出数据',
  });
}
