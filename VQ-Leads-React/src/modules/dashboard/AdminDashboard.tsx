import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type DashboardStats, type DashboardCharts, type User } from '../../api';
import { LineChart, DonutChart } from '../../components/charts/CustomCharts';
import { Card } from '../../components/common/Card';
import { Briefcase, TrendingUp, DollarSign, Users } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [timelineRange, setTimelineRange] = useState<'weekly' | 'monthly'>('weekly');
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery<DashboardCharts>({
    queryKey: ['dashboard-charts'],
    queryFn: api.getDashboardCharts,
  });

  const { data: agents = [] } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  });

  if (statsLoading || chartsLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-70px)]">
        <div className="text-muted-foreground text-sm font-semibold animate-pulse">Loading dashboard metrics...</div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const donutData = stats ? [
    { label: 'New', value: stats.statusBreakdown.NEW || 0, color: 'var(--primary)' },
    { label: 'Contacted', value: stats.statusBreakdown.CONTACTED || 0, color: '#c084fc' },
    { label: 'In Progress', value: stats.statusBreakdown.IN_PROGRESS || 0, color: '#f59e0b' },
    { label: 'Qualified', value: stats.statusBreakdown.QUALIFIED || 0, color: 'var(--primary)' },
    { label: 'Won', value: stats.statusBreakdown.WON || 0, color: '#10b981' },
    { label: 'Lost', value: stats.statusBreakdown.LOST || 0, color: '#ef4444' },
  ] : [];

  const timelineData = useMemo(() => {
    const data = charts?.leadsTimeline || [];
    if (timelineRange === 'weekly') return data.slice(-7);
    return data;
  }, [charts?.leadsTimeline, timelineRange]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of leads, agents, and performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Leads</span>
            <span className="text-3xl font-bold mt-2 text-foreground">{stats?.totalLeads || 0}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Briefcase size={22} />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversion Rate</span>
            <span className="text-3xl font-bold mt-2 text-foreground">{stats?.conversionRate || 0}%</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Value</span>
            <span className="text-3xl font-bold mt-2 text-foreground">{formatCurrency(stats?.pipelineValue || 0)}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Commissions</span>
            <span className="text-3xl font-bold mt-2 text-foreground">{formatCurrency(stats?.earnedCommissions || 0)}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="mb-6 flex items-start justify-between gap-3 text-left">
            <div>
              <h3 className="text-base font-semibold text-foreground">Lead Ingestion Timeline</h3>
              <p className="text-xs text-muted-foreground">
                {timelineRange === 'weekly' ? 'Inquiries submitted over the past 7 days' : 'Inquiries submitted over the past 15 days'}
              </p>
            </div>
            <select
              className="h-10 rounded-xl border border-input bg-muted/20 px-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer min-w-[140px]"
              value={timelineRange}
              onChange={e => setTimelineRange(e.target.value as 'weekly' | 'monthly')}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {charts && <LineChart data={timelineData} />}
        </Card>

        <Card className="p-6">
          <div className="mb-6 text-left">
            <h3 className="text-base font-semibold text-foreground">Status Funnel</h3>
            <p className="text-xs text-muted-foreground">Distribution of active pipeline leads</p>
          </div>
          <DonutChart data={donutData} />
        </Card>
      </div>

      <Card className="p-6 text-left">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <div>
              <h3 className="text-base font-semibold text-foreground">Sales Agents</h3>
              <p className="text-xs text-muted-foreground">{agents.length} active agent{agents.length !== 1 ? 's' : ''} registered</p>
            </div>
          </div>
        </div>
        {agents.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border/60 rounded-xl">
            <p className="text-sm text-muted-foreground">No agents added yet. Use Team → Members to create agents.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {agent.first_name ? agent.first_name[0] : agent.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{agent.full_name}</p>
                  <p className="text-[10px] text-muted-foreground">@{agent.username} · {Number(agent.profile.effective_commission_rate)}% comm.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-6 text-left">
            <h3 className="text-base font-semibold text-foreground">Agent Performance Leaderboard</h3>
            <p className="text-xs text-muted-foreground">Revenue and conversion performance ranking</p>
          </div>
          <div className="space-y-3">
            {charts?.leaderboard && charts.leaderboard.length > 0 ? (
              charts.leaderboard.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? 'bg-amber-500 text-black' :
                          idx === 1 ? 'bg-slate-400 text-black' :
                            idx === 2 ? 'bg-amber-700 text-white' :
                              'bg-muted text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-semibold text-foreground">{item.agent}</span>
                      <span className="text-[10px] text-muted-foreground">@{item.username}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-400">{formatCurrency(item.revenue)}</div>
                    <div className="text-[10px] text-muted-foreground">{item.wonLeads} deals won</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-8">No agent performance data.</div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 text-left">
            <h3 className="text-base font-semibold text-foreground">Top Lead Sources</h3>
            <p className="text-xs text-muted-foreground">Breakdown of ingestion source tags</p>
          </div>
          <div className="space-y-3">
            {stats?.sourceBreakdown && Object.keys(stats.sourceBreakdown).length > 0 ? (
              Object.entries(stats.sourceBreakdown).map(([source, count], idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
                  <span className="text-sm font-semibold text-foreground">{source}</span>
                  <span className="text-xs font-bold bg-muted/50 border border-border/60 px-2.5 py-0.5 rounded-full text-foreground/80">
                    {count} Inquiries
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-8">No lead sources logged yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
