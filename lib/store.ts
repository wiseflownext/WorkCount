import { create } from "zustand";
import type { User, Product, PieceRecord, TimeRecord } from "./types";
import {
  mockUsers,
  mockProducts,
  mockPieceRecords,
  mockTimeRecords,
} from "./mock-data";

interface AppState {
  // 当前用户
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // 用户列表（管理员用）
  users: User[];
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;

  // 产品列表
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;

  // 计件记录
  pieceRecords: PieceRecord[];
  addPieceRecord: (record: PieceRecord) => void;

  // 计时记录
  timeRecords: TimeRecord[];
  addTimeRecord: (record: TimeRecord) => void;
  updateTimeRecord: (id: string, data: Partial<TimeRecord>) => void;

  // 获取当前用户的活跃计时记录
  getActiveTimeRecord: () => TimeRecord | undefined;

  // 获取今日数据
  getTodayData: () => {
    pieceIncome: number;
    timeIncome: number;
    totalIncome: number;
    pieceRecords: PieceRecord[];
    timeRecords: TimeRecord[];
  };
}

const today = new Date().toISOString().split("T")[0];

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  users: mockUsers,
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (id, data) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    })),

  products: mockProducts,
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, data) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),

  pieceRecords: mockPieceRecords,
  addPieceRecord: (record) =>
    set((state) => ({ pieceRecords: [...state.pieceRecords, record] })),

  timeRecords: mockTimeRecords,
  addTimeRecord: (record) =>
    set((state) => ({ timeRecords: [...state.timeRecords, record] })),
  updateTimeRecord: (id, data) =>
    set((state) => ({
      timeRecords: state.timeRecords.map((r) =>
        r.id === id ? { ...r, ...data } : r
      ),
    })),

  getActiveTimeRecord: () => {
    const state = get();
    if (!state.currentUser) return undefined;
    return state.timeRecords.find(
      (r) => r.userId === state.currentUser!.id && r.status === "working"
    );
  },

  getTodayData: () => {
    const state = get();
    if (!state.currentUser) {
      return {
        pieceIncome: 0,
        timeIncome: 0,
        totalIncome: 0,
        pieceRecords: [],
        timeRecords: [],
      };
    }

    const todayPiece = state.pieceRecords.filter(
      (r) => r.userId === state.currentUser!.id && r.workDate === today
    );
    const todayTime = state.timeRecords.filter(
      (r) =>
        r.userId === state.currentUser!.id &&
        r.workDate === today &&
        r.status === "completed"
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
  },
}));
