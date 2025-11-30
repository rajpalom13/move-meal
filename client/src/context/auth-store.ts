import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';
import { initSocket, disconnectSocket } from '@/lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; phone: string; password: string; name: string; college?: string; gender?: string }) => Promise<void>;
  loginWithOTP: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateLocation: (latitude: number, longitude: number, address?: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password }) as {
            data: { user: User; token: string };
          };
          const { user, token } = response.data;

          initSocket(token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data) as {
            data: { user: User; token: string };
          };
          const { user, token } = response.data;

          initSocket(token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithOTP: async (email: string, otp: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.verifyOTP(email, otp) as {
            data: { user: User; token: string };
          };
          const { user, token } = response.data;

          initSocket(token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        disconnectSocket();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        // Redirect handled by component
      },

      updateUser: (data) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...data } });
        }
      },

      updateLocation: async (latitude, longitude, address) => {
        const { token } = get();
        if (!token) return;

        try {
          await authApi.updateLocation(token, { latitude, longitude, address });

          const { user } = get();
          if (user) {
            set({
              user: {
                ...user,
                location: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                  address,
                },
              },
            });
          }
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.getMe(token) as { data: User };
          initSocket(token);
          set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'movenmeal-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
