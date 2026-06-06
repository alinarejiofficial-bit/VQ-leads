import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { api, type FollowUp } from '../../api';
import { Card } from '../../components/common/Card';
import { Calendar, Circle } from 'lucide-react';

export const FollowUpsList: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const filter = searchParams.get('filter');
  const view = searchParams.get('view');

  const { data: followups = [], isLoading } = useQuery<FollowUp[]>({
    queryKey: ['followups'],
    queryFn: api.getFollowUps,
  });

  const toggleFollowupMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number, completed: boolean }) => api.updateFollowUp(id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    }
  });

  const handleToggleFollowup = (f: FollowUp) => {
    toggleFollowupMutation.mutate({ id: f.id, completed: !f.completed });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-xs font-semibold animate-pulse py-10 text-center">Loading followups...</div>
    );
  }

  let pendingReminders = followups.filter(f => !f.completed);
  
  if (filter === 'today') {
    const today = new Date().toISOString().split('T')[0];
    pendingReminders = pendingReminders.filter(f => f.scheduled_time && f.scheduled_time.startsWith(today));
  } else if (filter === 'overdue') {
    const now = new Date();
    pendingReminders = pendingReminders.filter(f => f.scheduled_time && new Date(f.scheduled_time) < now);
  }

  if (view === 'calendar') {
    return (
      <Card className="p-6 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
        <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3 text-left">
          <Calendar className="text-blue-400" size={20} />
          <h3 className="text-base font-semibold text-foreground">Follow-ups Calendar View</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Calendar view placeholder.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3 text-left">
        <Calendar className="text-blue-400" size={20} />
        <h3 className="text-base font-semibold text-foreground">Scheduled Client Follow-ups</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        <h4 className="text-xs font-semibold text-foreground text-left uppercase tracking-wider mb-2">
          {filter === 'today' ? 'Today\'s Reminders' : filter === 'overdue' ? 'Overdue Reminders' : 'Upcoming Reminders'} ({pendingReminders.length})
        </h4>
        {pendingReminders.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border/60 rounded-lg">
            No follow-up reminders scheduled.
          </div>
        ) : (
          pendingReminders.map(f => (
            <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:border-border transition-all text-left bg-muted/10">
              <button type="button" className="text-muted-foreground hover:text-foreground mt-0.5" onClick={() => handleToggleFollowup(f)}>
                <Circle size={16} />
              </button>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground leading-snug">{f.notes || 'No description'}</span>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                  <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-semibold border border-blue-500/15">
                    Lead: {f.lead_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {formatDate(f.scheduled_time)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
export default FollowUpsList;
