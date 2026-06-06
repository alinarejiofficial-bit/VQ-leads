import React, { useState } from 'react';
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
  ChevronRight,
  Activity,
  CalendarDays,
  Bell,
  ClipboardList
} from 'lucide-react';

interface SubItem {
  label: string;
  path: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: string[];
  children?: SubItem[];
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  const navItems: NavItem[] = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      roles: ['ADMIN', 'LEADER', 'AGENT'] 
    },
    { 
      path: '/leads', 
      label: 'Leads', 
      icon: FolderOpen, 
      roles: ['ADMIN', 'LEADER', 'AGENT'],
      children: [
        { label: 'All Leads', path: '/leads' },
        { label: 'Available Leads', path: '/leads?filter=available' },
        { label: 'Claimed Leads', path: '/leads?filter=claimed' },
        { label: 'My Leads', path: '/leads?filter=my' },
        { label: 'Converted Leads', path: '/leads?filter=converted' },
        { label: 'Lost Leads', path: '/leads?filter=lost' },
        { label: 'Import Leads', path: '/leads?action=import' },
        { label: 'Export Leads', path: '/leads?action=export' },
      ]
    },
    { 
      path: '/activities', 
      label: 'Activities', 
      icon: Activity, 
      roles: ['ADMIN', 'LEADER', 'AGENT'],
      children: [
        { label: 'Timeline', path: '/activities?tab=timeline' },
        { label: 'Call Logs', path: '/activities?tab=calls' },
        { label: 'Notes', path: '/activities?tab=notes' },
        { label: 'Emails', path: '/activities?tab=emails' },
      ]
    },
    { 
      path: '/tasks', 
      label: 'Tasks', 
      icon: CheckSquare, 
      roles: ['ADMIN', 'LEADER', 'AGENT'],
      children: [
        { label: 'All Tasks', path: '/tasks' },
        { label: 'Pending', path: '/tasks?filter=pending' },
        { label: 'Completed', path: '/tasks?filter=completed' },
        { label: 'Calendar', path: '/tasks?view=calendar' },
      ]
    },
    { 
      path: '/followups', 
      label: 'Follow-ups', 
      icon: CalendarDays, 
      roles: ['ADMIN', 'LEADER', 'AGENT'],
      children: [
        { label: 'Upcoming', path: '/followups?filter=upcoming' },
        { label: 'Today', path: '/followups?filter=today' },
        { label: 'Overdue', path: '/followups?filter=overdue' },
        { label: 'Calendar', path: '/followups?view=calendar' },
      ]
    },
    { 
      path: '/forms', 
      label: 'Forms', 
      icon: FileCode, 
      roles: ['ADMIN'],
      children: [
        { label: 'All Forms', path: '/forms' },
        { label: 'Create Form', path: '/forms?action=create' },
        { label: 'Submissions', path: '/forms?tab=submissions' },
        { label: 'Embed Codes', path: '/forms?tab=embed' },
      ]
    },
    { 
      path: '/teams', 
      label: 'Team', 
      icon: Users, 
      roles: ['ADMIN'],
      children: [
        { label: 'Members', path: '/teams' },
        { label: 'Roles', path: '/teams?tab=roles' },
        { label: 'Performance', path: '/teams?tab=performance' },
      ]
    },
    { 
      path: '/commissions', 
      label: 'Commissions', 
      icon: DollarSign, 
      roles: ['ADMIN', 'LEADER', 'AGENT'] 
    },
    { 
      path: '/reports', 
      label: 'Reports', 
      icon: BarChart3, 
      roles: ['ADMIN', 'LEADER'],
      children: [
        { label: 'Lead Reports', path: '/reports?tab=leads' },
        { label: 'Conversion Reports', path: '/reports?tab=conversions' },
        { label: 'Source Reports', path: '/reports?tab=sources' },
        { label: 'Team Reports', path: '/reports?tab=team' },
        { label: 'Commission Reports', path: '/reports?tab=commissions' },
      ]
    },
    { 
      path: '/notifications', 
      label: 'Notifications', 
      icon: Bell, 
      roles: ['ADMIN', 'LEADER', 'AGENT'] 
    },
    { 
      path: '/audit-logs', 
      label: 'Audit Logs', 
      icon: ClipboardList, 
      roles: ['ADMIN'] 
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: Settings, 
      roles: ['ADMIN'],
      children: [
        { label: 'General', path: '/settings' },
        { label: 'Lead Settings', path: '/settings?tab=leads' },
        { label: 'Commission Settings', path: '/settings?tab=commissions' },
        { label: 'Email Settings', path: '/settings?tab=email' },
        { label: 'Notification Settings', path: '/settings?tab=notifications' },
        { label: 'API Settings', path: '/settings?tab=api' },
      ]
    },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user.profile.role));

  const isPathActive = (path: string) => {
    const basePath = path.split('?')[0];
    return location.pathname === basePath;
  };

  const isSubItemActive = (path: string) => {
    return location.pathname + location.search === path;
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col justify-between shrink-0 overflow-hidden">
      <div className="flex flex-col flex-1 text-left overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-4 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
            <span className="text-xl">❖</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-base text-foreground leading-tight">
              VQ Leads
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              CR Management
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-0.5">
          {filteredItems.map(item => {
            const IconComponent = item.icon;
            const isActive = isPathActive(item.path);
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openMenus[item.label] ?? isActive;

            return (
              <div key={item.label} className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                {/* Parent Item */}
                {hasChildren ? (
                  <button
                    onClick={() => setOpenMenus(prev => ({ ...prev, [item.label]: !isOpen }))}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 hover:translate-x-0.5 cursor-pointer ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent size={17} strokeWidth={isActive ? 2.2 : 1.8} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight 
                      size={14} 
                      className={`text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-90 text-primary' : ''}`} 
                    />
                  </button>
                ) : (
                  <Link 
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 hover:translate-x-0.5 ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <IconComponent size={17} strokeWidth={isActive ? 2.2 : 1.8} className={`transition-transform duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{item.label}</span>
                  </Link>
                )}

                {/* Sub Items */}
                {hasChildren && (
                  <div 
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ 
                      maxHeight: isOpen ? `${(item.children!.length) * 36}px` : '0px',
                      opacity: isOpen ? 1 : 0 
                    }}
                  >
                    <div className="ml-5 pl-4 border-l border-border/60 mt-0.5 mb-1 flex flex-col gap-0.5">
                      {item.children!.map((child) => {
                        const childActive = isSubItemActive(child.path);
                        return (
                          <Link
                            key={child.path + child.label}
                            to={child.path}
                            className={`block px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 hover:translate-x-0.5 ${
                              childActive
                                ? 'text-primary bg-primary/8 font-semibold shadow-sm shadow-primary/5'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Card - always at bottom */}
      <div className="p-4 border-t border-border/40">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-semibold text-white text-sm">
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
            className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-all cursor-pointer" 
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
