import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type User, type DashboardStats, type DashboardCharts } from '../../api';
import { LineChart, DonutChart } from '../../components/charts/CustomCharts';
import { Card } from '../../components/common/Card';
import { 
  Users, 
  UserCheck, 
  CheckCircle2, 
  IndianRupee, 
  Phone, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  ChevronDown 
} from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
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

  const totalLeads = stats?.totalLeads || 0;
  const wonLeads = stats?.statusBreakdown?.WON || 0;
  const lostLeads = stats?.statusBreakdown?.LOST || 0;
  const availableLeads = totalLeads - wonLeads - lostLeads;

  // Construct source donut chart data
  const colors = ['#3b82f6', '#f97316', '#eab308', '#06b6d4', '#a855f7', '#10b981', '#6366f1'];
  const donutData = stats && stats.sourceBreakdown ? Object.entries(stats.sourceBreakdown).map(([source, count], idx) => ({
    label: source,
    value: count,
    color: colors[idx % colors.length]
  })) : [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto text-left">
      {/* Welcome & Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Welcome back, {user.full_name}!</p>
        </div>
      </div>

      {/* Row 1: KPI Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Leads */}
        <Card className="p-5 flex items-center gap-4 border border-border/60 hover:shadow-lg transition-all">
          <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Leads</span>
            <span className="text-2xl font-bold text-foreground mt-0.5">{totalLeads.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5 mt-1">
              ▲ 12.5% <span className="text-muted-foreground font-normal">vs last month</span>
            </span>
          </div>
        </Card>

        {/* Available Leads */}
        <Card className="p-5 flex items-center gap-4 border border-border/60 hover:shadow-lg transition-all">
          <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
            <UserCheck size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Leads</span>
            <span className="text-2xl font-bold text-foreground mt-0.5">{availableLeads.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5 mt-1">
              ▲ 8.2% <span className="text-muted-foreground font-normal">vs last month</span>
            </span>
          </div>
        </Card>

        {/* Converted Leads */}
        <Card className="p-5 flex items-center gap-4 border border-border/60 hover:shadow-lg transition-all">
          <div className="h-12 w-12 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Converted Leads</span>
            <span className="text-2xl font-bold text-foreground mt-0.5">{wonLeads.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5 mt-1">
              ▲ 15.2% <span className="text-muted-foreground font-normal">vs last month</span>
            </span>
          </div>
        </Card>

        {/* Revenue Generated */}
        <Card className="p-5 flex items-center gap-4 border border-border/60 hover:shadow-lg transition-all">
          <div className="h-12 w-12 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <IndianRupee size={22} />
          </div>
          <div className="flex flex-col col-span-1 min-w-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Revenue Generated</span>
            <span className="text-2xl font-bold text-foreground mt-0.5 truncate">{formatIndianCurrency(stats?.pipelineValue || 0)}</span>
            <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5 mt-1">
              ▲ 18.7% <span className="text-muted-foreground font-normal">vs last month</span>
            </span>
          </div>
        </Card>
      </div>

      {/* Row 2: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Trend Line Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between border border-border/60">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-foreground">Lead Trend</h3>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className="w-3 h-0.5 bg-[#10b981] inline-block rounded" /> Total Leads
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className="w-3 h-0.5 bg-[#3b82f6] inline-block rounded" /> Converted Leads
                </span>
              </div>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground hover:bg-muted/40 transition-all cursor-pointer">
              This Month <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex-1 w-full">
            {charts && <LineChart data={charts.leadsTimeline} />}
          </div>
        </Card>

        {/* Leads By Source Donut Chart */}
        <Card className="p-6 flex flex-col justify-between border border-border/60">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-foreground">Leads by Source</h3>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground hover:bg-muted/40 transition-all cursor-pointer">
              This Month <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center w-full">
            <DonutChart data={donutData} />
          </div>
        </Card>
      </div>

      {/* Row 3: Smaller Bottom KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Calls */}
        <Card className="p-5 flex items-center justify-between border border-border/60 hover:shadow-lg transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Calls</span>
            <span className="text-2xl font-bold text-foreground mt-1.5">25</span>
            <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5 mt-2">
              ▲ 12% <span className="text-muted-foreground font-normal">vs yesterday</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center shrink-0">
            <Phone size={18} />
          </div>
        </Card>

        {/* Pending Follow-ups */}
        <Card className="p-5 flex items-center justify-between border border-border/60 hover:shadow-lg transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Follow-ups</span>
            <span className="text-2xl font-bold text-foreground mt-1.5">{stats?.pendingFollowups || 0}</span>
            <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5 mt-2">
              ▲ 5% <span className="text-muted-foreground font-normal">vs yesterday</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
        </Card>

        {/* Tasks Due */}
        <Card className="p-5 flex items-center justify-between border border-border/60 hover:shadow-lg transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tasks Due</span>
            <span className="text-2xl font-bold text-foreground mt-1.5">12</span>
            <span className="text-[10px] font-bold text-red-400 flex items-center gap-0.5 mt-2">
              ▼ 3% <span className="text-muted-foreground font-normal">vs yesterday</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <CheckSquare size={18} />
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-5 flex items-center justify-between border border-border/60 hover:shadow-lg transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversion Rate</span>
            <span className="text-2xl font-bold text-foreground mt-1.5">{stats?.conversionRate || 0}%</span>
            <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5 mt-2">
              ▲ 2.1% <span className="text-muted-foreground font-normal">vs last month</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
        </Card>
      </div>

      {/* Row 4: Team Leaderboard (Conditional) */}
      {(user.profile.role === 'ADMIN' || user.profile.role === 'LEADER') && (
        <Card className="p-6 border border-border/60">
          <div className="mb-6 text-left">
            <h3 className="text-sm font-bold text-foreground">
              {user.profile.role === 'ADMIN' ? 'Agent Performance Leaderboard' : 'Team Performance Leaderboard'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue and conversion performance ranking</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {charts?.leaderboard && charts.leaderboard.length > 0 ? (
              charts.leaderboard.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/10 hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' :
                      idx === 1 ? 'bg-slate-400 text-black' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-muted border border-border/80 text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-foreground">{item.agent}</span>
                      <span className="text-[10px] text-muted-foreground">@{item.username}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-400">{formatIndianCurrency(item.revenue)}</div>
                    <div className="text-[10px] text-muted-foreground">{item.wonLeads} deals won</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground py-4 col-span-3 text-center">No performance data available.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
