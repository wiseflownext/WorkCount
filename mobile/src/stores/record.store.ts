import { create } from 'zustand';
import { PieceRecord, TimeRecord } from '../lib/types';
import * as recordService from '../services/record.service';
import { getToday } from '../lib/utils';

interface RecordState {
  todayPieceRecords: PieceRecord[];
  todayTimeRecords: TimeRecord[];
  activeTimeRecord: TimeRecord | null;
  todayIncome: { piece: number; time: number; total: number };
  isLoading: boolean;
  fetchTodayData: (userId: string) => Promise<void>;
  checkActiveTimer: (userId: string) => Promise<void>;
  addPieceRecord: (
    userId: string, productId: string, productName: string, quantity: number, unitPrice: number
  ) => Promise<PieceRecord>;
  startTimer: (
    userId: string, workContent: string, hourlyRate: number, productId?: string
  ) => Promise<TimeRecord>;
  endTimer: (recordId: string, userId: string) => Promise<TimeRecord>;
}

export const useRecordStore = create<RecordState>((set) => ({
  todayPieceRecords: [],
  todayTimeRecords: [],
  activeTimeRecord: null,
  todayIncome: { piece: 0, time: 0, total: 0 },
  isLoading: false,

  fetchTodayData: async (userId) => {
    set({ isLoading: true });
    try {
      const { pieceRecords, timeRecords } = await recordService.getRecordsByDate(userId, getToday());
      const piece = pieceRecords.reduce((s, r) => s + r.amount, 0);
      const time = timeRecords.reduce((s, r) => s + (r.amount || 0), 0);
      set({
        todayPieceRecords: pieceRecords,
        todayTimeRecords: timeRecords,
        todayIncome: { piece, time, total: piece + time },
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  checkActiveTimer: async (userId) => {
    const active = await recordService.getActiveTimeRecord(userId);
    set({ activeTimeRecord: active });
  },

  addPieceRecord: async (userId, productId, productName, quantity, unitPrice) => {
    const record = await recordService.addPieceRecord(userId, productId, productName, quantity, unitPrice);
    set((s) => {
      const newPiece = [record, ...s.todayPieceRecords];
      const piece = newPiece.reduce((sum, r) => sum + r.amount, 0);
      const time = s.todayIncome.time;
      return {
        todayPieceRecords: newPiece,
        todayIncome: { piece, time, total: piece + time },
      };
    });
    return record;
  },

  startTimer: async (userId, workContent, hourlyRate, productId) => {
    const record = await recordService.startTimeRecord(userId, workContent, hourlyRate, productId);
    set({ activeTimeRecord: record });
    return record;
  },

  endTimer: async (recordId, userId) => {
    const completed = await recordService.endTimeRecord(recordId);
    set((s) => {
      const newTime = [completed, ...s.todayTimeRecords];
      const time = newTime.reduce((sum, r) => sum + (r.amount || 0), 0);
      const piece = s.todayIncome.piece;
      return {
        activeTimeRecord: null,
        todayTimeRecords: newTime,
        todayIncome: { piece, time, total: piece + time },
      };
    });
    return completed;
  },
}));
