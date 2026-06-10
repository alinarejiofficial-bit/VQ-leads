import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, type User, type AgentDashboardData } from '../../api';
import { LineChart, DonutChart, BarChart } from '../../components/charts/CustomCharts';
import { Card } from '../../components/common/Card';
import {
  Briefcase,
  Calendar,
  CheckSquare,
  DollarSign,
  Flame,
  Phone,
  AlertTriangle,
  Activity,
  TrendingUp,
  PhoneCall,
  Target,
  Wallet,
  Sparkles,
} from 'lucide-react';

interface AgentDashboardProps {
  user: User;
}

const priorityClass = (priority: string) => {
  if (priority === 'High') return 'bg-red-500/10 text-red-400 border-red-500/20';
  if (priority === 'Medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-muted/40 text-muted-foreground border-border/40';
};

const KPI_CARDS = [
  { key: 'myLeads' as const, label: 'My Leads', icon: Briefcase, gradient: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-400', border: 'border-blue-500/20' },
  { key: 'todaysCalls' as const, label: "Today's Calls", icon: PhoneCall, gradient: 'from-violet-500/20 to-violet-600/5', iconColor: 'text-violet-400', border: 'border-violet-500/20' },
  { key: 'pendingFollowups' as const, label: 'Pending Follow-ups', icon: Calendar, gradient: 'from-cyan-500/20 to-cyan-600/5', iconColor: 'text-cyan-400', border: 'border-cyan-500/20' },
  { key: 'tasksDue' as const, label: 'Tasks Due', icon: CheckSquare, gradient: 'from-purple-500/20 to-purple-600/5', iconColor: 'text-purple-400', border: 'border-purple-500/20' },
  { key: 'convertedLeads' as const, label: 'Converted Leads', icon: Target, gradient: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400', border: 'border-emerald-500/20' },
  { key: 'revenueGenerated' as const, label: 'Revenue Generated', icon: TrendingUp, gradient: 'from-amber-500/20 to-amber-600/5', iconColor: 'text-amber-400', border: 'border-amber-500/20', isCurrency: true },
  { key: 'commissionEarned' as const, label: 'Commission Earned', icon: Wallet, gradient: 'from-green-500/20 to-green-600/5', iconColor: 'text-green-400', border: 'border-green-500/20', isCurrency: true },
];

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ user }) => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<AgentDashboardData>({
    queryKey: ['agent-dashboard'],
    queryFn: api.getAgentDashboard,
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  if (isLoading || !data) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-70px)]">
        <div className="text-muted-foreground text-sm font-semibold animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  const {
    summary,
    monthlyPerformance,
    charts,
    hotLeads,
    todaysFollowups,
    todaysTasks,
    recentActivities,
    overdueFollowups,
  } = data;

  const donutData = charts.pipelineChart
    .filter(d => d.value > 0)
    .map(d => ({ label: d.label, value: d.value, color: d.color }));

  const formatKpiValue = (key: typeof KPI_CARDS[number]['key'], isCurrency?: boolean) => {
    const val = summary[key];
    return isCurrency ? formatCurrency(val) : val;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-6 md:p-8 text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Agent Workspace</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {user.first_name || user.full_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {monthlyPerformance.conversionRate}% conversion rate this month · {monthlyPerformance.callsMade} calls made
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/leads?filter=available')}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Claim Leads
            </button>
            <button
              onClick={() => navigate('/leads?filter=my')}
              className="px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-bold hover:bg-muted/40 transition-all"
            >
              My Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* 7 KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {KPI_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.key}
              className={`p-4 bg-gradient-to-br ${card.gradient} border ${card.border} hover-card-lift animate-fade-in-up opacity-0 cursor-default shadow-sm`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className={`h-9 w-9 rounded-lg bg-card/60 border ${card.border} flex items-center justify-center mb-3 transition-all duration-300 hover:scale-110`}>
                <Icon size={18} className={card.iconColor} />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">
                {card.label}
              </p>
              <p className="text-xl font-bold text-foreground mt-1 tabular-nums">
                {formatKpiValue(card.key, card.isCurrency)}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 text-left hover-card-lift animate-fade-in-up opacity-0 shadow-sm" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Activity Overview</h3>
              <p className="text-xs text-muted-foreground">Calls vs conversions — last 14 days</p>
            </div>
            <div className="flex gap-4 text-[10px] font-semibold">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Calls
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> Conversions
              </span>
            </div>
          </div>
          <LineChart data={charts.activityTimeline} />
        </Card>

        <Card className="p-5 text-left hover-card-lift animate-fade-in-up opacity-0 shadow-sm" style={{ animationDelay: '340ms' }}>
          <h3 className="text-sm font-bold text-foreground mb-1">Pipeline Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-2">Lead status distribution</p>
          <DonutChart data={donutData.length > 0 ? donutData : [{ label: 'No leads', value: 1, color: '#334155' }]} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 text-left hover-card-lift animate-fade-in-up opacity-0 shadow-sm" style={{ animationDelay: '380ms' }}>
          <h3 className="text-sm font-bold text-foreground mb-1">Monthly Revenue</h3>
          <p className="text-xs text-muted-foreground mb-4">Won deals revenue trend</p>
          <BarChart
            data={charts.monthlyRevenue.map((item, i) => ({
              ...item,
              color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 6],
            }))}
          />
        </Card>

        <Card className="p-5 text-left hover-card-lift animate-fade-in-up opacity-0 shadow-sm" style={{ animationDelay: '420ms' }}>
          <h3 className="text-sm font-bold text-foreground mb-4">This Month at a Glance</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calls Made', value: monthlyPerformance.callsMade, icon: Phone, color: 'text-violet-400 bg-violet-500/10' },
              { label: 'Conversions', value: monthlyPerformance.conversions, icon: Target, color: 'text-emerald-400 bg-emerald-500/10' },
              { label: 'Revenue', value: formatCurrency(monthlyPerformance.revenue), icon: DollarSign, color: 'text-amber-400 bg-amber-500/10' },
              { label: 'Conversion Rate', value: `${monthlyPerformance.conversionRate}%`, icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="p-4 rounded-xl border border-border/40 bg-muted/10 flex items-center gap-3 transition-all duration-300 hover:scale-[1.03] hover:bg-muted/20">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-115 ${item.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">{item.label}</p>
                    <p className="text-lg font-bold text-foreground">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Hot Leads */}
      <Card className="overflow-hidden text-left hover-card-lift animate-fade-in-up opacity-0 shadow-sm" style={{ animationDelay: '460ms' }}>
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-transparent">
          <Flame size={16} className="text-orange-400 animate-pulse" />
          <h3 className="text-sm font-bold text-foreground">Hot Leads</h3>
        </div>
        {hotLeads.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">No active hot leads right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left font-semibold px-5 py-3">Name</th>
                  <th className="text-left font-semibold px-5 py-3">Source</th>
                  <th className="text-left font-semibold px-5 py-3">Priority</th>
                  <th className="text-left font-semibold px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {hotLeads.map(lead => (
                  <tr
                    key={lead.id}
                    className="border-b border-border/20 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate('/leads')}
                  >
                    <td className="px-5 py-3 font-semibold text-foreground">{lead.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{lead.source}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${priorityClass(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-foreground">{lead.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="text-left hover-card-lift animate-fade-in-up opacity-0 shadow-sm" style={{ animationDelay: '500ms' }}>
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
            <Calendar size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-foreground">Today&apos;s Follow-ups</h3>
          </div>
          <div className="p-4 space-y-2">
            {todaysFollowups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups scheduled for today.</p>
            ) : (
              todaysFollowups.map(f => (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-muted/10 transition-all duration-300 hover:scale-[1.02] hover:bg-muted/20">
                  <span className="text-xs font-bold text-primary whitespace-nowrap mt-0.5">{f.time}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{f.leadName}</p>
                    <p className="text-xs text-muted-foreground truncate">{f.notes}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="text-left hover-card-lift animate-fade-in-up opacity-0 shadow-sm" style={{ animationDelay: '540ms' }}>
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
            <CheckSquare size={16} className="text-green-400" />
            <h3 className="text-sm font-bold text-foreground">Today&apos;s Tasks</h3>
          </div>
          <div className="p-4 space-y-2">
            {todaysTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending tasks.</p>
            ) : (
              todaysTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10 transition-all duration-300 hover:scale-[1.02] hover:bg-muted/20">
                  <span className="text-sm font-medium text-foreground">{t.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ml-2 ${priorityClass(t.priority)}`}>
                    {t.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="text-left hover-card-lift animate-fade-in-up opacity-0 shadow-sm" style={{ animationDelay: '580ms' }}>
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Recent Activities</h3>
          </div>
          <div className="p-4 space-y-2">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity.</p>
            ) : (
              recentActivities.map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0 transition-all duration-300 hover:translate-x-1">
                  <Phone size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground">{a.time}</span>
                    <p className="text-sm text-foreground">{a.label}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="text-left border-red-500/20 hover-card-lift animate-fade-in-up opacity-0 shadow-sm" style={{ animationDelay: '620ms' }}>
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2 bg-gradient-to-r from-red-500/10 to-transparent">
            <AlertTriangle size={16} className="text-red-400 animate-bounce" />
            <h3 className="text-sm font-bold text-foreground">
              Overdue Follow-ups {overdueFollowups.length > 0 && `(${overdueFollowups.length})`}
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {overdueFollowups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">You&apos;re all caught up!</p>
            ) : (
              overdueFollowups.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5 transition-all duration-300 hover:scale-[1.02] hover:bg-red-500/10">
                  <span className="text-sm font-semibold text-foreground">{f.leadName}</span>
                  <span className="text-xs font-bold text-red-400">{f.overdueLabel}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

    </div>
  );
};
