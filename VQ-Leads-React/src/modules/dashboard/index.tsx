import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type User, type DashboardStats, type DashboardCharts } from '../../api';
import { LineChart, DonutChart } from '../../components/charts/CustomCharts';
import { Card } from '../../components/common/Card';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Sparkles, 
  Clock, 
  IndianRupee, 
  DollarSign, 
  Calendar, 
  ChevronDown,
  XCircle,
  CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [revenueTimeframe, setRevenueTimeframe] = useState<'1D' | '1W' | '1M' | '6M' | '1Y'>('1Y');

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

  // Formatting helpers
  const formatIndianCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // KPI Calculations
  const totalLeads = stats?.totalLeads || 0;
  const availableLeads = stats?.availableLeads || 0;
  const assignedLeads = stats?.assignedLeads || 0;
  const claimedLeads = stats?.claimedLeads || 0;
  const convertedLeads = stats?.convertedLeads || 0;
  const lostLeads = stats?.lostLeads || 0;
  const todayLeads = stats?.todayLeads || 0;
  const followupsDue = stats?.followupsDue || 0;
  const earnedCommissions = stats?.earnedCommissions || 0;
  const pipelineValue = stats?.pipelineValue || 0;

  // Construct source donut chart data
  const colors = ['#3b82f6', '#f97316', '#eab308', '#06b6d4', '#a855f7', '#10b981', '#6366f1'];
  const sourceDonutData = stats && stats.sourceBreakdown ? Object.entries(stats.sourceBreakdown).map(([source, count], idx) => ({
    label: source,
    value: count,
    color: colors[idx % colors.length]
  })) : [];

  // Construct status/conversion donut chart data
  const statusDonutData = stats ? [
    { label: 'New', value: stats.statusBreakdown.NEW || 0, color: '#3b82f6' },
    { label: 'Contacted', value: stats.statusBreakdown.CONTACTED || 0, color: '#a855f7' },
    { label: 'In Progress', value: stats.statusBreakdown.IN_PROGRESS || 0, color: '#f97316' },
    { label: 'Qualified', value: stats.statusBreakdown.QUALIFIED || 0, color: '#06b6d4' },
    { label: 'Won', value: stats.statusBreakdown.WON || 0, color: '#10b981' },
    { label: 'Lost', value: stats.statusBreakdown.LOST || 0, color: '#ef4444' }
  ] : [];

  const activeTimeframes: ('1D' | '1W' | '1M' | '6M' | '1Y')[] = ['1D', '1W', '1M', '6M', '1Y'];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-left animate-fade-in">
      {/* Title */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Row 1 & 2: Statistics Grid (10 cards: 5x2 grid) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Leads */}
        <Card className="p-4 flex flex-col justify-between border border-border/60 hover-card-lift transition-card text-left animate-fade-in-up delay-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Leads</span>
            <Users size={14} className="text-red-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-foreground">{totalLeads}</span>
          </div>
        </Card>

        {/* Available Leads */}
        <Card className="p-4 flex flex-col justify-between border border-border/60 hover-card-lift transition-card text-left animate-fade-in-up delay-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available Leads</span>
            <UserCheck size={14} className="text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-foreground">{availableLeads}</span>
          </div>
        </Card>

        {/* Assigned Leads */}
        <Card className="p-4 flex flex-col justify-between border border-border/60 hover-card-lift transition-card text-left animate-fade-in-up delay-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Leads</span>
            <UserPlus size={14} className="text-indigo-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-foreground">{assignedLeads}</span>
          </div>
        </Card>

        {/* Claimed Leads */}
        <Card className="p-4 flex flex-col justify-between border border-border/60 hover-card-lift transition-card text-left animate-fade-in-up delay-250">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Claimed Leads</span>
            <Sparkles size={14} className="text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-foreground">{claimedLeads}</span>
          </div>
        </Card>

        {/* Converted Leads */}
        <Card className="p-4 flex flex-col justify-between border border-border/60 hover-card-lift transition-card text-left animate-fade-in-up delay-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Converted Leads</span>
            <CheckCircle2 size={14} className="text-green-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-foreground">{convertedLeads}</span>
          </div>
        </Card>

        {/* Lost Leads */}
        <Card className="p-4 flex flex-col justify-between border border-border/60 hover-card-lift transition-card text-left animate-fade-in-up delay-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lost Leads</span>
            <XCircle size={14} className="text-red-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-foreground">{lostLeads}</span>
          </div>
        </Card>

        {/* Today's Leads */}
        <Card className="p-4 flex flex-col justify-between border border-border/60 hover-card-lift transition-card text-left animate-fade-in-up delay-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Today's Leads</span>
            <Clock size={14} className="text-cyan-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-foreground">{todayLeads}</span>
          </div>
        </Card>

        {/* Revenue Generated */}
        <Card className="p-4 flex flex-col justify-between border border-border/60 hover-card-lift transition-card text-left animate-fade-in-up delay-250">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue</span>
            <IndianRupee size={14} className="text-emerald-500" />
          </div>
          <div className="mt-3 truncate">
            <span className="text-xl font-bold text-foreground">{formatIndianCurrency(pipelineValue)}</span>
          </div>
        </Card>

        {/* Total Commission */}
        <Card className="p-4 flex flex-col justify-between border border-border/60 hover-card-lift transition-card text-left animate-fade-in-up delay-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Commission</span>
            <DollarSign size={14} className="text-purple-500" />
          </div>
          <div className="mt-3 truncate">
            <span className="text-xl font-bold text-foreground">{formatIndianCurrency(earnedCommissions)}</span>
          </div>
        </Card>

        {/* Follow-ups Due */}
        <Card className="p-4 flex flex-col justify-between border border-border/60 hover-card-lift transition-card text-left animate-fade-in-up delay-350">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Follow-ups Due</span>
            <Calendar size={14} className="text-orange-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-foreground">{followupsDue}</span>
          </div>
        </Card>
      </div>

      {/* Row 3: Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue / Lead Trend Chart */}
        <Card className="p-6 border border-border/60 flex flex-col justify-between text-left">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-foreground">Monthly Revenue / Lead Trend</h3>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <span className="w-3 h-0.5 bg-[#10b981] inline-block rounded" /> Total Leads
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <span className="w-3 h-0.5 bg-[#3b82f6] inline-block rounded" /> Converted Leads
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 rounded-lg bg-secondary/80 p-1 border border-border/40 text-xs">
              {activeTimeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setRevenueTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    revenueTimeframe === tf 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full">
            {charts && <LineChart data={charts.leadsTimeline} />}
          </div>
        </Card>

        {/* Lead Source Report */}
        <Card className="p-6 border border-border/60 flex flex-col justify-between text-left">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-foreground">Lead Source Report</h3>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary/40 transition-all cursor-pointer">
              This Month <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center w-full">
            <DonutChart data={sourceDonutData} />
          </div>
        </Card>

        {/* Conversion Report */}
        <Card className="p-6 border border-border/60 flex flex-col justify-between text-left">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-foreground">Conversion Status Report</h3>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary/40 transition-all cursor-pointer">
              This Month <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center w-full">
            <DonutChart data={statusDonutData} />
          </div>
        </Card>

        {/* Team Performance */}
        {(user.profile.role === 'ADMIN' || user.profile.role === 'LEADER') && (
          <Card className="p-6 border border-border/60 text-left flex flex-col justify-between">
            <div className="mb-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-foreground">Team Performance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Top agent closed-won value leaderboard</p>
              </div>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {charts?.leaderboard && charts.leaderboard.length > 0 ? (
                charts.leaderboard.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-all shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' :
                        idx === 1 ? 'bg-slate-400 text-black' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-secondary border border-border text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{item.agent}</span>
                        <span className="text-[9px] text-muted-foreground">@{item.username}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-green-500">${item.revenue.toLocaleString()}</div>
                      <div className="text-[9px] text-muted-foreground">{item.wonLeads} deals won</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground py-10 text-center">No team performance metrics available.</div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
