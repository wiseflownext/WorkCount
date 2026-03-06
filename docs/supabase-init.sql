-- ========================================
-- 工计宝 Supabase 初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ========================================

-- 1. 建表
-- ----------------------------------------

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(11) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('product', 'process')),
  unit_price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(10) DEFAULT '件',
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE piece_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_snapshot DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  product_id UUID REFERENCES products(id),
  work_content VARCHAR(200) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_half_hours DECIMAL(5,1),
  hourly_rate_snapshot DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2),
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(10) DEFAULT 'working' CHECK (status IN ('working', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  old_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  changed_by UUID REFERENCES users(id) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 索引
-- ----------------------------------------

CREATE INDEX idx_piece_user_date ON piece_records(user_id, work_date);
CREATE INDEX idx_time_user_date ON time_records(user_id, work_date);
CREATE INDEX idx_time_user_status ON time_records(user_id, status);
CREATE INDEX idx_price_product ON price_history(product_id, changed_at);

-- 3. 开启RLS
-- ----------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE piece_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS策略 - 管理员全权限
-- ----------------------------------------

CREATE POLICY admin_users ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_products ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_piece ON piece_records FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_time ON time_records FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_price ON price_history FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 5. RLS策略 - 员工权限
-- ----------------------------------------

CREATE POLICY worker_read_self ON users FOR SELECT USING (
  id = auth.uid()
);

CREATE POLICY worker_read_products ON products FOR SELECT USING (
  status = 'active'
);

CREATE POLICY worker_read_piece ON piece_records FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY worker_insert_piece ON piece_records FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY worker_read_time ON time_records FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY worker_insert_time ON time_records FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY worker_update_time ON time_records FOR UPDATE USING (
  user_id = auth.uid()
);

-- 6. 插入管理员
-- ----------------------------------------

INSERT INTO users (id, phone, name, role, hourly_rate, status)
VALUES (
  gen_random_uuid(),
  '18119609735',
  'tim',
  'admin',
  18,
  'active'
);

-- 7. 插入示例产品
-- ----------------------------------------

INSERT INTO products (code, name, type, unit_price, unit, status) VALUES
  ('P001', '轴承组装', 'process', 2.50, '件', 'active'),
  ('P002', '电机绕线', 'process', 5.00, '件', 'active'),
  ('P003', '外壳打磨', 'process', 1.80, '件', 'active'),
  ('P004', '成品检测', 'process', 3.00, '件', 'active'),
  ('P005', '包装封箱', 'process', 1.50, '件', 'active');
