import { supabase } from '../lib/supabase';
import { DailyReport, PeriodReport, AdminDashboard, PieceRecord, TimeRecord } from '../lib/types';
import { toCamel, getToday, formatTime } from '../lib/utils';
import { getRecordsByDate, getRecordsByDateRange } from './record.service';

export async function getDailyReport(userId: string, date: string): Promise<DailyReport> {
  const { pieceRecords, timeRecords } = await getRecordsByDate(userId, date);
  const pieceIncome = pieceRecords.reduce((s, r) => s + r.amount, 0);
  const timeIncome = timeRecords.reduce((s, r) => s + (r.amount || 0), 0);
  return { date, pieceIncome, timeIncome, totalIncome: pieceIncome + timeIncome, pieceRecords, timeRecords };
}

export async function getPeriodReport(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<PeriodReport> {
  const { pieceRecords, timeRecords } = await getRecordsByDateRange(startDate, endDate, userId);

  const dailyMap = new Map<string, { pieceIncome: number; timeIncome: number }>();
  const d = new Date(startDate);
  const end = new Date(endDate);
  while (d <= end) {
    dailyMap.set(d.toISOString().split('T')[0], { pieceIncome: 0, timeIncome: 0 });
    d.setDate(d.getDate() + 1);
  }

  pieceRecords.forEach((r) => {
    const day = dailyMap.get(r.workDate);
    if (day) day.pieceIncome += r.amount;
  });
  timeRecords.forEach((r) => {
    const day = dailyMap.get(r.workDate);
    if (day) day.timeIncome += r.amount || 0;
  });

  const dailyData = Array.from(dailyMap.entries()).map(([date, d]) => ({
    date,
    pieceIncome: d.pieceIncome,
    timeIncome: d.timeIncome,
    total: d.pieceIncome + d.timeIncome,
  }));

  const totalPieceIncome = dailyData.reduce((s, d) => s + d.pieceIncome, 0);
  const totalTimeIncome = dailyData.reduce((s, d) => s + d.timeIncome, 0);

  return {
    startDate,
    endDate,
    totalPieceIncome,
    totalTimeIncome,
    totalIncome: totalPieceIncome + totalTimeIncome,
    dailyData,
  };
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const today = getToday();
  const [pieceRes, timeRes, workingRes] = await Promise.all([
    supabase.from('piece_records').select('user_id, amount, product_name, created_at').eq('work_date', today),
    supabase.from('time_records').select('user_id, amount, work_content, created_at, status').eq('work_date', today),
    supabase.from('time_records').select('user_id').eq('status', 'working'),
  ]);

  const pieces = pieceRes.data || [];
  const times = timeRes.data || [];
  const working = workingRes.data || [];

  const workerIds = new Set([
    ...pieces.map((r: any) => r.user_id),
    ...times.map((r: any) => r.user_id),
  ]);

  const totalOutput =
    pieces.reduce((s: number, r: any) => s + (r.amount || 0), 0) +
    times.filter((r: any) => r.status === 'completed').reduce((s: number, r: any) => s + (r.amount || 0), 0);

  const userIds = [...workerIds];
  const { data: users } = await supabase.from('users').select('id, name').in('id', userIds.length ? userIds : ['']);
  const nameMap = new Map((users || []).map((u: any) => [u.id, u.name]));

  const recentRecords = [
    ...pieces.map((r: any) => ({
      id: r.user_id + '_p_' + r.created_at,
      workerName: nameMap.get(r.user_id) || '未知',
      type: 'piece' as const,
      productName: r.product_name,
      amount: r.amount,
      time: formatTime(r.created_at),
    })),
    ...times.filter((r: any) => r.status === 'completed').map((r: any) => ({
      id: r.user_id + '_t_' + r.created_at,
      workerName: nameMap.get(r.user_id) || '未知',
      type: 'time' as const,
      productName: r.work_content,
      amount: r.amount || 0,
      time: formatTime(r.created_at),
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 20);

  return {
    activeWorkers: workerIds.size,
    workingCount: working.length,
    totalOutput,
    recentRecords,
  };
}
