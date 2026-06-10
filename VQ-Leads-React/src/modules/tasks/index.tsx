import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  api, type Lead, type Task, type TaskComment, type TaskHistoryItem,
  type TaskPriority, type TaskStatus, type TaskType, type TaskWidgetStats, type User,
} from '../../api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
import {
  Calendar, CheckCircle2, Circle, Clock, AlertTriangle, Tag,
  ChevronRight, X, Plus, User as UserIcon,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'CALL_LEAD', label: 'Call Lead' },
  { value: 'FOLLOW_UP', label: 'Follow-Up' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'SITE_VISIT', label: 'Site Visit' },
  { value: 'SEND_EMAIL', label: 'Send Email' },
  { value: 'SEND_QUOTATION', label: 'Send Quotation' },
  { value: 'DOCUMENT_COLLECTION', label: 'Document Collection' },
  { value: 'PAYMENT_FOLLOW_UP', label: 'Payment Follow-Up' },
  { value: 'CUSTOM', label: 'Custom Task' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  MEDIUM: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  HIGH: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  URGENT: 'bg-red-500/10 border-red-500/20 text-red-400',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  IN_PROGRESS: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  COMPLETED: 'bg-green-500/10 border-green-500/20 text-green-400',
  CANCELLED: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  OVERDUE: 'bg-red-500/10 border-red-500/20 text-red-400',
};

const TASK_TYPE_COLORS: Record<TaskType, string> = {
  CALL_LEAD: '#22d3ee',
  FOLLOW_UP: '#a78bfa',
  MEETING: '#f59e0b',
  SITE_VISIT: '#10b981',
  SEND_EMAIL: '#3b82f6',
  SEND_QUOTATION: '#f97316',
  DOCUMENT_COLLECTION: '#ec4899',
  PAYMENT_FOLLOW_UP: '#84cc16',
  CUSTOM: '#94a3b8',
};

function dueLabel(dueDate: string | null): { text: string; cls: string } {
  if (!dueDate) return { text: 'No due date', cls: 'text-muted-foreground' };
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffH = Math.round(diffMs / 3600000);
  if (diffMs < 0) return { text: 'Overdue', cls: 'text-red-400 font-semibold' };
  if (diffH < 24) return { text: `Due in ${diffH}h`, cls: 'text-amber-400 font-semibold' };
  const diffD = Math.ceil(diffMs / 86400000);
  return { text: `Due in ${diffD}d`, cls: 'text-muted-foreground' };
}

// ─── Task Form ────────────────────────────────────────────────────────────────

interface TaskFormState {
  title: string;
  description: string;
  task_type: TaskType;
  priority: TaskPriority;
  due_date: string;
  reminder_time: string;
  notes: string;
  lead: number | '';
  assigned_to: number | '';
  status: TaskStatus;
}

const emptyForm = (): TaskFormState => ({
  title: '',
  description: '',
  task_type: 'CUSTOM',
  priority: 'MEDIUM',
  due_date: '',
  reminder_time: '',
  notes: '',
  lead: '',
  assigned_to: '',
  status: 'PENDING',
});

function TaskForm({
  initial,
  leads,
  agents,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<TaskFormState>;
  leads: Lead[];
  agents: User[];
  onSave: (data: TaskFormState) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<TaskFormState>({ ...emptyForm(), ...initial });
  const set = (key: keyof TaskFormState, val: any) => setForm(f => ({ ...f, [key]: val }));

    return (
    <div className="space-y-3">
      <Input placeholder="Task title *" value={form.title} onChange={e => set('title', e.target.value)} />
      <textarea
        className="w-full min-h-[80px] rounded-md border border-input bg-muted/20 px-3 py-2 text-sm"
        placeholder="Description"
        value={form.description}
        onChange={e => set('description', e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground">Task Type</label>
          <select className="mt-1 flex h-9 w-full rounded-md border border-input bg-muted/20 px-3 text-sm" value={form.task_type} onChange={e => set('task_type', e.target.value as TaskType)}>
            {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Priority</label>
          <select className="mt-1 flex h-9 w-full rounded-md border border-input bg-muted/20 px-3 text-sm" value={form.priority} onChange={e => set('priority', e.target.value as TaskPriority)}>
            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground">Due Date & Time</label>
          <Input type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Reminder</label>
          <Input type="datetime-local" value={form.reminder_time} onChange={e => set('reminder_time', e.target.value)} className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground">Related Lead</label>
          <select className="mt-1 flex h-9 w-full rounded-md border border-input bg-muted/20 px-3 text-sm" value={form.lead} onChange={e => set('lead', e.target.value ? Number(e.target.value) : '')}>
            <option value="">None</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Assign To *</label>
          <select className="mt-1 flex h-9 w-full rounded-md border border-input bg-muted/20 px-3 text-sm" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Select agent</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[11px] text-muted-foreground">Status</label>
        <select className="mt-1 flex h-9 w-full rounded-md border border-input bg-muted/20 px-3 text-sm" value={form.status} onChange={e => set('status', e.target.value as TaskStatus)}>
          {(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as TaskStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <textarea
        className="w-full min-h-[60px] rounded-md border border-input bg-muted/20 px-3 py-2 text-sm"
        placeholder="Internal notes"
        value={form.notes}
        onChange={e => set('notes', e.target.value)}
      />
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={isSaving || !form.title || !form.assigned_to}>
          {isSaving ? 'Saving...' : 'Save Task'}
        </Button>
      </div>
    </div>
  );
}

// ─── Task Detail Drawer ───────────────────────────────────────────────────────

function TaskDrawer({
  task,
  onClose,
  onStatusChange,
}: {
  task: Task;
  onClose: () => void;
  onStatusChange: (id: number, status: TaskStatus) => void;
}) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [drawerTab, setDrawerTab] = useState<'details' | 'comments' | 'history'>('details');

  const { data: comments = [] } = useQuery<TaskComment[]>({
    queryKey: ['task-comments', task.id],
    queryFn: () => api.getTaskComments(task.id),
  });

  const { data: history = [] } = useQuery<TaskHistoryItem[]>({
    queryKey: ['task-history', task.id],
    queryFn: () => api.getTaskHistory(task.id),
  });

  const addCommentMutation = useMutation({
    mutationFn: () => api.createTaskComment({ task: task.id, comment: newComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      setNewComment('');
    },
  });

  const { text: dueText, cls: dueCls } = dueLabel(task.due_date);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background border-l border-border flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: TASK_TYPE_COLORS[task.task_type] }}
              />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">{task.task_type.replace(/_/g, ' ')}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${STATUS_COLORS[task.status]}`}>{task.status}</span>
            </div>
            <h3 className="text-base font-bold text-foreground">{task.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/40 px-4">
          {(['details', 'comments', 'history'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setDrawerTab(t)}
              className={`py-2 px-3 text-xs font-semibold ${drawerTab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {drawerTab === 'details' && (
            <>
              {task.description && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{task.description}</p>}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Lead</p>
                  <p className="font-semibold text-foreground">{task.lead_name || '—'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Assigned To</p>
                  <p className="font-semibold text-foreground">{task.assigned_to_details?.full_name || '—'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Due Date</p>
                  <p className={`font-semibold ${dueCls}`}>{task.due_date ? new Date(task.due_date).toLocaleString() : '—'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Created By</p>
                  <p className="font-semibold text-foreground">{task.created_by_name}</p>
                </div>
                {task.completed_at && (
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Completed At</p>
                    <p className="font-semibold text-foreground">{new Date(task.completed_at).toLocaleString()}</p>
                  </div>
                )}
                {task.completed_by_name && (
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Completed By</p>
                    <p className="font-semibold text-foreground">{task.completed_by_name}</p>
                  </div>
                )}
              </div>
              {task.notes && (
                <div className="p-3 rounded-lg bg-muted/10 border border-border/40">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
                </div>
              )}
              {/* Countdown pill */}
              <div className={`text-xs px-3 py-2 rounded-lg border font-medium ${dueCls} bg-muted/10 border-border/40`}>
                <Clock size={11} className="inline mr-1 mb-0.5" />{dueText}
              </div>
              {/* Quick status actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as TaskStatus[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onStatusChange(task.id, s)}
                    className={`text-[11px] px-3 py-1.5 rounded border font-semibold transition-all ${task.status === s ? STATUS_COLORS[s] : 'bg-muted/10 border-border/40 text-muted-foreground hover:text-foreground'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {drawerTab === 'comments' && (
            <div className="space-y-3">
              {comments.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No comments yet.</p>}
              {comments.map(c => (
                <div key={c.id} className="p-3 rounded-lg border border-border/40 bg-muted/10">
                  <p className="text-[11px] font-semibold text-primary mb-1">{c.user_name}</p>
                  <p className="text-sm">{c.comment}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString()}</p>
                </div>
              ))}
              <div className="pt-2 space-y-2">
                <textarea
                  className="w-full min-h-[70px] rounded-md border border-input bg-muted/20 px-3 py-2 text-sm"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => addCommentMutation.mutate()}
                  disabled={addCommentMutation.isPending || !newComment.trim()}
                >
                  Add Comment
                </Button>
              </div>
        </div>
        )}

          {drawerTab === 'history' && (
            <div className="space-y-2">
              {history.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No history yet.</p>}
              {history.map(h => (
                <div key={h.id} className="flex gap-3 p-2 rounded-lg border border-border/30 text-xs">
                  <ChevronRight size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{h.action.replace(/_/g, ' ')}</p>
                    {h.old_value && <p className="text-muted-foreground">{h.old_value} → {h.new_value}</p>}
                    <p className="text-muted-foreground mt-0.5">{h.performed_by_name} · {new Date(h.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({ tasks, onSelectTask }: { tasks: Task[]; onSelectTask: (t: Task) => void }) {
  const [calView, setCalView] = useState<'month' | 'week' | 'day'>('month');
  const today = new Date();

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const calDays = useMemo(() => {
    if (calView === 'month') {
      const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
      const days: Date[] = [];
      // fill leading empty days
      for (let i = 0; i < start.getDay(); i++) days.push(new Date(start.getFullYear(), start.getMonth(), -i));
      days.reverse();
      for (let d = 1; d <= end.getDate(); d++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
      return days;
    }
    if (calView === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    return [today];
  }, [calView, viewDate]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
      if (!t.due_date) return;
      const key = new Date(t.due_date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const headerLabel = calView === 'month'
    ? viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    : calView === 'week' ? 'This Week' : today.toDateString();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">{headerLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {calView === 'month' && (
            <>
              <Button size="sm" variant="outline" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>‹</Button>
              <Button size="sm" variant="outline" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>›</Button>
            </>
          )}
          {(['month', 'week', 'day'] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setCalView(v)}
              className={`px-3 py-1 text-xs rounded border font-semibold ${calView === v ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/10 border-border/40 text-muted-foreground'}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
                </div>
              </div>

      {calView === 'month' && (
        <>
          <div className="grid grid-cols-7 text-[11px] font-semibold text-muted-foreground mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-1 text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border/20">
            {calDays.map((day, i) => {
              const key = day.toDateString();
              const dayTasks = tasksByDate[key] || [];
              const isToday = key === today.toDateString();
              const isCurrentMonth = day.getMonth() === viewDate.getMonth();
              return (
                <div key={i} className={`min-h-[80px] p-1 rounded-sm ${isCurrentMonth ? 'bg-card' : 'bg-muted/5'}`}>
                  <p className={`text-[11px] font-semibold mb-1 text-center w-6 mx-auto rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground/60'}`}>
                    {day.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelectTask(t)}
                        className="w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium"
                        style={{ background: TASK_TYPE_COLORS[t.task_type] + '20', color: TASK_TYPE_COLORS[t.task_type], border: `1px solid ${TASK_TYPE_COLORS[t.task_type]}30` }}
                      >
                        {t.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-[10px] text-muted-foreground text-center">+{dayTasks.length - 3} more</p>
        )}
      </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {calView !== 'month' && (
        <div className="space-y-2">
          {calDays.map((day, i) => {
            const key = day.toDateString();
            const dayTasks = tasksByDate[key] || [];
            return (
              <div key={i} className={`p-3 rounded-lg border ${key === today.toDateString() ? 'border-primary/40 bg-primary/5' : 'border-border/40 bg-muted/10'}`}>
                <p className="text-xs font-semibold text-foreground mb-2">{day.toDateString()}</p>
                {dayTasks.length === 0
                  ? <p className="text-xs text-muted-foreground">No tasks</p>
                  : dayTasks.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTask(t)}
                      className="w-full text-left flex items-center gap-2 p-2 rounded border border-border/30 mb-1 hover:bg-muted/20"
                    >
                      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: TASK_TYPE_COLORS[t.task_type] }} />
                      <span className="text-sm font-medium text-foreground truncate">{t.title}</span>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded border ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                    </button>
                  ))
                }
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Main Tasks Page ──────────────────────────────────────────────────────────

const TABS = ['all', 'pending', 'completed', 'calendar'] as const;
type TabKey = typeof TABS[number];

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [dueFilter, setDueFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Queries
  const { data: leads = [] } = useQuery<Lead[]>({ queryKey: ['leads'], queryFn: api.getLeads });
  const { data: agents = [] } = useQuery<User[]>({ queryKey: ['agents'], queryFn: api.getAgents });
  const { data: widgetStats } = useQuery<TaskWidgetStats>({
    queryKey: ['task-widgets'],
    queryFn: api.getTaskWidgetStats,
    refetchInterval: 30000,
  });

  const queryParams = useMemo(() => ({
    q: search || undefined,
    status: tab === 'pending' ? undefined : (tab === 'completed' ? 'COMPLETED' : statusFilter || undefined),
    priority: priorityFilter || undefined,
    task_type: taskTypeFilter || undefined,
    assigned_to: assignedFilter ? Number(assignedFilter) : undefined,
    due: dueFilter || undefined,
  }), [tab, search, statusFilter, priorityFilter, taskTypeFilter, assignedFilter, dueFilter]);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', queryParams],
    queryFn: () => api.getTasks(queryParams),
  });

  const visibleTasks = useMemo(() => {
    if (tab === 'pending') return tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'OVERDUE');
    if (tab === 'completed') return tasks.filter(t => t.status === 'COMPLETED');
    return tasks;
  }, [tasks, tab]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Task>) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-widgets'] });
      setShowCreateForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) => api.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-widgets'] });
      setEditTask(null);
      setSelectedTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-widgets'] });
      setSelectedTask(null);
    },
  });

  const handleCreate = (form: any) => {
    createMutation.mutate({
      ...form,
      lead: form.lead || null,
      assigned_to: form.assigned_to || undefined,
      due_date: form.due_date || null,
      reminder_time: form.reminder_time || null,
    });
  };

  const handleEdit = (form: any) => {
    if (!editTask) return;
    updateMutation.mutate({
      id: editTask.id,
      data: {
        ...form,
        lead: form.lead || null,
        due_date: form.due_date || null,
        reminder_time: form.reminder_time || null,
      },
    });
  };

  const handleStatusChange = (id: number, status: TaskStatus) => {
    updateMutation.mutate({ id, data: { status } });
    if (selectedTask?.id === id) setSelectedTask(prev => prev ? { ...prev, status } : null);
  };

  const completedToday = widgetStats?.completedToday ?? 0;
  const completedThisWeek = widgetStats?.completedThisWeek ?? 0;
  const completedThisMonth = widgetStats?.completedThisMonth ?? 0;

  return (
    <div className="p-6 space-y-5 text-left">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground">Tasks</h2>
        <Button onClick={() => { setShowCreateForm(true); setEditTask(null); }}>
          <Plus size={15} className="mr-1.5" /> New Task
        </Button>
      </div>

      {/* Widget stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Tasks', val: widgetStats?.totalTasks ?? 0, cls: '' },
          { label: 'Pending', val: widgetStats?.pendingTasks ?? 0, cls: '' },
          { label: 'Completed', val: widgetStats?.completedTasks ?? 0, cls: 'text-green-400' },
          { label: 'Overdue', val: widgetStats?.overdueTasks ?? 0, cls: 'text-red-400' },
          { label: 'Due Today', val: widgetStats?.tasksDueToday ?? 0, cls: 'text-amber-400' },
          { label: 'High Priority', val: widgetStats?.highPriorityTasks ?? 0, cls: 'text-orange-400' },
        ].map(({ label, val, cls }) => (
          <Card key={label} className="p-3">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold ${cls}`}>{val}</p>
          </Card>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border/40">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Inline create / edit form */}
      {(showCreateForm || editTask) && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">{editTask ? 'Edit Task' : 'New Task'}</h3>
          <TaskForm
            initial={editTask ? {
              title: editTask.title,
              description: editTask.description,
              task_type: editTask.task_type,
              priority: editTask.priority,
              due_date: editTask.due_date?.slice(0, 16) ?? '',
              reminder_time: editTask.reminder_time?.slice(0, 16) ?? '',
              notes: editTask.notes,
              lead: editTask.lead ?? '',
              assigned_to: editTask.assigned_to,
              status: editTask.status,
            } : undefined}
            leads={leads}
            agents={agents}
            onSave={editTask ? handleEdit : handleCreate}
            onCancel={() => { setShowCreateForm(false); setEditTask(null); }}
            isSaving={createMutation.isPending || updateMutation.isPending}
          />
        </Card>
      )}

      {/* Calendar */}
      {tab === 'calendar' && (
        <CalendarView tasks={tasks} onSelectTask={setSelectedTask} />
      )}

      {/* Completed stats (completed tab) */}
      {tab === 'completed' && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Completed Today</p>
            <p className="text-lg font-bold text-green-400">{completedToday}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[11px] text-muted-foreground">This Week</p>
            <p className="text-lg font-bold text-green-400">{completedThisWeek}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[11px] text-muted-foreground">This Month</p>
            <p className="text-lg font-bold text-green-400">{completedThisMonth}</p>
          </Card>
        </div>
      )}

      {/* Filters (not calendar) */}
      {tab !== 'calendar' && (
        <Card className="p-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-48"
            />
            {tab === 'all' && (
              <select className="h-9 rounded-md border border-input bg-muted/20 px-3 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                {(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'] as TaskStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <select className="h-9 rounded-md border border-input bg-muted/20 px-3 text-sm" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">All Priority</option>
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="h-9 rounded-md border border-input bg-muted/20 px-3 text-sm" value={taskTypeFilter} onChange={e => setTaskTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="h-9 rounded-md border border-input bg-muted/20 px-3 text-sm" value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)}>
              <option value="">All Agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
            {tab === 'pending' && (
              <select className="h-9 rounded-md border border-input bg-muted/20 px-3 text-sm" value={dueFilter} onChange={e => setDueFilter(e.target.value)}>
                <option value="">All Due</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this_week">This Week</option>
                <option value="overdue">Overdue</option>
                <option value="high_priority">High Priority</option>
              </select>
            )}
          </div>
        </Card>
      )}

      {/* Task table */}
      {tab !== 'calendar' && (
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">Loading tasks...</div>
          ) : visibleTasks.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No tasks found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Lead</th>
                    <th className="px-4 py-3">Assigned To</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map(task => {
                    const { text, cls } = dueLabel(task.due_date);
                    return (
                      <tr
                        key={task.id}
                        className="border-b border-border/20 hover:bg-muted/10 cursor-pointer transition-colors"
                        onClick={() => setSelectedTask(task)}
                      >
                        <td className="px-4 py-3 font-semibold text-foreground max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-2 h-2 rounded-full shrink-0"
                              style={{ background: TASK_TYPE_COLORS[task.task_type] }}
                            />
                            <span className="truncate">{task.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{task.lead_name || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <UserIcon size={12} className="text-muted-foreground" />
                            <span>{task.assigned_to_details?.full_name ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] px-2 py-0.5 rounded border font-semibold" style={{ background: TASK_TYPE_COLORS[task.task_type] + '20', color: TASK_TYPE_COLORS[task.task_type], borderColor: TASK_TYPE_COLORS[task.task_type] + '40' }}>
                            {task.task_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${PRIORITY_COLORS[task.priority]}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-xs ${cls}`}>{text}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${STATUS_COLORS[task.status]}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {task.status !== 'COMPLETED' && (
                              <button
                                type="button"
                                title="Mark Complete"
                                onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                                className="text-green-400 hover:text-green-300 p-1 rounded"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}
                            {task.status === 'COMPLETED' && (
                              <button
                                type="button"
                                title="Reopen"
                                onClick={() => handleStatusChange(task.id, 'PENDING')}
                                className="text-muted-foreground hover:text-foreground p-1 rounded"
                              >
                                <Circle size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => { setEditTask(task); setShowCreateForm(false); }}
                              className="text-muted-foreground hover:text-foreground p-1 rounded"
                            >
                              <Tag size={13} />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate(task.id); }}
                              className="text-red-400/60 hover:text-red-400 p-1 rounded"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Pending quick actions (quick card view) */}
      {tab === 'pending' && visibleTasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
          {visibleTasks.map(task => {
            const { text, cls } = dueLabel(task.due_date);
            return (
              <div
                key={`card-${task.id}`}
                className={`p-4 rounded-xl border cursor-pointer hover:shadow-sm transition-all text-left ${task.status === 'OVERDUE' ? 'border-red-500/30 bg-red-500/5' : 'border-border/50 bg-card'}`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-foreground text-sm leading-snug">{task.title}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase shrink-0 ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                </div>
                {task.lead_name && <p className="text-[11px] text-muted-foreground mb-1">Lead: {task.lead_name}</p>}
                <div className="flex items-center gap-2 flex-wrap text-[11px] mt-2">
                  <span className={cls}><Clock size={10} className="inline mr-0.5" />{text}</span>
                  <span style={{ color: TASK_TYPE_COLORS[task.task_type] }}>{task.task_type.replace(/_/g, ' ')}</span>
                  {task.status === 'OVERDUE' && <span className="flex items-center gap-1 text-red-400"><AlertTriangle size={10} />Overdue</span>}
                </div>
                <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    className="text-[11px] px-2 py-1 rounded border border-green-500/30 text-green-400 bg-green-500/5 hover:bg-green-500/10 font-semibold"
                    onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                  >
                    Mark Done
                  </button>
                  <button
                    type="button"
                    className="text-[11px] px-2 py-1 rounded border border-violet-500/30 text-violet-400 bg-violet-500/5 hover:bg-violet-500/10 font-semibold"
                    onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    className="text-[11px] px-2 py-1 rounded border border-border/40 text-muted-foreground hover:text-foreground font-semibold"
                    onClick={() => { setEditTask(task); setShowCreateForm(false); }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default TasksPage;
