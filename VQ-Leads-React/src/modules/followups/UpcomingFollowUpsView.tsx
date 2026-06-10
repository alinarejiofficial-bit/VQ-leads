import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  api, type FollowUp, type FollowUpWidgetStats, type User,
} from '../../api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
import {
  Calendar, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock, Download,
  Eye, LayoutList, Pencil, Plus, Search, Settings2, Trash2, CheckCircle2,
  AlertCircle, Users, Flame, Timer,
} from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  CALL: 'Call', EMAIL: 'Email', WHATSAPP: 'WhatsApp', MEETING: 'Meeting',
  DEMO: 'Demo', SITE_VISIT: 'Site Visit', QUOTATION: 'Quotation', PAYMENT_REMINDER: 'Payment',
};

const STAGE_LABEL: Record<string, string> = {
  NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', IN_PROGRESS: 'In Progress',
  PROPOSAL_SENT: 'Proposal Sent', NEGOTIATION: 'Negotiation', WON: 'Won', LOST: 'Lost',
};

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  CONTACTED: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  QUALIFIED: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  PROPOSAL_SENT: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  NEGOTIATION: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  WON: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  LOST: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: 'bg-red-500/10 text-red-600 border-red-500/25',
  URGENT: 'bg-red-500/10 text-red-600 border-red-500/25',
  MEDIUM: 'bg-orange-500/10 text-orange-600 border-orange-500/25',
  LOW: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
};

type SortKey = 'date' | 'lead' | 'priority' | 'agent';
type ViewMode = 'table' | 'calendar';

const PAGE_SIZE = 10;

const COLUMNS = [
  { id: 'lead', label: 'Lead Name', default: true },
  { id: 'company', label: 'Company', default: true },
  { id: 'type', label: 'Follow-up Type', default: true },
  { id: 'agent', label: 'Assigned Agent', default: true },
  { id: 'date', label: 'Follow-up Date', default: true },
  { id: 'time', label: 'Follow-up Time', default: true },
  { id: 'priority', label: 'Priority', default: true },
  { id: 'stage', label: 'Lead Stage', default: true },
  { id: 'notes', label: 'Notes', default: true },
  { id: 'actions', label: 'Actions', default: true },
] as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function priorityRank(p: string) {
  return { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[p] || 0;
}

function exportCsv(rows: FollowUp[]) {
  const headers = ['Lead', 'Company', 'Type', 'Agent', 'Date', 'Time', 'Priority', 'Stage', 'Notes'];
  const lines = rows.map(f => [
    f.lead_name,
    f.lead_company || '',
    TYPE_LABEL[f.followup_type] || f.followup_type,
    f.assigned_agent_details?.full_name || '',
    fmtDate(f.scheduled_time),
    fmtTime(f.scheduled_time),
    f.priority,
    STAGE_LABEL[f.lead_status || ''] || f.lead_status || '',
    (f.notes || '').replace(/"/g, '""'),
  ].map(v => `"${v}"`).join(','));
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `upcoming-followups-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  onSchedule: () => void;
  onView: (f: FollowUp) => void;
  onEdit: (f: FollowUp) => void;
  onComplete: (id: number) => void;
  onReschedule: (id: number, time: string) => void;
  onDelete: (id: number) => void;
}

export const UpcomingFollowUpsView: React.FC<Props> = ({
  onSchedule, onView, onEdit, onComplete, onReschedule, onDelete,
}) => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState<number | ''>('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [bulkIds, setBulkIds] = useState<number[]>([]);
  const [bulkAgent, setBulkAgent] = useState<number | ''>('');
  const [bulkDays, setBulkDays] = useState('1');
  const [showColumns, setShowColumns] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    Object.fromEntries(COLUMNS.map(c => [c.id, c.default]))
  );
  const [calMonth, setCalMonth] = useState(() => new Date());

  const selectCls = 'h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-border dark:bg-muted/20 dark:text-foreground';

  const { data: stats } = useQuery<FollowUpWidgetStats>({
    queryKey: ['followup-widgets'],
    queryFn: api.getFollowUpWidgetStats,
  });

  const { data: followups = [], isLoading } = useQuery<FollowUp[]>({
    queryKey: ['followups', 'upcoming', search, agentFilter, typeFilter, priorityFilter, dateFrom, dateTo],
    queryFn: () => api.getFollowUps({
      bucket: 'upcoming',
      q: search || undefined,
      agent: agentFilter || undefined,
      followup_type: typeFilter || undefined,
      priority: priorityFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
  });

  const { data: todayFollowups = [] } = useQuery<FollowUp[]>({
    queryKey: ['followups', 'today-sidebar'],
    queryFn: () => api.getFollowUps({ bucket: 'today' }),
  });

  const { data: agents = [] } = useQuery<User[]>({ queryKey: ['agents'], queryFn: api.getAgents });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['followups'] });
    queryClient.invalidateQueries({ queryKey: ['followup-widgets'] });
  };

  const bulkReassign = useMutation({
    mutationFn: ({ ids, agent }: { ids: number[]; agent: number }) => api.bulkReassignFollowUps(ids, agent),
    onSuccess: () => { invalidate(); setBulkIds([]); },
  });

  const bulkReschedule = useMutation({
    mutationFn: ({ ids, days }: { ids: number[]; days: number }) => api.bulkRescheduleFollowUps(ids, { shift_days: days }),
    onSuccess: () => { invalidate(); setBulkIds([]); },
  });

  const filtered = useMemo(() => {
    let rows = [...followups];
    if (statusFilter) rows = rows.filter(f => f.effective_status === statusFilter);
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
      else if (sortKey === 'lead') cmp = a.lead_name.localeCompare(b.lead_name);
      else if (sortKey === 'priority') cmp = priorityRank(b.priority) - priorityRank(a.priority);
      else if (sortKey === 'agent') cmp = (a.assigned_agent_details?.full_name || '').localeCompare(b.assigned_agent_details?.full_name || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [followups, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const nextFollowup = filtered[0];
  const countdown = useMemo(() => {
    if (!nextFollowup) return null;
    const ms = new Date(nextFollowup.scheduled_time).getTime() - Date.now();
    if (ms <= 0) return 'Starting soon';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }, [nextFollowup]);

  const calDays = useMemo(() => {
    const y = calMonth.getFullYear();
    const m = calMonth.getMonth();
    const first = new Date(y, m, 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [calMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, FollowUp[]> = {};
    filtered.forEach(f => {
      const k = new Date(f.scheduled_time).toDateString();
      (map[k] ||= []).push(f);
    });
    return map;
  }, [filtered]);

  const toggleBulk = (id: number) => setBulkIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleCol = (id: string) => setVisibleCols(v => ({ ...v, [id]: !v[id] }));

  const kpiCards = [
    { label: 'Total Upcoming', value: stats?.upcomingFollowups ?? 0, icon: CalendarDays, cls: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-600' },
    { label: "Tomorrow's", value: stats?.upcomingTomorrow ?? 0, icon: Clock, cls: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 text-violet-600' },
    { label: 'This Week', value: stats?.upcomingThisWeek ?? 0, icon: Calendar, cls: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-600' },
    { label: 'High Priority', value: stats?.upcomingHighPriority ?? 0, icon: Flame, cls: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground">Upcoming Follow-ups</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">Manage and track all scheduled future follow-ups.</p>
        </div>
        <Button onClick={onSchedule} className="rounded-xl shadow-sm shadow-blue-500/20">
          <Plus size={16} className="mr-1.5" /> Schedule Follow-up
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${k.cls}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{k.label}</p>
                  <p className="mt-2 text-3xl font-bold">{k.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 dark:bg-card/60">
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4 min-w-0">
          {/* Toolbar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-border dark:bg-card">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search lead..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="h-10 rounded-xl pl-9"
                />
              </div>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-10 w-[140px] rounded-xl" title="From date" />
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-10 w-[140px] rounded-xl" title="To date" />
              <select className={selectCls} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {['CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'DEMO', 'SITE_VISIT'].map(t => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
              <select className={selectCls} value={agentFilter} onChange={e => setAgentFilter(e.target.value ? Number(e.target.value) : '')}>
                <option value="">All Agents</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
              <select className={selectCls} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="">All Priorities</option>
                {['HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
              </select>
              <select className={selectCls} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="UPCOMING">Upcoming</option>
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-border">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-border dark:bg-muted/30">
                <button type="button" onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm dark:bg-card' : 'text-muted-foreground'}`}>
                  <LayoutList size={14} /> Table
                </button>
                <button type="button" onClick={() => setViewMode('calendar')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm dark:bg-card' : 'text-muted-foreground'}`}>
                  <Calendar size={14} /> Calendar
                </button>
              </div>
              <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs" onClick={() => exportCsv(filtered)}>
                <Download size={14} className="mr-1" /> Export Excel
              </Button>
              <div className="relative">
                <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs" onClick={() => setShowColumns(s => !s)}>
                  <Settings2 size={14} className="mr-1" /> Columns
                </Button>
                {showColumns && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-border bg-card p-2 shadow-xl">
                    {COLUMNS.filter(c => c.id !== 'actions').map(c => (
                      <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted/40">
                        <input type="checkbox" checked={visibleCols[c.id]} onChange={() => toggleCol(c.id)} />
                        {c.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <select className={`${selectCls} ml-auto w-auto`} value={`${sortKey}-${sortDir}`} onChange={e => {
                const [k, d] = e.target.value.split('-') as [SortKey, 'asc' | 'desc'];
                setSortKey(k); setSortDir(d);
              }}>
                <option value="date-asc">Sort: Date ↑</option>
                <option value="date-desc">Sort: Date ↓</option>
                <option value="lead-asc">Sort: Lead A–Z</option>
                <option value="priority-desc">Sort: Priority</option>
                <option value="agent-asc">Sort: Agent</option>
              </select>
            </div>
          </div>

          {/* Bulk bar */}
          {bulkIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-3">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{bulkIds.length} selected</span>
              <select className={selectCls} value={bulkAgent} onChange={e => setBulkAgent(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Assign agent...</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
              <Button size="sm" variant="outline" className="h-9 rounded-xl text-xs" disabled={!bulkAgent} onClick={() => bulkAgent && bulkReassign.mutate({ ids: bulkIds, agent: bulkAgent })}>
                <Users size={13} className="mr-1" /> Bulk Assign
              </Button>
              <Input type="number" min={1} value={bulkDays} onChange={e => setBulkDays(e.target.value)} className="h-9 w-16 rounded-xl text-xs" />
              <Button size="sm" variant="outline" className="h-9 rounded-xl text-xs" onClick={() => bulkReschedule.mutate({ ids: bulkIds, days: Number(bulkDays) || 1 })}>
                Bulk Reschedule
              </Button>
              <button type="button" className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setBulkIds([])}>Clear</button>
            </div>
          )}

          {/* Table / Calendar */}
          {viewMode === 'calendar' ? (
            <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                <button type="button" onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
                <span className="text-sm font-bold">{calMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
                <button type="button" onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
              </div>
              <div className="grid grid-cols-7 border-b border-border/30 bg-slate-50/80 text-center text-[10px] font-bold uppercase text-muted-foreground dark:bg-muted/20">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border/30 p-2">
                {calDays.map((day, i) => {
                  const key = day.toDateString();
                  const events = eventsByDay[key] || [];
                  const inMonth = day.getMonth() === calMonth.getMonth();
                  return (
                    <div key={i} className={`min-h-[72px] rounded-lg bg-card p-1 ${inMonth ? '' : 'opacity-40'}`}>
                      <p className="text-[10px] font-bold text-muted-foreground">{day.getDate()}</p>
                      {events.slice(0, 2).map(f => (
                        <button key={f.id} type="button" onClick={() => onView(f)} className="mt-0.5 block w-full truncate rounded bg-blue-500/15 px-1 py-0.5 text-left text-[9px] font-semibold text-blue-700">
                          {fmtTime(f.scheduled_time)} {f.lead_name}
                        </button>
                      ))}
                      {events.length > 2 && <p className="text-[8px] text-muted-foreground">+{events.length - 2}</p>}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
              {isLoading ? (
                <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">Loading follow-ups…</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10">
                    <CalendarDays size={36} className="text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">No upcoming follow-ups scheduled.</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">Schedule your first follow-up to stay on top of lead conversations.</p>
                  <Button onClick={onSchedule} className="mt-6 rounded-xl">
                    <Plus size={15} className="mr-1.5" /> Schedule Follow-up
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-border dark:bg-muted/20">
                          <th className="w-10 px-3 py-3"><span className="sr-only">Select</span></th>
                          {visibleCols.lead && <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lead Name</th>}
                          {visibleCols.company && <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Company</th>}
                          {visibleCols.type && <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>}
                          {visibleCols.agent && <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Agent</th>}
                          {visibleCols.date && <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</th>}
                          {visibleCols.time && <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time</th>}
                          {visibleCols.priority && <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority</th>}
                          {visibleCols.stage && <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lead Stage</th>}
                          {visibleCols.notes && <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes</th>}
                          {visibleCols.actions && <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map(f => (
                          <tr key={f.id} className="border-b border-slate-50 transition hover:bg-blue-50/40 dark:border-border/30 dark:hover:bg-muted/10">
                            <td className="px-3 py-3">
                              <input type="checkbox" checked={bulkIds.includes(f.id)} onChange={() => toggleBulk(f.id)} className="rounded border-input" />
                            </td>
                            {visibleCols.lead && <td className="px-3 py-3 font-semibold text-foreground">{f.lead_name}</td>}
                            {visibleCols.company && <td className="px-3 py-3 text-muted-foreground">{f.lead_company || '—'}</td>}
                            {visibleCols.type && (
                              <td className="px-3 py-3">
                                <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">
                                  {TYPE_LABEL[f.followup_type] || f.followup_type}
                                </span>
                              </td>
                            )}
                            {visibleCols.agent && <td className="px-3 py-3 text-muted-foreground">{f.assigned_agent_details?.full_name || 'Unassigned'}</td>}
                            {visibleCols.date && <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(f.scheduled_time)}</td>}
                            {visibleCols.time && <td className="px-3 py-3 font-medium text-foreground">{fmtTime(f.scheduled_time)}</td>}
                            {visibleCols.priority && (
                              <td className="px-3 py-3">
                                <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_STYLE[f.priority] || PRIORITY_STYLE.MEDIUM}`}>
                                  {f.priority === 'URGENT' ? 'High' : f.priority.charAt(0) + f.priority.slice(1).toLowerCase()}
                                </span>
                              </td>
                            )}
                            {visibleCols.stage && (
                              <td className="px-3 py-3">
                                <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold ${STAGE_COLORS[f.lead_status || 'NEW'] || STAGE_COLORS.NEW}`}>
                                  {STAGE_LABEL[f.lead_status || ''] || f.lead_status || 'New'}
                                </span>
                              </td>
                            )}
                            {visibleCols.notes && <td className="max-w-[160px] truncate px-3 py-3 text-muted-foreground" title={f.notes}>{f.notes || '—'}</td>}
                            {visibleCols.actions && (
                              <td className="px-3 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <button type="button" title="View" onClick={() => onView(f)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"><Eye size={14} /></button>
                                  <button type="button" title="Edit" onClick={() => onEdit(f)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"><Pencil size={14} /></button>
                                  <button type="button" title="Reschedule" onClick={() => {
                                    const next = new Date(f.scheduled_time);
                                    next.setDate(next.getDate() + 1);
                                    const v = window.prompt('New date/time (YYYY-MM-DDTHH:MM):', next.toISOString().slice(0, 16));
                                    if (v) onReschedule(f.id, new Date(v).toISOString());
                                  }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"><Clock size={14} /></button>
                                  <button type="button" title="Complete" onClick={() => onComplete(f.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"><CheckCircle2 size={14} /></button>
                                  <button type="button" title="Delete" onClick={() => onDelete(f.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-border">
                    <p className="text-xs text-muted-foreground">
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                      <span className="text-xs font-medium">{page} / {totalPages}</span>
                      <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 p-5 shadow-sm dark:border-border">
            <div className="flex items-center gap-2 text-left">
              <Timer size={18} className="text-blue-500" />
              <h4 className="text-sm font-bold text-foreground">Next Follow-up</h4>
            </div>
            {nextFollowup ? (
              <div className="mt-4 text-left">
                <p className="text-2xl font-bold text-blue-600">{countdown}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{nextFollowup.lead_name}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(nextFollowup.scheduled_time)} · {fmtTime(nextFollowup.scheduled_time)}</p>
                <Button variant="outline" size="sm" className="mt-3 h-8 w-full rounded-xl text-xs" onClick={() => onView(nextFollowup)}>View Details</Button>
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground text-left">No upcoming follow-ups in queue.</p>
            )}
          </Card>

          <Card className="rounded-2xl border-slate-200/80 p-5 shadow-sm dark:border-border">
            <div className="flex items-center gap-2 text-left">
              <AlertCircle size={18} className="text-violet-500" />
              <h4 className="text-sm font-bold text-foreground">Today&apos;s Schedule</h4>
            </div>
            <div className="mt-3 space-y-2">
              {todayFollowups.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing scheduled for today.</p>
              ) : todayFollowups.slice(0, 5).map(f => (
                <button key={f.id} type="button" onClick={() => onView(f)} className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-muted/10 px-3 py-2 text-left hover:bg-muted/20">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{f.lead_name}</p>
                    <p className="text-[10px] text-muted-foreground">{TYPE_LABEL[f.followup_type]}</p>
                  </div>
                  <span className="text-xs font-bold text-violet-600">{fmtTime(f.scheduled_time)}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 p-5 shadow-sm dark:border-border">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">Upcoming Calendar</h4>
              <ChevronDown size={14} className="text-muted-foreground" />
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-muted-foreground">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {calDays.slice(0, 35).map((day, i) => {
                const count = (eventsByDay[day.toDateString()] || []).length;
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`flex h-8 flex-col items-center justify-center rounded-lg text-[10px] ${isToday ? 'bg-blue-500 text-white font-bold' : count ? 'bg-blue-500/15 font-semibold text-blue-700' : 'text-muted-foreground'}`}>
                    {day.getDate()}
                    {count > 0 && !isToday && <span className="h-1 w-1 rounded-full bg-blue-500" />}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
