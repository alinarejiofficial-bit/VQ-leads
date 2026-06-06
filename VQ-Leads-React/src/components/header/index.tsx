import React, { useState } from 'react';
import { Search, Bell, Plus, FileSpreadsheet, FileCode, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
      <div className="flex flex-wrap items-center gap-3.5 ml-auto">
        <button 
          onClick={() => navigate('/leads')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-sm shadow-primary/10 cursor-pointer"
        >
          <Plus size={13} /> Add Lead
        </button>
        <button 
          onClick={() => navigate('/leads')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-xs font-bold hover:bg-secondary/80 transition-all cursor-pointer"
        >
          <FileSpreadsheet size={13} /> Import Excel
        </button>
        {user?.profile.role === 'ADMIN' && (
          <button 
            onClick={() => navigate('/forms')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-xs font-bold hover:bg-secondary/80 transition-all cursor-pointer"
          >
            <FileCode size={13} /> Create Form
          </button>
        )}

        <div className="h-5 w-[1px] bg-border mx-1 hidden sm:block" />

        {/* Notifications */}
        <button 
          onClick={() => navigate('/tasks')}
          className="relative h-9 w-9 rounded-xl hover:bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-border/60"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-card">
            2
          </span>
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
