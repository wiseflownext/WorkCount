# CODEX 提示词 - 工计宝APP完整开发

---

## 项目总述

```
Build a complete Android mobile app called "工计宝" (WorkCount) using React Native (Expo) with Supabase as the backend. This is a manufacturing payroll management app supporting piece-rate (计件) and time-based (计时) pay for factory workers.

Tech stack:
- React Native with Expo (SDK 51+)
- TypeScript
- Supabase (PostgreSQL + Auth + Realtime)
- Zustand for state management
- React Native Paper for UI components
- xlsx library for Excel export
- React Navigation (bottom tabs + stack)

Target users: 40-60 year old Chinese factory workers with low tech literacy.
UI requirements: Extra large fonts (body ≥ 18sp, buttons ≥ 20sp), high contrast, large touch targets (min 48dp), max 2 navigation levels, Chinese language only.
```

---

## 数据库结构

```
Set up the following Supabase PostgreSQL tables with Row Level Security:

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(11) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  hourly_rate DECIMAL(10,2) DEFAULT 0, -- 元/半小时
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 产品工序表
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

-- 计件记录表
CREATE TABLE piece_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_snapshot DECIMAL(10,2) NOT NULL, -- 录入时的单价快照
  amount DECIMAL(10,2) NOT NULL, -- quantity * unit_price_snapshot
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 计时记录表
CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  product_id UUID REFERENCES products(id), -- 可选关联
  work_content VARCHAR(200) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_half_hours DECIMAL(5,1), -- 半小时数，向上取整
  hourly_rate_snapshot DECIMAL(10,2) NOT NULL, -- 录入时的时薪快照
  amount DECIMAL(10,2), -- duration_half_hours * hourly_rate_snapshot
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(10) DEFAULT 'working' CHECK (status IN ('working', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 单价变更历史
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  old_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  changed_by UUID REFERENCES users(id) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

RLS Policies:
- workers can only SELECT/INSERT their own piece_records and time_records
- workers can SELECT products where status='active'
- workers can SELECT their own user record
- admin can do everything
- time_records INSERT: check no existing 'working' status record for the same user (enforce mutual exclusion)
- piece_records INSERT: check no existing 'working' time_record for the same user

Create indexes on: piece_records(user_id, work_date), time_records(user_id, work_date), time_records(user_id, status)
```

---

## 认证模块

```
Implement authentication using Supabase Auth with phone + password:

Login screen:
- Phone number input (11 digits, numeric keyboard, validate Chinese phone format)
- Password input with show/hide toggle
- Large "登录" button (full width, 56dp height, blue #1976D2)
- Show loading spinner during auth
- On success: fetch user profile from users table, store in Zustand, navigate to home
- On error: show clear Chinese error message ("手机号或密码错误")
- Auto-login: check stored session on app launch
- No registration screen (admin creates accounts via Supabase or admin panel)

App logo "工计宝" displayed prominently at top of login page.
```

---

## 员工端页面

```
Build the worker-facing screens:

Bottom Tab Navigator with 4 tabs: 首页 / 日报 / 工资条 / 我的
Tab icons should be simple and large (28dp).

=== Worker Home Screen ===
- Header: "你好, {name}" + formatted date "2024年1月15日 星期一"
- Today's earning card: "今日收入" with large green (4CAF50) amount "¥XXX.XX"
- If active time tracking: pulsing green banner "正在计时中... {HH:MM:SS}" (real-time update every second)
- Two large square buttons (equal width, side by side, min 120dp height):
  - "计件录入" (blue icon + text)
  - "计时打卡" (orange icon + text)
- "今日记录" section: FlatList of today's records
  - Each item: type badge (计件=blue, 计时=orange), product name, details, amount

=== Piece Entry Screen ===
- Navigate from home, stack navigator
- Product list: FlatList of active products, each item shows code + name + "¥{price}/{unit}"
  - Large tappable cards (full width, 64dp min height), selected = blue border
- After selection: show product info + quantity input
  - Number input with large +/- stepper buttons (each 56dp)
  - Real-time calculation display: "{quantity} × ¥{price} = ¥{total}" in large green text
- "提交" button (full width, 56dp, green)
- Validation: must select product, quantity > 0
- Mutual exclusion check: if there's an active time_record with status='working', show alert "请先结束计时再录入计件" and block submission
- On success: show success message with amount, navigate back

=== Time Clock Screen ===
- Navigate from home, stack navigator
- Check on mount: if existing working record, show State B directly

State A (idle):
- Work content: TextInput (large, placeholder "请输入工作内容")
- Optional product link: "关联产品(可选)" dropdown from active products list
- Giant green circle button "开始工作" (140dp diameter) centered
- Mutual exclusion: this screen should also check there's no issue

State B (working):
- Work content displayed at top (read-only)
- Large timer "HH:MM:SS" centered (font size 48sp), update every second
- "已工作 X小时X分钟" below timer
- Green pulsing border animation
- Giant red circle button "结束工作" (140dp diameter)

State C (summary after ending):
- Card showing: work content, start time, end time
- Duration: raw duration → rounded up to nearest half hour
- Calculation: "{half_hours} × ¥{rate} = ¥{amount}"
- "确认提交" button (green) and "继续工作" button (blue outline)
- On confirm: update time_record (set end_time, duration, amount, status='completed')

=== Daily Report Screen (日报 tab) ===
- Date selector at top: "<" [日期] ">" buttons to navigate days
- Summary card: 计件收入 + 计时收入 + 日合计 (large green)
- Record list: all records for selected date, sorted by time
- Each record: type badge, product/content, detail calculation, amount
- Empty state: "今日暂无记录" with simple illustration

=== Payslip Screen (工资条 tab) ===
- Toggle: "周报" | "月报" (SegmentedButtons)

Week view:
- Week navigation: "上一周" [日期范围] "下一周"
- Simple bar chart or daily breakdown list (Mon-Sun)
- Each day: date, piece income, time income, daily total
- "本周合计: ¥XXXX.XX" at bottom (large green)

Month view:
- Month navigation: "上月" [YYYY年MM月] "下月"
- Daily list with totals
- Summary card at top: 计件总额 / 计时总额 / 月合计
- Scrollable if many days

=== Profile Screen (我的 tab) ===
- User info: name, phone, role display
- "修改密码" button → change password form
- "退出登录" button → clear session, navigate to login
```

---

## 管理员端页面

```
Build admin screens. Admin uses same app, different bottom tabs based on role.

Admin Bottom Tabs: 首页 / 报表 / 导出 / 设置
Role-based navigation: check user.role on login, show different tab navigators.

=== Admin Home Screen ===
- Header: "管理员面板" + date
- Dashboard cards row:
  - "今日在岗: {count}人" (count of workers with records today)
  - "今日总产出: ¥{total}"
  - "正在计时: {count}人" (workers with status='working')
- Quick action grid (2x2):
  - "员工管理" / "产品管理" / "数据报表" / "数据导出"
- Activity feed: latest 20 records from all workers today
  - Each: {worker_name} | {type badge} | {product} | ¥{amount} | {time}

=== Employee Management Screen ===
- Stack navigator from admin home
- Header: "员工管理" + "添加员工" button (top right, or FAB)
- FlatList of employees:
  - Card: name, phone, "时薪: ¥{rate}/半小时", status badge (在职=green, 离职=gray)
  - Tap card → edit screen
- Add/Edit Employee Screen (modal or stack):
  - Form fields: 姓名, 手机号(11 digits), 密码(add only), 时薪(numeric input with ¥ prefix), 状态 toggle
  - For editing: password field hidden, show "重置密码" button instead
  - Save button validates: name required, phone 11 digits, rate > 0
  - On add: create Supabase auth user + insert users table record
  - On edit: update users table, if rate changed old rate only affects future records

=== Product Management Screen ===
- Stack navigator from admin home
- Filter tabs: "全部" | "产品" | "工序"
- "添加" FAB button
- Product list:
  - Card: [code] name, "¥{price}/{unit}", type badge, status badge
  - Tap → edit
- Add/Edit form:
  - 编号 (unique code), 名称, 类型 (dropdown: 产品/工序)
  - 单价 (numeric, ¥ prefix), 单位 (picker: 件/个/组/套)
  - 备注 (optional TextInput), 状态 toggle
  - On price change during edit: show warning "单价变更仅对新记录生效，历史记录不受影响"
  - Save: if price changed, insert price_history record

=== Admin Reports Screen (报表 tab) ===
- Top: "日报" | "周报" | "月报" toggle
- Employee filter: dropdown "全部员工" + list of active workers
- Date/Week/Month selector

Daily report:
- Per-employee table: 员工 | 计件数 | 计件收入 | 工时(h) | 计时收入 | 日合计
- Bottom totals row
- Tap employee row → drill into their detail records

Weekly report:
- Selected employee or all: date | 计件收入 | 计时收入 | 日合计
- 7 rows (Mon-Sun) + total row

Monthly report:
- Same structure as weekly but full month
- Summary cards at top: 计件总额 / 计时总额 / 总计

=== Data Export Screen (导出 tab) ===
- Date range picker: "开始日期" / "结束日期" (DatePicker)
- Employee selector: "全部员工" or multi-select specific employees
- Data type checkboxes: ☑计件明细 ☑计时明细 ☑薪资汇总
- Preview: "将导出 {count} 条记录"
- Large "导出Excel" button (green, full width)
- Implementation: query Supabase for selected data, generate xlsx file using xlsx library, save to device Downloads folder using expo-file-system + expo-sharing
- Export format:
  - Sheet 1 "计件明细": 日期, 员工, 产品编号, 产品名称, 数量, 单价, 金额
  - Sheet 2 "计时明细": 日期, 员工, 工作内容, 开始时间, 结束时间, 时长(h), 时薪, 金额
  - Sheet 3 "薪资汇总": 员工, 计件总额, 计时总额, 合计

=== Settings Screen (设置 tab) ===
- Admin profile info
- "修改密码"
- App version info
- "退出登录"
```

---

## 通用要求

```
Global requirements for the entire app:

1. Error handling: All Supabase calls wrapped in try-catch, show Chinese error messages via Toast/Snackbar
2. Loading states: Show ActivityIndicator for all async operations
3. Pull-to-refresh on all list screens
4. Offline handling: Show "网络连接失败，请检查网络" when offline
5. Number formatting: All currency values formatted as "¥X,XXX.XX"
6. Date formatting: "YYYY年MM月DD日" for dates, "HH:MM" for times
7. Confirmation dialogs: Delete operations require "确认删除？" dialog
8. Input validation: All forms validate before submission with Chinese error hints
9. Font sizes: body text 18sp, section headers 22sp, page titles 24sp, amounts 28sp+
10. Color system: Primary blue #1976D2, Success green #4CAF50, Warning orange #FF9800, Error red #F44336, Background #F5F5F5, Card white #FFFFFF
11. All text hardcoded in Chinese, no i18n needed
12. Zustand store structure: useAuthStore (user, session, login/logout), useRecordStore (piece/time records, CRUD), useProductStore (products, CRUD)
13. Supabase client: single instance in lib/supabase.ts with environment variables for URL and anon key
14. Navigation: @react-navigation/native with @react-navigation/bottom-tabs and @react-navigation/stack
15. TypeScript: strict mode, define interfaces for all data models in types/index.ts
```
