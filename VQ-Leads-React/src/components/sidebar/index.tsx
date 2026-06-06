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
  Settings,
  ChevronDown
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
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col justify-between p-4 shrink-0 overflow-y-auto">
      <div className="flex flex-col flex-1 text-left">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-4 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
            <span className="text-xl">❖</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-base text-foreground leading-tight">
              Brisk
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              CR Management
            </span>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center justify-between border border-border rounded-xl px-3 py-2 bg-secondary/50 mb-6 cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
              M
            </div>
            <span className="text-xs font-semibold text-foreground">Mesh</span>
          </div>
          <ChevronDown size={14} className="text-muted-foreground" />
        </div>

        {/* Navigation Items */}
        <ul className="flex flex-col gap-1">
          {filteredItems.map(item => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-secondary text-primary font-semibold shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  }`}
                >
                  <IconComponent size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>


        {/* User Card */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-semibold text-white">
              {user.first_name ? user.first_name[0] : user.username[0].toUpperCase()}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-semibold text-foreground truncate">{user.full_name}</span>
              <span className="text-[9px] font-bold uppercase text-primary">
                {user.profile.role}
              </span>
            </div>
          </div>
          <button 
            className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-all" 
            onClick={handleLogout}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
