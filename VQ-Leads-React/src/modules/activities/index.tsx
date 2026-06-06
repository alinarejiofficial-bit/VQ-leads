import React from 'react';
import { useLocation } from 'react-router-dom';

export const Activities: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab') || 'timeline';

  return (
    <div className="p-8 text-left">
      <h2 className="text-2xl font-bold text-foreground mb-6">Activities - {tab.charAt(0).toUpperCase() + tab.slice(1)}</h2>
      
      <div className="flex gap-4 mb-6 border-b border-border/40 pb-2">
        {['timeline', 'calls', 'notes', 'emails'].map(t => (
          <a key={t} href={`/activities?tab=${t}`} className={`pb-2 px-2 text-sm font-medium ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </a>
        ))}
      </div>

      <div className="p-6 bg-card rounded-xl border border-border/40 text-muted-foreground">
        {tab === 'timeline' && <p>This is the Timeline view. Shows a chronological list of all interactions.</p>}
        {tab === 'calls' && <p>This is the Call Logs view. Shows records of all phone calls.</p>}
        {tab === 'notes' && <p>This is the Notes view. Shows internal notes left by agents.</p>}
        {tab === 'emails' && <p>This is the Emails view. Shows email correspondence.</p>}
      </div>
    </div>
  );
};

export default Activities;
