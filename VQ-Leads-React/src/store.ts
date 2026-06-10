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
    localStorage.removeItem('vq_refresh');
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

  // Stale access token without a refresh token cannot be renewed — clear once on load.
  if (savedToken && savedUser && !localStorage.getItem('vq_refresh')) {
    const exp = (() => {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
      } catch {
        return null;
      }
    })();
    if (!exp || exp <= Date.now()) {
      localStorage.removeItem('vq_token');
      localStorage.removeItem('vq_user');
    }
  }

  const initialToken = localStorage.getItem('vq_token');
  const initialUser = safeParseUser(localStorage.getItem('vq_user'));

  return {
    user: initialUser,
    token: initialToken && initialUser ? initialToken : null,
    isAuthenticated: !!initialToken && !!initialUser,

    login: (user, token) => {
      localStorage.setItem('vq_token', token);
      localStorage.setItem('vq_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
      window.dispatchEvent(new Event('auth_change'));
    },
    
    logout: () => {
      localStorage.removeItem('vq_token');
      localStorage.removeItem('vq_refresh');
      localStorage.removeItem('vq_user');
      set({ user: null, token: null, isAuthenticated: false });
      window.dispatchEvent(new Event('auth_change'));
    },
    
    setUser: (user) => {
      localStorage.setItem('vq_user', JSON.stringify(user));
      set({ user });
    }
  };
});
