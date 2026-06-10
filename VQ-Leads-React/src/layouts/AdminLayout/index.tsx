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
    <div className="flex w-screen min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-background relative overflow-x-hidden">
        {/* Glowing background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px] pointer-events-none animate-float-slow z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[140px] pointer-events-none animate-float-slower z-0" />
        
        <div className="relative z-10 flex flex-col flex-1">
          <Header />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
