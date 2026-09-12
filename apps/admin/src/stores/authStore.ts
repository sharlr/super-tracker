import { create } from 'zustand';
import axios from 'axios';

interface AuthState {
  token: string | null;
  user: any | null;
  loading: boolean;
  login: (email: string, password: string, tenantSlug: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  loading: false,

  login: async (email: string, password: string, tenantSlug: string) => {
    try {
      set({ loading: true });
      const response = await axios.post('/api/v1/auth/login', {
        email,
        password,
        tenantSlug
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ token, user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      set({ token, user: JSON.parse(user) });
    }
  }
}));

// Set up axios default headers
export function setupAxiosInterceptors() {
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4010';
    return config;
  });
}
