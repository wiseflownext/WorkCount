import { create } from 'zustand';
import { User } from '../lib/types';
import * as authService from '../services/auth.service';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (phone, password) => {
    set({ isLoading: true });
    try {
      const user = await authService.login(phone, password);
      set({ currentUser: user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ currentUser: null, isAuthenticated: false });
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentSession();
      set({ currentUser: user, isAuthenticated: !!user, isLoading: false });
    } catch {
      set({ currentUser: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
}));
