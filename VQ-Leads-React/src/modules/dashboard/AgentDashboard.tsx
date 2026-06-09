import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type User, type Lead, type Task, type FollowUp, type Commission } from '../../api';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/forms/Input';

import { LeadDetailsDrawer } from '../leads/components/LeadDetailsDrawer';
import {
  Search,
  Briefcase,
  Trophy,
  Phone,
  ThumbsUp,
  ThumbsDown,
  Award,
  Trash2,
  FileEdit,
  Sparkles,
  Calendar,
  DollarSign,
  CheckSquare,
  Clock,
  AlertTriangle,
  Percent,
  ChevronRight
} from 'lucide-react';

interface AgentDashboardProps {
  user: User;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  // Interactive attention filter state
  const [activeAttentionFilter, setActiveAttentionFilter] = useState<'ALL' | 'OVERDUE' | 'NO_NEXT_ACTION' | 'STALE'>('ALL');

  // Fetch data
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: api.getLeads,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
  });

  const { data: followups = [], isLoading: followupsLoading } = useQuery<FollowUp[]>({
    queryKey: ['followups'],
    queryFn: api.getFollowUps,
  });

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: ['commissions'],
    queryFn: api.getCommissions,
  });

  // Mutations
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Lead> }) => api.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });

  // Agent-specific metrics
  const myLeads = leads.filter(l => l.owner === user.id);
  const activeLeads = myLeads.filter(l => !['WON', 'LOST', 'CONVERTED'].includes(l.status));

  // KPI Calculations
  // 1. My Leads (Total owned)
  const myLeadsCount = myLeads.length;

  // 2. Today's Calls (Uncompleted follow-ups scheduled for today)
  const todayStr = new Date().toDateString();
  const todayCalls = followups.filter(f => {
    if (f.completed) return false;
    const fDateStr = new Date(f.scheduled_time).toDateString();
    return fDateStr === todayStr;
  });
  const todayCallsCount = todayCalls.length;

  // 3. Pending Follow-ups (All uncompleted follow-ups)
  const pendingFollowups = followups.filter(f => !f.completed);
  const pendingFollowupsCount = pendingFollowups.length;

  // 4. Tasks Due (Pending tasks)
  const tasksDue = tasks.filter(t => t.status === 'PENDING');
  const tasksDueCount = tasksDue.length;

  // 5. Converted Leads (Status WON or CONVERTED)
  const convertedLeads = myLeads.filter(l => ['WON', 'CONVERTED'].includes(l.status));
  const convertedLeadsCount = convertedLeads.length;

  // 6. Revenue (Sum of value of converted leads)
  const totalRevenue = convertedLeads.reduce((sum, l) => sum + parseFloat(l.value || '0'), 0);

  // 7. Commission (Total earned from APPROVED or PAID commissions)
  const earnedCommission = commissions
    .filter(c => ['APPROVED', 'PAID'].includes(c.status))
    .reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);

  // 8. Win Rate (Converted leads / Total closed leads)
  const lostCount = myLeads.filter(l => l.status === 'LOST').length;
  const totalClosed = convertedLeadsCount + lostCount;
  const winRate = totalClosed > 0 ? Math.round((convertedLeadsCount / totalClosed) * 100) : 0;

  // Attention Required widgets criteria
  // A. Overdue Followups: Uncompleted followups scheduled before "now"
  const now = new Date();
  const overdueFollowups = followups.filter(f => !f.completed && new Date(f.scheduled_time) < now);
  const overdueFollowupsCount = overdueFollowups.length;
  const overdueLeadIds = new Set(overdueFollowups.map(f => f.lead));

  // B. Leads with No Next Action: Active leads with no pending tasks and no pending followups
  const leadsWithNoNextAction = activeLeads.filter(l => {
    const hasPendingTask = tasks.some(t => t.lead === l.id && t.status === 'PENDING');
    const hasPendingFollowup = followups.some(f => f.lead === l.id && !f.completed);
    return !hasPendingTask && !hasPendingFollowup;
  });
  const leadsWithNoNextActionCount = leadsWithNoNextAction.length;
  const noNextActionLeadIds = new Set(leadsWithNoNextAction.map(l => l.id));

  // C. Stale Leads (>48h no activity): Active leads whose updated_at date is older than 48 hours
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const staleLeads = activeLeads.filter(l => new Date(l.updated_at) < fortyEightHoursAgo);
  const staleLeadsCount = staleLeads.length;
  const staleLeadIds = new Set(staleLeads.map(l => l.id));

  // Filter My Leads Pipeline based on selection
  const filteredMyLeads = myLeads.filter(lead => {
    if (activeAttentionFilter === 'OVERDUE') {
      return overdueLeadIds.has(lead.id);
    }
    if (activeAttentionFilter === 'NO_NEXT_ACTION') {
      return noNextActionLeadIds.has(lead.id);
    }
    if (activeAttentionFilter === 'STALE') {
      return staleLeadIds.has(lead.id);
    }
    return true;
  });

  // Available leads (unassigned)
  const availableLeads = leads.filter(l => !l.owner);
  const sources = Array.from(new Set(leads.map(l => l.source)));
  const filteredAvailable = availableLeads.filter(lead => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  // Handlers
  const handleClaimLead = (leadId: number, leadName: string) => {
    updateLeadMutation.mutate(
      { id: leadId, data: { owner: user.id, status: 'CLAIMED' as any } },
      {
        onSuccess: () => {
          showSuccess(`Successfully claimed lead "${leadName}"! It's now in your pipeline.`);
        },
      }
    );
  };

  const handleStatusChange = (leadId: number, newStatus: string, leadName: string) => {
    updateLeadMutation.mutate(
      { id: leadId, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          if (newStatus === 'WON' || newStatus === 'CONVERTED') {
            showSuccess(`🎉 Spectacular! Lead "${leadName}" has been successfully converted!`);
          } else if (newStatus === 'LOST') {
            showSuccess(`Lead "${leadName}" status updated to Lost.`);
          } else {
            showSuccess(`Lead "${leadName}" status updated to ${newStatus}.`);
          }
        },
      }
    );
  };

  const handleLeadUpdated = () => {
    refetchLeads();
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['followups'] });
    queryClient.invalidateQueries({ queryKey: ['commissions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const formatCurrency = (amount: string | number) => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(val)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      NEW: 'New',
      AVAILABLE: 'Available',
      CLAIMED: 'Pipeline',
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

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      NEW: 'bg-blue-500/15 text-blue-600 border-blue-500/25',
      AVAILABLE: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/25',
      CLAIMED: 'bg-violet-500/15 text-violet-600 border-violet-500/25',
      CONTACTED: 'bg-orange-500/15 text-orange-600 border-orange-500/25',
      IN_PROGRESS: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
      QUALIFIED: 'bg-indigo-500/15 text-indigo-600 border-indigo-500/25',
      FOLLOW_UP: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/25',
      PROPOSAL_SENT: 'bg-teal-500/15 text-teal-600 border-teal-500/25',
      NEGOTIATION: 'bg-pink-500/15 text-pink-600 border-pink-500/25',
      CONVERTED: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
      WON: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
      LOST: 'bg-red-500/15 text-red-600 border-red-500/25',
    };
    return map[status] || 'bg-gray-500/15 text-gray-600 border-gray-500/25';
  };

  const toggleAttentionFilter = (filter: 'OVERDUE' | 'NO_NEXT_ACTION' | 'STALE') => {
    if (activeAttentionFilter === filter) {
      setActiveAttentionFilter('ALL');
    } else {
      setActiveAttentionFilter(filter);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120 } },
  };

  const isAllLoading = leadsLoading || tasksLoading || followupsLoading || commissionsLoading;

  if (isAllLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-70px)]">
        <div className="text-muted-foreground text-sm font-semibold animate-pulse">
          Loading agent dashboard...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto text-left"
    >
      {/* Success Banner */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          <Sparkles size={16} className="text-emerald-500" />
          {successMsg}
        </motion.div>
      )}

      {/* KPI Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* My Leads */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-indigo-500/5 to-transparent flex items-center justify-between group hover:border-indigo-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider mb-1">
                My Leads
              </span>
              <h3 className="text-3xl font-black text-foreground">{myLeadsCount}</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Total assigned leads</span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500/20 transition-colors">
              <Briefcase size={22} />
            </div>
          </Card>
        </motion.div>

        {/* Today's Calls */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-violet-500/5 to-transparent flex items-center justify-between group hover:border-violet-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider mb-1">
                Today's Calls
              </span>
              <h3 className="text-3xl font-black text-foreground">{todayCallsCount}</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Scheduled for today</span>
            </div>
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500 group-hover:bg-violet-500/20 transition-colors">
              <Calendar size={22} />
            </div>
          </Card>
        </motion.div>

        {/* Pending Follow-ups */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-sky-500/5 to-transparent flex items-center justify-between group hover:border-sky-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider mb-1">
                Pending Follow-ups
              </span>
              <h3 className="text-3xl font-black text-foreground">{pendingFollowupsCount}</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Uncompleted followups</span>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500 group-hover:bg-sky-500/20 transition-colors">
              <Phone size={22} />
            </div>
          </Card>
        </motion.div>

        {/* Tasks Due */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-slate-500/5 to-transparent flex items-center justify-between group hover:border-slate-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                Tasks Due
              </span>
              <h3 className="text-3xl font-black text-foreground">{tasksDueCount}</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Pending checklist items</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-500/10 text-slate-500 group-hover:bg-slate-500/20 transition-colors">
              <CheckSquare size={22} />
            </div>
          </Card>
        </motion.div>

        {/* Converted Leads */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-emerald-500/5 to-transparent flex items-center justify-between group hover:border-emerald-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1">
                Converted Leads
              </span>
              <h3 className="text-3xl font-black text-foreground">{convertedLeadsCount}</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Successful closures</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
              <Trophy size={22} />
            </div>
          </Card>
        </motion.div>

        {/* Win Rate */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-cyan-500/5 to-transparent flex items-center justify-between group hover:border-cyan-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-wider mb-1">
                Win Rate
              </span>
              <h3 className="text-3xl font-black text-foreground">{winRate}%</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Won vs lost closed leads</span>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500/20 transition-colors">
              <Percent size={22} />
            </div>
          </Card>
        </motion.div>

        {/* Revenue */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-amber-500/5 to-transparent flex items-center justify-between group hover:border-amber-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider mb-1">
                Revenue
              </span>
              <h3 className="text-3xl font-black text-foreground">{formatCurrency(totalRevenue)}</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Value of won deals</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 transition-colors">
              <DollarSign size={22} />
            </div>
          </Card>
        </motion.div>

        {/* Commission */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 border border-border/50 bg-gradient-to-br from-rose-500/5 to-transparent flex items-center justify-between group hover:border-rose-500/30 transition-colors h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider mb-1">
                Commission
              </span>
              <h3 className="text-3xl font-black text-foreground">{formatCurrency(earnedCommission)}</h3>
              <span className="text-[11px] text-muted-foreground mt-0.5">Approved & Paid earnings</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20 transition-colors">
              <Award size={22} />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Attention Required Widgets - Action Center */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Overdue Follow-ups Alert */}
        <motion.div variants={itemVariants}>
          <button
            onClick={() => toggleAttentionFilter('OVERDUE')}
            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden cursor-pointer ${
              activeAttentionFilter === 'OVERDUE'
                ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/5'
                : 'bg-card hover:bg-secondary/15 border-border/60 hover:border-rose-500/30'
            }`}
          >
            <div className="flex items-center gap-3.5 z-10">
              <div className={`p-2.5 rounded-xl transition-colors ${
                activeAttentionFilter === 'OVERDUE'
                  ? 'bg-rose-500/20 text-rose-600'
                  : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/15'
              }`}>
                <Clock size={20} className={overdueFollowupsCount > 0 ? "animate-pulse" : ""} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Overdue Follow-ups</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Needs immediate call logging</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 z-10">
              <span className={`text-xl font-black px-2.5 py-0.5 rounded-lg ${
                overdueFollowupsCount > 0
                  ? 'bg-rose-500/15 text-rose-600 border border-rose-500/25'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {overdueFollowupsCount}
              </span>
              <ChevronRight size={14} className="text-muted-foreground opacity-55 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            {/* Subtle glow effect */}
            {overdueFollowupsCount > 0 && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            )}
          </button>
        </motion.div>

        {/* Leads with No Next Action Alert */}
        <motion.div variants={itemVariants}>
          <button
            onClick={() => toggleAttentionFilter('NO_NEXT_ACTION')}
            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden cursor-pointer ${
              activeAttentionFilter === 'NO_NEXT_ACTION'
                ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/5'
                : 'bg-card hover:bg-secondary/15 border-border/60 hover:border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-3.5 z-10">
              <div className={`p-2.5 rounded-xl transition-colors ${
                activeAttentionFilter === 'NO_NEXT_ACTION'
                  ? 'bg-amber-500/20 text-amber-600'
                  : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/15'
              }`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">No Next Action</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Leads with no pending task/call</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 z-10">
              <span className={`text-xl font-black px-2.5 py-0.5 rounded-lg ${
                leadsWithNoNextActionCount > 0
                  ? 'bg-amber-500/15 text-amber-600 border border-amber-500/25'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {leadsWithNoNextActionCount}
              </span>
              <ChevronRight size={14} className="text-muted-foreground opacity-55 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            {/* Subtle glow effect */}
            {leadsWithNoNextActionCount > 0 && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            )}
          </button>
        </motion.div>

        {/* Stale Leads Alert */}
        <motion.div variants={itemVariants}>
          <button
            onClick={() => toggleAttentionFilter('STALE')}
            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden cursor-pointer ${
              activeAttentionFilter === 'STALE'
                ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20 shadow-md shadow-orange-500/5'
                : 'bg-card hover:bg-secondary/15 border-border/60 hover:border-orange-500/30'
            }`}
          >
            <div className="flex items-center gap-3.5 z-10">
              <div className={`p-2.5 rounded-xl transition-colors ${
                activeAttentionFilter === 'STALE'
                  ? 'bg-orange-500/20 text-orange-600'
                  : 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/15'
              }`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Stale Leads</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">No activity for over 48 hours</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 z-10">
              <span className={`text-xl font-black px-2.5 py-0.5 rounded-lg ${
                staleLeadsCount > 0
                  ? 'bg-orange-500/15 text-orange-600 border border-orange-500/25'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {staleLeadsCount}
              </span>
              <ChevronRight size={14} className="text-muted-foreground opacity-55 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            {/* Subtle glow effect */}
            {staleLeadsCount > 0 && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            )}
          </button>
        </motion.div>
      </motion.div>

      {/* Main Work Grid: Available Pool + My Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Available Lead Pool (3 cols) */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-3"
        >
          <Card className="border border-border/60 overflow-hidden h-full flex flex-col">
            {/* Panel Header */}
            <div className="p-5 border-b border-border/40 flex items-center gap-3 bg-secondary/10">
              <span className="text-xl">🌎</span>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Available Lead Pool
              </h3>
              <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                {availableLeads.length} Open
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4">
                These leads are unassigned. Accept a lead to lock it to your account.
              </p>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search available leads by name, email, company..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="h-10 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer min-w-[140px]"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="All">All Sources</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lead Table */}
              {filteredAvailable.length > 0 ? (
                <div className="overflow-x-auto flex-1 -mx-5 px-5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/40 text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="pb-3 font-bold">Customer Info</th>
                        <th className="pb-3 font-bold">Company</th>
                        <th className="pb-3 font-bold">Source</th>
                        <th className="pb-3 font-bold">Budget</th>
                        <th className="pb-3 font-bold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredAvailable.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-secondary/20 transition-colors group"
                        >
                          <td className="py-3.5">
                            <div
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => setSelectedLeadId(lead.id)}
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-black shrink-0">
                                {lead.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                  {lead.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {lead.email || 'No email'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-sm text-muted-foreground">
                            {lead.company || 'N/A'}
                          </td>
                          <td className="py-3.5">
                            <span className="text-[10px] font-bold bg-secondary px-2 py-0.5 rounded-full text-muted-foreground border border-border/40">
                              {lead.source}
                            </span>
                          </td>
                          <td className="py-3.5 text-sm font-bold text-foreground">
                            {formatCurrency(lead.value)}
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => handleClaimLead(lead.id, lead.name)}
                              disabled={updateLeadMutation.isPending}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/15 text-emerald-600 text-[11px] font-bold rounded-lg border border-emerald-500/25 hover:bg-emerald-500/25 hover:border-emerald-500/40 transition-all cursor-pointer disabled:opacity-50"
                            >
                              🤝 Claim Lead
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-3">🏖️</span>
                  <h4 className="text-sm font-bold text-foreground mb-1">All caught up!</h4>
                  <p className="text-xs text-muted-foreground max-w-[280px]">
                    {searchTerm || sourceFilter !== 'All'
                      ? 'No available leads match your current search filters.'
                      : 'No unassigned leads exist in the pool right now.'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Right: My Leads Pipeline (2 cols) */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-2"
        >
          <Card className="border border-border/60 overflow-hidden h-full flex flex-col">
            {/* Panel Header */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between gap-3 bg-secondary/10">
              <div className="flex items-center gap-3">
                <span className="text-xl">💼</span>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  My Leads Pipeline ({activeAttentionFilter === 'ALL' ? myLeads.length : `${filteredMyLeads.length} of ${myLeads.length}`})
                </h3>
              </div>
              {activeAttentionFilter !== 'ALL' && (
                <button
                  onClick={() => setActiveAttentionFilter('ALL')}
                  className="flex items-center gap-1 text-[10px] font-black text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
              {filteredMyLeads.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {filteredMyLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="border border-border/60 rounded-xl p-4 bg-card hover:border-border transition-all flex flex-col gap-3"
                    >
                      {/* Lead Header */}
                      <div className="flex justify-between items-start">
                        <div
                          className="cursor-pointer"
                          onClick={() => setSelectedLeadId(lead.id)}
                        >
                          <h4 className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                            {lead.name}
                          </h4>
                          <span className="text-[11px] text-muted-foreground">
                            {lead.company || 'N/A'} • {formatCurrency(lead.value)}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border ${getStatusColor(
                            lead.status
                          )}`}
                        >
                          {getStatusLabel(lead.status)}
                        </span>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleStatusChange(lead.id, 'CONTACTED', lead.name)}
                          className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-500/10 text-orange-600 text-[10px] font-bold rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-colors cursor-pointer"
                        >
                          <Phone size={11} /> Contacted
                        </button>
                        <button
                          onClick={() => handleStatusChange(lead.id, 'QUALIFIED', lead.name)}
                          className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-500/10 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                        >
                          <ThumbsUp size={11} /> Interested
                        </button>
                        <button
                          onClick={() => handleStatusChange(lead.id, 'NEGOTIATION', lead.name)}
                          className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-pink-500/10 text-pink-600 text-[10px] font-bold rounded-lg border border-pink-500/20 hover:bg-pink-500/20 transition-colors cursor-pointer"
                        >
                          <ThumbsDown size={11} /> Not Interested
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleStatusChange(lead.id, 'WON', lead.name)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                        >
                          <Award size={11} /> Convert
                        </button>
                        <button
                          onClick={() => handleStatusChange(lead.id, 'LOST', lead.name)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500/10 text-red-600 text-[10px] font-bold rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 size={11} /> Drop
                        </button>
                      </div>

                      {/* Edit Notes Button */}
                      <button
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground bg-secondary/40 border border-border/40 rounded-lg hover:bg-secondary/70 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <FileEdit size={12} /> Edit Notes & Logs
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-4xl mb-3">🎒</span>
                  <h4 className="text-sm font-bold text-foreground mb-1">
                    {activeAttentionFilter !== 'ALL' ? 'No Filtered Leads' : 'Pipeline Empty'}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-[240px]">
                    {activeAttentionFilter !== 'ALL'
                      ? 'No leads in your pipeline match the selected attention filter.'
                      : 'Claim leads from the available pool on the left to start working!'}
                  </p>
                  {activeAttentionFilter !== 'ALL' && (
                    <button
                      onClick={() => setActiveAttentionFilter('ALL')}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all cursor-pointer"
                    >
                      Clear Active Filter
                    </button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Lead Details Drawer */}
      <LeadDetailsDrawer
        leadId={selectedLeadId || 0}
        isOpen={selectedLeadId !== null}
        onClose={() => {
          setSelectedLeadId(null);
          handleLeadUpdated();
        }}
        currentUser={user}
        agents={[]}
        onLeadUpdated={handleLeadUpdated}
      />
    </motion.div>
  );
};

export default AgentDashboard;
