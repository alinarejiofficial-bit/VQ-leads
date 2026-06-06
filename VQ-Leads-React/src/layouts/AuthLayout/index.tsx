import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_10%_20%,rgba(147,51,234,0.08)_0%,rgba(0,0,0,0)_50%)] bg-background p-4">
      {children}
    </div>
  );
};
