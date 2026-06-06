import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Task } from '../../api';
import { Card } from '../../components/common/Card';
import { ClipboardCheck, Circle, CheckCircle, Calendar } from 'lucide-react';

export const TasksList: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.updateTask(id, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleToggleTask = (task: Task) => {
    const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    toggleTaskMutation.mutate({ id: task.id, status: newStatus });
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
      <div className="text-muted-foreground text-xs font-semibold animate-pulse py-10 text-center">Loading checklist...</div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  return (
    <Card className="p-6 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3 text-left">
        <ClipboardCheck className="text-primary" size={20} />
        <h3 className="text-base font-semibold text-foreground">CRM Checklist Tasks</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Pending Tasks */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-foreground text-left uppercase tracking-wider mb-2">
            Pending Checklist ({pendingTasks.length})
          </h4>
          {pendingTasks.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border/60 rounded-lg">
              All checklist items are completed!
            </div>
          ) : (
            pendingTasks.map(t => (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:border-border transition-all text-left bg-muted/10">
                <button type="button" className="text-muted-foreground hover:text-foreground mt-0.5" onClick={() => handleToggleTask(t)}>
                  <Circle size={16} />
                </button>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground leading-snug">{t.title}</span>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                    {t.lead_name && <span className="bg-muted px-1.5 py-0.5 rounded text-foreground/80">Lead: {t.lead_name}</span>}
                    {t.due_date && <span className="flex items-center gap-1"><Calendar size={10} /> Due: {formatDate(t.due_date)}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border/30">
            <h4 className="text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider mb-2">
              Completed Items
            </h4>
            {completedTasks.map(t => (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/20 bg-muted/5 opacity-60 text-left">
                <button type="button" className="text-green-400 mt-0.5" onClick={() => handleToggleTask(t)}>
                  <CheckCircle size={16} />
                </button>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground line-through leading-snug">{t.title}</span>
                  {t.lead_name && <span className="text-[10px] text-muted-foreground">Lead: {t.lead_name}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// Unified side-by-side page view
import { FollowUpsList } from '../followups';

export const TasksPage: React.FC = () => {
  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
      <TasksList />
      <FollowUpsList />
    </div>
  );
};

export default TasksPage;

