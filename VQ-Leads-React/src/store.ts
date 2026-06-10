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

function safeParseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem('vq_user');
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('vq_token');
  const savedUser = safeParseUser(localStorage.getItem('vq_user'));

  // If we have a token but no usable user object, clear the stale token too
  if (savedToken && !savedUser) {
    localStorage.removeItem('vq_token');
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('auth_change', () => {
      const token = localStorage.getItem('vq_token');
      const user = safeParseUser(localStorage.getItem('vq_user'));
      set({
        token: user ? token : null,
        user,
        isAuthenticated: !!token && !!user,
      });
    });
  }

  return {
    user: savedUser,
    token: savedToken && savedUser ? savedToken : null,
    isAuthenticated: !!savedToken && !!savedUser,
    
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
