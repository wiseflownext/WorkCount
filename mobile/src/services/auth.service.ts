import { supabase } from '../lib/supabase';
import { User } from '../lib/types';
import { toCamel } from '../lib/utils';

export async function login(phone: string, password: string): Promise<User> {
  const email = `${phone}@workcount.app`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('手机号或密码错误');

  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
  if (profileErr) throw new Error('获取用户信息失败');
  return toCamel<User>(profile);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentSession(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile) return null;
  return toCamel<User>(profile);
}

export async function createUser(
  name: string, phone: string, password: string, hourlyRate: number
): Promise<User> {
  const email = `${phone}@workcount.app`;
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authErr) throw new Error('创建账号失败: ' + authErr.message);
  if (!authData.user) throw new Error('创建账号失败');

  const { data, error } = await supabase.from('users').insert({
    id: authData.user.id,
    phone,
    name,
    role: 'worker',
    hourly_rate: hourlyRate,
    status: 'active',
  }).select().single();
  if (error) throw new Error('保存用户信息失败');
  return toCamel<User>(data);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  const dbUpdates: Record<string, any> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { error } = await supabase.from('users').update(dbUpdates).eq('id', id);
  if (error) throw new Error('更新失败');
}

export async function getAllWorkers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'worker')
    .order('created_at', { ascending: false });
  if (error) throw new Error('获取员工列表失败');
  return (data || []).map((d: any) => toCamel<User>(d));
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error('修改密码失败');
}
