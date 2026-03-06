export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'admin' | 'worker';
  hourlyRate: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  type: 'product' | 'process';
  unitPrice: number;
  unit: '件' | '个' | '组' | '套';
  status: 'active' | 'inactive';
  remark?: string;
  createdAt: string;
}

export interface PieceRecord {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceSnapshot: number;
  amount: number;
  workDate: string;
  createdAt: string;
}

export interface TimeRecord {
  id: string;
  userId: string;
  productId?: string;
  workContent: string;
  startTime: string;
  endTime?: string;
  durationHalfHours?: number;
  hourlyRateSnapshot: number;
  amount?: number;
  workDate: string;
  status: 'working' | 'completed';
  createdAt: string;
}

export interface DailyReport {
  date: string;
  pieceIncome: number;
  timeIncome: number;
  totalIncome: number;
  pieceRecords: PieceRecord[];
  timeRecords: TimeRecord[];
}

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

export interface AdminDashboard {
  activeWorkers: number;
  workingCount: number;
  totalOutput: number;
  recentRecords: ActivityRecord[];
}

export interface ActivityRecord {
  id: string;
  workerName: string;
  type: 'piece' | 'time';
  productName: string;
  amount: number;
  time: string;
}
