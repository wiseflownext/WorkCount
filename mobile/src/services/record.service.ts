import { supabase } from '../lib/supabase';
import { PieceRecord, TimeRecord } from '../lib/types';
import { toCamel, getToday, calcHalfHours } from '../lib/utils';

export async function addPieceRecord(
  userId: string,
  productId: string,
  productName: string,
  quantity: number,
  unitPrice: number
): Promise<PieceRecord> {
  const amount = quantity * unitPrice;
  const { data, error } = await supabase.from('piece_records').insert({
    user_id: userId,
    product_id: productId,
    product_name: productName,
    quantity,
    unit_price_snapshot: unitPrice,
    amount,
    work_date: getToday(),
  }).select().single();
  if (error) throw new Error('提交失败: ' + error.message);
  return toCamel<PieceRecord>(data);
}

export async function getActiveTimeRecord(userId: string): Promise<TimeRecord | null> {
  const { data, error } = await supabase
    .from('time_records')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'working')
    .maybeSingle();
  if (error) throw new Error('查询计时状态失败');
  return data ? toCamel<TimeRecord>(data) : null;
}

export async function startTimeRecord(
  userId: string,
  workContent: string,
  hourlyRate: number,
  productId?: string
): Promise<TimeRecord> {
  const { data, error } = await supabase.from('time_records').insert({
    user_id: userId,
    product_id: productId || null,
    work_content: workContent,
    start_time: new Date().toISOString(),
    hourly_rate_snapshot: hourlyRate,
    work_date: getToday(),
    status: 'working',
  }).select().single();
  if (error) throw new Error('开始计时失败: ' + error.message);
  return toCamel<TimeRecord>(data);
}

export async function endTimeRecord(id: string): Promise<TimeRecord> {
  const { data: record } = await supabase
    .from('time_records')
    .select('*')
    .eq('id', id)
    .single();
  if (!record) throw new Error('记录不存在');

  const endTime = new Date().toISOString();
  const halfHours = calcHalfHours(record.start_time, endTime);
  const amount = halfHours * (record.hourly_rate_snapshot / 2);

  const { data, error } = await supabase.from('time_records').update({
    end_time: endTime,
    duration_half_hours: halfHours,
    amount,
    status: 'completed',
  }).eq('id', id).select().single();
  if (error) throw new Error('结束计时失败');
  return toCamel<TimeRecord>(data);
}

export async function getRecordsByDate(
  userId: string,
  date: string
): Promise<{ pieceRecords: PieceRecord[]; timeRecords: TimeRecord[] }> {
  const [pieceRes, timeRes] = await Promise.all([
    supabase.from('piece_records').select('*')
      .eq('user_id', userId).eq('work_date', date).order('created_at', { ascending: false }),
    supabase.from('time_records').select('*')
      .eq('user_id', userId).eq('work_date', date)
      .eq('status', 'completed').order('created_at', { ascending: false }),
  ]);
  return {
    pieceRecords: (pieceRes.data || []).map((d: any) => toCamel<PieceRecord>(d)),
    timeRecords: (timeRes.data || []).map((d: any) => toCamel<TimeRecord>(d)),
  };
}

export async function getRecordsByDateRange(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<{ pieceRecords: PieceRecord[]; timeRecords: TimeRecord[] }> {
  let pieceQuery = supabase.from('piece_records').select('*')
    .gte('work_date', startDate).lte('work_date', endDate);
  let timeQuery = supabase.from('time_records').select('*')
    .gte('work_date', startDate).lte('work_date', endDate).eq('status', 'completed');

  if (userId) {
    pieceQuery = pieceQuery.eq('user_id', userId);
    timeQuery = timeQuery.eq('user_id', userId);
  }

  const [pieceRes, timeRes] = await Promise.all([
    pieceQuery.order('work_date'),
    timeQuery.order('work_date'),
  ]);
  return {
    pieceRecords: (pieceRes.data || []).map((d: any) => toCamel<PieceRecord>(d)),
    timeRecords: (timeRes.data || []).map((d: any) => toCamel<TimeRecord>(d)),
  };
}
