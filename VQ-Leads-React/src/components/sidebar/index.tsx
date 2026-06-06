import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { 
  LayoutDashboard, 
  Users, 
  FileCode, 
  DollarSign, 
  CheckSquare, 
  LogOut,
  FolderOpen,
  BarChart3,
  Settings
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'LEADER', 'AGENT'] },
    { path: '/leads', label: 'Leads Board', icon: FolderOpen, roles: ['ADMIN', 'LEADER', 'AGENT'] },
    { path: '/teams', label: 'Sales Teams', icon: Users, roles: ['ADMIN'] },
    { path: '/forms', label: 'Lead Forms', icon: FileCode, roles: ['ADMIN'] },
    { path: '/commissions', label: 'Commissions', icon: DollarSign, roles: ['ADMIN', 'LEADER', 'AGENT'] },
    { path: '/tasks', label: 'Tasks & Followups', icon: CheckSquare, roles: ['ADMIN', 'LEADER', 'AGENT'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'LEADER'] },
    { path: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
  ];


  const filteredItems = navItems.filter(item => item.roles.includes(user.profile.role));

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col justify-between p-4 shrink-0">
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-3 px-2 py-4 border-b border-border/40 mb-6">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold">
            VQ
          </div>
          <span className="font-bold text-lg text-foreground bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent">
            VQ Leads
          </span>
        </div>

        <ul className="flex flex-col gap-1.5">
          {filteredItems.map(item => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border border-transparent ${
                    isActive 
                      ? 'bg-accent/80 text-accent-foreground border-primary/20 shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  }`}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-semibold text-white">
            {user.first_name ? user.first_name[0] : user.username[0].toUpperCase()}
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-xs font-semibold text-foreground truncate">{user.full_name}</span>
            <span className={`text-[9px] w-fit font-bold uppercase rounded px-1.5 py-0.5 mt-0.5 border ${
              user.profile.role === 'ADMIN' 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : user.profile.role === 'LEADER'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-green-500/10 border-green-500/30 text-green-400'
            }`}>
              {user.profile.role}
            </span>
          </div>
        </div>

        <button 
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all text-left" 
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
