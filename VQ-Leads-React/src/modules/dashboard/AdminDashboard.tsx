import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type DashboardStats, type DashboardCharts } from '../../api';
import { LineChart, DonutChart } from '../../components/charts/CustomCharts';
import { Card } from '../../components/common/Card';
import { Briefcase, TrendingUp, DollarSign } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery<DashboardCharts>({
    queryKey: ['dashboard-charts'],
    queryFn: api.getDashboardCharts,
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

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
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
          <div className="mb-6 text-left">
            <h3 className="text-base font-semibold text-foreground">Lead Ingestion Timeline</h3>
            <p className="text-xs text-muted-foreground">Inquiries submitted over the past 15 days</p>
          </div>
          {charts && <LineChart data={charts.leadsTimeline} />}
        </Card>

        <Card className="p-6">
          <div className="mb-6 text-left">
            <h3 className="text-base font-semibold text-foreground">Status Funnel</h3>
            <p className="text-xs text-muted-foreground">Distribution of active pipeline leads</p>
          </div>
          <DonutChart data={donutData} />
        </Card>
      </div>

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
