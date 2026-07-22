import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, type AuthUser, type LoginDTO, type RegisterDTO } from '../services/api/authApi';
import { signOutFromGoogle } from '../services/googleSignIn';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (credentials: LoginDTO) => Promise<void>;
  loginWithGoogle: (idToken: string, acceptedTerms?: boolean) => Promise<void>;
  register: (data: RegisterDTO) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    const res = await authApi.login(credentials);
    await SecureStore.setItemAsync('accessToken', res.accessToken);
    await SecureStore.setItemAsync('refreshToken', res.refreshToken);
    set({ user: res.user, isAuthenticated: true });
  },

  loginWithGoogle: async (idToken, acceptedTerms) => {
    const res = await authApi.googleLogin({ idToken, acceptedTerms });
    await SecureStore.setItemAsync('accessToken', res.accessToken);
    await SecureStore.setItemAsync('refreshToken', res.refreshToken);
    set({ user: res.user, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await authApi.register(data);
    await SecureStore.setItemAsync('accessToken', res.accessToken);
    await SecureStore.setItemAsync('refreshToken', res.refreshToken);
    set({ user: res.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear tokens regardless
    }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await signOutFromGoogle();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Refresca el perfil silenciosamente (sin togglear isLoading, para no
  // mostrar el spinner de pantalla completa). Se usa al volver a foreground:
  // así, tras verificar el email en la web, el estado emailVerifiedAt se
  // actualiza y el banner de verificación desaparece solo.
  refreshUser: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      // best-effort: si falla (offline / token expirado) dejamos el estado
      // actual; checkAuth() y el interceptor de axios manejan la sesión.
    }
  },

  setUser: (user) => set({ user }),
}));
