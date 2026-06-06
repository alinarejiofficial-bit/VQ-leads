import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Sidebar } from '../../components/sidebar';
import { Header } from '../../components/header';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex w-screen min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-background relative">
        <Header />
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
