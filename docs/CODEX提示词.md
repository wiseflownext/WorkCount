# CODEX 提示词 - 工计宝APP（基于V0原型转React Native）

---

## 项目总述

```
Convert the existing V0 prototype (Next.js + Tailwind) into a production Android app using React Native (Expo) with Supabase backend. The V0 prototype is located in this repository and contains complete UI pages with mock data — use it as the definitive UI/UX reference.

Project name: 工计宝 (WorkCount)
Function: Manufacturing payroll management — piece-rate (计件) and time-based (计时) pay

Tech stack:
- React Native with Expo (SDK 51+), TypeScript strict mode
- Supabase (PostgreSQL + Auth + Realtime) as BaaS
- Zustand for state management (migrate from V0's lib/store.ts)
- React Native Paper for Material Design components
- xlsx library + expo-file-system + expo-sharing for Excel export
- @react-navigation/native + bottom-tabs + stack

Target users: 40-60 year old Chinese factory workers, low tech literacy.
UI: Extra large fonts (body ≥ 18sp, buttons ≥ 20sp), high contrast, large touch targets (min 48dp), max 2 navigation levels, Chinese only.

Key reference files from V0 prototype:
- lib/types.ts → TypeScript interfaces (User, Product, PieceRecord, TimeRecord, DailyReport, PeriodReport)
- lib/store.ts → Zustand store structure (currentUser, users, products, pieceRecords, timeRecords + actions)
- lib/mock-data.ts → Mock data structure and helper functions (getUserTodayData, getActiveTimeRecord, getAllTodayData)
- components/mobile-layout.tsx → Bottom tab layout with role-based tabs (worker: 首页/日报/工资条/我的, admin: 首页/报表/导出/设置)
```

---

## 数据库结构

```
Set up the following Supabase PostgreSQL tables. The table structure mirrors V0's lib/types.ts but uses snake_case for DB columns:

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(11) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  hourly_rate DECIMAL(10,2) DEFAULT 0,
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
  product_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_snapshot DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 计时记录表
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
- workers: SELECT/INSERT own piece_records and time_records, SELECT active products, SELECT own user record
- admin: full access to all tables
- Constraint: piece_records INSERT blocked if user has a time_record with status='working'
- Constraint: time_records INSERT blocked if user already has a time_record with status='working'

Indexes: piece_records(user_id, work_date), time_records(user_id, work_date), time_records(user_id, status)

Seed data: migrate mock data from V0's lib/mock-data.ts (5 users, 7 products, sample records)
```

---

## 认证模块

```
Implement auth based on V0 prototype's app/page.tsx login page:

V0 reference: app/page.tsx uses mockUsers for login validation, Card layout with logo, phone/password inputs, Eye/EyeOff toggle, role-based redirect.

Convert to production:
- Supabase Auth with email (use phone@workcount.app as email pattern) + password
- Phone input: 11-digit numeric keyboard, validate ^1[3-9]\d{9}$
- Password: show/hide toggle (Eye/EyeOff icons, same as V0)
- Large "登录" button (full width, 56dp, blue #1976D2)
- Loading spinner during auth
- Error: "手机号或密码错误" (Chinese)
- On success: fetch user profile from users table, set Zustand currentUser, navigate by role (admin → /admin, worker → /worker)
- Auto-login: check persisted Supabase session on app launch
- No registration (admin creates accounts)

Zustand auth store (migrate from V0 lib/store.ts):
- currentUser: User | null
- login(phone, password): Promise<void>
- logout(): void
```

---

## 员工端页面

```
Convert V0 worker pages to React Native. Match the V0 UI/UX exactly but adapt to native components.

Navigation: Bottom Tab (React Navigation) with 4 tabs matching V0's MobileLayout worker config:
- 首页 (Home icon) / 日报 (FileText) / 工资条 (Receipt) / 我的 (User)

=== Worker Home (V0 ref: app/worker/page.tsx) ===
V0 implementation: greeting header, today's earning card (green), active timer banner (pulsing green with real-time HH:MM:SS), two action buttons (计件录入 blue, 计时打卡 orange), today's record list with type badges.

Convert notes:
- Replace Next.js Link with React Navigation's navigation.navigate()
- "计件录入" button DISABLED when active timer exists (V0 already implements this)
- Active timer banner: use setInterval(1000ms) for live countdown, same as V0
- Today's data: migrate getTodayData() logic from V0 store, replace mock with Supabase query
- Record list: use FlatList instead of map()

=== Piece Entry (V0 ref: app/worker/piece-entry/page.tsx) ===
V0 implementation: 3-step flow — search/select product → quantity input with +/-/quick buttons (10/20/50/100) → success page. Blocks if timer active.

Convert notes:
- Stack screen with back button (ArrowLeft)
- Product search: FlatList with search filter, each card shows [code] name ¥price/unit
- Selected product: blue border highlight
- Quantity: large stepper (+/- buttons 56dp), quick-fill buttons [10][20][50][100]
- Real-time calc: "数量 × ¥单价 = ¥合计" in green
- Submit: save to Supabase piece_records with unit_price_snapshot from current product price
- Mutual exclusion: check getActiveTimeRecord(), block with alert if timer running

=== Time Clock (V0 ref: app/worker/time-clock/page.tsx) ===
V0 implementation: 3 states — idle (work content input + optional product link + green 开始 circle) → working (HH:MM:SS timer + estimated earnings + red 结束 circle) → completed (summary card with duration/calculation + 确认/继续 buttons).

Convert notes:
- On mount: check existing working record, resume State B if found
- State A: TextInput for work content, optional product picker, green circle button 140dp "开始工作"
- State B: real-time timer (setInterval 1000ms), show estimated earnings updating live, pulsing green animation (use Animated API), red circle button "结束工作"
- State C: duration rounded UP to nearest 0.5 hours (Math.ceil(minutes/30)*0.5), amount = durationHalfHours × hourlyRateSnapshot
- Save: update time_record in Supabase (end_time, duration_half_hours, amount, status='completed')

=== Daily Report (V0 ref: app/worker/daily/page.tsx) ===
V0 implementation: date navigation with ChevronLeft/Right, summary card (计件/计时/合计), record list with type badges, empty state "今日暂无记录".

Convert notes:
- Date picker: left/right arrows, disable future dates (same as V0)
- Data: query Supabase piece_records + time_records WHERE user_id AND work_date
- Summary: useMemo for pieceIncome + timeIncome + total
- FlatList with type badge (计件=blue, 计时=orange)

=== Payslip (V0 ref: app/worker/payslip/page.tsx) ===
V0 implementation: week/month toggle, period navigation, bar chart (CSS div heights), detail table (date/piece/time/total), period summary card.

Convert notes:
- SegmentedButtons for 周报/月报 toggle
- Week: getWeekRange() helper, 7-day breakdown, bar chart using View heights (same approach as V0 CSS)
- Month: getMonthRange(), daily list, summary card at top
- Data: query Supabase by date range, aggregate in frontend

=== Profile (V0 ref: app/worker/profile/page.tsx) ===
V0 implementation: user info display, 修改密码 button, 退出登录 button.

Convert: same layout, Supabase auth.updateUser() for password, auth.signOut() + clear Zustand for logout
```

---

## 管理员端页面

```
Convert V0 admin pages to React Native. Admin uses same app with role-based tab navigator.

Admin Bottom Tabs (from V0 MobileLayout admin config):
- 首页 (Home) / 报表 (BarChart3) / 导出 (Download) / 设置 (Settings)

=== Admin Home (V0 ref: app/admin/page.tsx) ===
V0 implementation: dashboard cards (今日在岗/今日总产出/正在计时), 2x2 quick action grid (员工管理/产品管理/数据报表/数据导出), today's activity feed with worker name + type badge + amount + time.

Convert notes:
- Dashboard data: query Supabase for today's aggregates (replace V0's getAllTodayData mock)
- Quick actions: navigate to stack screens
- Activity feed: FlatList, latest 20 records from all workers today

=== Employee Management (V0 ref: app/admin/employees/page.tsx) ===
V0 implementation: search bar, employee card list (name/phone/hourlyRate/status), bottom sheet form for add/edit with fields (姓名/手机号/密码/时薪/状态), addUser/updateUser store actions.

Convert notes:
- Stack screen from admin home
- Search: filter by name/phone
- Employee card: name, phone, "时薪: ¥{rate}/半小时", status badge (在职=green, 离职=gray)
- Add form: 姓名, 手机号(11位), 初始密码(新增时), 时薪(数字), 状态toggle
- Edit form: hide password, show "重置密码" button
- Save: Supabase auth.admin.createUser() for new + insert users, update users table for edit
- Validation: name required, phone 11 digits, rate > 0

=== Product Management (V0 ref: app/admin/products/page.tsx) ===
V0 implementation: filter tabs (全部/产品/工序), search, product card list, bottom sheet form with fields (编号/名称/类型/单价/单位/备注/状态), price change warning with AlertTriangle icon.

Convert notes:
- Filter tabs: "全部" | "产品" | "工序"
- Card: [code] name, ¥price/unit, type badge (产品=blue, 工序=purple), status badge
- Form: same fields as V0, type picker (产品/工序), unit picker (件/个/组/套)
- Price change warning: "单价变更仅对新记录生效，历史记录不受影响" (same as V0)
- Save: upsert products table, insert price_history if price changed

=== Admin Reports (V0 ref: app/admin/reports/page.tsx) ===
V0 implementation: 日报/周报/月报 toggle, employee filter dropdown, period navigation, summary cards (3-column: 计件/计时/合计), data table with per-worker rows.

Convert notes:
- Toggle: 日报 | 周报 | 月报
- Employee filter: Picker with "全部员工" + worker list
- Daily: table rows = workers, columns = 计件数/计件收入/工时/计时收入/日合计, totals row
- Week/Month: rows = dates, columns = 计件收入/计时收入/日合计, totals row
- Data: query Supabase with date range + optional user_id filter

=== Data Export (V0 ref: app/admin/export/page.tsx) ===
V0 implementation: date range inputs, employee filter, data type checkboxes (计件明细/计时明细/薪资汇总), record count preview, export button, export history list.

Convert notes:
- Date range: use @react-native-community/datetimepicker
- Employee filter: Picker (全部/specific)
- Checkboxes: 计件明细, 计时明细, 薪资汇总
- Preview: "将导出 {count} 条记录"
- Export: query Supabase → generate xlsx → save via expo-file-system → share via expo-sharing
- Excel sheets:
  - Sheet1 "计件明细": 日期, 员工, 产品编号, 产品名称, 数量, 单价, 金额
  - Sheet2 "计时明细": 日期, 员工, 工作内容, 开始时间, 结束时间, 时长(h), 时薪, 金额
  - Sheet3 "薪资汇总": 员工, 计件总额, 计时总额, 合计

=== Settings (V0 ref: app/admin/settings/page.tsx) ===
V0 implementation: admin info, 修改密码, 退出登录.

Convert: same as worker profile, plus app version display
```

---

## Supabase服务层

```
Create a service layer to replace V0's mock data with real Supabase queries:

lib/supabase.ts:
- Single Supabase client instance
- Environment variables: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
- AsyncStorage adapter for session persistence

lib/services/auth.service.ts:
- login(phone, password) → signInWithPassword
- logout() → signOut
- getCurrentUser() → get session + fetch user profile
- createUser(data) → admin.createUser + insert users table
- resetPassword(userId, newPassword) → admin.updateUserById

lib/services/product.service.ts:
- getActiveProducts() → SELECT * FROM products WHERE status='active'
- getAllProducts() → SELECT * (admin)
- createProduct(data) → INSERT
- updateProduct(id, data) → UPDATE + INSERT price_history if price changed

lib/services/record.service.ts:
- addPieceRecord(data) → INSERT with unit_price_snapshot from current product price
- getActiveTimeRecord(userId) → SELECT WHERE user_id AND status='working'
- startTimeRecord(data) → INSERT with hourly_rate_snapshot from user's current rate
- endTimeRecord(id, endTime) → calculate duration_half_hours + amount, UPDATE
- getRecordsByDate(userId, date) → query both tables
- getRecordsByRange(userId?, startDate, endDate) → for reports/export

lib/services/report.service.ts:
- getDailyReport(userId, date) → aggregate piece + time records
- getWeekReport(userId?, weekStart) → 7-day aggregation
- getMonthReport(userId?, year, month) → monthly aggregation
- getAllWorkersTodayStats() → admin dashboard data

Zustand stores (refactor from V0 lib/store.ts):
- useAuthStore: currentUser, login, logout, isLoading
- useProductStore: products, fetchProducts, addProduct, updateProduct
- useRecordStore: pieceRecords, timeRecords, activeTimeRecord, fetchTodayData, addPieceRecord, startTimer, endTimer
- All store actions call service layer instead of local mock operations
```

---

## 通用要求

```
1. Error handling: All Supabase calls in try-catch, show Chinese Toast messages (react-native-toast-message)
2. Loading states: ActivityIndicator for all async operations
3. Pull-to-refresh: RefreshControl on all FlatList screens
4. Offline: NetInfo listener, show "网络连接失败，请检查网络" banner when offline
5. Currency format: "¥X,XXX.XX" (toLocaleString)
6. Date format: "YYYY年MM月DD日" for dates, "HH:MM" for times
7. Confirmation: Alert.alert for destructive operations
8. Validation: all forms validate before submit, Chinese error hints
9. Font sizes: body 18sp, headers 22sp, titles 24sp, amounts 28sp+
10. Colors (same as V0 prototype):
    - Primary blue: #1976D2
    - Success green: #4CAF50
    - Warning orange: #FF9800
    - Error red: #F44336
    - Background: #F5F5F5
    - Card: #FFFFFF
11. Chinese only, no i18n
12. TypeScript strict, interfaces in types/index.ts (migrate from V0 lib/types.ts)
13. File structure:
    app/ (Expo Router or React Navigation screens)
    components/ (shared UI, migrate from V0 components/)
    lib/
      supabase.ts
      services/ (auth, product, record, report)
      stores/ (auth, product, record)
      types.ts (from V0)
      utils.ts (from V0)
14. V0 prototype in repo root serves as UI specification — match all layouts, colors, spacing, interactions
```
