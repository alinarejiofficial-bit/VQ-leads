import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  api,
  type DashboardStats,
  type DashboardCharts,
  type TeamPerformanceData,
  type FollowUpWidgetStats,
  type LeadActivity,
} from '../../api';
import {
  RevenueLeadsTrendChart,
  PipelineFunnelChart,
  SourceBarChart,
} from '../../components/charts/CustomCharts';
import {
  Briefcase, TrendingUp, DollarSign, CalendarClock, Target, Users,
  ChevronRight, Plus, UserPlus, FileText, Upload, BarChart3, UserCheck,
  Bell,
} from 'lucide-react';

const GOALS = { revenue: 100_000, leads: 150, conversion: 20 };

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function fmtNum(v: number) {
  return v.toLocaleString('en-US');
}

function trendFromSeries(data: number[]): number {
  if (data.length < 2) return 12.5;
  const half = Math.floor(data.length / 2);
  const a = data.slice(0, half).reduce((s, n) => s + n, 0) / Math.max(half, 1);
  const b = data.slice(half).reduce((s, n) => s + n, 0) / Math.max(data.length - half, 1);
  return a === 0 ? (b > 0 ? 100 : 0) : ((b - a) / a) * 100;
}

function relativeTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  return `${Math.floor(h / 24)} days ago`;
}

function activityIcon(type: string) {
  const map: Record<string, { bg: string; icon: React.ReactNode }> = {
    CREATED: { bg: 'bg-blue-100 text-blue-600', icon: <Plus size={14} /> },
    ASSIGNMENT: { bg: 'bg-violet-100 text-violet-600', icon: <UserCheck size={14} /> },
    STATUS_CHANGE: { bg: 'bg-amber-100 text-amber-600', icon: <TrendingUp size={14} /> },
    COMMISSION_APPROVED: { bg: 'bg-emerald-100 text-emerald-600', icon: <DollarSign size={14} /> },
  };
  return map[type] || { bg: 'bg-slate-100 text-slate-600', icon: <Bell size={14} /> };
}

function activityText(act: LeadActivity) {
  const t: Record<string, string> = {
    CREATED: 'New lead created',
    ASSIGNMENT: 'Lead assigned',
    STATUS_CHANGE: 'Lead status changed',
    COMMISSION_APPROVED: 'Commission generated',
  };
  return t[act.activity_type] || act.description.slice(0, 60);
}

interface KpiProps {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  iconBg: string;
}

const KpiCard: React.FC<KpiProps> = ({ label, value, trend, trendLabel = 'this month', icon, iconBg }) => (
  <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-border dark:bg-card">
    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>{icon}</div>
    <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-foreground">{value}</p>
    {trend !== undefined ? (
      <p className={`mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {trend >= 0 ? '+' : '−'}{Math.abs(trend).toFixed(1)}% {trendLabel}
      </p>
    ) : trendLabel !== 'this month' ? (
      <p className="mt-2 text-xs font-medium text-red-500">{trendLabel}</p>
    ) : null}
  </div>
);

const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-border dark:bg-card ${className}`}>
    {children}
  </div>
);

const PanelHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
  <div className="mb-4 flex items-center justify-between">
    <h3 className="text-sm font-semibold text-slate-900 dark:text-foreground">{title}</h3>
    {action}
  </div>
);

const selectCls = 'h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 dark:border-border dark:bg-muted/20';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats,
  });
  const { data: charts, isLoading: chartsLoading } = useQuery<DashboardCharts>({
    queryKey: ['dashboard-charts'],
    queryFn: api.getDashboardCharts,
  });
  const { data: team } = useQuery<TeamPerformanceData>({
    queryKey: ['team-performance'],
    queryFn: api.getTeamPerformance,
  });
  const { data: followups } = useQuery<FollowUpWidgetStats>({
    queryKey: ['followup-widgets'],
    queryFn: api.getFollowUpWidgetStats,
  });
  const { data: activities } = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: () => api.getActivitiesTimeline({ page_size: 6 }),
  });
  const { data: notifications } = useQuery({
    queryKey: ['dashboard-notifications'],
    queryFn: () => api.getNotifications({ archived: false }),
  });

  const timeline = charts?.leadsTimeline || [];
  const leadSpark = timeline.map(d => d.count);
  const revSpark = timeline.map(d => d.revenue || 0);

  const funnelData = useMemo(() => {
    const b = stats?.statusBreakdown || {};
    return [
      { label: 'New', value: b.NEW || 0, color: '#3b82f6' },
      { label: 'Contacted', value: b.CONTACTED || 0, color: '#60a5fa' },
      { label: 'Qualified', value: b.QUALIFIED || 0, color: '#14b8a6' },
      { label: 'Proposal', value: b.IN_PROGRESS || 0, color: '#f97316' },
      { label: 'Won', value: b.WON || 0, color: '#22c55e' },
      { label: 'Lost', value: b.LOST || 0, color: '#f472b6' },
    ];
  }, [stats?.statusBreakdown]);

  const sourceData = useMemo(() => {
    const raw = stats?.sourceBreakdown || {};
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#06b6d4'];
    return Object.entries(raw)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], i) => ({ label, value, color: colors[i] }));
  }, [stats?.sourceBreakdown]);

  const agents = useMemo(
    () => [...(team?.members || [])].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    [team?.members]
  );

  if (statsLoading || chartsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 dark:bg-background">
        <p className="animate-pulse text-sm text-slate-500">Loading dashboard…</p>
      </div>
    );
  }

  const activeLeads = stats?.activeLeads ?? (
    (stats?.totalLeads || 0) - (stats?.statusBreakdown?.WON || 0) - (stats?.statusBreakdown?.LOST || 0)
  );
  const revenue = stats?.revenueThisMonth || 0;
  const totalLeadsPeriod = timeline.reduce((s, d) => s + d.count, 0);
  const totalRevPeriod = timeline.reduce((s, d) => s + (d.revenue || 0), 0);

  const kpis: KpiProps[] = [
    { label: 'Total Leads', value: fmtNum(stats?.totalLeads || 0), trend: trendFromSeries(leadSpark), icon: <Briefcase size={18} className="text-blue-600" />, iconBg: 'bg-blue-50' },
    { label: 'Active Leads', value: fmtNum(activeLeads), trend: trendFromSeries(leadSpark), icon: <Users size={18} className="text-emerald-600" />, iconBg: 'bg-emerald-50' },
    { label: 'Conversion Rate', value: `${stats?.conversionRate || 0}%`, trend: 3.2, icon: <Target size={18} className="text-violet-600" />, iconBg: 'bg-violet-50' },
    { label: 'Pipeline Value', value: fmtCurrency(stats?.pipelineValue || 0), trend: 18.7, icon: <DollarSign size={18} className="text-orange-600" />, iconBg: 'bg-orange-50' },
    { label: 'Follow-ups Due Today', value: fmtNum(followups?.todayFollowups || 0), trendLabel: `${followups?.overdueFollowups || 0} overdue`, trend: undefined, icon: <CalendarClock size={18} className="text-red-500" />, iconBg: 'bg-red-50' },
    { label: 'Revenue Generated', value: fmtCurrency(revenue), trend: trendFromSeries(revSpark), icon: <TrendingUp size={18} className="text-emerald-600" />, iconBg: 'bg-emerald-50' },
  ];

  const quickActions = [
    { label: 'Add Lead', icon: <Plus size={22} />, bg: 'bg-blue-50 text-blue-600 hover:bg-blue-100', path: '/leads' },
    { label: 'Add Agent', icon: <UserPlus size={22} />, bg: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100', path: '/teams' },
    { label: 'Create Form', icon: <FileText size={22} />, bg: 'bg-violet-50 text-violet-600 hover:bg-violet-100', path: '/forms' },
    { label: 'Import Leads', icon: <Upload size={22} />, bg: 'bg-orange-50 text-orange-600 hover:bg-orange-100', path: '/leads?action=import' },
    { label: 'Generate Report', icon: <BarChart3 size={22} />, bg: 'bg-pink-50 text-pink-600 hover:bg-pink-100', path: '/reports' },
    { label: 'Assign Leads', icon: <UserCheck size={22} />, bg: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100', path: '/leads?filter=available' },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8 dark:bg-background">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* Row 1 — KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {kpis.map(k => <KpiCard key={k.label} {...k} />)}
        </div>

        {/* Row 2 — Trend | Funnel | Follow-ups */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Panel className="lg:col-span-6">
            <PanelHeader
              title="Revenue & Leads Trend"
              action={<select className={selectCls} defaultValue="30"><option value="30">Last 30 Days</option><option value="7">Last 7 Days</option></select>}
            />
            <RevenueLeadsTrendChart data={timeline} />
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 dark:border-border">
              <div>
                <p className="text-xs text-slate-500">Total Revenue</p>
                <p className="text-lg font-bold text-slate-900 dark:text-foreground">{fmtCurrency(totalRevPeriod || revenue)}</p>
                <p className="text-xs text-emerald-600">+{trendFromSeries(revSpark).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Leads</p>
                <p className="text-lg font-bold text-slate-900 dark:text-foreground">{fmtNum(totalLeadsPeriod || stats?.totalLeads || 0)}</p>
                <p className="text-xs text-emerald-600">+{trendFromSeries(leadSpark).toFixed(1)}%</p>
              </div>
            </div>
          </Panel>

          <Panel className="lg:col-span-3">
            <PanelHeader title="Lead Pipeline Funnel" action={<select className={selectCls} defaultValue="month"><option>This Month</option></select>} />
            <PipelineFunnelChart data={funnelData} />
            <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs dark:border-border">
              <span className="text-slate-500">Total Leads: <strong className="text-slate-800">{stats?.totalLeads || 0}</strong></span>
              <span className="text-slate-500">Conversion: <strong className="text-slate-800">{stats?.conversionRate || 0}%</strong></span>
            </div>
          </Panel>

          <Panel className="lg:col-span-3">
            <PanelHeader title="Today's Follow-ups" />
            <div className="space-y-2">
              {[
                { label: 'Overdue', count: followups?.overdueFollowups || 0, color: 'text-red-600', bg: 'bg-red-50', path: '/followups?bucket=overdue' },
                { label: 'Due Today', count: followups?.todayFollowups || 0, color: 'text-orange-600', bg: 'bg-orange-50', path: '/followups?bucket=today' },
                { label: 'Upcoming', count: followups?.upcomingFollowups || 0, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/followups?bucket=upcoming' },
              ].map(row => (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => navigate(row.path)}
                  className={`flex w-full items-center justify-between rounded-lg ${row.bg} px-4 py-3 text-left transition hover:opacity-90`}
                >
                  <span className={`text-sm font-medium ${row.color}`}>{row.label}</span>
                  <span className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${row.color}`}>{row.count}</span>
                    <ChevronRight size={16} className={row.color} />
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Row 3 — Leaderboard | Sources | Activities */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Panel className="overflow-hidden p-0 lg:col-span-6">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-border">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-foreground">Agent Performance Leaderboard</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[10px] uppercase tracking-wide text-slate-500 dark:border-border">
                    <th className="px-4 py-2.5 font-semibold">#</th>
                    <th className="px-4 py-2.5 font-semibold">Agent Name</th>
                    <th className="px-4 py-2.5 font-semibold">Assigned</th>
                    <th className="px-4 py-2.5 font-semibold">Qualified</th>
                    <th className="px-4 py-2.5 font-semibold">Won</th>
                    <th className="px-4 py-2.5 font-semibold">Conv.</th>
                    <th className="px-4 py-2.5 font-semibold">Revenue</th>
                    <th className="px-4 py-2.5 font-semibold">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No agent data yet.</td></tr>
                  ) : agents.map((a, i) => (
                    <tr key={a.agentId} className={`border-b border-slate-50 ${i === 0 ? 'bg-emerald-50/60' : ''}`}>
                      <td className="px-4 py-3 font-bold text-slate-600">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[10px] font-bold text-white">
                            {a.agent.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800">{a.agent}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{a.leadsClaimed}</td>
                      <td className="px-4 py-3 tabular-nums">{a.qualifiedLeads ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums">{a.conversions}</td>
                      <td className="px-4 py-3 tabular-nums">{a.conversionRate}%</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-emerald-600">{fmtCurrency(a.revenue)}</td>
                      <td className="px-4 py-3 tabular-nums">{fmtCurrency(a.commissionEarned || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => navigate('/teams')} className="w-full py-3 text-center text-xs font-medium text-blue-600 hover:underline">
              View full leaderboard
            </button>
          </Panel>

          <Panel className="lg:col-span-3">
            <PanelHeader title="Top Lead Sources" />
            <SourceBarChart data={sourceData} />
            <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs dark:border-border">
              <span className="text-slate-500">Total Leads: <strong>{stats?.totalLeads || 0}</strong></span>
              <button type="button" onClick={() => navigate('/reports')} className="font-medium text-blue-600 hover:underline">View all sources</button>
            </div>
          </Panel>

          <Panel className="lg:col-span-3">
            <PanelHeader
              title="Recent Activities"
              action={<button type="button" onClick={() => navigate('/activities')} className="text-xs font-medium text-blue-600 hover:underline">View all</button>}
            />
            <div className="space-y-3">
              {(activities?.results || []).length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">No recent activity.</p>
              ) : (activities?.results || []).map((act: LeadActivity) => {
                const ic = activityIcon(act.activity_type);
                return (
                  <div key={act.id} className="flex gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ic.bg}`}>{ic.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800">{activityText(act)}</p>
                      <p className="truncate text-[11px] text-slate-500">{act.lead_name || act.description}</p>
                      <p className="text-[10px] text-slate-400">{relativeTime(act.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Row 4 — Goals | Quick Actions | Notifications */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel>
            <PanelHeader title="Monthly Goals" />
            <div className="space-y-4">
              {[
                { label: 'Revenue Target', cur: revenue, target: GOALS.revenue, fmt: fmtCurrency },
                { label: 'Lead Target', cur: stats?.totalLeads || 0, target: GOALS.leads, fmt: (n: number) => fmtNum(n) },
                { label: 'Conversion Goal', cur: stats?.conversionRate || 0, target: GOALS.conversion, fmt: (n: number) => `${n}%`, isPct: true },
              ].map(g => {
                const pct = Math.min(Math.round((g.cur / g.target) * 100), 100);
                return (
                  <div key={g.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{g.label}</span>
                      <span className="text-slate-500">{pct}%</span>
                    </div>
                    <div className="mb-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-500">{g.fmt(g.cur)} / {g.fmt(g.target)}</p>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Quick Actions" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3">
              {quickActions.map(a => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => navigate(a.path)}
                  className={`flex flex-col items-center gap-2 rounded-xl p-3 transition ${a.bg}`}
                >
                  {a.icon}
                  <span className="text-center text-[10px] font-semibold leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Notification Summary" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-500/10">
                <p className="text-[10px] font-medium text-blue-700">New Leads Today</p>
                <p className="text-2xl font-bold text-blue-800">{stats?.todayLeads || 0}</p>
                <p className="text-[10px] text-emerald-600">+{trendFromSeries(leadSpark).toFixed(1)}%</p>
              </div>
              <div className="rounded-xl bg-orange-50 p-3 dark:bg-orange-500/10">
                <p className="text-[10px] font-medium text-orange-700">Pending Follow-ups</p>
                <p className="text-2xl font-bold text-orange-800">{stats?.pendingFollowups || stats?.followupsDue || 0}</p>
                <p className="text-[10px] text-orange-600">{followups?.overdueFollowups || 0} overdue</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                <p className="text-[10px] font-medium text-emerald-700">Won Deals</p>
                <p className="text-2xl font-bold text-emerald-800">{stats?.wonDeals || stats?.convertedLeads || 0}</p>
                <p className="text-[10px] text-emerald-600">+{stats?.conversionRate || 0}%</p>
              </div>
              <div className="rounded-xl bg-pink-50 p-3 dark:bg-pink-500/10">
                <p className="text-[10px] font-medium text-pink-700">System Alerts</p>
                <p className="text-2xl font-bold text-pink-800">{notifications?.unreadCount || 0}</p>
                <button type="button" onClick={() => navigate('/notifications')} className="text-[10px] font-medium text-pink-600 hover:underline">View alerts</button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
