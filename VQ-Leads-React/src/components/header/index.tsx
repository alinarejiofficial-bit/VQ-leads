import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, FileSpreadsheet, FileCode, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';

export const Header: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { data: notifications } = useQuery({
    queryKey: ['notifications-bell'],
    queryFn: () => api.getNotifications({ archived: false }),
    refetchInterval: 15000,
  });
  const unreadCount = notifications?.unreadCount || 0;

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <header className="min-h-[70px] border-b border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 py-3 bg-card/45 backdrop-blur-xl sticky top-0 z-40">
      {/* Search Bar */}
      <div className="relative w-full md:max-w-xs">
        <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search Lead" 
          className="flex h-10 w-full rounded-lg border border-input bg-muted/20 pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-ring transition-all"
        />
      </div>

      {/* Actions, Notifications & Profile */}
      <div className="flex flex-wrap items-center gap-3.5 ml-auto select-none">
        {user?.profile.role !== 'AGENT' && (
          <>
            <button 
              onClick={() => navigate('/leads')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-sm shadow-primary/10 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus size={13} /> Add Lead
            </button>
            <button 
              onClick={() => navigate('/leads')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-xs font-bold hover:bg-secondary/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <FileSpreadsheet size={13} /> Import Excel
            </button>
          </>
        )}
        {user?.profile.role === 'ADMIN' && (
          <button 
            onClick={() => navigate('/forms')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-xs font-bold hover:bg-secondary/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <FileCode size={13} /> Create Form
          </button>
        )}

        <div className="h-5 w-[1px] bg-border mx-1 hidden sm:block" />

        {/* Theme Toggle */}
        <button 
          onClick={() => setIsDark(!isDark)}
          className="h-9 w-9 rounded-xl hover:bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-border/60 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun size={16} className="text-amber-400 animate-pulse" />
          ) : (
            <Moon size={16} className="text-indigo-500" />
          )}
        </button>

        {/* Notifications */}
        <button 
          onClick={() => navigate('/notifications')}
          className="relative h-9 w-9 rounded-xl hover:bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-border/60 hover-bell-shake"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-1 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-card">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Menu */}
        {user && (
          <div className="relative">
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-secondary/50 cursor-pointer border border-transparent hover:border-border transition-all select-none"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-bold text-[10px] text-white">
                {user.first_name ? user.first_name[0] : user.username[0].toUpperCase()}
              </div>
              <span className="text-xs font-bold text-foreground hidden sm:block truncate max-w-[80px]">{user.full_name}</span>
              <ChevronDown size={12} className="text-muted-foreground" />
            </div>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl p-1.5 animate-slide-in">
                <div className="px-3 py-2 border-b border-border text-left">
                  <div className="text-xs font-bold text-foreground truncate">{user.full_name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{user.profile.role}</div>
                </div>
                <button 
                  onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary rounded-lg transition-all"
                >
                  Account Settings
                </button>
                <button 
                  onClick={() => { setShowProfileMenu(false); useAuthStore.getState().logout(); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-all mt-1"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
