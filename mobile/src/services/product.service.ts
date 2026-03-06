import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { toCamel } from '../lib/utils';

export async function getActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('code');
  if (error) throw new Error('获取产品列表失败');
  return (data || []).map((d: any) => toCamel<Product>(d));
}

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('code');
  if (error) throw new Error('获取产品列表失败');
  return (data || []).map((d: any) => toCamel<Product>(d));
}

export async function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const { data, error } = await supabase.from('products').insert({
    code: product.code,
    name: product.name,
    type: product.type,
    unit_price: product.unitPrice,
    unit: product.unit,
    status: product.status,
    remark: product.remark || null,
  }).select().single();
  if (error) throw new Error('创建产品失败: ' + error.message);
  return toCamel<Product>(data);
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>,
  changedBy?: string
): Promise<Product> {
  const current = await supabase.from('products').select('unit_price').eq('id', id).single();
  const oldPrice = current.data?.unit_price;

  const dbUpdates: Record<string, any> = {};
  if (updates.code !== undefined) dbUpdates.code = updates.code;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.unitPrice !== undefined) dbUpdates.unit_price = updates.unitPrice;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.remark !== undefined) dbUpdates.remark = updates.remark;

  const { data, error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error('更新产品失败');

  if (updates.unitPrice !== undefined && oldPrice !== updates.unitPrice && changedBy) {
    await supabase.from('price_history').insert({
      product_id: id,
      old_price: oldPrice,
      new_price: updates.unitPrice,
      changed_by: changedBy,
    });
  }
  return toCamel<Product>(data);
}
