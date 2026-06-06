import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api, type User, type DashboardStats, type DashboardCharts } from '../../api';
import { LineChart, DonutChart } from '../../components/charts/CustomCharts';
import { Card } from '../../components/common/Card';
import { 
  Users, 
  IndianRupee, 
  ChevronDown,
  CheckCircle2,
  XCircle
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
  const convertedLeads = stats?.convertedLeads || 0;
  const lostLeads = stats?.lostLeads || 0;
  const todayLeads = stats?.todayLeads || 0;
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-8 space-y-6 max-w-7xl mx-auto text-left"
    >
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </motion.div>

      {/* Consolidated 4-Card Statistics Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Card 1: Total Leads */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-0 shadow-lg shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-blue-500/10 via-card to-card flex flex-col justify-between text-left relative overflow-hidden group rounded-2xl h-full">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/30 transition-all duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Total Leads</span>
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Users size={18} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-5 relative z-10">
              <h3 className="text-3xl font-black text-foreground tracking-tight">{totalLeads}</h3>
              <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-blue-500/10 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-md border border-blue-500/20 shadow-sm whitespace-nowrap">{todayLeads} Added Today</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Card 2: Converted Leads */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-0 shadow-lg shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-emerald-500/10 via-card to-card flex flex-col justify-between text-left relative overflow-hidden group rounded-2xl h-full">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/30 transition-all duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Converted Leads</span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 size={18} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-5 relative z-10">
              <h3 className="text-3xl font-black text-foreground tracking-tight">{convertedLeads}</h3>
              <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-emerald-500/10">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Win Rate:</span>
                <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 shadow-sm">{totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0}%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Card 3: Rejected Leads */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-0 shadow-lg shadow-red-500/5 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-red-500/10 via-card to-card flex flex-col justify-between text-left relative overflow-hidden group rounded-2xl h-full">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-red-500/30 transition-all duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Rejected Leads</span>
              <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500 ring-1 ring-red-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <XCircle size={18} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-5 relative z-10">
              <h3 className="text-3xl font-black text-foreground tracking-tight">{lostLeads}</h3>
              <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-red-500/10">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lost Rate:</span>
                <span className="text-[10px] font-black text-red-500">{totalLeads > 0 ? Math.round((lostLeads / totalLeads) * 100) : 0}%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Card 4: Revenue & Commissions */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-0 shadow-lg shadow-violet-500/5 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-violet-500/10 via-card to-card flex flex-col justify-between text-left relative overflow-hidden group rounded-2xl h-full">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-violet-500/30 transition-all duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Revenue & Comm</span>
              <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <IndianRupee size={18} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-5 relative z-10">
              <h3 className="text-3xl font-black text-foreground tracking-tight">{formatIndianCurrency(pipelineValue)}</h3>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-violet-500/10">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Commissions:</span>
                <span className="text-sm font-black text-violet-500">{formatIndianCurrency(earnedCommissions)}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Row 3: Charts Layout */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Monthly Revenue / Lead Trend Chart */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-0 shadow-lg shadow-black/5 bg-gradient-to-b from-card to-secondary/10 flex flex-col justify-between text-left rounded-2xl relative overflow-hidden group h-full">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
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
        </motion.div>

        {/* Lead Source Report */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-0 shadow-lg shadow-black/5 bg-gradient-to-b from-card to-secondary/10 flex flex-col justify-between text-left rounded-2xl relative overflow-hidden group h-full">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
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
        </motion.div>

        {/* Conversion Report */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-0 shadow-lg shadow-black/5 bg-gradient-to-b from-card to-secondary/10 flex flex-col justify-between text-left rounded-2xl relative overflow-hidden group h-full">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
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
        </motion.div>

        {/* Team Performance */}
        {(user.profile.role === 'ADMIN' || user.profile.role === 'LEADER') && (
          <motion.div variants={itemVariants}>
            <Card className="p-0 border border-border/60 text-left flex flex-col justify-between bg-card overflow-hidden h-full">
              <div className="p-6 pb-4 border-b border-border/40 bg-gradient-to-r from-secondary/30 to-transparent">
                <h3 className="text-sm font-extrabold text-foreground tracking-wide">Team Leaderboard</h3>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">Top agents by closed-won value</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                {charts?.leaderboard && charts.leaderboard.length > 0 ? (
                  charts.leaderboard.map((item, idx) => {
                    const maxRevenue = charts.leaderboard[0].revenue;
                    const progressPct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={idx} className="group relative flex items-center justify-between p-3.5 rounded-xl border border-transparent bg-secondary/20 hover:bg-secondary/50 hover:border-border transition-all duration-300">
                        {/* Background Progress Bar (Subtle) */}
                        <div 
                          className="absolute inset-0 bg-primary/5 rounded-xl transition-all duration-500 ease-out"
                          style={{ width: `${progressPct}%`, zIndex: 0 }}
                        />
                        
                        <div className="flex items-center gap-4 relative z-10">
                          {/* Rank Badge */}
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                            idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-500/20' :
                            idx === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black shadow-lg shadow-slate-400/30 ring-2 ring-slate-400/20' :
                            idx === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 shadow-lg shadow-amber-800/30 ring-2 ring-amber-800/20' :
                            'bg-secondary border border-border text-muted-foreground'
                          }`}>
                            #{idx + 1}
                          </div>
                          
                          {/* Avatar & Name */}
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-inner shrink-0">
                              {item.agent.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">{item.agent}</span>
                              <span className="text-[10px] font-medium text-muted-foreground">@{item.username}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right relative z-10 flex flex-col items-end">
                          <div className="text-[13px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">${item.revenue.toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-muted-foreground mt-1 tracking-wide">{item.wonLeads} WON</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs font-semibold text-muted-foreground py-10 text-center flex flex-col items-center justify-center h-full">
                    <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                      <Users size={20} className="text-muted-foreground/50" />
                    </div>
                    No team performance metrics available
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
