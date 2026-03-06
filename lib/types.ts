// 用户类型
export interface User {
  id: string;
  phone: string;
  name: string;
  role: "admin" | "worker";
  hourlyRate: number; // 时薪（元/半小时）
  status: "active" | "inactive";
  createdAt: Date;
}

// 产品/工序类型
export interface Product {
  id: string;
  code: string;
  name: string;
  type: "product" | "process";
  unitPrice: number;
  unit: "件" | "个" | "组" | "套";
  status: "active" | "inactive";
  remark?: string;
  createdAt: Date;
}

// 计件记录
export interface PieceRecord {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceSnapshot: number;
  amount: number;
  workDate: string;
  createdAt: Date;
}

// 计时记录
export interface TimeRecord {
  id: string;
  userId: string;
  productId?: string;
  workContent: string;
  startTime: Date;
  endTime?: Date;
  durationHalfHours?: number;
  hourlyRateSnapshot: number;
  amount?: number;
  workDate: string;
  status: "working" | "completed";
  createdAt: Date;
}

// 日报数据
export interface DailyReport {
  date: string;
  pieceIncome: number;
  timeIncome: number;
  totalIncome: number;
  pieceRecords: PieceRecord[];
  timeRecords: TimeRecord[];
}

// 周报/月报数据
export interface PeriodReport {
  startDate: string;
  endDate: string;
  totalPieceIncome: number;
  totalTimeIncome: number;
  totalIncome: number;
  dailyData: {
    date: string;
    pieceIncome: number;
    timeIncome: number;
    total: number;
  }[];
}
