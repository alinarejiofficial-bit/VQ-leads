import React from 'react';

export const Header: React.FC = () => {
  const getPageTitle = () => {
    const path = window.location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/leads')) return 'Leads Pipeline';
    if (path.startsWith('/teams')) return 'Sales Teams Organization';
    if (path.startsWith('/forms')) return 'Public Forms Manager';
    if (path.startsWith('/commissions')) return 'Commissions Hub';
    if (path.startsWith('/tasks')) return 'My Tasks & Reminders';
    if (path.startsWith('/reports')) return 'Analytical Reports';
    if (path.startsWith('/settings')) return 'CRM Global Settings';
    return 'CRM Platform';
  };

  return (
    <header className="h-[70px] border-b border-border/80 flex items-center justify-between px-8 bg-card/40 backdrop-blur-xl sticky top-0 z-40">
      <h2 className="text-lg font-bold text-foreground">{getPageTitle()}</h2>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border border-border/40">
          Server: {new Date().toLocaleDateString()}
        </span>
      </div>
    </header>
  );
};
