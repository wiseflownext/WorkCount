# 工计宝 WorkCount

制造业计时计件薪资管理 Android APP，纯 AI 驱动开发。

## 项目概述

面向 40-60 岁制造业员工的极简薪资记录工具，支持**计件**和**计时**两种结算方式。

- **员工端**：录入计件/计时记录、查看日报、工资条、个人信息
- **管理员端**：员工管理、产品管理、数据报表、Excel 导出

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React Native (Expo SDK 51) + TypeScript |
| UI 组件 | React Native Paper (Material Design) |
| 导航 | React Navigation 6 (Stack + Bottom Tabs) |
| 状态管理 | Zustand |
| 后端服务 | Supabase (PostgreSQL + Auth + RLS) |
| 数据导出 | xlsx + expo-file-system + expo-sharing |
| 构建部署 | EAS Build (云端 APK 构建) |

## AI 驱动开发全流程

### 第一阶段：需求分析与文档生成

通过与 AI 多轮对话，明确产品定位、用户角色、功能模块、业务规则等，AI 生成：

| 文档 | 用途 |
|------|------|
| `docs/产品功能介绍.md` | 产品定位、功能模块、数据库设计、页面清单 |
| `docs/V0提示词.md` | 喂给 V0 生成 UI 原型的分段提示词 |
| `docs/CODEX提示词.md` | 喂给 AI 生成完整 APP 代码的提示词 |
| `docs/技术实现架构.md` | 系统架构、数据流、DB 设计、导航结构、服务层 API |

### 第二阶段：UI 原型（V0）

将 `V0提示词.md` 中的 12 段提示词逐段输入 [V0](https://v0.dev)，生成 Next.js + Tailwind 的交互原型，用于：

- 验证页面布局和交互逻辑
- 提取 UI 设计规范（颜色、字号、间距）
- 反哺优化 CODEX 提示词

### 第三阶段：环境准备

1. **Supabase**：创建项目 → 获取 URL 和 Anon Key
2. **数据库初始化**：执行 `docs/supabase-init.sql`（建表、索引、RLS 策略、初始数据）
3. **Expo 账号**：注册并登录 EAS CLI
4. **管理员账号**：通过 Supabase Auth 创建初始管理员

配置信息记录在 `docs/环境配置.md`（已 gitignore）。

### 第四阶段：代码生成

AI 根据 `CODEX提示词.md` + `技术实现架构.md` + V0 原型，一次性生成 `mobile/` 目录下全部代码：

```
mobile/
├── App.tsx                    # 入口（ErrorBoundary + 导航）
├── src/
│   ├── lib/                   # 核心库（Supabase 客户端、工具函数、类型定义）
│   ├── theme/                 # 主题（颜色、字号、间距、Paper 主题）
│   ├── services/              # 服务层（auth、product、record、report、export）
│   ├── stores/                # Zustand 状态管理（auth、product、record）
│   ├── navigation/            # 导航（Root → Auth / WorkerTabs / AdminTabs）
│   ├── components/            # 通用组件（RecordCard、SummaryCard、DateNavigator 等）
│   └── screens/               # 页面
│       ├── auth/              #   登录
│       ├── worker/            #   员工端 6 个页面
│       └── admin/             #   管理员端 8 个页面
├── app.json                   # Expo 配置
├── eas.json                   # EAS Build 配置
├── package.json               # 依赖
└── .env                       # 环境变量（本地开发用）
```

### 第五阶段：APK 构建

```bash
# 登录 Expo
npx expo login

# 初始化 EAS 项目
npx eas init

# 云端构建 APK
npx eas build --platform android --profile preview
```

EAS 云端自动完成：`npm install` → `expo prebuild` → Gradle 编译 → 签名 → 生成 APK。

### 构建过程中遇到的问题与解决

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `react-native-url-polyfill` 找不到 | RN 0.74 已内置 URL polyfill | 删除该依赖和 import |
| `@react-native-picker/picker` 找不到 | 未声明依赖 | `npx expo install @react-native-picker/picker` |
| APK 闪退 | `.env` 未打入 EAS 构建，`createClient('')` 抛异常 | 硬编码 Supabase 凭据 |
| APK 闪退 | `xlsx` 模块加载阶段访问 Node API | 改为 `require()` 延迟加载 |
| APK 闪退 | 缺少 `react-native-gesture-handler` 初始化 | App.tsx 顶部 import |
| APK 闪退 | 未使用的原生依赖 `datetimepicker`/`netinfo` | 从 package.json 移除 |
| Gradle 构建失败 | 缺少 `expo-font`/`expo-modules-core` | `npx expo install` 补装 |
| Keystore 生成失败 | EAS 非交互模式不支持 | 新开 PowerShell 窗口交互构建 |
| 上传失败 `ECONNRESET` | 网络/代理不稳定 | 重试 |

## 关键设计决策

- **计件/计时互斥**：正在计时时禁止计件录入
- **单价快照**：计件记录保存当时单价，后续改价不影响历史
- **时薪快照**：计时记录保存当时时薪
- **半小时向上取整**：计时按半小时粒度计算，不足半小时按半小时算
- **手机号映射邮箱**：Supabase Auth 不直接支持手机号登录，使用 `{phone}@workcount.app` 映射

## 数据库

5 张表：`users`、`products`、`piece_records`、`time_records`、`price_history`

全部启用 RLS（行级安全策略），管理员可操作所有数据，员工只能操作自己的数据。

详见 `docs/supabase-init.sql`。
