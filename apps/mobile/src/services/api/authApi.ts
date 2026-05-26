import { axiosInstance } from '../axios';

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  hourlyRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export const authApi = {
  login: async (dto: LoginDTO): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post('/auth/login', dto);
    return data;
  },

  register: async (dto: RegisterDTO): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post('/auth/register', dto);
    return data;
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await axiosInstance.get('/auth/me');
    return data.user ?? data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },

  forgotPassword: async (email: string): Promise<void> => {
    await axiosInstance.post('/auth/forgot-password', { email });
  },

  updateProfile: async (data: { name?: string; hourlyRate?: number }): Promise<AuthUser> => {
    const { data: res } = await axiosInstance.patch('/auth/me', data);
    return res.user ?? res;
  },
};
