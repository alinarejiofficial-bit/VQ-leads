import React from 'react';
import { type User } from '../../api';
import { AdminDashboard } from './AdminDashboard';
import { AgentDashboard } from './AgentDashboard';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  if (user.profile.role === 'ADMIN') {
    return <AdminDashboard />;
  }
  return <AgentDashboard user={user} />;
};

export default Dashboard;
