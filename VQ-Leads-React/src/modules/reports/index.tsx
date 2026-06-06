import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type DashboardStats, type DashboardCharts } from '../../api';
import { Card } from '../../components/common/Card';
import { BarChart3, TrendingUp, Users, DollarSign, PieChart, Landmark } from 'lucide-react';

export const Reports: React.FC = () => {
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
        <div className="text-muted-foreground text-sm font-semibold animate-pulse">Loading analytics reports...</div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const totalLeads = stats?.totalLeads || 0;
  const pipelineVal = stats?.pipelineValue || 0;
  const avgDealSize = totalLeads > 0 ? pipelineVal / totalLeads : 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto text-left">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Deal Value</span>
            <span className="text-2xl font-bold mt-2 text-foreground">{formatCurrency(avgDealSize)}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Landmark size={20} />
          </div>
        </Card>
        <Card className="p-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Revenue</span>
            <span className="text-2xl font-bold mt-2 text-foreground">{formatCurrency(pipelineVal)}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </Card>
        <Card className="p-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Commission Paid</span>
            <span className="text-2xl font-bold mt-2 text-foreground">{formatCurrency(stats?.earnedCommissions || 0)}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </Card>
      </div>

      {/* Main Charts & Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Monthly Revenue Performance
            </h3>
            <p className="text-xs text-muted-foreground">Historical revenue won from enterprise and inbound deals</p>
          </div>
          
          <div className="space-y-4">
            {charts?.monthlyRevenue && charts.monthlyRevenue.length > 0 ? (
              <div className="space-y-3">
                {charts.monthlyRevenue.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground">{item.month}</span>
                      <span className="text-green-400 font-bold">{formatCurrency(item.revenue)}</span>
                    </div>
                    {/* Progress Bar simulation */}
                    <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden border border-border/40">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (item.revenue / (Math.max(...charts.monthlyRevenue.map(m => m.revenue), 1))) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-12 text-center">No monthly revenue performance logged.</div>
            )}
          </div>
        </Card>

        {/* Lead Source Performance */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <PieChart size={18} className="text-blue-400" />
              Ingestion Channels
            </h3>
            <p className="text-xs text-muted-foreground">Distribution and counts of lead channels</p>
          </div>

          <div className="space-y-4">
            {stats?.sourceBreakdown && Object.keys(stats.sourceBreakdown).length > 0 ? (
              Object.entries(stats.sourceBreakdown).map(([source, count], idx) => {
                const totalCount = Object.values(stats.sourceBreakdown).reduce((a, b) => a + b, 0);
                const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground">{source}</span>
                      <span className="text-muted-foreground font-mono">{count} ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground py-10 text-center">No lead sources analyzed yet.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Leaderboard Section */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users size={18} className="text-purple-400" />
            Agent Conversion Leaderboard
          </h3>
          <p className="text-xs text-muted-foreground">Ranked sales contribution based on closed-won deal values</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {charts?.leaderboard && charts.leaderboard.length > 0 ? (
            charts.leaderboard.map((agent, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border/80 bg-muted/10 flex flex-col justify-between hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-amber-500 text-black' :
                    idx === 1 ? 'bg-slate-400 text-black' :
                    idx === 2 ? 'bg-amber-700 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    #{idx + 1}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-foreground">{agent.agent}</span>
                    <span className="text-[10px] text-muted-foreground">@{agent.username}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-end">
                  <div className="text-left">
                    <span className="text-[10px] text-muted-foreground block">CLOSED WON</span>
                    <span className="text-sm font-bold text-green-400">{formatCurrency(agent.revenue)}</span>
                  </div>
                  <span className="text-[11px] bg-secondary/80 px-2.5 py-0.5 rounded-full border border-border text-foreground font-semibold">
                    {agent.wonLeads} deals won
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-10 col-span-3 text-center">No leaderboard statistics logged.</div>
          )}
        </div>
      </Card>
    </div>
  );
};
export default Reports;
