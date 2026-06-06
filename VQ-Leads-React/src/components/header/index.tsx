import React from 'react';
import { Search, Bell, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../../store';

export const Header: React.FC = () => {
  const user = useAuthStore(state => state.user);

  return (
    <header className="h-[70px] border-b border-border/80 flex items-center justify-between px-8 bg-card/40 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button className="h-8 w-8 rounded-lg hover:bg-secondary/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-border/60">
          <ChevronLeft size={16} />
        </button>
        <div className="relative max-w-md w-full">
          <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search leads, customers..." 
            className="flex h-10 w-full rounded-lg border border-input bg-muted/20 pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-ring transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative h-9 w-9 rounded-xl hover:bg-secondary/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-border/60">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-[#090a0f]">
            2
          </span>
        </button>
        {user && (
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-semibold text-white border border-primary/20 cursor-pointer">
            {user.first_name ? user.first_name[0] : user.username[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
};
