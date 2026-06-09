import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api, type User, type DashboardStats, type DashboardCharts } from '../../api';
import { LineChart, DonutChart } from '../../components/charts/CustomCharts';
import { Card } from '../../components/common/Card';
import { AgentDashboard } from './AgentDashboard';
import { 
  Users, 
  IndianRupee, 
  ChevronDown,
  Activity,
  Briefcase,
  Clock,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Target,
  ListTodo,
  Check,
  UserPlus,
  Download
} from 'lucide-react';

interface DashboardProps {
  user: User;
}

const DEMO_DATA = {
  activeAgents: 24,
  followUpsDue: 32,
  commPending: 48000,
  salesFunnel: [
    { label: 'New', count: 1248, color: 'bg-blue-500' },
    { label: 'Claimed', count: 950, color: 'bg-indigo-500' },
    { label: 'Contacted', count: 720, color: 'bg-violet-500' },
    { label: 'Qualified', count: 430, color: 'bg-fuchsia-500' },
    { label: 'Negotiation', count: 180, color: 'bg-pink-500' },
    { label: 'Converted', count: 125, color: 'bg-emerald-500' },
  ],
  followUpCenter: {
    dueToday: 24,
    overdue: 8,
    upcoming: 31
  },
  recentActivities: [
    { text: 'Lead #124 claimed by Sarah', time: '2 min ago', type: 'claim', icon: UserPlus, color: 'text-blue-500 bg-blue-500/10' },
    { text: 'Follow-up created by John', time: '5 min ago', type: 'followup', icon: Calendar, color: 'text-orange-500 bg-orange-500/10' },
    { text: 'Lead #532 converted', time: '8 min ago', type: 'convert', icon: Check, color: 'text-emerald-500 bg-emerald-500/10' },
    { text: 'Commission approved', time: '12 min ago', type: 'commission', icon: IndianRupee, color: 'text-violet-500 bg-violet-500/10' },
    { text: 'New lead imported', time: '20 min ago', type: 'import', icon: Download, color: 'text-cyan-500 bg-cyan-500/10' }
  ],
  recentLeads: [
    { name: 'Raj Kumar', source: 'Google Ads', status: 'Qualified', owner: 'Sarah', value: 50000 },
    { name: 'Anil George', source: 'Website Forms', status: 'Contacted', owner: 'John', value: 30000 },
    { name: 'Priya Menon', source: 'Facebook Ads', status: 'New', owner: 'Unassigned', value: 15000 },
    { name: 'Vikram Singh', source: 'WhatsApp', status: 'Negotiation', owner: 'Michael', value: 75000 },
    { name: 'Neha Sharma', source: 'Google Ads', status: 'Claimed', owner: 'Sarah', value: 25000 },
  ]
};

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Route agents to their dedicated dashboard
  if (user.profile.role === 'AGENT') {
    return <AgentDashboard user={user} />;
  }

  const [revenueTimeframe, setRevenueTimeframe] = useState<'1D' | '1W' | '1M' | '6M' | '1Y'>('1Y');
  const [recentLeads, setRecentLeads] = useState(DEMO_DATA.recentLeads);

  const handleClaimLead = (idx: number) => {
    const newLeads = [...recentLeads];
    newLeads[idx].owner = user.first_name || user.username || 'You';
    newLeads[idx].status = 'Claimed';
    setRecentLeads(newLeads);
  };

  const handleUpdateStatus = (idx: number, e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLeads = [...recentLeads];
    newLeads[idx].status = e.target.value;
    setRecentLeads(newLeads);
  };

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
  const formatCompactCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  // KPI Calculations
  const totalLeads = stats?.totalLeads || 0;
  const convertedLeads = stats?.convertedLeads || 0;
  const pipelineValue = stats?.pipelineValue || 0;
  const winRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

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
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto text-left"
    >
      {/* Title Area */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="text-primary" /> Admin Overview
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">Live Demo</span>
        </div>
      </motion.div>

      {/* Row 1: KPI Ribbon (6 columns) */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {/* Total Leads */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 shadow-sm bg-gradient-to-br from-blue-500/5 to-transparent flex flex-col justify-center text-left relative overflow-hidden group h-full hover:border-blue-500/30 transition-colors">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1">Total Leads</span>
            <h3 className="text-2xl font-black text-foreground">{totalLeads.toLocaleString()}</h3>
            <div className="absolute top-4 right-4 text-blue-500/20 group-hover:text-blue-500/40 transition-colors"><Users size={24} /></div>
          </Card>
        </motion.div>

        {/* Revenue */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 shadow-sm bg-gradient-to-br from-emerald-500/5 to-transparent flex flex-col justify-center text-left relative overflow-hidden group h-full hover:border-emerald-500/30 transition-colors">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1">Revenue</span>
            <h3 className="text-2xl font-black text-foreground">{formatCompactCurrency(pipelineValue)}</h3>
            <div className="absolute top-4 right-4 text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors"><IndianRupee size={24} /></div>
          </Card>
        </motion.div>

        {/* Conv % */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 shadow-sm bg-gradient-to-br from-violet-500/5 to-transparent flex flex-col justify-center text-left relative overflow-hidden group h-full hover:border-violet-500/30 transition-colors">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1">Conv %</span>
            <h3 className="text-2xl font-black text-foreground">{winRate}%</h3>
            <div className="absolute top-4 right-4 text-violet-500/20 group-hover:text-violet-500/40 transition-colors"><TrendingUp size={24} /></div>
          </Card>
        </motion.div>

        {/* Active Agents */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 shadow-sm bg-gradient-to-br from-cyan-500/5 to-transparent flex flex-col justify-center text-left relative overflow-hidden group h-full hover:border-cyan-500/30 transition-colors">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1">Active Agents</span>
            <h3 className="text-2xl font-black text-foreground">{DEMO_DATA.activeAgents}</h3>
            <div className="absolute top-4 right-4 text-cyan-500/20 group-hover:text-cyan-500/40 transition-colors"><Briefcase size={24} /></div>
          </Card>
        </motion.div>

        {/* Follow Ups Due */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 shadow-sm bg-gradient-to-br from-orange-500/5 to-transparent flex flex-col justify-center text-left relative overflow-hidden group h-full hover:border-orange-500/30 transition-colors">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1">Follow Ups Due</span>
            <h3 className="text-2xl font-black text-foreground">{DEMO_DATA.followUpsDue}</h3>
            <div className="absolute top-4 right-4 text-orange-500/20 group-hover:text-orange-500/40 transition-colors"><Clock size={24} /></div>
          </Card>
        </motion.div>

        {/* Comm Pending */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 shadow-sm bg-gradient-to-br from-pink-500/5 to-transparent flex flex-col justify-center text-left relative overflow-hidden group h-full hover:border-pink-500/30 transition-colors">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1">Comm. Pending</span>
            <h3 className="text-2xl font-black text-foreground">{formatCompactCurrency(DEMO_DATA.commPending)}</h3>
            <div className="absolute top-4 right-4 text-pink-500/20 group-hover:text-pink-500/40 transition-colors"><Target size={24} /></div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Row 2: Funnel & Status */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Sales Funnel */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border border-border/60 bg-card/50 flex flex-col h-full relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Sales Funnel</h3>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-4">
              {DEMO_DATA.salesFunnel.map((stage, idx) => {
                const maxCount = DEMO_DATA.salesFunnel[0].count;
                const pct = (stage.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end text-xs font-semibold">
                      <span className="text-muted-foreground">{stage.label}</span>
                      <span className="text-foreground">{stage.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                        className={`h-full rounded-full ${stage.color}`} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Lead Status */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border border-border/60 bg-card/50 flex flex-col justify-between text-left h-full relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Lead Status</h3>
            </div>
            <div className="flex-1 flex items-center justify-center w-full">
              <DonutChart data={statusDonutData} />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Row 3: Trends & Sources */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Monthly Revenue / Lead Trend Chart */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border border-border/60 bg-card/50 flex flex-col justify-between text-left h-full relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Revenue Trend</h3>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <span className="w-3 h-0.5 bg-[#10b981] inline-block rounded" /> Total Leads
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <span className="w-3 h-0.5 bg-[#3b82f6] inline-block rounded" /> Converted
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
          <Card className="p-6 border border-border/60 bg-card/50 flex flex-col justify-between text-left h-full relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Lead Sources</h3>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary/40 transition-all cursor-pointer">
                This Month <ChevronDown size={14} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center w-full">
              <DonutChart data={sourceDonutData} />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Row 4: Agents & Follow-up Center */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Team Performance */}
        {(user.profile.role === 'ADMIN' || user.profile.role === 'LEADER') && (
          <motion.div variants={itemVariants}>
            <Card className="p-0 border border-border/60 text-left flex flex-col justify-between bg-card overflow-hidden h-full">
              <div className="p-5 border-b border-border/40 flex justify-between items-center bg-secondary/10">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Top Performing Agents</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5" style={{ scrollbarWidth: 'thin' }}>
                {charts?.leaderboard && charts.leaderboard.length > 0 ? (
                  charts.leaderboard.map((item, idx) => {
                    const maxRevenue = charts.leaderboard[0].revenue;
                    const progressPct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={idx} className="group relative flex items-center justify-between p-3 rounded-xl border border-transparent bg-secondary/10 hover:bg-secondary/40 hover:border-border/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-primary/5 rounded-xl transition-all duration-500 ease-out" style={{ width: `${progressPct}%`, zIndex: 0 }} />
                        <div className="flex items-center gap-3 relative z-10">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-lg shadow-amber-500/30 ring-1 ring-amber-500/20' :
                            idx === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black shadow-lg shadow-slate-400/30 ring-1 ring-slate-400/20' :
                            idx === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 shadow-lg shadow-amber-800/30 ring-1 ring-amber-800/20' :
                            'bg-secondary border border-border text-muted-foreground'
                          }`}>#{idx + 1}</div>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary/80 to-indigo-500/80 flex items-center justify-center font-bold text-white text-[10px] shadow-inner shrink-0">
                              {item.agent.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{item.agent}</span>
                          </div>
                        </div>
                        <div className="text-right relative z-10">
                          <div className="text-xs font-black text-emerald-500">{formatCompactCurrency(item.revenue)}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs font-semibold text-muted-foreground py-10 text-center flex flex-col items-center justify-center h-full">
                    No team performance metrics available
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-border/40 text-center">
                <button className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center w-full gap-1">
                  View Team Performance <ArrowUpRight size={14} />
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Follow-up Center */}
        <motion.div variants={itemVariants}>
          <Card className="p-0 border border-border/60 bg-card flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-border/40 flex justify-between items-center bg-secondary/10">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Follow-up Center</h3>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500"><Calendar size={20} /></div>
                  <span className="text-sm font-bold text-foreground">Due Today</span>
                </div>
                <span className="text-lg font-black text-foreground">{DEMO_DATA.followUpCenter.dueToday}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><Activity size={20} /></div>
                  <span className="text-sm font-bold text-foreground">Overdue</span>
                </div>
                <span className="text-lg font-black text-red-500">{DEMO_DATA.followUpCenter.overdue}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><ListTodo size={20} /></div>
                  <span className="text-sm font-bold text-foreground">Upcoming</span>
                </div>
                <span className="text-lg font-black text-foreground">{DEMO_DATA.followUpCenter.upcoming}</span>
              </div>
            </div>
            <div className="p-3 border-t border-border/40 text-center mt-auto">
              <button className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center w-full gap-1">
                Open Calendar <ArrowUpRight size={14} />
              </button>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Row 5: Recent Activities */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border/60 bg-card overflow-hidden">
          <div className="p-5 border-b border-border/40 bg-secondary/10">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Recent Activities</h3>
          </div>
          <div className="divide-y divide-border/40">
            {DEMO_DATA.recentActivities.map((act, idx) => {
              const Icon = act.icon;
              return (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${act.color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{act.text}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{act.time}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Row 6: Recent Leads */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border/60 bg-card overflow-hidden">
          <div className="p-5 border-b border-border/40 bg-secondary/10">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Recent Leads</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground uppercase tracking-wider bg-secondary/5">
                  <th className="p-4 font-bold">Lead Name</th>
                  <th className="p-4 font-bold">Source</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Owner</th>
                  <th className="p-4 font-bold text-right">Value</th>
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentLeads.map((lead, idx) => (
                  <tr key={idx} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-4">
                      <span className="text-sm font-bold text-foreground">{lead.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-semibold text-muted-foreground">{lead.source}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lead.status === 'New' ? 'bg-blue-500/10 text-blue-500' :
                        lead.status === 'Contacted' ? 'bg-violet-500/10 text-violet-500' :
                        lead.status === 'Qualified' ? 'bg-cyan-500/10 text-cyan-500' :
                        lead.status === 'Claimed' ? 'bg-indigo-500/10 text-indigo-500' :
                        lead.status === 'Negotiation' ? 'bg-pink-500/10 text-pink-500' :
                        lead.status === 'Won' || lead.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {lead.owner !== 'Unassigned' && (
                          <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-black">
                            {lead.owner.charAt(0)}
                          </div>
                        )}
                        <span className={lead.owner === 'Unassigned' ? 'text-muted-foreground italic' : 'text-foreground'}>
                          {lead.owner}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-black text-emerald-500">{formatCompactCurrency(lead.value)}</span>
                    </td>
                    <td className="p-4 text-center">
                      {lead.owner === 'Unassigned' ? (
                        <button 
                          onClick={() => handleClaimLead(idx)}
                          className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          Claim
                        </button>
                      ) : (
                        <select 
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(idx, e)}
                          className="px-2 py-1 bg-secondary text-foreground text-[10px] font-bold rounded-md border border-border cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="New">New</option>
                          <option value="Claimed">Claimed</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Negotiation">Negotiation</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
