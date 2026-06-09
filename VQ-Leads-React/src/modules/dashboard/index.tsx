import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type User, type Lead, type FollowUp, type Commission, type DashboardStats, type DashboardCharts } from '../../api';
import { LineChart, DonutChart } from '../../components/charts/CustomCharts';
import { Card } from '../../components/common/Card';
import { Dialog } from '../../components/common/Dialog';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
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
  Download,
  Plus
} from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Route agents to their dedicated dashboard
  if (user.profile.role === 'AGENT') {
    return <AgentDashboard user={user} />;
  }

  const queryClient = useQueryClient();
  const [revenueTimeframe, setRevenueTimeframe] = useState<'1D' | '1W' | '1M' | '6M' | '1Y'>('1Y');

  // Add Lead States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadValue, setNewLeadValue] = useState('0.00');
  const [newLeadSource, setNewLeadSource] = useState('Manual Entry');
  const [newLeadOwner, setNewLeadOwner] = useState<number | null>(null);

  // Fetch real data
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery<DashboardCharts>({
    queryKey: ['dashboard-charts'],
    queryFn: api.getDashboardCharts,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: api.getLeads,
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  });

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: ['commissions'],
    queryFn: api.getCommissions,
  });

  const { data: followups = [], isLoading: followupsLoading } = useQuery<FollowUp[]>({
    queryKey: ['followups'],
    queryFn: api.getFollowUps,
  });

  // Mutations
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Lead> }) => api.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: api.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      setIsAddModalOpen(false);
      // Reset form fields
      setNewLeadName('');
      setNewLeadEmail('');
      setNewLeadPhone('');
      setNewLeadCompany('');
      setNewLeadValue('0.00');
      setNewLeadSource('Manual Entry');
      setNewLeadOwner(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to create lead');
    }
  });

  const handleClaimLead = (leadId: number) => {
    updateLeadMutation.mutate({
      id: leadId,
      data: { owner: user.id, status: 'CLAIMED' as any }
    });
  };

  const handleUpdateStatus = (leadId: number, e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLeadMutation.mutate({
      id: leadId,
      data: { status: e.target.value as any }
    });
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMutation.mutate({
      name: newLeadName,
      email: newLeadEmail,
      phone: newLeadPhone,
      company: newLeadCompany,
      value: newLeadValue,
      source: newLeadSource,
      owner: newLeadOwner || null,
      status: 'NEW'
    });
  };

  const isAllLoading = statsLoading || chartsLoading || leadsLoading || agentsLoading || commissionsLoading || followupsLoading;

  if (isAllLoading) {
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

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      NEW: 'New',
      AVAILABLE: 'Available',
      CLAIMED: 'Claimed',
      CONTACTED: 'Contacted',
      IN_PROGRESS: 'In Progress',
      QUALIFIED: 'Qualified',
      FOLLOW_UP: 'Follow-up',
      PROPOSAL_SENT: 'Proposal',
      NEGOTIATION: 'Negotiation',
      CONVERTED: 'Converted',
      WON: 'Converted',
      LOST: 'Lost',
    };
    return map[status] || status;
  };

  // KPI Calculations
  const totalLeads = stats?.totalLeads || 0;
  const convertedLeads = stats?.convertedLeads || 0;
  const pipelineValue = stats?.pipelineValue || 0;
  const winRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const activeAgentsCount = agents.length;
  const followupsDueCount = stats?.followupsDue || 0;
  const commPendingSum = commissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);

  // Sales Funnel
  const salesFunnelData = [
    { label: 'New', count: stats?.statusBreakdown?.NEW || 0, color: 'bg-blue-500' },
    { label: 'Claimed', count: stats?.statusBreakdown?.CLAIMED || 0, color: 'bg-indigo-500' },
    { label: 'Contacted', count: stats?.statusBreakdown?.CONTACTED || 0, color: 'bg-violet-500' },
    { label: 'Qualified', count: stats?.statusBreakdown?.QUALIFIED || 0, color: 'bg-fuchsia-500' },
    { label: 'Negotiation', count: stats?.statusBreakdown?.NEGOTIATION || 0, color: 'bg-pink-500' },
    { label: 'Converted', count: (stats?.statusBreakdown?.WON || 0) + (stats?.statusBreakdown?.CONVERTED || 0), color: 'bg-emerald-500' },
  ];

  // Follow-up Center
  const today = new Date().toDateString();
  const nowTime = new Date();

  const dueTodayCount = followups.filter(f => !f.completed && new Date(f.scheduled_time).toDateString() === today).length;
  const overdueCount = followups.filter(f => !f.completed && new Date(f.scheduled_time) < nowTime && new Date(f.scheduled_time).toDateString() !== today).length;
  const upcomingCount = followups.filter(f => !f.completed && new Date(f.scheduled_time) > nowTime && new Date(f.scheduled_time).toDateString() !== today).length;

  // Recent Activities dynamically generated from recent leads activity
  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const recentActivities = leads.slice(0, 5).map(lead => {
    const timeStr = formatTimeAgo(lead.updated_at);
    if (lead.status === 'NEW') {
      return { text: `New lead "${lead.name}" added to database`, time: timeStr, type: 'import', icon: Download, color: 'text-cyan-500 bg-cyan-500/10' };
    } else if (lead.status === 'CLAIMED') {
      return { text: `Lead "${lead.name}" claimed by ${lead.owner_name}`, time: timeStr, type: 'claim', icon: UserPlus, color: 'text-blue-500 bg-blue-500/10' };
    } else if (['WON', 'CONVERTED'].includes(lead.status)) {
      return { text: `Lead "${lead.name}" successfully converted`, time: timeStr, type: 'convert', icon: Check, color: 'text-emerald-500 bg-emerald-500/10' };
    } else {
      return { text: `Lead "${lead.name}" status updated to ${getStatusLabel(lead.status)}`, time: timeStr, type: 'update', icon: Activity, color: 'text-orange-500 bg-orange-500/10' };
    }
  });

  const recentLeadsList = leads.slice(0, 5);

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
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-sm shadow-primary/10 cursor-pointer animate-fade-in"
        >
          <Plus size={14} /> Add Lead
        </button>
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
            <h3 className="text-2xl font-black text-foreground">{activeAgentsCount}</h3>
            <div className="absolute top-4 right-4 text-cyan-500/20 group-hover:text-cyan-500/40 transition-colors"><Briefcase size={24} /></div>
          </Card>
        </motion.div>

        {/* Follow Ups Due */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 shadow-sm bg-gradient-to-br from-orange-500/5 to-transparent flex flex-col justify-center text-left relative overflow-hidden group h-full hover:border-orange-500/30 transition-colors">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1">Follow Ups Due</span>
            <h3 className="text-2xl font-black text-foreground">{followupsDueCount}</h3>
            <div className="absolute top-4 right-4 text-orange-500/20 group-hover:text-orange-500/40 transition-colors"><Clock size={24} /></div>
          </Card>
        </motion.div>

        {/* Comm Pending */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 shadow-sm bg-gradient-to-br from-pink-500/5 to-transparent flex flex-col justify-center text-left relative overflow-hidden group h-full hover:border-pink-500/30 transition-colors">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1">Comm. Pending</span>
            <h3 className="text-2xl font-black text-foreground">{formatCompactCurrency(commPendingSum)}</h3>
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
              {salesFunnelData.map((stage, idx) => {
                const maxCount = Math.max(...salesFunnelData.map(s => s.count), 1);
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
                <span className="text-lg font-black text-foreground">{dueTodayCount}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><Activity size={20} /></div>
                  <span className="text-sm font-bold text-foreground">Overdue</span>
                </div>
                <span className="text-lg font-black text-red-500">{overdueCount}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><ListTodo size={20} /></div>
                  <span className="text-sm font-bold text-foreground">Upcoming</span>
                </div>
                <span className="text-lg font-black text-foreground">{upcomingCount}</span>
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
            {recentActivities.length > 0 ? (
              recentActivities.map((act, idx) => {
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
              })
            ) : (
              <div className="text-xs font-semibold text-muted-foreground py-10 text-center flex items-center justify-center h-full">
                No recent activities recorded
              </div>
            )}
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
            {recentLeadsList.length > 0 ? (
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
                  {recentLeadsList.map((lead) => (
                    <tr key={lead.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-4">
                        <span className="text-sm font-bold text-foreground">{lead.name}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold text-muted-foreground">{lead.source}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.status === 'NEW' ? 'bg-blue-500/10 text-blue-500' :
                          lead.status === 'CONTACTED' ? 'bg-violet-500/10 text-violet-500' :
                          lead.status === 'QUALIFIED' ? 'bg-cyan-500/10 text-cyan-500' :
                          lead.status === 'CLAIMED' ? 'bg-indigo-500/10 text-indigo-500' :
                          lead.status === 'NEGOTIATION' ? 'bg-pink-500/10 text-pink-500' :
                          ['WON', 'CONVERTED'].includes(lead.status) ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          {lead.owner ? (
                            <>
                              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-black">
                                {lead.owner_name.charAt(0)}
                              </div>
                              <span className="text-foreground">
                                {lead.owner_name}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-black text-emerald-500">{formatCompactCurrency(parseFloat(lead.value))}</span>
                      </td>
                      <td className="p-4 text-center">
                        {!lead.owner ? (
                          <button 
                            onClick={() => handleClaimLead(lead.id)}
                            className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
                          >
                            Claim
                          </button>
                        ) : (
                          <select 
                            value={lead.status}
                            onChange={(e) => handleUpdateStatus(lead.id, e)}
                            className="px-2 py-1 bg-secondary text-foreground text-[10px] font-bold rounded-md border border-border cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="NEW">New</option>
                            <option value="CLAIMED">Claimed</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="QUALIFIED">Qualified</option>
                            <option value="NEGOTIATION">Negotiation</option>
                            <option value="WON">Won</option>
                            <option value="LOST">Lost</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-xs font-semibold text-muted-foreground py-10 text-center flex flex-col items-center justify-center h-full">
                No leads registered in database
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* New Lead Modal */}
      <Dialog isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Lead">
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Contact Name *</label>
            <Input 
              type="text" 
              value={newLeadName} 
              onChange={e => setNewLeadName(e.target.value)} 
              required 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Company Name</label>
            <Input 
              type="text" 
              value={newLeadCompany} 
              onChange={e => setNewLeadCompany(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Email</label>
              <Input 
                type="email" 
                value={newLeadEmail} 
                onChange={e => setNewLeadEmail(e.target.value)} 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Phone</label>
              <Input 
                type="text" 
                value={newLeadPhone} 
                onChange={e => setNewLeadPhone(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Deal Value (₹)</label>
              <Input 
                type="number" 
                step="0.01"
                value={newLeadValue} 
                onChange={e => setNewLeadValue(e.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">Lead Source</label>
              <Input 
                type="text" 
                value={newLeadSource} 
                onChange={e => setNewLeadSource(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">Assign Agent</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
              value={newLeadOwner || ''}
              onChange={e => setNewLeadOwner(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Unassigned</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.username})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createLeadMutation.isPending}>
              {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Dialog>
    </motion.div>
  );
};

export default Dashboard;
