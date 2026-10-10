import { create } from 'zustand';
import { api, getStoredToken, setStoredToken } from '../api/client';
import { disconnectSocket, initSocket } from '../socket/socket';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  expoPushToken?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setPushToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await getStoredToken();
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Verify token with backend
      const response = await api.getMe();
      if (response && response.user) {
        set({
          user: response.user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        // Initialize socket connection
        await initSocket();
      } else {
        await setStoredToken(null);
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      console.warn('[AuthStore] Session validation failed:', err);
      await setStoredToken(null);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.login({ email, password });
      await setStoredToken(response.token);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      await initSocket();
    } catch (err: any) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.register({ name, email, password });
      await setStoredToken(response.token);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      await initSocket();
    } catch (err: any) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      disconnectSocket();
      await setStoredToken(null);
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setPushToken: async (token: string) => {
    try {
      await api.updatePushToken(token);
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, expoPushToken: token } });
      }
    } catch (err) {
      console.error('[AuthStore] Failed to update push token', err);
    }
  },
}));
