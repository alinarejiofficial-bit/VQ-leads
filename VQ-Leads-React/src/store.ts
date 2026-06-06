import { create } from 'zustand';
import { type User } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('vq_token');
  const savedUser = localStorage.getItem('vq_user');
  
  if (typeof window !== 'undefined') {
    window.addEventListener('auth_change', () => {
      const token = localStorage.getItem('vq_token');
      const user = localStorage.getItem('vq_user');
      set({
        token,
        user: user ? JSON.parse(user) : null,
        isAuthenticated: !!token
      });
    });
  }

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken,
    isAuthenticated: !!savedToken,
    
    login: (user, token) => {
      localStorage.setItem('vq_token', token);
      localStorage.setItem('vq_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    
    logout: () => {
      localStorage.removeItem('vq_token');
      localStorage.removeItem('vq_user');
      set({ user: null, token: null, isAuthenticated: false });
    },
    
    setUser: (user) => {
      localStorage.setItem('vq_user', JSON.stringify(user));
      set({ user });
    }
  };
});
