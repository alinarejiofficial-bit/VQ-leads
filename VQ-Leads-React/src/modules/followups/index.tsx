import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  api, type FollowUp, type FollowUpAnalytics, type FollowUpHistoryItem,
  type FollowUpPriority, type FollowUpType, type FollowUpWidgetStats,
  type Lead, type User,
} from '../../api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
import { LineChart, BarChart } from '../../components/charts/CustomCharts';
import {
  Calendar, CalendarDays, CheckCircle2, Clock, AlertTriangle, Phone, Mail,
  ChevronLeft, ChevronRight, X, Plus, History, Bell, TrendingUp, Target,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const FOLLOWUP_TYPES: { value: FollowUpType; label: string }[] = [
  { value: 'CALL', label: 'Phone Call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'SITE_VISIT', label: 'Site Visit' },
  { value: 'DEMO', label: 'Demo Presentation' },
  { value: 'QUOTATION', label: 'Quotation Follow-up' },
  { value: 'PAYMENT_REMINDER', label: 'Payment Reminder' },
];

const TYPE_LABEL: Record<FollowUpType, string> = Object.fromEntries(
  FOLLOWUP_TYPES.map(t => [t.value, t.label])
) as Record<FollowUpType, string>;

const TYPE_COLORS: Record<FollowUpType, string> = {
  CALL: '#22d3ee',
  EMAIL: '#3b82f6',
  WHATSAPP: '#10b981',
  MEETING: '#f59e0b',
  SITE_VISIT: '#84cc16',
  DEMO: '#a78bfa',
  QUOTATION: '#f97316',
  PAYMENT_REMINDER: '#ec4899',
};

const PRIORITIES: FollowUpPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const PRIORITY_COLORS: Record<FollowUpPriority, string> = {
  LOW: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  MEDIUM: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  HIGH: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  URGENT: 'bg-red-500/10 border-red-500/20 text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  TODAY: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  OVERDUE: 'bg-red-500/10 border-red-500/20 text-red-400',
  COMPLETED: 'bg-green-500/10 border-green-500/20 text-green-400',
  CANCELLED: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
};

const REMINDER_PRESETS = [
  { id: 'none', label: 'No Reminder', minutes: null },
  { id: '15m', label: '15 Minutes Before', minutes: 15 },
  { id: '1h', label: '1 Hour Before', minutes: 60 },
  { id: '1d', label: '1 Day Before', minutes: 1440 },
] as const;

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const badge = (text: string, cls: string) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase whitespace-nowrap ${cls}`}>{text}</span>
);

// ─── Follow-up Form ───────────────────────────────────────────────────────────

interface FormState {
  lead: number | '';
  assigned_agent: number | '';
  followup_type: FollowUpType;
  scheduled_time: string;
  priority: FollowUpPriority;
  notes: string;
  reminder: string;
}

const emptyForm = (): FormState => ({
  lead: '',
  assigned_agent: '',
  followup_type: 'CALL',
  scheduled_time: '',
  priority: 'MEDIUM',
  notes: '',
  reminder: 'none',
});

function FollowUpForm({
  initial, leads, agents, onSave, onCancel, isSaving,
}: {
  initial?: Partial<FormState>;
  leads: Lead[];
  agents: User[];
  onSave: (data: Partial<FollowUp>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<FormState>({ ...emptyForm(), ...initial });
  const set = (key: keyof FormState, val: any) => setForm(f => ({ ...f, [key]: val }));

  const selectCls = 'flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer';

  const submit = () => {
    if (!form.lead || !form.scheduled_time) {
      alert('Lead and date/time are required.');
      return;
    }
    const scheduled = new Date(form.scheduled_time);
    let reminder_time: string | null = null;
    const preset = REMINDER_PRESETS.find(p => p.id === form.reminder);
    if (preset?.minutes) {
      reminder_time = new Date(scheduled.getTime() - preset.minutes * 60000).toISOString();
    }
    onSave({
      lead: Number(form.lead),
      assigned_agent: form.assigned_agent ? Number(form.assigned_agent) : null,
      followup_type: form.followup_type,
      scheduled_time: scheduled.toISOString(),
      priority: form.priority,
      notes: form.notes,
      reminder_time,
    });
  };

  return (
    <div className="space-y-3 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground">Lead *</label>
          <select className={selectCls} value={form.lead} onChange={e => set('lead', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Select lead...</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground">Assigned Agent</label>
          <select className={selectCls} value={form.assigned_agent} onChange={e => set('assigned_agent', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Me (default)</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground">Follow-up Type</label>
          <select className={selectCls} value={form.followup_type} onChange={e => set('followup_type', e.target.value)}>
            {FOLLOWUP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground">Date &amp; Time *</label>
          <Input type="datetime-local" value={form.scheduled_time} onChange={e => set('scheduled_time', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground">Priority</label>
          <select className={selectCls} value={form.priority} onChange={e => set('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground">Reminder</label>
          <select className={selectCls} value={form.reminder} onChange={e => set('reminder', e.target.value)}>
            {REMINDER_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Notes</label>
        <textarea
          className="w-full min-h-[70px] rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Notes about this follow-up..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={submit} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Follow-up'}
        </Button>
      </div>
    </div>
  );
}

// ─── Details Drawer ───────────────────────────────────────────────────────────

function FollowUpDrawer({
  followup, onClose, onComplete, onCancelFollowup, onReschedule,
}: {
  followup: FollowUp;
  onClose: () => void;
  onComplete: (id: number, notes?: string) => void;
  onCancelFollowup: (id: number) => void;
  onReschedule: (id: number, newTime: string) => void;
}) {
  const [tab, setTab] = useState<'details' | 'history'>('details');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const { data: history = [] } = useQuery<FollowUpHistoryItem[]>({
    queryKey: ['followup-history', followup.id],
    queryFn: () => api.getFollowUpHistory(followup.id),
    enabled: tab === 'history',
  });

  const isActive = followup.status === 'SCHEDULED';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto p-6 text-left animate-slide-in">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{followup.lead_name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{TYPE_LABEL[followup.followup_type]} follow-up</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {badge(followup.effective_status, STATUS_COLORS[followup.effective_status])}
          {badge(followup.priority, PRIORITY_COLORS[followup.priority])}
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase"
            style={{ color: TYPE_COLORS[followup.followup_type], borderColor: `${TYPE_COLORS[followup.followup_type]}40`, backgroundColor: `${TYPE_COLORS[followup.followup_type]}15` }}
          >
            {TYPE_LABEL[followup.followup_type]}
          </span>
        </div>

        <div className="flex gap-3 border-b border-border/40 mb-4">
          {(['details', 'history'] as const).map(t => (
            <button
              key={t}
              className={`pb-2 text-xs font-semibold capitalize ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'details' && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Date</p>
                <p className="text-foreground font-medium mt-0.5">{fmtDate(followup.scheduled_time)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Time</p>
                <p className="text-foreground font-medium mt-0.5">{fmtTime(followup.scheduled_time)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Assigned Agent</p>
                <p className="text-foreground font-medium mt-0.5">{followup.assigned_agent_details?.full_name || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Created By</p>
                <p className="text-foreground font-medium mt-0.5">{followup.created_by_name}</p>
              </div>
              {followup.reminder_time && (
                <div className="col-span-2 flex items-center gap-1.5 text-xs text-amber-400">
                  <Bell size={12} /> Reminder at {fmtDate(followup.reminder_time)} {fmtTime(followup.reminder_time)}
                </div>
              )}
              {followup.effective_status === 'OVERDUE' && (
                <div className="col-span-2 flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                  <AlertTriangle size={12} /> {followup.days_overdue} day(s) overdue
                </div>
              )}
              {followup.completed_at && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Completed</p>
                  <p className="text-foreground font-medium mt-0.5">
                    {fmtDate(followup.completed_at)} {fmtTime(followup.completed_at)} by {followup.completed_by_name}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Notes</p>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/10 border border-border/40 rounded-lg p-3">
                {followup.notes || 'No notes.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {followup.lead_phone && (
                <a href={`tel:${followup.lead_phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20">
                  <Phone size={12} /> Call
                </a>
              )}
              {followup.lead_email && (
                <a href={`mailto:${followup.lead_email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20">
                  <Mail size={12} /> Email
                </a>
              )}
            </div>

            {isActive && (
              <div className="space-y-3 pt-3 border-t border-border/40">
                <Button className="w-full" onClick={() => onComplete(followup.id)}>
                  <CheckCircle2 size={14} className="mr-1.5" /> Mark as Completed
                </Button>
                <div className="flex gap-2">
                  <Input type="datetime-local" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="flex-1" />
                  <Button
                    variant="outline"
                    disabled={!rescheduleTime}
                    onClick={() => { onReschedule(followup.id, new Date(rescheduleTime).toISOString()); setRescheduleTime(''); }}
                  >
                    Reschedule
                  </Button>
                </div>
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={() => onCancelFollowup(followup.id)}>
                  Cancel Follow-up
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No history yet.</p>
            ) : (
              history.map(h => (
                <div key={h.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/40 bg-muted/10">
                  <History size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{h.action.replace(/_/g, ' ')}</p>
                    {(h.old_value || h.new_value) && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 break-words">
                        {h.old_value && <span className="line-through mr-1">{h.old_value}</span>}
                        {h.new_value}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {h.performed_by_name} · {fmtDate(h.created_at)} {fmtTime(h.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({
  followups, agents, onSelect, onDropReschedule,
}: {
  followups: FollowUp[];
  agents: User[];
  onSelect: (f: FollowUp) => void;
  onDropReschedule: (id: number, day: Date) => void;
}) {
  const [mode, setMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [cursor, setCursor] = useState(() => new Date());
  const [agentFilter, setAgentFilter] = useState<number | ''>('');

  const filtered = useMemo(
    () => agentFilter ? followups.filter(f => f.assigned_agent === agentFilter) : followups,
    [followups, agentFilter]
  );

  const eventsByDay = useMemo(() => {
    const map: Record<string, FollowUp[]> = {};
    filtered.forEach(f => {
      const key = new Date(f.scheduled_time).toDateString();
      (map[key] = map[key] || []).push(f);
    });
    Object.values(map).forEach(list => list.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)));
    return map;
  }, [filtered]);

  const navigate = (dir: -1 | 1) => {
    const next = new Date(cursor);
    if (mode === 'daily') next.setDate(next.getDate() + dir);
    else if (mode === 'weekly') next.setDate(next.getDate() + dir * 7);
    else next.setMonth(next.getMonth() + dir);
    setCursor(next);
  };

  const days: Date[] = useMemo(() => {
    if (mode === 'daily') return [new Date(cursor)];
    if (mode === 'weekly') {
      const start = new Date(cursor);
      start.setDate(start.getDate() - start.getDay());
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  }, [mode, cursor]);

  const title = mode === 'monthly'
    ? cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })
    : mode === 'weekly'
      ? `Week of ${days[0].toLocaleDateString([], { month: 'short', day: 'numeric' })}`
      : cursor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const todayKey = new Date().toDateString();
  const selectCls = 'h-9 rounded-lg border border-input bg-muted/20 px-3 text-xs font-semibold text-foreground focus:outline-none cursor-pointer';

  const renderEvent = (f: FollowUp, compact: boolean) => (
    <div
      key={f.id}
      draggable={f.status === 'SCHEDULED'}
      onDragStart={e => e.dataTransfer.setData('text/plain', String(f.id))}
      onClick={() => onSelect(f)}
      className="rounded px-1.5 py-1 cursor-pointer hover:opacity-80 transition-opacity text-left"
      style={{ backgroundColor: `${TYPE_COLORS[f.followup_type]}20`, borderLeft: `3px solid ${TYPE_COLORS[f.followup_type]}` }}
      title={`${f.lead_name} · ${TYPE_LABEL[f.followup_type]} · ${fmtTime(f.scheduled_time)}`}
    >
      <p className="text-[10px] font-bold text-foreground truncate">{fmtTime(f.scheduled_time)} {f.lead_name}</p>
      {!compact && <p className="text-[9px] text-muted-foreground truncate">{TYPE_LABEL[f.followup_type]}</p>}
    </div>
  );

  return (
    <Card className="p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}><ChevronLeft size={15} /></button>
          <h3 className="text-sm font-bold text-foreground min-w-[180px] text-center">{title}</h3>
          <button className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground" onClick={() => navigate(1)}><ChevronRight size={15} /></button>
          <Button variant="outline" size="sm" className="h-8 text-xs ml-1" onClick={() => setCursor(new Date())}>Today</Button>
        </div>
        <div className="flex items-center gap-2">
          <select className={selectCls} value={agentFilter} onChange={e => setAgentFilter(e.target.value ? Number(e.target.value) : '')}>
            <option value="">All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
          <div className="flex rounded-lg border border-border/60 overflow-hidden">
            {(['daily', 'weekly', 'monthly'] as const).map(m => (
              <button
                key={m}
                className={`px-3 py-1.5 text-xs font-semibold capitalize ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Type legend */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {FOLLOWUP_TYPES.map(t => (
          <span key={t.value} className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[t.value] }} /> {t.label}
          </span>
        ))}
      </div>

      {mode === 'monthly' && (
        <>
          <div className="grid grid-cols-7 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const key = day.toDateString();
              const events = eventsByDay[key] || [];
              const inMonth = day.getMonth() === cursor.getMonth();
              return (
                <div
                  key={idx}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const id = Number(e.dataTransfer.getData('text/plain'));
                    if (id) onDropReschedule(id, day);
                  }}
                  className={`min-h-[88px] rounded-lg border p-1.5 ${
                    key === todayKey ? 'border-primary/50 bg-primary/5' : 'border-border/40 bg-muted/5'
                  } ${inMonth ? '' : 'opacity-40'}`}
                >
                  <p className="text-[10px] font-bold text-muted-foreground mb-1 text-left">{day.getDate()}</p>
                  <div className="space-y-1">
                    {events.slice(0, 3).map(f => renderEvent(f, true))}
                    {events.length > 3 && (
                      <p className="text-[9px] text-muted-foreground font-semibold text-left">+{events.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-left">Tip: drag an event onto another day to reschedule it.</p>
        </>
      )}

      {mode === 'weekly' && (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const key = day.toDateString();
            const events = eventsByDay[key] || [];
            return (
              <div
                key={idx}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const id = Number(e.dataTransfer.getData('text/plain'));
                  if (id) onDropReschedule(id, day);
                }}
                className={`min-h-[200px] rounded-lg border p-2 ${key === todayKey ? 'border-primary/50 bg-primary/5' : 'border-border/40 bg-muted/5'}`}
              >
                <p className="text-[10px] font-bold text-muted-foreground mb-2 text-center">
                  {day.toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                </p>
                <div className="space-y-1.5">{events.map(f => renderEvent(f, false))}</div>
              </div>
            );
          })}
        </div>
      )}

      {mode === 'daily' && (
        <div className="space-y-2 min-h-[200px]">
          {(eventsByDay[cursor.toDateString()] || []).length === 0 ? (
            <p className="text-xs text-muted-foreground py-10 text-center border border-dashed border-border/60 rounded-lg">No follow-ups on this day.</p>
          ) : (
            (eventsByDay[cursor.toDateString()] || []).map(f => (
              <div
                key={f.id}
                onClick={() => onSelect(f)}
                className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10 cursor-pointer hover:border-border"
                style={{ borderLeft: `4px solid ${TYPE_COLORS[f.followup_type]}` }}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{f.lead_name}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABEL[f.followup_type]} · {f.assigned_agent_details?.full_name || 'Unassigned'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {badge(f.priority, PRIORITY_COLORS[f.priority])}
                  <span className="text-xs font-bold text-foreground">{fmtTime(f.scheduled_time)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function AnalyticsView() {
  const { data } = useQuery<FollowUpAnalytics>({
    queryKey: ['followup-analytics'],
    queryFn: api.getFollowUpAnalytics,
  });

  if (!data) {
    return <div className="text-xs text-muted-foreground animate-pulse py-10 text-center">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 text-left">
          <h4 className="text-sm font-semibold text-foreground mb-1">Daily Follow-up Trend</h4>
          <p className="text-xs text-muted-foreground mb-4">Scheduled vs completed, last 14 days</p>
          <LineChart data={data.dailyTrend.map(d => ({ date: d.date, count: d.scheduled, convertedCount: d.completed }))} />
        </Card>
        <Card className="p-5 text-left">
          <h4 className="text-sm font-semibold text-foreground mb-1">Monthly Performance</h4>
          <p className="text-xs text-muted-foreground mb-4">Completed follow-ups per month</p>
          <BarChart data={data.monthlyPerformance.map(m => ({ label: m.month, value: m.completed, color: '#10b981' }))} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 text-left md:col-span-2">
          <h4 className="text-sm font-semibold text-foreground mb-4">Agent Productivity</h4>
          <div className="space-y-2">
            {data.byAgent.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6">No agent data yet.</p>
            ) : (
              data.byAgent.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.agent}</p>
                    <p className="text-[10px] text-muted-foreground">@{a.username}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-foreground font-bold">{a.total} total</span>
                    <span className="text-green-400 font-bold">{a.completed} done</span>
                    <span className="text-red-400 font-bold">{a.overdue} overdue</span>
                    <span className="text-primary font-bold">{a.completionRate}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Target size={15} className="text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Key Metrics</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Conversion after follow-up</span>
                <span className="font-bold text-green-400">{data.conversionAfterFollowup}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Avg completion time</span>
                <span className="font-bold text-foreground">{data.avgCompletionHours}h</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 text-left">
            <h4 className="text-sm font-semibold text-foreground mb-3">By Status</h4>
            <div className="space-y-2">
              {Object.entries(data.byStatus).map(([s, count]) => (
                <div key={s} className="flex items-center justify-between">
                  {badge(s, STATUS_COLORS[s] || '')}
                  <span className="text-xs font-bold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 text-left">
            <h4 className="text-sm font-semibold text-foreground mb-3">By Lead Source</h4>
            <div className="space-y-2">
              {data.bySource.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">{s.source}</span>
                  <span className="font-bold text-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = 'upcoming' | 'today' | 'overdue' | 'calendar' | 'analytics';

export const FollowUps: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const tab: TabId = (searchParams.get('view') === 'calendar')
    ? 'calendar'
    : ((searchParams.get('filter') as TabId) || (searchParams.get('tab') as TabId) || 'upcoming');

  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState<number | ''>('');
  const [leadFilter, setLeadFilter] = useState<number | ''>('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<FollowUp | null>(null);
  const [bulkIds, setBulkIds] = useState<number[]>([]);
  const [bulkAgent, setBulkAgent] = useState<number | ''>('');
  const [bulkDays, setBulkDays] = useState('1');

  const setTab = (t: TabId) => {
    setBulkIds([]);
    navigate(t === 'calendar' ? '/followups?view=calendar' : `/followups?filter=${t}`);
  };

  // ── Queries ──
  const { data: stats } = useQuery<FollowUpWidgetStats>({
    queryKey: ['followup-widgets'],
    queryFn: api.getFollowUpWidgetStats,
  });

  const listBucket = tab === 'calendar' || tab === 'analytics' ? undefined : tab;
  const { data: followups = [], isLoading } = useQuery<FollowUp[]>({
    queryKey: ['followups', listBucket, search, agentFilter, leadFilter, typeFilter, priorityFilter],
    queryFn: () => api.getFollowUps({
      bucket: listBucket,
      q: search || undefined,
      agent: agentFilter || undefined,
      lead: leadFilter || undefined,
      followup_type: typeFilter || undefined,
      priority: priorityFilter || undefined,
    }),
  });

  const { data: allFollowups = [] } = useQuery<FollowUp[]>({
    queryKey: ['followups-all'],
    queryFn: () => api.getFollowUps(),
    enabled: tab === 'calendar',
  });

  const { data: leads = [] } = useQuery<Lead[]>({ queryKey: ['leads'], queryFn: () => api.getLeads() });
  const { data: agents = [] } = useQuery<User[]>({ queryKey: ['agents'], queryFn: api.getAgents });

  // ── Mutations ──
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['followups'] });
    queryClient.invalidateQueries({ queryKey: ['followups-all'] });
    queryClient.invalidateQueries({ queryKey: ['followup-widgets'] });
    queryClient.invalidateQueries({ queryKey: ['followup-analytics'] });
  };

  const createMutation = useMutation({
    mutationFn: api.createFollowUp,
    onSuccess: () => { invalidate(); setShowForm(false); },
    onError: (e: Error) => alert(e.message || 'Failed to create follow-up'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FollowUp> }) => api.updateFollowUp(id, data),
    onSuccess: (updated) => { invalidate(); setSelected(prev => (prev && prev.id === updated.id ? updated : prev)); },
    onError: (e: Error) => alert(e.message || 'Failed to update follow-up'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => api.completeFollowUp(id, notes),
    onSuccess: (updated) => { invalidate(); setSelected(prev => (prev && prev.id === updated.id ? updated : prev)); },
  });

  const bulkReassignMutation = useMutation({
    mutationFn: ({ ids, agent }: { ids: number[]; agent: number }) => api.bulkReassignFollowUps(ids, agent),
    onSuccess: () => { invalidate(); setBulkIds([]); setBulkAgent(''); },
  });

  const bulkRescheduleMutation = useMutation({
    mutationFn: ({ ids, days }: { ids: number[]; days: number }) => api.bulkRescheduleFollowUps(ids, { shift_days: days }),
    onSuccess: () => { invalidate(); setBulkIds([]); },
  });

  const handleComplete = (id: number) => {
    const notes = window.prompt('Add completion notes (optional):') || undefined;
    completeMutation.mutate({ id, notes });
  };

  const handleCancelFollowup = (id: number) => {
    if (!window.confirm('Cancel this follow-up?')) return;
    updateMutation.mutate({ id, data: { status: 'CANCELLED' } });
    setSelected(null);
  };

  const handleReschedule = (id: number, newTime: string) => {
    updateMutation.mutate({ id, data: { scheduled_time: newTime } });
  };

  const handleDropReschedule = (id: number, day: Date) => {
    const f = allFollowups.find(x => x.id === id);
    if (!f) return;
    const old = new Date(f.scheduled_time);
    const next = new Date(day);
    next.setHours(old.getHours(), old.getMinutes(), 0, 0);
    handleReschedule(id, next.toISOString());
  };

  const toggleBulk = (id: number) => {
    setBulkIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectCls = 'h-10 rounded-lg border border-input bg-muted/20 px-3 text-xs font-semibold text-foreground focus:outline-none cursor-pointer';

  const widgets = [
    { label: 'Total Follow-ups', value: stats?.totalFollowups ?? 0, icon: CalendarDays, cls: 'bg-primary/10 border-primary/20 text-primary' },
    { label: 'Upcoming', value: stats?.upcomingFollowups ?? 0, icon: Clock, cls: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
    { label: "Today", value: stats?.todayFollowups ?? 0, icon: Calendar, cls: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
    { label: 'Overdue', value: stats?.overdueFollowups ?? 0, icon: AlertTriangle, cls: 'bg-red-500/10 border-red-500/20 text-red-400' },
    { label: 'Completed', value: stats?.completedFollowups ?? 0, icon: CheckCircle2, cls: 'bg-green-500/10 border-green-500/20 text-green-400' },
    { label: 'Success Rate', value: `${stats?.successRate ?? 0}%`, icon: TrendingUp, cls: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-xl font-bold text-foreground">Follow-ups</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Schedule, track and complete lead follow-ups</p>
        </div>
        <Button onClick={() => setShowForm(s => !s)}>
          <Plus size={15} className="mr-1.5" /> Schedule Follow-up
        </Button>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {widgets.map((w, idx) => {
          const Icon = w.icon;
          return (
            <Card key={idx} className="p-4 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{w.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{w.value}</p>
              </div>
              <div className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${w.cls}`}>
                <Icon size={16} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 text-left">Schedule New Follow-up</h3>
          <FollowUpForm
            leads={leads}
            agents={agents}
            isSaving={createMutation.isPending}
            onCancel={() => setShowForm(false)}
            onSave={data => createMutation.mutate(data)}
          />
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/40 overflow-x-auto">
        {([
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'today', label: "Today" },
          { id: 'overdue', label: 'Overdue' },
          { id: 'calendar', label: 'Calendar' },
          { id: 'analytics', label: 'Analytics' },
        ] as { id: TabId; label: string }[]).map(t => (
          <button
            key={t.id}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap ${
              tab === t.id ? 'text-primary border-b-2 border-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Today summary strip */}
      {tab === 'today' && stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{stats.todayFollowups}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Total Due Today</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.completedToday}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Completed Today</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.pendingToday}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Pending Today</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      {(tab === 'upcoming' || tab === 'today' || tab === 'overdue') && (
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search lead or notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-[220px] h-10"
          />
          <select className={selectCls} value={agentFilter} onChange={e => setAgentFilter(e.target.value ? Number(e.target.value) : '')}>
            <option value="">All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
          <select className={selectCls} value={leadFilter} onChange={e => setLeadFilter(e.target.value ? Number(e.target.value) : '')}>
            <option value="">All Leads</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select className={selectCls} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {FOLLOWUP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className={selectCls} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
      )}

      {/* Bulk action bar (overdue) */}
      {tab === 'overdue' && bulkIds.length > 0 && (
        <Card className="p-3 flex flex-wrap items-center gap-3 border-primary/30">
          <span className="text-xs font-bold text-foreground">{bulkIds.length} selected</span>
          <div className="flex items-center gap-2">
            <select className={selectCls} value={bulkAgent} onChange={e => setBulkAgent(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Reassign to...</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
            <Button
              size="sm" variant="outline" className="h-9 text-xs"
              disabled={!bulkAgent || bulkReassignMutation.isPending}
              onClick={() => bulkAgent && bulkReassignMutation.mutate({ ids: bulkIds, agent: bulkAgent })}
            >
              Bulk Reassign
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" min={1} value={bulkDays} onChange={e => setBulkDays(e.target.value)} className="w-20 h-9 text-xs" />
            <span className="text-xs text-muted-foreground">days</span>
            <Button
              size="sm" variant="outline" className="h-9 text-xs"
              disabled={bulkRescheduleMutation.isPending}
              onClick={() => bulkRescheduleMutation.mutate({ ids: bulkIds, days: Number(bulkDays) || 1 })}
            >
              Bulk Reschedule
            </Button>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground ml-auto" onClick={() => setBulkIds([])}>Clear</button>
        </Card>
      )}

      {/* Content */}
      {tab === 'analytics' && <AnalyticsView />}

      {tab === 'calendar' && (
        <CalendarView
          followups={allFollowups.filter(f => f.status === 'SCHEDULED')}
          agents={agents}
          onSelect={setSelected}
          onDropReschedule={handleDropReschedule}
        />
      )}

      {(tab === 'upcoming' || tab === 'today' || tab === 'overdue') && (
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-xs text-muted-foreground animate-pulse">Loading follow-ups...</div>
          ) : followups.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No {tab} follow-ups. {tab !== 'overdue' && 'Schedule one to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left">
                    {tab === 'overdue' && <th className="px-4 py-3 w-8"></th>}
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lead Name</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Agent</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {tab === 'overdue' ? 'Original Due Date' : 'Date'}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {tab === 'overdue' ? 'Days Overdue' : 'Time'}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followups.map(f => (
                    <tr
                      key={f.id}
                      className={`border-b border-border/20 hover:bg-muted/10 cursor-pointer ${
                        tab === 'overdue' ? 'bg-red-500/[0.04]' : ''
                      }`}
                      onClick={() => setSelected(f)}
                    >
                      {tab === 'overdue' && (
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-input bg-muted/20 cursor-pointer"
                            checked={bulkIds.includes(f.id)}
                            onChange={() => toggleBulk(f.id)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-semibold text-foreground text-left">{f.lead_name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-left">{f.assigned_agent_details?.full_name || '—'}</td>
                      <td className="px-4 py-3 text-left">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase whitespace-nowrap"
                          style={{ color: TYPE_COLORS[f.followup_type], borderColor: `${TYPE_COLORS[f.followup_type]}40`, backgroundColor: `${TYPE_COLORS[f.followup_type]}15` }}
                        >
                          {TYPE_LABEL[f.followup_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-left whitespace-nowrap">{fmtDate(f.scheduled_time)}</td>
                      <td className="px-4 py-3 text-left whitespace-nowrap">
                        {tab === 'overdue' ? (
                          <span className="text-red-400 font-bold">{f.days_overdue}d</span>
                        ) : (
                          <span className="text-muted-foreground">{fmtTime(f.scheduled_time)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-left">{badge(f.effective_status, STATUS_COLORS[f.effective_status])}</td>
                      <td className="px-4 py-3 text-left">{badge(f.priority, PRIORITY_COLORS[f.priority])}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {tab === 'today' && f.lead_phone && (
                            <a
                              href={`tel:${f.lead_phone}`}
                              className="h-8 w-8 rounded-lg border border-green-500/20 bg-green-500/10 text-green-400 flex items-center justify-center hover:bg-green-500/20"
                              title="Quick Call"
                            >
                              <Phone size={13} />
                            </a>
                          )}
                          {tab === 'today' && f.lead_email && (
                            <a
                              href={`mailto:${f.lead_email}`}
                              className="h-8 w-8 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20"
                              title="Quick Email"
                            >
                              <Mail size={13} />
                            </a>
                          )}
                          <Button
                            variant="outline" size="sm" className="h-8 px-2.5 text-xs"
                            onClick={() => handleComplete(f.id)}
                            title="Mark Completed"
                          >
                            <CheckCircle2 size={13} className="mr-1" /> Complete
                          </Button>
                          <Button
                            variant="outline" size="sm" className="h-8 px-2.5 text-xs"
                            onClick={() => {
                              const next = new Date(f.scheduled_time);
                              next.setDate(next.getDate() + 1);
                              const input = window.prompt('Reschedule to (YYYY-MM-DDTHH:MM):', toLocalInputValue(next));
                              if (input) handleReschedule(f.id, new Date(input).toISOString());
                            }}
                            title="Reschedule"
                          >
                            <Clock size={13} className="mr-1" /> Reschedule
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Drawer */}
      {selected && (
        <FollowUpDrawer
          followup={selected}
          onClose={() => setSelected(null)}
          onComplete={handleComplete}
          onCancelFollowup={handleCancelFollowup}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  );
};

export default FollowUps;
