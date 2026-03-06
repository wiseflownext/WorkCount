import type { User, Product, PieceRecord, TimeRecord } from "./types";

// 模拟用户数据
export const mockUsers: User[] = [
  {
    id: "1",
    phone: "13800138001",
    name: "张师傅",
    role: "worker",
    hourlyRate: 15, // 15元/半小时
    status: "active",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    phone: "13800138002",
    name: "李工",
    role: "worker",
    hourlyRate: 12,
    status: "active",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "3",
    phone: "13800138003",
    name: "王主管",
    role: "admin",
    hourlyRate: 20,
    status: "active",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "4",
    phone: "13800138004",
    name: "赵师傅",
    role: "worker",
    hourlyRate: 14,
    status: "active",
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "5",
    phone: "13800138005",
    name: "刘师傅",
    role: "worker",
    hourlyRate: 13,
    status: "inactive",
    createdAt: new Date("2024-01-20"),
  },
];

// 模拟产品/工序数据
export const mockProducts: Product[] = [
  {
    id: "p1",
    code: "P001",
    name: "轴承组装",
    type: "process",
    unitPrice: 2.5,
    unit: "件",
    status: "active",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "p2",
    code: "P002",
    name: "电机绕线",
    type: "process",
    unitPrice: 5.0,
    unit: "个",
    status: "active",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "p3",
    code: "P003",
    name: "外壳打磨",
    type: "process",
    unitPrice: 1.8,
    unit: "件",
    status: "active",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "p4",
    code: "P004",
    name: "成品检测",
    type: "process",
    unitPrice: 1.2,
    unit: "件",
    status: "active",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "p5",
    code: "M001",
    name: "A型电机",
    type: "product",
    unitPrice: 15.0,
    unit: "套",
    status: "active",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "p6",
    code: "M002",
    name: "B型电机",
    type: "product",
    unitPrice: 18.0,
    unit: "套",
    status: "active",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "p7",
    code: "P005",
    name: "线路焊接",
    type: "process",
    unitPrice: 3.5,
    unit: "组",
    status: "inactive",
    remark: "已停用",
    createdAt: new Date("2024-01-01"),
  },
];

// 获取今天的日期字符串
const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

// 模拟计件记录
export const mockPieceRecords: PieceRecord[] = [
  {
    id: "pr1",
    userId: "1",
    productId: "p1",
    productName: "轴承组装",
    quantity: 50,
    unitPriceSnapshot: 2.5,
    amount: 125,
    workDate: today,
    createdAt: new Date(),
  },
  {
    id: "pr2",
    userId: "1",
    productId: "p2",
    productName: "电机绕线",
    quantity: 20,
    unitPriceSnapshot: 5.0,
    amount: 100,
    workDate: today,
    createdAt: new Date(),
  },
  {
    id: "pr3",
    userId: "1",
    productId: "p3",
    productName: "外壳打磨",
    quantity: 80,
    unitPriceSnapshot: 1.8,
    amount: 144,
    workDate: yesterday,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: "pr4",
    userId: "2",
    productId: "p1",
    productName: "轴承组装",
    quantity: 40,
    unitPriceSnapshot: 2.5,
    amount: 100,
    workDate: today,
    createdAt: new Date(),
  },
  {
    id: "pr5",
    userId: "4",
    productId: "p4",
    productName: "成品检测",
    quantity: 100,
    unitPriceSnapshot: 1.2,
    amount: 120,
    workDate: today,
    createdAt: new Date(),
  },
];

// 模拟计时记录
export const mockTimeRecords: TimeRecord[] = [
  {
    id: "tr1",
    userId: "1",
    workContent: "设备调试",
    startTime: new Date(Date.now() - 7200000), // 2小时前
    endTime: new Date(Date.now() - 3600000), // 1小时前
    durationHalfHours: 2,
    hourlyRateSnapshot: 15,
    amount: 30,
    workDate: today,
    status: "completed",
    createdAt: new Date(),
  },
  {
    id: "tr2",
    userId: "2",
    productId: "p5",
    workContent: "A型电机组装培训",
    startTime: new Date(Date.now() - 5400000), // 1.5小时前
    endTime: new Date(Date.now() - 1800000), // 30分钟前
    durationHalfHours: 2,
    hourlyRateSnapshot: 12,
    amount: 24,
    workDate: today,
    status: "completed",
    createdAt: new Date(),
  },
  {
    id: "tr3",
    userId: "4",
    workContent: "新员工带教",
    startTime: new Date(Date.now() - 3600000), // 1小时前
    durationHalfHours: undefined,
    hourlyRateSnapshot: 14,
    amount: undefined,
    workDate: today,
    status: "working", // 正在计时
    createdAt: new Date(),
  },
];

// 当前登录用户（模拟）
export const currentUser = mockUsers[0]; // 默认张师傅

// 获取用户今日数据
export function getUserTodayData(userId: string) {
  const todayPiece = mockPieceRecords.filter(
    (r) => r.userId === userId && r.workDate === today
  );
  const todayTime = mockTimeRecords.filter(
    (r) => r.userId === userId && r.workDate === today && r.status === "completed"
  );

  const pieceIncome = todayPiece.reduce((sum, r) => sum + r.amount, 0);
  const timeIncome = todayTime.reduce((sum, r) => sum + (r.amount || 0), 0);

  return {
    pieceIncome,
    timeIncome,
    totalIncome: pieceIncome + timeIncome,
    pieceRecords: todayPiece,
    timeRecords: todayTime,
  };
}

// 获取用户是否正在计时
export function getUserActiveTimeRecord(userId: string) {
  return mockTimeRecords.find(
    (r) => r.userId === userId && r.status === "working"
  );
}

// 获取全员今日数据（管理员用）
export function getAllTodayData() {
  const todayPiece = mockPieceRecords.filter((r) => r.workDate === today);
  const todayTime = mockTimeRecords.filter((r) => r.workDate === today);

  const totalPieceIncome = todayPiece.reduce((sum, r) => sum + r.amount, 0);
  const totalTimeIncome = todayTime
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const activeWorkers = new Set([
    ...todayPiece.map((r) => r.userId),
    ...todayTime.map((r) => r.userId),
  ]).size;

  const workingCount = todayTime.filter((r) => r.status === "working").length;

  return {
    activeWorkers,
    workingCount,
    totalPieceIncome,
    totalTimeIncome,
    totalIncome: totalPieceIncome + totalTimeIncome,
    recentRecords: [...todayPiece, ...todayTime].slice(0, 10),
  };
}
