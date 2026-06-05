import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, type User } from '../api';
import { 
  LayoutDashboard, 
  Users, 
  FileCode, 
  DollarSign, 
  CheckSquare, 
  LogOut,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const location = useLocation();


  const handleLogout = () => {
    api.logout();
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'AGENT'] },
    { path: '/leads', label: 'Leads Board', icon: FolderOpen, roles: ['ADMIN', 'AGENT'] },
    { path: '/teams', label: 'Sales Teams', icon: Users, roles: ['ADMIN'] },
    { path: '/forms', label: 'Lead Forms', icon: FileCode, roles: ['ADMIN'] },
    { path: '/commissions', label: 'Commissions', icon: DollarSign, roles: ['ADMIN', 'AGENT'] },
    { path: '/tasks', label: 'Tasks & Followups', icon: CheckSquare, roles: ['ADMIN', 'AGENT'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user.profile.role));

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <div className="logo-icon">VQ</div>
        <span className="logo-text">VQ Leads</span>
      </div>

      <ul className="nav-links">
        {filteredItems.map(item => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Link to={item.path}>
                <IconComponent size={18} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div style={{ padding: '0 12px' }}>
        <div className="user-badge" style={{ justifyContent: 'flex-start', margin: '0 0 10px 0' }}>
          <div className="user-avatar">
            {user.first_name ? user.first_name[0] : user.username[0].toUpperCase()}
          </div>
          <div className="user-info-text">
            <span className="username">{user.full_name}</span>
            <span className={`role-tag ${user.profile.role.toLowerCase()}`}>
              {user.profile.role}
            </span>
          </div>
        </div>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Log Out</span>
      </button>
    </aside>
  );
};
